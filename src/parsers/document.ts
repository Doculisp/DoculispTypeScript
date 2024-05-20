import { IRegisterable, Valid } from "../types.containers";
import { DocumentMap, DocumentParser } from "../types.document";
import { Result, fail, ok } from "../types.general";

type ParseResult = {
    result: string | undefined;
    rest: string;
    line: number;
    char: number;
}

type ParseFunction = (value: string, line: number, char: number) => ParseResult;

const startsWithWhiteSpace = /^\s/;
const startsWithWord = /^\w([\w\s]*\w)*/;

function constructResult(current: string, rest: string, line: number, char: number): ParseResult {
    let r = 0 < current.length ? current : undefined;
    return {
        result: r,
        rest: rest,
        line: line,
        char: char,
    };
}

function is(expression: RegExp): ParseFunction {
    return function isThing(value: string, line: number, char: number): ParseResult {
        let current = "";
    
        while(0 < value.length) {
            let match = value.match(expression);
            if(match) {
                let v = match[0];
                current += v;
                value = value.slice(v.length);
                char += v.length;
                continue;
            }
    
            return constructResult(current, value, line, char);
        }
    
        return constructResult(current, value, line, char);
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
            if(v.result) {
                value = v.rest;
                line = v.line;
                char = v.char;
                continue;
            }

            v = isWord(value, line, char);
            if(v.result) {
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