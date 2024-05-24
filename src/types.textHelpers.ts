export interface IMarkupSearches {
    readonly startWithOpenComment: RegExp;
    readonly startWithCloseComment: RegExp;
    readonly startWithInlineMarker: RegExp;
    readonly startWithMultilineMarker: RegExp;
    readonly startWithDocuLisp: RegExp;
};

export interface IWhiteSpaceSearches {
    readonly startWithWhiteSpace: RegExp;
    readonly startWithRn: RegExp;
    readonly startWithR: RegExp;
    readonly startWithN: RegExp;
};

export interface ILispSearches extends IWhiteSpaceSearches {
    readonly startWithOpenLisp: RegExp;
    readonly startsWithCloseLisp: RegExp;
};

export interface IDocumentSearches extends IMarkupSearches, IWhiteSpaceSearches, ILispSearches {
};

export type Searcher = {
    searchDocumentFor: IDocumentSearches,
    searchLispFor: ILispSearches,
}