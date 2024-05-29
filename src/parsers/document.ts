import { IRegisterable, Valid } from "../types.containers";
import { DocumentMap, DocumentParser, DocumentPart } from "../types.document";
import { ILocation, Result, fail, ok } from "../types.general";
import * as path from 'node:path';
import { IDocumentSearches, Searcher } from "../types.textHelpers";
import { SubParseResult } from "../types.internal";

type DocumentParse = {
    value: string;
    start: ILocation;
};


function documentParse(doesIt: IDocumentSearches): Valid<DocumentParser> {
    function parse(value: string, documentPath: string): Result<DocumentMap> {
        function constructDocumentMap(parts: DocumentPart[]) : DocumentMap {
            return {
                documentPath,
                parts,
            };
        }

        function constructResult(current: string, start: ILocation | undefined, rest: string, line: number, char: number): SubParseResult<DocumentParse | undefined> {
            let r: DocumentParse | undefined = !!start ? { value: current, start } : undefined;
            return {
                result: r,
                rest: rest,
                line: line,
                char: char,
                type: "parse result"
            };
        }
        
        function isWhiteSpace(value: string, line: number, char: number): SubParseResult<DocumentParse | undefined> {
            let current = "";
            let start: ILocation | undefined;
            let hasWhiteSpace: boolean = false;
        
            function addLine(expression: RegExp) : void {
                let v: string = (value.match(expression) as any)[0];
                    if(!start) {
                        start = { line, char };
                    }
                    current += v;
                    value = value.slice(v.length);
                    char = 1;
                    line++;
            }
        
            while(0 < value.length) {
                if(/^\S/.test(value)) {
                    return constructResult(current, start, value, line, char);
                }
        
                hasWhiteSpace = doesIt.startWithWindowsNewline.test(value);
                if(hasWhiteSpace) {
                    addLine(doesIt.startWithWindowsNewline);
                    continue;
                }
                
                hasWhiteSpace = doesIt.startWithMacsNewline.test(value);
                if(hasWhiteSpace) {
                    addLine(doesIt.startWithMacsNewline);
                    continue;
                }
                
                hasWhiteSpace = doesIt.startWithLinuxNewline.test(value);
                if(hasWhiteSpace) {
                    addLine(doesIt.startWithLinuxNewline);
                    continue;
                }
        
                if(!start) {
                    start = { line, char };
                }
                current += value.charAt(0);
                value = value.slice(1);
                char++;
            }
        
            return constructResult(current, start, value, line, char);
        }

        function isDoculisp(value: string, line: number, char: number, start?: ILocation | undefined): Result<SubParseResult<DocumentParse | undefined>> {
            let current = "";
            let depth = !!start ? 1 : 0;
        
            while(0 < value.length) {
                if(doesIt.startWithDocuLisp.test(value)) {
                    if(!start) {
                        start = { line, char };
                    } else {
                        return fail(`Doculisp Block at { line: ${start.line}, char: ${start.char}} contains an embedded doculisp block at { line: ${line}, char: ${char} }.`, documentPath);
                    }

                    let v: string = (value.match(doesIt.startWithDocuLisp) as any)[0];
                    char += v.length;
                    value = value.slice(v.length);
                    depth++;
                    continue;
                }

                if(doesIt.startWithOpenLisp.test(value)) {
                    let v: string = (value.match(doesIt.startWithOpenLisp) as any)[0];
                    current += v;
                    char + v.length;
                    value = value.slice(v.length);
                    depth++;
                    continue;
                }

                const closes = doesIt.startsWithCloseLisp.test(value);
                if(1 < depth && closes) {
                    let v: string = (value.match(doesIt.startsWithCloseLisp) as any)[0];
                    current += v;
                    char += v.length;
                    value = value.slice(v.length);
                    depth--;
                    continue;
                } else if (closes) {
                    let v: string = (value.match(doesIt.startsWithCloseLisp) as any)[0];
                    char += v.length;
                    value = value.slice(v.length);
                    depth--;
                    return ok(constructResult(current.trim(), start, value, line, char));
                }

                if(doesIt.startWithWhiteSpace.test(value)) {
                    let whiteSpace = isWhiteSpace(value, line, char);
                    if(start && whiteSpace.result) {
                        current += whiteSpace.result.value;
                    }

                    line = whiteSpace.line;
                    char = whiteSpace.char;
                    value = whiteSpace.rest;
                    continue;
                }

                current += value.charAt(0);
                value = value.slice(1);
                char++;
            }

            start = start as any as ILocation;
            return fail(`Doculisp block at { line: ${start.line}, char: ${start.char} } is not closed.`, documentPath);
        }
        
        function isComment(value: string, line: number, char: number): Result<SubParseResult<DocumentParse | undefined>[]> {
            let start: ILocation | undefined;
            let results: SubParseResult<DocumentParse | undefined>[] = [];
        
            while(0 < value.length) {
                const hasStart = !!start;
                let hasOpenComment = doesIt.startWithOpenComment.test(value);
                if(hasOpenComment) {
                    let v: string = (value.match(doesIt.startWithOpenComment) as any)[0];
                    if (!hasStart){
                        start = { line, char };
                    }
                    value = value.slice(v.length);
                    char += v.length;
                    continue;
                }
        
                let hasCloseComment = doesIt.startWithCloseComment.test(value);
                if(hasStart && hasCloseComment) {
                    let v: string = (value.match(doesIt.startWithCloseComment) as any)[0];
                    value = value.slice(v.length);
                    char += v.length;
                    results[results.length] = constructResult("", undefined, value, line, char)
                    return ok(results);
                }

                if(doesIt.startWithDocuLisp.test(value)) {
                    let doculisp = isDoculisp(value, line, char);
                    if(doculisp.success) {
                        results[results.length] = doculisp.value;
                        value = doculisp.value.rest;
                        continue;
                    } else {
                        return fail(doculisp.message, documentPath);
                    }
                }
        
                let hasWhiteSpace = doesIt.startWithWhiteSpace.test(value);
                if(hasWhiteSpace) {
                    let whiteSpace = isWhiteSpace(value, line, char);
                    value = whiteSpace.rest;
                    line = whiteSpace.line;
                    char = whiteSpace.char;
                    continue;
                }
        
                if(!hasStart){
                    results[results.length] = constructResult("", undefined, value, line, char)
                    return ok(results);
                } else {
                    value = value.slice(1);
                    char++;
                }
            }
        
            if(!start){
                results[results.length] = constructResult("", undefined, value, line, char)
                return ok(results);
            } else {
                return fail(`Open HTML Comment at { line: ${start.line}, char: ${start.char} } but does not close.`, documentPath);
            }
        }
        
        function isInline(value: string, line: number, char: number): Result<SubParseResult<DocumentParse | undefined>> {
            let current = "";
            let start: ILocation | undefined;
        
            while(0 < value.length) {
                let inLineMarkerFound = doesIt.startWithInlineMarker.test(value);
                if(inLineMarkerFound) {
                    const inline: string = (value.match(doesIt.startWithInlineMarker) as any)[0];
                    
                    current += inline;
                    value = value.slice(inline.length);
                    let l = line;
                    let c = char;
                    char += inline.length;
        
                    if(start) {
                        return ok(constructResult(current, start, value, line, char));
                    } else {
                        start = { line: l, char: c };
                        continue;
                    }
                }
        
                if(doesIt.startWithWhiteSpace.test(value)) {
                    let whiteSpace = isWhiteSpace(value, line, char);
                    if(start && line != whiteSpace.line) {
                        return fail(`Inline code block at { line: ${start.line}, char: ${start.char} } contains a new line before closing.`, documentPath);
                    }
                    current += whiteSpace.result?.value;
                    value = whiteSpace.rest;
                    char = whiteSpace.char;
                    continue;
                }
        
                if(!start) {
                    return ok(constructResult("", start, value, line, char));
                }
        
                current += value.at(0);
                value = value.slice(1);
                char = char++;
            }
        
            if(start) {
                return fail(`Inline code block at { line: ${start.line}, char: ${start.char} } does not close`, documentPath);
            }
            return ok(constructResult(current, start, value, line, char));
        }
        
        function isMultiline(value: string, line: number, char: number): Result<SubParseResult<DocumentParse | undefined>> {
            let current = "";
            let start: ILocation | undefined;
        
            while(0 < value.length) {
                let inLineMarkerFound = doesIt.startWithMultilineMarker.test(value);
                if(inLineMarkerFound) {
                    const inline: string = (value.match(doesIt.startWithMultilineMarker) as any)[0];
                    
                    current += inline;
                    value = value.slice(inline.length);
                    let l = line;
                    let c = char;
                    char += inline.length;
        
                    if(start) {
                        return ok(constructResult(current, start, value, line, char));
                    } else {
                        start = { line: l, char: c };
                        continue;
                    }
                }
        
                if(doesIt.startWithWhiteSpace.test(value)) {
                    let whiteSpace = isWhiteSpace(value, line, char);
                    current += whiteSpace.result?.value;
                    value = whiteSpace.rest;
                    char = whiteSpace.char;
                    continue;
                }
        
                if(!start) {
                    return ok(constructResult("", start, value, line, char));
                }
        
                current += value.at(0);
                value = value.slice(1);
                char = char++;
            }
        
            if(start) {
                return fail(`Multiline code block at { line: ${start.line}, char: ${start.char} } does not close`, documentPath);
            }
        
            return ok(constructResult(current, start, value, line, char));
        }
        
        function isWord(value: string, line: number, char: number): Result<SubParseResult<DocumentParse | undefined>> {
            let current = "";
            let start: ILocation | undefined;
        
            while(0 < value.length) {
                let hasWhiteSpace = doesIt.startWithWhiteSpace.test(value);
                if(!start && hasWhiteSpace) {
                    return ok(constructResult(current, start, value, line, char));
                } else if (hasWhiteSpace) {
                    const whiteSpace = isWhiteSpace(value, line, char);
                    current += whiteSpace.result?.value;
                    value = whiteSpace.rest;
                    line = whiteSpace.line;
                    char = whiteSpace.char;
                    continue;
                }
        
                if(doesIt.startWithOpenComment.test(value)) {
                    return ok(constructResult(current.trim(), start, value, line, char));
                }
        
                if(doesIt.startWithMultilineMarker.test(value)) {
                    let multiline = isMultiline(value, line, char);
                    if(multiline.success) {
                        let v = multiline.value;
                        value = v.rest;
                        line = v.line;
                        char = v.char;

                        if(v.result) {
                            current += v.result.value;
                            if(!start) {
                                start = v.result.start;
                            }
                        }
                    } else {
                        return fail(multiline.message, documentPath);
                    }
                }
        
                if(doesIt.startWithInlineMarker.test(value)) {
                    let inline = isInline(value, line, char);
                    if(inline.success) {
                        let v = inline.value;
                        value = v.rest;
                        line = v.line;
                        char = v.char;
                        if(v.result){
                            current += v.result.value;
                            if(!start) {
                                start = v.result.start;
                            }
                        }
                        continue;
                    } else {
                        return fail(inline.message, documentPath);
                    }
                }
        
                if(!start) {
                    start = { line, char };
                }
                current += value.charAt(0);
                value = value.slice(1);
                char++;
            }
        
            return ok(constructResult(current.trim(), start, value, line, char));
        }

        if(0 === value.length) {
            return ok(constructDocumentMap([]));
        }

        let line = 1;
        let char = 1;
        let current: DocumentPart[] = [];

        let ext = path.extname(documentPath);
        if(ext === '.dlisp') {
            let lisp = isDoculisp(`${value})`, line, 1, { line: 1, char: 1 });
            if(lisp.success) {
                let v = lisp.value;
                if(v.result){
                    current[current.length] = {
                        location: { line: v.result.start.line, char: v.result.start.char },
                        text: v.result.value,
                        type: 'lisp'
                    };
                    
                    value = '';

                    if(0 < v.rest.trim().length) {
                        let whiteSpace = isWhiteSpace(v.rest, v.line, v.char);

                        return fail(`Doculisp block at { line: 1, char: 1 } has something not contained in parenthesis at { line: ${whiteSpace.line}, char: ${whiteSpace.char} }.`, documentPath);
                    }
                }
            }
            else {
                return fail(lisp.message, documentPath);
            }
        }

        while (0 < value.length) {
            let v = isWhiteSpace(value, line, char);
            if(v.result) {
                value = v.rest;
                line = v.line;
                char = v.char;
                continue;
            }

            if(doesIt.startWithOpenComment.test(value)) {
                let comment = isComment(value, line, char);
                if(comment.success) {
                    comment.value.forEach(element => {
                        if(element.result) {
                            current[current.length] = {
                                location: { line: element.result.start.line, char: element.result.start.char },
                                text: element.result.value,
                                type: "lisp",
                            };
                        }
                        if(element.rest.length < value.length) {
                            value = element.rest;
                            char = element.char;
                            line = element.line;
                        }
                    });
                    continue;
                } else {
                    return fail(comment.message, documentPath);
                }
            }

            let word = isWord(value, line, char);
            if(word.success){
                v = word.value;
                if(v.result) {
                    value = v.rest;
                    current[current.length] = {
                        location: { line, char },
                        text: v.result.value,
                        type: "text",
                    };
                    line = v.line;
                    char = v.char;
                    continue;
                }
            } else {
                return fail(word.message, documentPath);
            }

            return fail(`unknown value "${value}"`, documentPath);
        }

        return ok(constructDocumentMap(current));
    }

    return parse;
}

const registerable: IRegisterable = {
    builder: (searches: Searcher) => documentParse(searches.searchDocumentFor),
    name: 'documentParse',
    singleton: true,
    dependencies: ['searches']
};

export {
    registerable as document,
};