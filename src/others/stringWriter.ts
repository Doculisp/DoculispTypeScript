import { AstPart, IAst, IHeader, ILoad, ISectionWriter, ITableOfContents, ITitle, IWrite } from "../types/types.ast";
import { IRegisterable } from "../types/types.containers";
import { ILocation, IUtil, Result } from "../types/types.general";
import { IStringWriter } from "../types/types.stringWriter";

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

    get lineLength(): number {
        if(this._lines.length < 1) {
            return 0;
        }

        return this._lines[this._lines.length - 1]?.length || 0;
    }
}

function isNewLine(previousLocation: ILocation, currentLocation: ILocation): boolean {
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

    function useLabel(append: (text: string) => void, title: string, linkText: string, label?: string): void {
        let lblText = !!label ? `${label}: `: '';
        
        append(`[${lblText}${title}](${linkText})`);
    }

    function ignoreLabel(append: (text: string) => void, title: string, linkText: string, label?: string): void {
        return useLabel(append, title, linkText);
    }

    function writeRawLink(appender: (append: (text: string) => void, title: string, linkText: string, label?: string) => void): (sb: StringBuilder, title: string, linkText: string, label: string) => void {
        return function(sb: StringBuilder, title: string, linkText: string, label: string): void {
            appender(text => sb.addLine(text), title, linkText, label);
        }
    }

    function writeNumbered(appender: (append: (text: string) => void, title: string, linkText: string, label?: string) => void): (sb: StringBuilder, title: string, linkText: string, label: string) => void {
        let cnt = 1;
        return function(sb: StringBuilder, title: string, linkText: string, label: string): void {
            appender(text => sb.add(`${cnt}. ${text}`), title, linkText, label);
            cnt++;
        }
    }

    function writeBulleted(appender: (append: (text: string) => void, title: string, linkText: string, label?: string) => void): (sb: StringBuilder, title: string, linkText: string, label: string) => void {
        return function(sb: StringBuilder, title: string, linkText: string, label: string): void {
            appender(text => sb.add(`* ${text}`), title, linkText, label);
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

            addRow(sb, title.title, title.ref_link, element.sectionLabel);
        }
        
        if(0 < sb.length) {
            sb.addLine();
        }
    
        return sb.toString();
    }

    switch (toc.bulletStyle) {
        case 'labeled':
            return writeTable(loads, writeRawLink(useLabel));

        case 'unlabeled':
            return writeTable(loads, writeRawLink(ignoreLabel));

        case 'numbered':
            return writeTable(loads, writeNumbered(ignoreLabel));

        case 'numbered-labeled':
            return writeTable(loads, writeNumbered(useLabel));

        case 'bulleted':
            return writeTable(loads, writeBulleted(ignoreLabel));

        case 'bulleted-labeled':
            return writeTable(loads, writeBulleted(useLabel));
    
        default:
            return `>>>> ${toc.bulletStyle} <<<<\n`;
    }
    
}

function writeContent(loads: ILoad[]): string {
    const sb = new StringBuilder();

    for (let index = 0; index < loads.length; index++) {
        const load = loads[index];
        if(!load) {
            continue;
        }

        if(!load.document) {
            continue;
        }

        const doc = load.document;
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
        const ast = section.ast[index];
        if(!ast) {
            continue;
        }

        if(isNewLine(previous, ast.documentOrder)) {
            sb.addLine();
        }

        if(previousType === 'ast-write' && ast.type === 'ast-write') {
            if(previous.documentPath !== ast.documentOrder.documentPath
               || (previous.line + 2) <= ast.documentOrder.line
               || (ast.documentOrder.line + 2) <= previous.line
            ) {
                sb.addLine();
            } else if (0 < sb.lineLength) {
                //sb.add(' ');
            }
        }
        else {
            sb.addLine();
        }

        switch (ast.type) {
            case 'ast-write':
                sb.add(writeAstWrite(ast));
                break;

            case 'ast-title':
                sb.add(writeAstTitle(ast));
                break;

            case 'ast-header':
                sb.add(writeAstHeader(ast));
                break;

            case 'ast-content':
                sb.add(writeContent(section.include));
                break;

            case 'ast-toc':
                sb.add(writeTableOfContents(ast, section.include));
                break;
        
            default:
                break;
        }

        previousType = ast.type;
        previous = ast.documentOrder;
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