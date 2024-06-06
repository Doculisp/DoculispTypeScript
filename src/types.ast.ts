import { ILocation } from "./types.general";

export type AstOrder = 'before' | 'same' | 'after';

export interface IAst {
    readonly inDocumentOrder: ILocation;
    readonly documentOrder: number;
    compare(other: IAst): AstOrder;
};

export interface IWrite extends IAst {
    readonly type: 'ast-write';
    readonly value: string;
};

export interface ISubTitle extends IAst {
    readonly type: 'ast-subtitle';
    readonly subtitle: string;
};

export interface ITitle extends IAst {
    readonly type: 'ast-title',
    readonly title: string;
    readonly label: string;
    readonly link: string;
    readonly subTitle: ISubTitle | false;
};

export interface ILoad extends IAst {
    readonly type: 'ast-load';
    readonly path: string;
    readonly document: IDocumentWriter | false;
}

export type AstBulletStyle = 
    'no-table'  |
    'unlabeled' |
    'labeled'   |
    'numbered'  |
    'numbered-labeled' |
    'bulleted' |
    'bulleted-labeled';

export interface ITableOfContents extends IAst {
    readonly type: 'ast-toc';
    readonly sectionTitles: ITitle[];
    readonly bulletStyle: AstBulletStyle;
};

export interface IHeader extends IAst {
    readonly type: 'ast-header'
    readonly depthCount: number;
    readonly text: string;
};

export interface IContent extends IAst {
    readonly type: 'ast-content-write';
};

export interface IDocumentWriter extends IAst {
    readonly type: 'ast-document';
    readonly subDocuments: ILoad[];
    readonly ast: IAst[];
};