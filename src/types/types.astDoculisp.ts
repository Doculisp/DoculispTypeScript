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
    readonly ref_link: string;
    readonly subtitle?: string | undefined;
};

export interface ILoad extends ILocationSortable {
    readonly type: 'ast-load';
    readonly path: string;
    readonly sectionLabel: string;
    document: ISectionWriter | false;
}

export type AstBulletStyle = 
    'no-table'  |
    'unlabeled' |
    'labeled'   |
    'numbered'  |
    'numbered-labeled' |
    'bulleted' |
    'bulleted-labeled';

export const bulletStyles: ReadonlyArray<AstBulletStyle> = [
    'no-table',
    'unlabeled',
    'labeled',
    'numbered',
    'numbered-labeled',
    'bulleted',
    'bulleted-labeled',
];

export interface ITableOfContents extends ILocationSortable {
    readonly type: 'ast-toc';
    readonly bulletStyle: AstBulletStyle;
};

export interface IHeader extends ILocationSortable {
    readonly type: 'ast-header'
    readonly depthCount: number;
    readonly text: string;
};

export interface IContentLocation extends ILocationSortable {
    readonly type: 'ast-content'
}

export type AstPart = IWrite | ITitle | ITableOfContents | IContentLocation | IHeader;

export interface ISectionWriter extends ILocationSortable {
    readonly type: 'ast-section';
    readonly ast: AstPart[];
    readonly include: ILoad[];
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