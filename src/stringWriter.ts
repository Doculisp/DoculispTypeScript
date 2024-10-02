import { IAst, ITitle, IWrite } from "./types.ast";
import { IRegisterable } from "./types.containers";
import { ILocation, IUtil, Result } from "./types.general";
import { IStringWriter } from "./types.stringWriter";

class StringBuilder {
    private _lines: string[];

    constructor() {
        this._lines = [];
    }

    addLine(): StringBuilder
    addLine(value: string): StringBuilder
    addLine(value?: string): StringBuilder {
        let v = value ?? '';
        this._lines.push(v);
        return this;
    }

    add(value: string): StringBuilder {
        if(!value) {
            return this;
        }

        if(this._lines.length === 0) {
            this._lines.push('');
        }

        this._lines[this._lines.length - 1] += value;
        return this;
    }

    toString(): string {
        return this._lines.join('\n');
    }
}

function newLine(previousLocation: ILocation, currentLocation: ILocation): boolean {
    return !(
        previousLocation.documentPath === currentLocation.documentPath
        && previousLocation.line === currentLocation.line
    );
}

function writeAstWrite(astWrite: IWrite) : string {
    return astWrite.value;
}

function writeAstTitle(astTitle: ITitle): string {
    return astTitle.label;
}

function buildWriter(util: IUtil) : IStringWriter {
    function writeAst(astMaybe: Result<IAst>): Result<string> {
        if(!astMaybe.success) {
            return astMaybe;
        }

        if(astMaybe.value.section.type === 'ast-empty'){
            return util.ok('');
        }

        const sb = new StringBuilder();
        const section = astMaybe.value.section;

        sb.addLine('<!-- Generated Document do not edit! -->');
        sb.addLine();

        let previous: ILocation = util.location('', -1, -1, -1, -1);

        for (let index = 0; index < section.ast.length; index++) {
            const element = section.ast[index];
            if(!element) {
                continue;
            }

            if(newLine(previous, element.documentOrder)) {
                sb.addLine();
            }

            switch (element.type) {
                case 'ast-write':
                    sb.add(writeAstWrite(element));
                    break;

                case 'ast-title':
                    sb.add(writeAstTitle(element));
                    break;
            
                default:
                    break;
            }

            previous = element.documentOrder;
        }

        sb.addLine();
        sb.addLine('<!-- Generated Document do not edit! -->');
        return util.ok(sb.toString());
    }

    return {
        writeAst,
    }
}

const stringWriter: IRegisterable = {
    builder: (util: IUtil) => buildWriter(util),
    name: 'stringWriter',
    dependencies: ['util'],
    singleton: false,
};

export {
    stringWriter,
};