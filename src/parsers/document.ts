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

type ParseFunction = (value: string, line: number, char: number) => ParseResult;

const startsWithWhiteSpace = /^\s+/;
const startsWithWord = /^\w([\w\s]*\w)*/;

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

function is(expression: RegExp): ParseFunction {
    return function isThing(value: string, line: number, char: number): ParseResult {
        let current = "";
        let start: Point | undefined;
    
        while(0 < value.length) {
            let match = value.match(expression);
            if(match) {
                if(!start) {
                    start = { line, char};
                }
                let v = match[0];
                current += v;
                value = value.slice(v.length);
                char += v.length;
                continue;
            }
    
            return constructResult(current, start, value, line, char);
        }
    
        return constructResult(current, start, value, line, char);
    };
}

const isWord = is(startsWithWord);
const isWhiteSpace = is(startsWithWhiteSpace);

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