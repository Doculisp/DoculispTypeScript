import { IAstEmpty, RootAst } from "./types.ast";
import { IPath } from "./types.filePath";
import { ILocation, IProjectLocation, Result } from "./types.general";
import { IVariableTable } from "./types.variableTable";

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
    readonly id?: string|undefined;
    readonly ref_link: string;
    readonly subtitle?: string | undefined;
};

export interface ILoad extends ILocationSortable {
    readonly type: 'doculisp-load';
    readonly path: IPath;
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
    readonly label: string | false;
    readonly bulletStyle: DoculispBulletStyle;
};

export interface IHeader extends ILocationSortable {
    readonly type: 'doculisp-header';
    readonly depthCount: number;
    readonly text: string;
    readonly id?: string | undefined;
};

export interface IContentLocation extends ILocationSortable {
    readonly type: 'doculisp-content';
}

export interface IPathId extends ILocationSortable {
    readonly type: 'doculisp-path-id';
    readonly id: string;
}

export type DoculispPart = IWrite | ITitle | ITableOfContents | IContentLocation | IHeader | IPathId;

export interface ISectionWriter extends ILocationSortable {
    readonly doculisp: DoculispPart[];
    readonly include: ILoad[];
    readonly type: 'doculisp-section';
};

export interface IEmptyDoculisp {
    readonly type: 'doculisp-empty';
}

export interface IDoculisp {
    projectLocation: IProjectLocation;
    section: ISectionWriter;
    type: 'doculisp-root';
}

export interface IDoculispParser {
    parse(tokenResults: Result<RootAst | IAstEmpty>, variableTable: IVariableTable): Result<IDoculisp | IEmptyDoculisp>;
};