import { IRegisterable, Valid } from "../types.containers";
import { DocumentMap, DocumentParser } from "../types.document";
import { Result, fail, ok } from "../types.general";

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

function documentParse(): Valid<DocumentParser> {
    function parse(value: string, path: string): Result<DocumentMap> {

        function constructTextResult(current: string, start: Point | undefined, rest: string, line: number, char: number): ParseResult {
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
                    return constructTextResult(current, start, value, line, char);
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
        
            return constructTextResult(current, start, value, line, char);
        }
        
        function isComment(value: string, line: number, char: number): Result<ParseResult> {
            let start: Point | undefined;
        
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
                    return ok(constructTextResult("", start, value, line, char));
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
                    return ok(constructTextResult("", start, value, line, char));
                } else {
                    value = value.slice(1);
                    char++;
                }
            }
        
            if(!start){
                return ok(constructTextResult("", start, value, line, char));
            } else {
                return fail(`Open HTML Comment at { line: ${start.line}, char: ${start.char} } but does not close.`, path);
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
                        return ok(constructTextResult(current, start, value, line, char));
                    } else {
                        start = { line: l, char: c };
                        continue;
                    }
                }
        
                if(startsWithWhiteSpace.test(value)) {
                    let whiteSpace = isWhiteSpace(value, line, char);
                    if(start && line != whiteSpace.line) {
                        return fail(`Inline code block at { line: ${start.line}, char: ${start.char} } contains a new line before closing.`, path);
                    }
                    current += whiteSpace.result;
                    value = whiteSpace.rest;
                    char = whiteSpace.char;
                    continue;
                }
        
                if(!start) {
                    return ok(constructTextResult("", start, value, line, char));
                }
        
                current += value.at(0);
                value = value.slice(1);
                char = char++;
            }
        
            if(start) {
                return fail(`Inline code block at { line: ${start.line}, char: ${start.char} } does not close`, path);
            }
            return ok(constructTextResult(current, start, value, line, char));
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
                        return ok(constructTextResult(current, start, value, line, char));
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
                    return ok(constructTextResult("", start, value, line, char));
                }
        
                current += value.at(0);
                value = value.slice(1);
                char = char++;
            }
        
            if(start) {
                return fail(`Multiline code block at { line: ${start.line}, char: ${start.char} } does not close`, path);
            }
        
            return ok(constructTextResult(current, start, value, line, char));
        }
        
        function isWord(value: string, line: number, char: number): Result<ParseResult> {
            let current = "";
            let start: Point | undefined;
        
            while(0 < value.length) {
                let hasWhiteSpace = startsWithWhiteSpace.test(value);
                if(!start && hasWhiteSpace) {
                    return ok(constructTextResult(current, start, value, line, char));
                } else if (hasWhiteSpace) {
                    const whiteSpace = isWhiteSpace(value, line, char);
                    current += whiteSpace.result;
                    value = whiteSpace.rest;
                    line = whiteSpace.line;
                    char = whiteSpace.char;
                    continue;
                }
        
                if(startsWithOpenComment.test(value)) {
                    return ok(constructTextResult(current.trim(), start, value, line, char));
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
                        return fail(multiline.message, path);
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
                        return fail(inline.message, path);
                    }
                }
        
                if(!start) {
                    start = { line, char };
                }
                current += value.charAt(0);
                value = value.slice(1);
                char++;
            }
        
            return ok(constructTextResult(current.trim(), start, value, line, char));
        }

        if(0 === value.length) {
            return ok([]);
        }

        let line = 1;
        let char = 1;
        let current: DocumentMap = [];

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
                    v = comment.value;
                    if(v.start) {
                        value = v.rest;
                        line = v.line;
                        char = v.char;
                    }
                } else {
                    return fail(comment.message, path);
                }
                continue;
            }

            let word = isWord(value, line, char);
            if(word.success){
                v = word.value;
                if(v.start) {
                    value = v.rest;
                    current[current.length] = {
                        location: { line, char, documentPath: path },
                        text: v.result,
                        type: "text",
                    };
                    line = v.line;
                    char = v.char;
                    continue;
                }
            } else {
                return fail(word.message, path);
            }

            return fail(`unknown value "${value}"`, path);
        }

        return ok(current);
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