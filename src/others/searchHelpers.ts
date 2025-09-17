import { IRegisterable } from "../types/types.containers";
import { IDocumentSearches, ILispSearches, Searcher } from "../types/types.textHelpers";

const documentSearches: IDocumentSearches = {
    startWithNonNewLineWhiteSpace: /^[^\S\r\n]/, // /^\s/,
    startWithAnyWhiteSpace: /^\s/,
    startWithWindowsNewline: /^\r\n/,
    startWithMacsNewline: /^\r/,
    startWithLinuxNewline: /^\n/,
    startWithAnyNewline: /^[\r\n]/,
    startWithOpenComment: /^<!--/,
    startWithCloseComment: /^-->/,
    startWithInlineMarker: /^`/,
    startWithMultilineMarker: /^``+/,
    startWithDocuLisp: /^\(dl/,
    startWithOpenLisp: /^\(/,
    startsWithCloseLisp: /^\)/,
}

const searcher: Searcher = {
    searchLispFor: documentSearches as ILispSearches,
    searchDocumentFor: documentSearches as IDocumentSearches,
}

const registerable: IRegisterable = {
    builder: () => searcher,
    name: 'searches',
    singleton: true,
};

export {
    registerable as document,
};