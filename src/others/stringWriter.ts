import { DoculispPart, IDoculisp, IEmptyDoculisp, IHeader, ILoad, ISectionWriter, ITableOfContents, ITitle, IWrite } from "../types/types.astDoculisp";
import { IRegisterable } from "../types/types.containers";
import { ILocation, IUtil, Result } from "../types/types.general";
import { IStringBuilder, StringBuilderConstructor } from "../types/types.sringBuilder";
import { IStringWriter } from "../types/types.stringWriter";
import { IStringArray, IVariableTable } from "../types/types.variableTable";

function buildWriter(util: IUtil, stringBuilderConstructor: StringBuilderConstructor) : IStringWriter {

    function writeAstWrite(astWrite: IWrite) : string {
        return astWrite.value;
    }
    
    function writeAstTitle(astTitle: ITitle): string {
        const sb = stringBuilderConstructor();
    
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
        function findTitle(doculisp: DoculispPart[]): ITitle | null {
            for (let index = 0; index < doculisp.length; index++) {
                const element = doculisp[index];
                if(!element) {
                    continue;
                }
    
                if(element.type === 'doculisp-title') {
                    return element;
                }
            }
    
            return null;
        }
    
        function useLabel(append: (text: string) => void, title: string, linkText: string, label?: string): void {
            let lblText = !!label ? `${label}: `: '';
            
            append(`${lblText}[${title}](${linkText})`);
        }
    
        function ignoreLabel(append: (text: string) => void, title: string, linkText: string, label?: string): void {
            return useLabel(append, title, linkText);
        }
    
        function writeRawLink(appender: (append: (text: string) => void, title: string, linkText: string, label?: string) => void): (sb: IStringBuilder, title: string, linkText: string, label: string) => void {
            return function(sb: IStringBuilder, title: string, linkText: string, label: string): void {
                appender(text => sb.addLine(text), title, linkText, label);
            }
        }
    
        function writeNumbered(appender: (append: (text: string) => void, title: string, linkText: string, label?: string) => void): (sb: IStringBuilder, title: string, linkText: string, label: string) => void {
            let cnt = 1;
            return function(sb: IStringBuilder, title: string, linkText: string, label: string): void {
                appender(text => sb.add(`${cnt}. ${text}`), title, linkText, label);
                cnt++;
            }
        }
    
        function writeBulleted(appender: (append: (text: string) => void, title: string, linkText: string, label?: string) => void): (sb: IStringBuilder, title: string, linkText: string, label: string) => void {
            return function(sb: IStringBuilder, title: string, linkText: string, label: string): void {
                appender(text => sb.add(`* ${text}`), title, linkText, label);
            }
        }
    
        function writeTable(loads: ILoad[], addRow: (sb: IStringBuilder, title: string, linkText: string, label: string) => void): string {
            const sb = stringBuilderConstructor();
    
            for (let index = 0; index < loads.length; index++) {
                const element = loads[index];
                if(!element) {
                    continue;
                }
        
                if(!element.document) {
                    continue;
                }
        
                const doc = element.document;
                const title = findTitle(doc.doculisp);
        
                if(!title) {
                    continue;
                }
        
                if(0 < sb.length) {
                    sb.addLine();
                }
    
                addRow(sb, title.title, title.ref_link, element.sectionLabel);
            }
        
            return sb.toString();
        }
    
        const sb = stringBuilderConstructor();
        if(toc.label) {
            sb.addLine(toc.label);
            sb.addLine();
        }
    
        switch (toc.bulletStyle) {
            case 'labeled':
                sb.addLine(writeTable(loads, writeRawLink(useLabel)));
                return sb.toString();
    
            case 'unlabeled':
                sb.addLine(writeTable(loads, writeRawLink(ignoreLabel)));
                return sb.toString();
    
            case 'numbered':
                sb.addLine(writeTable(loads, writeNumbered(ignoreLabel)));
                return sb.toString();
    
            case 'numbered-labeled':
                sb.addLine(writeTable(loads, writeNumbered(useLabel)));
                return sb.toString();
    
            case 'bulleted':
                sb.addLine(writeTable(loads, writeBulleted(ignoreLabel)));
                return sb.toString();
    
            case 'bulleted-labeled':
                sb.addLine(writeTable(loads, writeBulleted(useLabel)));
                return sb.toString();
        
            default:
                return `>>>> ${toc.bulletStyle} <<<<\n`;
        }
        
    }
    
    function writeContent(loads: ILoad[]): string {
        const sb = stringBuilderConstructor();
    
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
        const sb = stringBuilderConstructor();
        let previousType = '';
    
        for (let index = 0; index < section.doculisp.length; index++) {
            const doculisp = section.doculisp[index];
            if(!doculisp) {
                continue;
            }
    
            sb.addLine();
    
            if(previousType === 'doculisp-write' && doculisp.type === 'doculisp-write') {
                if(previous.documentPath !== doculisp.documentOrder.documentPath
                   || (previous.line + 2) <= doculisp.documentOrder.line
                   || (doculisp.documentOrder.line + 2) <= previous.line
                ) {
                    sb.addLine();
                }
            }
            else {
                sb.addLine();
            }
    
            switch (doculisp.type) {
                case 'doculisp-write':
                    sb.add(writeAstWrite(doculisp));
                    break;
    
                case 'doculisp-title':
                    sb.add(writeAstTitle(doculisp));
                    break;
    
                case 'doculisp-header':
                    sb.add(writeAstHeader(doculisp));
                    break;
    
                case 'doculisp-content':
                    sb.add(writeContent(section.include));
                    break;
    
                case 'doculisp-toc':
                    sb.add(writeTableOfContents(doculisp, section.include));
                    break;
            
                default:
                    break;
            }
    
            previousType = doculisp.type;
            previous = doculisp.documentOrder;
        }
    
        return sb.toString();
    }

    function buildAuthorTable(variableTable: IVariableTable): string | false {
        const authorsVariable = variableTable.getValue<IStringArray>('author');

        if(!authorsVariable){
            return false;
        }

        const authors = authorsVariable.value.map(v => v.value);

        if(authors.length === 0) {
            return false;
        }

        const sb = stringBuilderConstructor();
        authors.forEach(name => {
            sb.addLine(`<!-- Written By: ${name} -->`);
        });

        return sb.toString();
    }
    function writeAst(astMaybe: Result<IDoculisp | IEmptyDoculisp>, variableTable: IVariableTable): Result<string> {
        if(!astMaybe.success) {
            return astMaybe;
        }

        if(astMaybe.value.type === 'doculisp-empty'){
            return util.ok('');
        }

        const authorsMaybe = buildAuthorTable(variableTable);

        const sb = stringBuilderConstructor();
        const section = astMaybe.value.section;

        sb.addLine('<!-- GENERATED DOCUMENT DO NOT EDIT! -->');
        sb.addLine('<!-- prettier-ignore-start -->');
        sb.addLine('<!-- markdownlint-disable -->');
        sb.addLine();
        sb.addLine(`<!-- Compiled with doculisp https://www.npmjs.com/package/doculisp -->`);
        if(authorsMaybe){
            sb.addLine(authorsMaybe);
        }


        let previous: ILocation = util.location(astMaybe.value.projectLocation.documentPath, -1, -1, -1, -1);
        sb.addLine(writeSection(previous, section));
        
        sb.addLine();
        if(authorsMaybe){
            sb.addLine(authorsMaybe);
        }
        sb.addLine('<!-- markdownlint-restore -->');
        sb.addLine('<!-- prettier-ignore-end -->');
        sb.addLine('<!-- GENERATED DOCUMENT DO NOT EDIT! -->');
        return util.ok(sb.toString());
    }

    return {
        writeAst,
    }
}

const stringWriter: IRegisterable = {
    builder: (util: IUtil, stringBuilderConstructor: StringBuilderConstructor) => buildWriter(util, stringBuilderConstructor),
    name: 'stringWriter',
    dependencies: ['util', 'stringBuilder'],
    singleton: false,
};

export {
    stringWriter,
};