import { AstPart, IAst, IHeader, ILoad, ISectionWriter, ITableOfContents, ITitle, IWrite } from "./types.ast";
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

    get length(): number {
        let i = 0;

        this._lines.forEach(l => i += l.length);

        return i + this._lines.length - 1;
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
    const sb = new StringBuilder();

    sb.add(astTitle.label);

    if(astTitle.subtitle) {
        sb.addLine();
        sb.addLine(astTitle.subtitle);
    }

    return sb.toString();
}

function writeAstHeader(astHeader: IHeader): string {
    const headMarker = '#'.repeat(astHeader.depthCount);
    return `${headMarker} ${astHeader.text} ${headMarker}`;
}

function writeTableOfContents(toc: ITableOfContents, loads: ILoad[]): string {
    function findTitle(ast: AstPart[]): ITitle | null {
        for (let index = 0; index < ast.length; index++) {
            const element = ast[index];
            if(!element) {
                continue;
            }

            if(element.type === 'ast-title') {
                return element;
            }
        }

        return null;
    }

    function writeLink(append: (text: string) => void, title: string, linkText: string, label?: string): void {
        let lblText = '';
        if(!!label) {
            lblText = `${label}: `;
        }
        append(`[${lblText}${title}](${linkText})`);
    }

    function ignoreLabel(append: (text: string) => void, title: string, linkText: string, label?: string): void {
        return writeLink(append, title, linkText);
    }

    function useAppendLine(appender: (append: (text: string) => void, title: string, linkText: string, label?: string) => void): (sb: StringBuilder, title: string, linkText: string, label: string) => void {
        return function(sb: StringBuilder, title: string, linkText: string, label: string): void {
            appender(text => sb.addLine(text), title, linkText, label);
        }
    }

    function writeTable(loads: ILoad[], addRow: (sb: StringBuilder, title: string, linkText: string, label: string) => void): string {
        const sb = new StringBuilder();

        for (let index = 0; index < loads.length; index++) {
            const element = loads[index];
            if(!element) {
                continue;
            }
    
            if(!element.document) {
                continue;
            }
    
            const doc = element.document;
            const title = findTitle(doc.ast);
    
            if(!title) {
                continue;
            }
    
            if(0 < sb.length) {
                sb.addLine();
            }

            addRow(sb, title.title, title.link, element.sectionLabel);
        }
        
        if(0 < sb.length) {
            sb.addLine();
        }
    
        return sb.toString();
    }

    switch (toc.bulletStyle) {
        case 'labeled':
            return writeTable(loads, useAppendLine(writeLink));

        case 'unlabeled':
            return writeTable(loads, useAppendLine(ignoreLabel));
    
        default:
            return `>>>> ${toc.bulletStyle} <<<<\n`;
    }
    
}

function writeContent(loads: ILoad[]): string {
    const sb = new StringBuilder();

    for (let index = 0; index < loads.length; index++) {
        const element = loads[index];
        if(!element) {
            continue;
        }

        if(!element.document) {
            continue;
        }

        const doc = element.document;
        let previous: ILocation = doc.documentOrder;

        if(0 < sb.length) {
            sb.addLine();
        }

        sb.add(writeSection(previous, doc));
    }

    return sb.toString().trim();
}

function writeSection(previous: ILocation, section: ISectionWriter): string {
    const sb = new StringBuilder();
    let previousType = '';

    for (let index = 0; index < section.ast.length; index++) {
        const element = section.ast[index];
        if(!element) {
            continue;
        }

        if(newLine(previous, element.documentOrder)) {
            sb.addLine();
        }

        if(previousType !== 'ast-write' || element.type !== 'ast-write') {
            sb.addLine();
        }

        switch (element.type) {
            case 'ast-write':
                sb.add(writeAstWrite(element));
                break;

            case 'ast-title':
                sb.add(writeAstTitle(element));
                break;

            case 'ast-header':
                sb.add(writeAstHeader(element));
                break;

            case 'ast-content':
                sb.add(writeContent(section.external));
                break;

            case 'ast-toc':
                sb.add(writeTableOfContents(element, section.external));
                break;
        
            default:
                break;
        }

        previousType = element.type;
        previous = element.documentOrder;
    }

    return sb.toString();
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

        let previous: ILocation = util.location('', -1, -1, -1, -1);
        sb.addLine(writeSection(previous, section));
        
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