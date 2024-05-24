export interface IMarkupSearches {
    readonly startsWithRn: RegExp;
    readonly startsWithR: RegExp;
    readonly startsWithN: RegExp;
    readonly startsWithOpenComment: RegExp;
    readonly startsWithCloseComment: RegExp;
    readonly startsWithInlineMarker: RegExp;
    readonly startsWithMultilineMarker: RegExp;
    readonly startsWithDocuLisp: RegExp;
};

export interface IWhiteSpaceSearches {
    readonly startsWithWhiteSpace: RegExp;
};

export interface ILispSearches extends IWhiteSpaceSearches {
    readonly startsWithOpenLisp: RegExp;
    readonly startsWithCloseLisp: RegExp;
};

export interface IDocumentSearches extends IMarkupSearches, IWhiteSpaceSearches, ILispSearches {
};

export type Searcher = {
    searchDocumentFor: IDocumentSearches,
    searchLispFor: ILispSearches,
}