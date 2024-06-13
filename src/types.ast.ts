import { ILocation, IProjectLocation, Result } from "./types.general";
import { TokenizedDocument } from "./types.tokens";

export interface ILocationSortable {
    readonly documentOrder: ILocation;
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
    readonly subtitle?: string | undefined;
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
    projectLocation: IProjectLocation;
    section: ISectionWriter | IEmptyAst;
}

export type ParseAst = (tokenResults: Result<TokenizedDocument>) => Result<IAst>;
export interface IAstParser {
    parse(tokenResults: Result<TokenizedDocument>): Result<IAst>;
};