export interface IMarkupSearches {
    readonly startWithOpenComment: RegExp;
    readonly startWithCloseComment: RegExp;
    readonly startWithInlineMarker: RegExp;
    readonly startWithMultilineMarker: RegExp;
    readonly startWithDocuLisp: RegExp;
};

export interface IWhiteSpaceSearches {
    readonly startWithNonNewLineWhiteSpace: RegExp;
    readonly startWithAnyWhiteSpace: RegExp;
    readonly startWithWindowsNewline: RegExp;
    readonly startWithMacsNewline: RegExp;
    readonly startWithLinuxNewline: RegExp;
    readonly startWithAnyNewline: RegExp;
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

export type TextHelper = {
    isLetter(charCode: number) : Boolean;
    removeSymbols(word: string): string;
    containsSymbols(word: string): string[] | false;
    isLowercase(word: string): Boolean;
};
