import { IRegisterable } from "../types.containers";
import { Result, ok } from "../types.general";
import { HandleValue, IDiscardResult, IInternals, IParseStepForward, IParser, ISubParseGroupResult, ISubParseResult, IUnparsed, StepParseResult, StepParse } from "../types.internal";

function mapFirst<TParse, TResult>(input: TParse, line: number, char: number, collection: HandleValue<TParse, TResult>[]): StepParseResult<TParse, TResult> {
    for (let index = 0; index < collection.length; index++) {
        const handler = collection[index] as HandleValue<TParse, TResult>;
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

class Parser<TParse, TResult> implements IParser<TParse, TResult> {
    private readonly _handlers: HandleValue<TParse, TResult>[] = [];
    private readonly _needsParsing: (input: TParse) => boolean;

    constructor(_needsParsing: (input: TParse) => boolean, ...handlers: HandleValue<TParse, TResult>[]) {
        let that = this;
        function addHandler(handler: HandleValue<TParse, TResult>) {
            that._handlers[that._handlers.length] = handler;
        }

        this._needsParsing = _needsParsing;
        handlers.forEach(addHandler);
    }

    parse(input: TParse, line: number, char: number): Result<[TResult[], IUnparsed<TParse>]> {
        const results: TResult[] = [];

        function getUnparsed(): IUnparsed<TParse> {
            return {
                type: 'unparsed',
                location: { line, char, },
                remaining: input,
            };
        }

        while(this._needsParsing(input)) {
            let result = mapFirst(input, line, char, this._handlers);
            
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
            createStringParser<T> (...handlers: HandleValue<string, T>[]): IParser<string, T> {
                return new Parser<string, T>((input: string) => (0 < input.length), ...handlers);
            },
            createArrayParser<TParse, TResult>(...handlers: HandleValue<TParse[], TResult>[]): IParser<TParse[], TResult> {
                return new Parser<TParse[], TResult>((input: TParse[]) => (0 < input.length), ...handlers);
            },

            buildStepParse<TParse, TResult>(step: IParseStepForward<TParse>, resultType: (ISubParseGroupResult<TResult> | ISubParseResult<TResult> | IDiscardResult)): StepParse<TParse, TResult> {
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
    registerable as parser,
};