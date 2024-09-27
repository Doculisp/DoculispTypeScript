import { AstBulletStyle, AstPart, IAst, IHeader, ILoad, ISectionWriter, ITableOfContents, ITitle, IWrite } from "./types.ast";
import { IRegisterable } from "./types.containers";
import { IDocWriter } from "./types.docWriter";
import { IUtil, Result } from "./types.general";

function buildWriter(util: IUtil): IDocWriter {
    function getLabel(style: AstBulletStyle, load: ILoad): string {
        switch (style) {
            case 'bulleted':
            case 'numbered':
            case 'unlabeled':
                return '';
            default:
                return load.sectionLabel;
        }
    }

    function getNumberedBullet(): (label: string, text: string) => string {
        let cnt = 1;
        function bullet(label: string, text: string): string {
            const lbl = 0 < label.length ? `${label}: ` : '';
            const result = `${cnt}. ${lbl}${text}`;
            cnt++;
            return result;
        }

        return bullet;
    }

    function getBullet(): (label: string, text: string) => string {
        function bullet(label: string, text: string): string {
            const lbl = 0 < label.length ? `${label}: ` : '';
            return `* ${lbl}${text}`;
        }

        return bullet;
    }

    function getNoBullet(): (label: string, text: string) => string {
        function bullet(label: string, text: string): string {
            const lbl = 0 < label.length ? `${label}: ` : '';
            return `${lbl}${text}`;
        }
    }

    function getBulletBuilder(style: AstBulletStyle): (label: string, text: string) => string {
        switch (style) {
            case 'bulleted':
            case 'bulleted-labeled':
                return getBullet();
            case 'numbered':
            case 'numbered-labeled':
                return getNumberedBullet();
            default:
                return getNoBullet();
        }
    }

    function compileToc(astToc: ITableOfContents, loads: ILoad): string {
        if(astToc.bulletStyle === 'no-table') {
            return '';
        }
    }

    function compileContentLocation(loads: ILoad[]): string {
        const parts: string[] = [];

        loads.forEach(load => {
            if(load.document) {
                const section = compileSection(load.document);
                parts.push(section);
            }
        });

        return `${parts.join('\n')}`;
    }

    function compileHeader(astHeader: IHeader): string {
        const padding = '#'.repeat(astHeader.depthCount);
        return `${padding} ${astHeader.text} ${padding}`;
    }

    function compileTitle(astTitle: ITitle): string {
        return astTitle.label;
    }

    function compileWrite(astWrite: IWrite): string {
        return astWrite.value;
    }

    function compilePart(astPart: AstPart) : string {
        astPart.
    }

    function compileSection(astSection: ISectionWriter): string {
        const parts: string[] = [];

        
    }

    function compile(astResult: Result<IAst>): Result<string> {
        if(!astResult.success) {
            return astResult;
        }

        const ast = astResult.value;

        if(ast.section.type === 'ast-empty') {
            return util.ok('');
        }

        throw new Error("Not yet Implemented");
    }

    function write(path: string, astResult: Result<IAst>): Result<string> {
        throw new Error('Not yet Implemented');
    }

    return {
        compile,
        write,
    };
}

const documentWriter: IRegisterable = {
    builder: (util: IUtil) => buildWriter(util),
    name: 'docWriter',
    singleton: true,
    dependencies: ['util', 'fileHandler']
};

export {
    documentWriter,
};