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

export type DoculispBulletStyle = 
    'no-table'  |
    'unlabeled' |
    'labeled'   |
    'numbered'  |
    'numbered-labeled' |
    'bulleted' |
    'bulleted-labeled';

export const bulletStyles: ReadonlyArray<DoculispBulletStyle> = [
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
    readonly bulletStyle: DoculispBulletStyle;
};

export interface IHeader extends ILocationSortable {
    readonly type: 'ast-header'
    readonly depthCount: number;
    readonly text: string;
};

export interface IContentLocation extends ILocationSortable {
    readonly type: 'ast-content'
}

export type DoculispPart = IWrite | ITitle | ITableOfContents | IContentLocation | IHeader;

export interface ISectionWriter extends ILocationSortable {
    readonly type: 'ast-section';
    readonly ast: DoculispPart[];
    readonly include: ILoad[];
};

export interface IEmptyDoculisp {
    readonly type: 'ast-empty';
}

export interface IDoculisp {
    projectLocation: IProjectLocation;
    section: ISectionWriter | IEmptyDoculisp;
}

export type ParseAst = (tokenResults: Result<TokenizedDocument>) => Result<IDoculisp>;
export interface IDoculispParser {
    parse(tokenResults: Result<TokenizedDocument>): Result<IDoculisp>;
};