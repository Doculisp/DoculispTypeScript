import { IRegisterable } from "../types.containers";
import { IDocumentSearches, ILispSearches, Searcher } from "../types.textHelpers";

const documentSearches: IDocumentSearches = {
    startsWithWhiteSpace: /^\s/,
    startsWithRn: /^\r\n/,
    startsWithR: /^\r/,
    startsWithN: /^\n/,
    startsWithOpenComment: /^<!--/,
    startsWithCloseComment: /^-->/,
    startsWithInlineMarker: /^`/,
    startsWithMultilineMarker: /^```/,
    startsWithDocuLisp: /^\(dl/,
    startsWithOpenLisp: /^\(/,
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