import { ILocation, IProjectLocation, Result } from "./types.general";
import { TokenizedDocument } from "./types.tokens";

export interface ILocationSortable {
    readonly documentOrder: ILocation;
};

export interface IWrite extends ILocationSortable {
    readonly type: 'doculisp-write';
    readonly value: string;
};

export interface ITitle extends ILocationSortable {
    readonly type: 'doculisp-title';
    readonly title: string;
    readonly label: string;
    readonly ref_link: string;
    readonly subtitle?: string | undefined;
};

export interface ILoad extends ILocationSortable {
    readonly type: 'doculisp-load';
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
    readonly type: 'doculisp-toc';
    readonly bulletStyle: DoculispBulletStyle;
};

export interface IHeader extends ILocationSortable {
    readonly type: 'doculisp-header'
    readonly depthCount: number;
    readonly text: string;
};

export interface IContentLocation extends ILocationSortable {
    readonly type: 'doculisp-content'
}

export type DoculispPart = IWrite | ITitle | ITableOfContents | IContentLocation | IHeader;

export interface ISectionWriter extends ILocationSortable {
    readonly type: 'doculisp-section';
    readonly doculisp: DoculispPart[];
    readonly include: ILoad[];
};

export interface IEmptyDoculisp {
    readonly type: 'doculisp-empty';
}

export interface IDoculisp {
    projectLocation: IProjectLocation;
    section: ISectionWriter | IEmptyDoculisp;
}

export interface IDoculispParser {
    parse(tokenResults: Result<TokenizedDocument>): Result<IDoculisp>;
};