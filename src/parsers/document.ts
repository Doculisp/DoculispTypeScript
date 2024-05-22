import { IRegisterable, Valid } from "../types.containers";
import { DocumentMap, DocumentParser, DocumentPart } from "../types.document";
import { Result, fail, ok } from "../types.general";
import * as path from 'node:path';

type Point = { line: number; char: number; }

type ParseResult = {
    result: string;
    rest: string;
    line: number;
    char: number;
    start: Point | undefined;
}

// type ParseFunction = (value: string, line: number, char: number) => ParseResult;

const startsWithWhiteSpace = /^\s/;
const startsWithRn = /^\r\n/;
const startsWithR = /^\r/;
const startsWithN = /^\n/;
const startsWithOpenComment = /^<!--/;
const startsWithCloseComment = /^-->/;
const startsWithInlineMarker = /^`/;
const startsWithMultilineMarker = /^```/;
const startsWithDocuLisp = /^\(dl/;
const startsWithOpenLisp = /^\(/;
const startsWithCloseLisp = /^\)/;

function documentParse(): Valid<DocumentParser> {
    function parse(value: string, documentPath: string): Result<DocumentMap> {
        function constructDocumentMap(parts: DocumentPart[]) : DocumentMap {
            return {
                documentPath,
                parts,
            };
        }

        function constructResult(current: string, start: Point | undefined, rest: string, line: number, char: number): ParseResult {
            let r = !!start ? current : "";
            return {
                result: r,
                rest: rest,
                line: line,
                char: char,
                start: start,
            };
        }
        
        function isWhiteSpace(value: string, line: number, char: number): ParseResult {
            let current = "";
            let start: Point | undefined;
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
        
                hasWhiteSpace = startsWithRn.test(value);
                if(hasWhiteSpace) {
                    addLine(startsWithRn);
                    continue;
                }
                
                hasWhiteSpace = startsWithR.test(value);
                if(hasWhiteSpace) {
                    addLine(startsWithR);
                    continue;
                }
                
                hasWhiteSpace = startsWithN.test(value);
                if(hasWhiteSpace) {
                    addLine(startsWithN);
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

        function isDoculisp(value: string, line: number, char: number, start?: Point | undefined): Result<ParseResult> {
            let current = "";
            let depth = !!start ? 1 : 0;
        
            while(0 < value.length) {
                if(startsWithDocuLisp.test(value)) {
                    if(!start) {
                        start = { line, char };
                    } else {
                        return fail(`Doculisp Block at { line: ${start.line}, char: ${start.char}} contains an embedded doculisp block at { line: ${line}, char: ${char} }.`, documentPath);
                    }

                    let v: string = (value.match(startsWithDocuLisp) as any)[0];
                    char += v.length;
                    value = value.slice(v.length);
                    depth++;
                    continue;
                }

                if(startsWithOpenLisp.test(value)) {
                    let v: string = (value.match(startsWithOpenLisp) as any)[0];
                    current += v;
                    char + v.length;
                    value = value.slice(v.length);
                    depth++;
                    continue;
                }

                const closes = startsWithCloseLisp.test(value);
                if(1 < depth && closes) {
                    let v: string = (value.match(startsWithCloseLisp) as any)[0];
                    current += v;
                    char += v.length;
                    value = value.slice(v.length);
                    depth--;
                    continue;
                } else if (closes) {
                    let v: string = (value.match(startsWithCloseLisp) as any)[0];
                    char += v.length;
                    value = value.slice(v.length);
                    depth--;
                    return ok(constructResult(current.trim(), start, value, line, char));
                }

                if(startsWithWhiteSpace.test(value)) {
                    let whiteSpace = isWhiteSpace(value, line, char);
                    if(start) {
                        current += whiteSpace.result;
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

            start = start as any as Point;
            return fail(`Doculisp block at { line: ${start.line}, char: ${start.char} } is not closed.`, documentPath);
        }
        
        function isComment(value: string, line: number, char: number): Result<ParseResult[]> {
            let start: Point | undefined;
            let results: ParseResult[] = [];
        
            while(0 < value.length) {
                const hasStart = !!start;
                let hasOpenComment = startsWithOpenComment.test(value);
                if(hasOpenComment) {
                    let v: string = (value.match(startsWithOpenComment) as any)[0];
                    if (!hasStart){
                        start = { line, char };
                    }
                    value = value.slice(v.length);
                    char += v.length;
                    continue;
                }
        
                let hasCloseComment = startsWithCloseComment.test(value);
                if(hasStart && hasCloseComment) {
                    let v: string = (value.match(startsWithCloseComment) as any)[0];
                    value = value.slice(v.length);
                    char += v.length;
                    results[results.length] = constructResult("", undefined, value, line, char)
                    return ok(results);
                }

                if(startsWithDocuLisp.test(value)) {
                    let doculisp = isDoculisp(value, line, char);
                    if(doculisp.success) {
                        results[results.length] = doculisp.value;
                        value = doculisp.value.rest;
                        continue;
                    } else {
                        return fail(doculisp.message, documentPath);
                    }
                }
        
                let hasWhiteSpace = startsWithWhiteSpace.test(value);
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
        
        function isInline(value: string, line: number, char: number): Result<ParseResult> {
            let current = "";
            let start: Point | undefined;
        
            while(0 < value.length) {
                let inLineMarkerFound = startsWithInlineMarker.test(value);
                if(inLineMarkerFound) {
                    const inline: string = (value.match(startsWithInlineMarker) as any)[0];
                    
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
        
                if(startsWithWhiteSpace.test(value)) {
                    let whiteSpace = isWhiteSpace(value, line, char);
                    if(start && line != whiteSpace.line) {
                        return fail(`Inline code block at { line: ${start.line}, char: ${start.char} } contains a new line before closing.`, documentPath);
                    }
                    current += whiteSpace.result;
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
        
        function isMultiline(value: string, line: number, char: number): Result<ParseResult> {
            let current = "";
            let start: Point | undefined;
        
            while(0 < value.length) {
                let inLineMarkerFound = startsWithMultilineMarker.test(value);
                if(inLineMarkerFound) {
                    const inline: string = (value.match(startsWithMultilineMarker) as any)[0];
                    
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
        
                if(startsWithWhiteSpace.test(value)) {
                    let whiteSpace = isWhiteSpace(value, line, char);
                    current += whiteSpace.result;
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
        
        function isWord(value: string, line: number, char: number): Result<ParseResult> {
            let current = "";
            let start: Point | undefined;
        
            while(0 < value.length) {
                let hasWhiteSpace = startsWithWhiteSpace.test(value);
                if(!start && hasWhiteSpace) {
                    return ok(constructResult(current, start, value, line, char));
                } else if (hasWhiteSpace) {
                    const whiteSpace = isWhiteSpace(value, line, char);
                    current += whiteSpace.result;
                    value = whiteSpace.rest;
                    line = whiteSpace.line;
                    char = whiteSpace.char;
                    continue;
                }
        
                if(startsWithOpenComment.test(value)) {
                    return ok(constructResult(current.trim(), start, value, line, char));
                }
        
                if(startsWithMultilineMarker.test(value)) {
                    let multiline = isMultiline(value, line, char);
                    if(multiline.success) {
                        let v = multiline.value;
                        current += v.result;
                        value = v.rest;
                        line = v.line;
                        char = v.char;
                        if(!start) {
                            start = v.start;
                        }
                    } else {
                        return fail(multiline.message, documentPath);
                    }
                }
        
                if(startsWithInlineMarker.test(value)) {
                    let inline = isInline(value, line, char);
                    if(inline.success) {
                        let v = inline.value;
                        current += v.result;
                        value = v.rest;
                        line = v.line;
                        char = v.char;
                        if(!start) {
                            start = v.start;
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
                if(v.start){
                    current[current.length] = {
                        location: { line: v.start.line, char: v.start.char },
                        text: v.result,
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
            if(v.start) {
                value = v.rest;
                line = v.line;
                char = v.char;
                continue;
            }

            if(startsWithOpenComment.test(value)) {
                let comment = isComment(value, line, char);
                if(comment.success) {
                    comment.value.forEach(element => {
                        if(element.start) {
                            current[current.length] = {
                                location: { line: element.start.line, char: element.start.char },
                                text: element.result,
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
                if(v.start) {
                    value = v.rest;
                    current[current.length] = {
                        location: { line, char },
                        text: v.result,
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
    builder: documentParse,
    name: 'documentParse',
    singleton: true,
};

export {
    registerable as document,
};