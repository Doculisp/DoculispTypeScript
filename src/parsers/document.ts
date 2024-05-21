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
            return ok(constructResult("", start, value, line, char));
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
            return ok(constructResult("", start, value, line, char));
        } else {
            value = value.slice(1);
            char++;
        }
    }

    if(!start){
        return ok(constructResult("", start, value, line, char));
    } else {
        return fail(`Open HTML Comment at { line: ${line}, char: ${char} } but no close`);
    }
}

function isWord(value: string, line: number, char: number): ParseResult {
    let current = "";
    let start: Point | undefined;

    while(0 < value.length) {
        let hasWhiteSpace = startsWithWhiteSpace.test(value);
        if(!start && hasWhiteSpace) {
            return constructResult(current, start, value, line, char);
        } else if (hasWhiteSpace) {
            const whiteSpace = isWhiteSpace(value, line, char);
            current += whiteSpace.result;
            value = whiteSpace.rest;
            line = whiteSpace.line;
            char = whiteSpace.char;
            continue;
        }

        if(!start) {
            start = { line, char };
        }
        current += value.charAt(0);
        value = value.slice(1);
        char++;
    }

    return constructResult(current.trim(), start, value, line, char);
}

function documentParse(): Valid<DocumentParser> {
    function parse(value: string, path: string): Result<DocumentMap> {
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
                    return fail(comment.message);
                }
                continue;
            }

            v = isWord(value, line, char);
            if(v.start) {
                value = v.rest;
                current[current.length] = {
                    location: { line, char, document: path },
                    text: v.result,
                    type: "text",
                };
                line = v.line;
                char = v.char;
                continue;
            }

            return fail(`unknown value "${value}"`);
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