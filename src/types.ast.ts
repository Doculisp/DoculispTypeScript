import { ILocation, Result } from "./types.general";
import { TokenizedDocument } from "./types.tokens";

export type AstBefore = -1
export type AstSame = 0
export type AstAfter = 1;
export type AstOrder = AstBefore | AstSame | AstAfter;

export interface IDocumentOrder extends ILocation {
    readonly documentDepth: number;
    readonly documentIndex: number;
    compare(other: IDocumentOrder): AstOrder;
}

export interface ILocationSortable {
    readonly documentOrder: IDocumentOrder;
};

export interface IWrite extends ILocationSortable {
    readonly type: 'ast-write';
    readonly value: string;
};

export interface ITitle extends ILocationSortable {
    readonly type: 'ast-title';
    readonly title: string;
    readonly label: string;
    readonly link: string;
};

export interface ILoad extends ILocationSortable {
    readonly type: 'ast-load';
    readonly path: string;
    readonly document: ISectionWriter | false;
}

export type AstBulletStyle = 
    'no-table'  |
    'unlabeled' |
    'labeled'   |
    'numbered'  |
    'numbered-labeled' |
    'bulleted' |
    'bulleted-labeled';

export interface ITableOfContents extends ILocationSortable {
    readonly type: 'ast-toc';
    readonly sectionTitles: ITitle[];
    readonly bulletStyle: AstBulletStyle;
};

export interface IHeader extends ILocationSortable {
    readonly type: 'ast-header'
    readonly depthCount: number;
    readonly text: string;
};

export type AstPart = IWrite | ITitle | ILoad | ITableOfContents | IHeader;

export interface ISectionWriter extends ILocationSortable {
    readonly type: 'ast-section';
    readonly ast: AstPart[];
};

export interface IEmptyAst {
    readonly type: 'ast-empty';
}

export interface IAst {
    documentPath: string;
    section: ISectionWriter | IEmptyAst;
}

export type ParseAst = (tokenResults: Result<TokenizedDocument>) => Result<IAst>;
export interface IAstParser {
    parse(tokenResults: Result<TokenizedDocument>): Result<IAst>;
};