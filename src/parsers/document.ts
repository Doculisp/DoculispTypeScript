import { IRegisterable, Valid } from "../types.containers";
import { DocumentMap, DocumentParser, DocumentPart } from "../types.document";
import { ILocation, Result, fail, ok } from "../types.general";
import * as path from 'node:path';
import { IDocumentSearches, Searcher } from "../types.textHelpers";
import { HandleValue, IDiscardResult, IInternals, IKeeper, IParseStepForward, StepParseResult } from "../types.internal";

type DocumentParse = {
    value: string;
    start: ILocation;
};


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

function documentParse(doesIt: IDocumentSearches, parserBuilder: IInternals): Valid<DocumentParser> {
    function parse(value: string, documentPath: string): Result<DocumentMap> {
        function constructDocumentMap(parts: DocumentPart[]) : DocumentMap {
            return {
                documentPath,
                parts,
            };
        }
        
        function buildWhiteSpaceChecker<T = DocumentParse>(keepPredicate?: ((found: string) => Boolean) | undefined, packager?: ((whiteSpace: string, start: ILocation) => T) | undefined): HandleValue<T> {
            const predicate = keepPredicate ?? (() => true);
            const packaging = packager ?? ((whiteSpace: string, start: ILocation) => { return { start, value: whiteSpace } as T});

            return function isWhiteSpace(value: string, line: number, char: number): StepParseResult<T> {
                let start: ILocation | undefined;

                function tryParseIt(beginsWith: RegExp, defaultReturn: false | 'stop', lineIncrementor: (line: number) => number, charIncrementor: (char: number, found: string) => number): HandleValue<string> {
                    return function (value: string, line: number, char: number): StepParseResult<string> {
                        if(beginsWith.test(value)) {
                            const found: string = (value.match(beginsWith) as any)[0];
                            const rest = value.slice(found.length);
                            if(!start){
                                start = { line, char, };
                            }

                            let step: IParseStepForward = {
                                rest,
                                line: lineIncrementor(line),
                                char: charIncrementor(char, found),
                            };

                            if(predicate(found)){
                                let ret = parserBuilder.buildStepParse<string>(step, { 
                                    type: 'parse result',
                                    result: found,
                                });
                                return ok(ret);
                            } else {
                                let ret = parserBuilder.buildStepParse<string>(step, {
                                    type: 'discard',
                                });
                                return ok(ret);
                            }
                        }
                        return ok(defaultReturn);
                    }
                }

                function tryParseNewLine(beginsWith: RegExp): HandleValue<string> {
                    return tryParseIt(beginsWith, false, (line: number) => line + 1, () => 1);
                }

                const tryParseWindowsNewLine = tryParseNewLine(doesIt.startWithWindowsNewline);
                const tryParseMacNewLine = tryParseNewLine(doesIt.startWithMacsNewline);
                const tryParseLinuxNewLine = tryParseNewLine(doesIt.startWithLinuxNewline);
                const tryParseWhiteSpace = tryParseIt(doesIt.startWithWhiteSpace, 'stop', line => line, (char: number, found: string) => char + found.length);

                const parser = parserBuilder.createParser<string>(tryParseWindowsNewLine, tryParseMacNewLine, tryParseLinuxNewLine, tryParseWhiteSpace);
                const parsed = parser.parse(value, line, char);

                if(parsed.success) {
                    const [results, leftover] = parsed.value;
                    if(start){
                        if(0 < results.length) {
                            let result = "";
                            results.forEach(s => {
                                result = result + s;
                            });

                            return ok({
                                type: 'parse result',
                                result: packaging(result, start),
                                rest: leftover.remaining,
                                line: leftover.location.line,
                                char: leftover.location.char,
                            });
                        }
                    }
                    return ok(false);
                } else {
                    return parsed;
                }
            };
        }

        function buildDoculispChecker(start?: ILocation | undefined):HandleValue<DocumentParse> {
            const defaultReturn = !!start ? 'stop' : false;
            return function isDoculisp(value: string, line: number, char: number): StepParseResult<DocumentParse> {
                let depth = !!start ? 1 : 0;

                function tryParseDoculispOpen(value: string, line: number, char: number): StepParseResult<string> {
                    if(doesIt.startWithDocuLisp.test(value)){
                        if(!start) {
                            start = { line, char };
                        } else {
                            return fail(`Doculisp Block at { line: ${start.line}, char: ${start.char}} contains an embedded doculisp block at { line: ${line}, char: ${char} }.`, documentPath);
                        }

                        let v: string = (value.match(doesIt.startWithDocuLisp) as any)[0];
                        depth++;
                        
                        return ok({
                            type: 'discard',
                            rest: value.slice(v.length),
                            line,
                            char: char + v.length,
                        });
                    }

                    return ok(false);
                }

                function tryParseOpenLisp(value: string, line: number, char: number): StepParseResult<string> {
                    if(doesIt.startWithOpenLisp.test(value)) {
                        let v: string = (value.match(doesIt.startWithOpenLisp) as any)[0];
                        depth++;
                        
                        return ok({
                            type: 'parse result',
                            result: v,
                            rest: value.slice(v.length),
                            line,
                            char: char + v.length,
                        });
                    }

                    return ok(false);
                }

                function tryParseCloseLisp(value: string, subLine: number, subChar: number): StepParseResult<string> {
                    if(doesIt.startsWithCloseLisp.test(value)) {
                        let v: string = (value.match(doesIt.startsWithCloseLisp) as any)[0];
                        let rest = value.slice(v.length);

                        let last = depth === 1;
                        depth--;

                        let step: IParseStepForward = {
                            rest,
                            line: subLine,
                            char: subChar + v.length,
                        };

                        if(last) {
                            let ret = parserBuilder.buildStepParse<string>(step, {
                                type: 'discard',
                            });
                            return ok(ret);
                        }
                        else {
                            let ret = parserBuilder.buildStepParse<string>(step, {
                                type: 'parse result',
                                result: v,
                            });
                            return ok(ret);
                        }
                    }

                    return ok(false);
                }

                function predicate() {
                    return !!start;
                } 

                function tryParseEndAll(): StepParseResult<string> {
                    if(start && 0 === depth) {
                        return ok('stop');
                    }
                    return ok(false);
                }

                const startsWithWord = /^[^\s\(\)](\s*[^\s\(\)])+/;
                function tryParseText(value: string, line: number, char: number): StepParseResult<string> {
                    if(startsWithWord.test(value)) {
                        const v: string = (value.match(startsWithWord) as any)[0];
                        
                        return ok({
                            type: 'parse result',
                            result: v,
                            rest: value.slice(v.length),
                            line,
                            char: char + v.length,
                        });
                    }

                    return ok(false);
                }

                let parser = parserBuilder.createParser<string>(tryParseEndAll, tryParseDoculispOpen, tryParseOpenLisp, tryParseCloseLisp, buildWhiteSpaceChecker(predicate, (v: string) => { return v; }), tryParseText);

                const parsed = parser.parse(value, line, char);

                if(parsed.success) {
                    const [results, leftover] = parsed.value;

                    if(0 < depth) {
                        return fail(`Doculisp block at { line: ${line}, char: ${char} } is not closed.`, documentPath);
                    }
        
                    if(0 < results.length && start) {
                        const result = results.join('');
                        return ok({
                            type: 'parse result',
                            result: { start, value: result.trim() },
                            rest: leftover.remaining,
                            line: leftover.location.line,
                            char: leftover.location.char,
                        });
                    }
                    return ok(defaultReturn);
                } else {
                    return parsed;
                }
            }
        }
        
        function isComment(value: string, line: number, char: number): StepParseResult<DocumentParse> {
            let start: ILocation | undefined;
            let results: (IKeeper<DocumentParse> | IDiscardResult)[] = [];
            const isWhiteSpace = buildWhiteSpaceChecker();
        
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
                    let doculisp = buildDoculispChecker()(value, line, char);
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
                            continue;
                        }
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
            const isWhiteSpace = buildWhiteSpaceChecker();
        
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
                            continue;
                        }
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
            const isWhiteSpace = buildWhiteSpaceChecker();
        
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
                            continue;
                        }
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
            const isWhiteSpace = buildWhiteSpaceChecker();
        
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
                            continue;
                        }
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
            const parser = parserBuilder.createParser(buildDoculispChecker({ line: 1, char: 1 }));
            const parsed = parser.parse(`${value})`, 1, 1);
            if(parsed.success) {
                const [lispRaw, leftover] = parsed.value;
                if(0 < leftover.remaining.trim().length) {
                    return fail(`Doculisp block at { line: 1, char: 1 } has something not contained in parenthesis at { line: ${leftover.location.line}, char: ${leftover.location.char - 1} }.`, documentPath);
                }

                const lisp: DocumentPart[] = lispRaw.map(l => {
                    return {
                        location: l.start,
                        text: l.value,
                        type: 'lisp'
                    };
                })

                return ok(constructDocumentMap(lisp));
            } else {
                return parsed;
            }
        }

        const isWhiteSpace = buildWhiteSpaceChecker();
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
    builder: (searches: Searcher, createParser: IInternals) => documentParse(searches.searchDocumentFor, createParser),
    name: 'documentParse',
    singleton: true,
    dependencies: ['searches', 'parser']
};

export {
    registerable as document,
};