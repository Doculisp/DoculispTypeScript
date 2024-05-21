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
const startsWithN = /^\r/;
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

function isWhiteSpace(value: string, line: number, char: number): ParseResult {
    let current = "";
    let start: Point | undefined;
    let hasWhiteSpace: boolean = false;

    function addLine(expression: RegExp) : void {
        let v: string = (value.match(expression) as any)[0];
            current += v;
            value = value.slice(v.length);
            char = 1;
            line++;
    }

    while(0 < value.length) {
        hasWhiteSpace = startsWithRn.test(value);
        if(!start && hasWhiteSpace){
            return constructResult(current, start, value, line, char);
        } else if(hasWhiteSpace) {
            addLine(startsWithRn);
            continue;
        }
        
        hasWhiteSpace = startsWithR.test(value);
        if(!start && hasWhiteSpace){
            return constructResult(current, start, value, line, char);
        } else if(hasWhiteSpace) {
            addLine(startsWithR);
            continue;
        }
        
        hasWhiteSpace = startsWithN.test(value);
        if(!start && hasWhiteSpace){
            return constructResult(current, start, value, line, char);
        } else if(hasWhiteSpace) {
            addLine(startsWithN);
            continue;
        }

        if(/^\S/.test(value)) {
            return constructResult(current, start, value, line, char);
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