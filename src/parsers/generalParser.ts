import { IRegisterable } from "../types.containers";
import { Result, ok } from "../types.general";
import { HandleValue, IDiscardResult, IInternals, IParseStepForward, IParser, ISubParseGroupResult, ISubParseResult, IUnparsed, StepParse, StepParseResult } from "../types.internal";

function mapFirst<T>(documentPath: string, input: string, line: number, char: number, collection: HandleValue<T>[]): StepParseResult<T> {
    for (let index = 0; index < collection.length; index++) {
        const handler = collection[index] as any as HandleValue<T>;
        const result = handler(input, line, char);
        if(result.success) {
            if(result.value){
                return result;
            }
        } else {
            return result;
        }
    }

    return ok('stop');
}

class Parser<T> implements IParser<T> {
    private readonly _handlers: HandleValue<T>[] = [];
    private readonly _documentPath: string;

    constructor(documentPath: string,...handlers: HandleValue<T>[]) {
        this._documentPath = documentPath;
        let that = this;
        function addHandler(handler: HandleValue<T>) {
            that._handlers[that._handlers.length] = handler;
        }

        handlers.forEach(addHandler);
    }

    parse(input: string, line: number, char: number): Result<[T[], IUnparsed]> {
        const results: T[] = [];

        function getUnparsed(): IUnparsed {
            return {
                type: 'unparsed',
                location: { line, char, },
                remaining: input,
            };
        }

        while(0 < input.length) {
            let result = mapFirst(this._documentPath, input, line, char, this._handlers);
            
            if(!result.success) {
                return result;
            }

            if(result.value === 'stop') {
                return ok([results, getUnparsed()]);
            } 

            if(result.value){
                let parseResult = result.value;
                line = parseResult.line;
                char = parseResult.char;
                input = parseResult.rest;

                if(parseResult.type === 'parse result'){
                    results[results.length] = parseResult.subResult;
                }
                if(parseResult.type === 'parse group result') {
                    parseResult.subResult.forEach(t =>{
                        if(t.type === 'keep'){
                            results[results.length] = t.keptValue;
                        }
                    });
                }
            }
        }

        return ok([results, getUnparsed()]);
    }
}

const registerable: IRegisterable = {
    builder: () => { 
        const ret: IInternals = {
            createParser<T> (documentPath: string, ...handlers: HandleValue<T>[]): IParser<T> {
                return new Parser<T>(documentPath, ...handlers);
            },
            buildStepParse<T>(step: IParseStepForward, resultType: (ISubParseGroupResult<T> | ISubParseResult<T> | IDiscardResult)): StepParse<T> {
                const stepKeys = 
                    Object.
                        keys(step);
                const resultKeys =
                    Object.
                        keys(resultType);
            
                const ret: any = {};
                
                stepKeys.forEach(key => ret[key] = (step as any)[key]);
                resultKeys.forEach(key => ret[key] = (resultType as any)[key]);
            
                return ret;
            },
        };
        return ret; 
    },
    name: 'parser',
    singleton: true,
    dependencies: []
};

export {
    registerable as document,
};