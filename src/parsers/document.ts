import { IRegisterable, Valid } from "../types.containers";
import { DocumentMap, DocumentParser, DocumentPart } from "../types.document";
import { ILocation, Result, fail, ok } from "../types.general";
import * as path from 'node:path';
import { IDocumentSearches, Searcher } from "../types.textHelpers";
import { IDiscardResult, IKeeper, StepParseResult } from "../types.internal";

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

        function constructResult(current: string, start: ILocation | undefined, rest: string, line: number, char: number): StepParseResult<DocumentParse> {
            if(start){
                return ok({
                    type: 'parse result',
                    result: { start, value: current },
                    rest: rest,
                    line: line,
                    char: char
                });
            }

            return ok(false);
        }
        
        function isWhiteSpace(value: string, line: number, char: number): StepParseResult<DocumentParse> {
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

        function isDoculisp(value: string, line: number, char: number, start?: ILocation | undefined): StepParseResult<DocumentParse> {
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
                    return constructResult(current.trim(), start, value, line, char);
                }

                if(doesIt.startWithWhiteSpace.test(value)) {
                    let whiteSpace = isWhiteSpace(value, line, char);
                    if(whiteSpace.success){
                        if(whiteSpace.value && whiteSpace.value !== 'stop'){
                            if(start) {
                                if(whiteSpace.value.type === 'parse result'){
                                    current += whiteSpace.value.result.value;
                                }
                                if(whiteSpace.value.type === 'parse group result') {
                                    whiteSpace.value.result.forEach(r => {
                                        if(r.type === 'keep') {
                                            current += r.value.value;
                                        }
                                    });
                                }
                            }

                            line = whiteSpace.value.line;
                            char = whiteSpace.value.char;
                            value = whiteSpace.value.rest;
                        }
                        continue;
                    }
                    else {
                        return whiteSpace;
                    }
                }

                current += value.charAt(0);
                value = value.slice(1);
                char++;
            }

            start = start as any as ILocation;
            return fail(`Doculisp block at { line: ${start.line}, char: ${start.char} } is not closed.`, documentPath);
        }
        
        function isComment(value: string, line: number, char: number): StepParseResult<DocumentParse> {
            let start: ILocation | undefined;
            let results: (IKeeper<DocumentParse> | IDiscardResult)[] = [];
        
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
                    return ok({
                        type: 'parse group result',
                        result: results,
                        rest: value,
                        line,
                        char,
                    });
                }

                if(doesIt.startWithDocuLisp.test(value)) {
                    let doculisp = isDoculisp(value, line, char);
                    if(doculisp.success) {
                        if(doculisp.value && doculisp.value !== 'stop'){
                            value = doculisp.value.rest;

                            if(doculisp.value.type === 'parse result') {
                                results[results.length] = { type: 'keep', value: doculisp.value.result };
                            }

                            if(doculisp.value.type === 'parse group result') {
                                doculisp.value.result.forEach(v => results[results.length] = v); 
                            }

                            line = doculisp.value.line;
                            char = doculisp.value.char;
                        }
                        continue;
                    } else {
                        return fail(doculisp.message, documentPath);
                    }
                }
        
                let hasWhiteSpace = doesIt.startWithWhiteSpace.test(value);
                if(hasWhiteSpace) {
                    let whiteSpace = isWhiteSpace(value, line, char);
                    if(whiteSpace.success){
                        if(whiteSpace.value && whiteSpace.value !== 'stop'){
                            value = whiteSpace.value.rest;
                            line = whiteSpace.value.line;
                            char = whiteSpace.value.char;
                        }
                        continue;
                    } else {
                        return whiteSpace;
                    }
                }
        
                if(!hasStart){
                    return ok({
                        type: 'parse group result',
                        result: results,
                        rest: value,
                        line,
                        char,
                    });
                } else {
                    value = value.slice(1);
                    char++;
                }
            }
        
            if(!start){
                return ok(false);
            } else {
                return fail(`Open HTML Comment at { line: ${start.line}, char: ${start.char} } but does not close.`, documentPath);
            }
        }
        
        function isInline(value: string, line: number, char: number): StepParseResult<DocumentParse> {
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
                        return constructResult(current, start, value, line, char);
                    } else {
                        start = { line: l, char: c };
                        continue;
                    }
                }
        
                if(doesIt.startWithWhiteSpace.test(value)) {
                    let whiteSpace = isWhiteSpace(value, line, char);
                    if(whiteSpace.success){
                        if(whiteSpace.value && whiteSpace.value !== 'stop'){
                            if(start && line != whiteSpace.value.line) {
                                return fail(`Inline code block at { line: ${start.line}, char: ${start.char} } contains a new line before closing.`, documentPath);
                            }
                        
                            if(whiteSpace.value.type === 'parse result') {
                                current += whiteSpace.value.result.value;
                            }

                            if(whiteSpace.value.type === 'parse group result') {
                                whiteSpace.value.result.forEach(v => {
                                    if(v.type === 'keep') {
                                        current += v.value;
                                    }
                                });
                            }

                            value = whiteSpace.value.rest;
                            char = whiteSpace.value.char;
                        }
                        continue;
                    }
                    return whiteSpace;
                }
        
                if(!start) {
                    return ok(false);
                }
        
                current += value.at(0);
                value = value.slice(1);
                char = char++;
            }
        
            if(start) {
                return fail(`Inline code block at { line: ${start.line}, char: ${start.char} } does not close`, documentPath);
            }
            return constructResult(current, start, value, line, char);
        }
        
        function isMultiline(value: string, line: number, char: number): StepParseResult<DocumentParse> {
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
                        return constructResult(current, start, value, line, char);
                    } else {
                        start = { line: l, char: c };
                        continue;
                    }
                }
        
                if(doesIt.startWithWhiteSpace.test(value)) {
                    let whiteSpace = isWhiteSpace(value, line, char);
                    if(whiteSpace.success){
                        if(whiteSpace.value && whiteSpace.value !== 'stop'){
                            if(whiteSpace.value.type === 'parse result') {
                                current += whiteSpace.value.result.value;
                            }

                            if(whiteSpace.value.type === 'parse group result') {
                                whiteSpace.value.result.forEach(r => {
                                    if(r.type === 'keep') {
                                        current += r.value;
                                    }
                                });
                            }

                            value = whiteSpace.value.rest;
                            char = whiteSpace.value.char;
                        }
                        continue;
                    } else {
                        return whiteSpace;
                    }
                }
        
                if(!start) {
                    return ok(false);
                }
        
                current += value.at(0);
                value = value.slice(1);
                char = char++;
            }
        
            if(start) {
                return fail(`Multiline code block at { line: ${start.line}, char: ${start.char} } does not close`, documentPath);
            }
        
            return constructResult(current, start, value, line, char);
        }
        
        function isWord(value: string, line: number, char: number): StepParseResult<DocumentParse> {
            let current = "";
            let start: ILocation | undefined;
        
            while(0 < value.length) {
                let hasWhiteSpace = doesIt.startWithWhiteSpace.test(value);
                if(!start && hasWhiteSpace) {
                    return constructResult(current, start, value, line, char);
                } else if (hasWhiteSpace) {
                    const whiteSpace = isWhiteSpace(value, line, char);
                    if(whiteSpace.success){
                        if(whiteSpace.value && whiteSpace.value !== 'stop'){
                            if(whiteSpace.value.type === 'parse result') {
                                current += whiteSpace.value.result.value;
                            }

                            if(whiteSpace.value.type === 'parse group result') {
                                whiteSpace.value.result.forEach(r => {
                                    if(r.type === 'keep') {
                                        current += r.value;
                                    }
                                });
                            }

                            value = whiteSpace.value.rest;
                            line = whiteSpace.value.line;
                            char = whiteSpace.value.char;
                        }
                        continue;
                    }
                }
        
                if(doesIt.startWithOpenComment.test(value)) {
                    return constructResult(current.trim(), start, value, line, char);
                }
        
                if(doesIt.startWithMultilineMarker.test(value)) {
                    let multiline = isMultiline(value, line, char);
                    if(multiline.success) {
                        if(multiline.value && multiline.value !== 'stop') {
                            let v = multiline.value;
                            value = v.rest;
                            line = v.line;
                            char = v.char;

                            if(v.type === 'parse result') {
                                current += v.result.value;
                                if(!start) {
                                    start = v.result.start;
                                }
                            }

                            if(v.type === 'parse group result') {
                                v.result.forEach(r => {
                                    if(r.type === 'keep') {
                                        current += r.value.value;
                                        if(!start) {
                                            start = r.value.start;
                                        }
                                    }
                                });
                            }
                    }
                    } else {
                        return fail(multiline.message, documentPath);
                    }
                }
        
                if(doesIt.startWithInlineMarker.test(value)) {
                    let inline = isInline(value, line, char);
                    if(inline.success) {
                        if(inline.value && inline.value !== 'stop'){
                            let v = inline.value;
                            value = v.rest;
                            line = v.line;
                            char = v.char;
                            if(v.type === 'parse result') {
                                current += v.result.value;
                                if(!start) {
                                    start = v.result.start;
                                }
                            }

                            if(v.type === 'parse group result') {
                                v.result.forEach(r => {
                                    if(r.type === 'keep') {
                                        current += r.value.value;
                                        if(!start) {
                                            start = r.value.start;
                                        }
                                    }
                                });
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
        
            return constructResult(current.trim(), start, value, line, char);
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
                if(v && v !== 'stop'){
                    if(v.type === 'parse result') {
                        current[current.length] = {
                            location: { line: v.result.start.line, char: v.result.start.char },
                            text: v.result.value,
                            type: 'lisp'
                        };
                    }

                    if(v.type === 'parse group result') {
                        v.result.forEach(r => {
                            if(r.type === 'keep'){
                                current[current.length] = {
                                    location: { line: r.value.start.line, char: r.value.start.char },
                                    text: r.value.value,
                                    type: 'lisp'
                                };
                            }
                        });
                    }
                    
                    value = '';
                    line = v.line;
                    char = v.char;

                    if(0 < v.rest.trim().length) {
                        return fail(`Doculisp block at { line: 1, char: 1 } has something not contained in parenthesis at { line: ${line}, char: ${char} }.`, documentPath);
                    }
                }
            }
            else {
                return fail(lisp.message, documentPath);
            }
        }

        while (0 < value.length) {
            let v = isWhiteSpace(value, line, char);
            if(v.success){
                if(v.value && v.value !== 'stop') {
                    value = v.value.rest;
                    line = v.value.line;
                    char = v.value.char;
                    continue;
                }
            } else {
                return v;
            }

            if(doesIt.startWithOpenComment.test(value)) {
                let comment = isComment(value, line, char);
                if(comment.success) {
                    if(comment.value && comment.value !== 'stop') {
                        if(comment.value.type === 'parse group result'){
                            comment.value.result.forEach(element => {
                                if(element.type === 'keep') {
                                    current[current.length] = {
                                        location: { line: element.value.start.line, char: element.value.start.char },
                                        text: element.value.value,
                                        type: "lisp",
                                    };
                                }
                            });
                        }

                        if(comment.value.rest.length < value.length) {
                            value = comment.value.rest;
                            char = comment.value.char;
                            line = comment.value.line;
                        }
                    }
                    continue;
                } else {
                    return fail(comment.message, documentPath);
                }
            }

            let word = isWord(value, line, char);
            if(word.success) {
                if(word.value && word.value !== 'stop') {
                    let v = word.value;
                    value = v.rest;
                    if(v.type === 'parse result') {
                        current[current.length] = {
                            location: { line, char },
                            text: v.result.value,
                            type: "text",
                        };
                    }

                    if(v.type === 'parse group result') {
                        v.result.forEach(r => {
                            if(r.type === 'keep') {
                                current[current.length] = {
                                    location: { line, char},
                                    text: r.value.value,
                                    type: 'text'
                                };
                            }
                        });
                    }

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