import { IRegisterable } from "../types.containers";
import { IDocumentSearches, ILispSearches, Searcher } from "../types.textHelpers";

const documentSearches: IDocumentSearches = {
    startWithWhiteSpace: /^\s/,
    startWithWindowsNewline: /^\r\n/,
    startWithMacsNewline: /^\r/,
    startWithLinuxNewline: /^\n/,
    startWithOpenComment: /^<!--/,
    startWithCloseComment: /^-->/,
    startWithInlineMarker: /^`/,
    startWithMultilineMarker: /^```/,
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