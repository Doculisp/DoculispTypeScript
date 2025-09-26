import { IRegisterable } from "../types/types.containers";
import { ILocation, ISuccess, IUtil, ResultCode } from "../types/types.general";
import { HandleValue, IDiscardResult, IInternals, IParseStepForward, IParser, ISubParseGroupResult, ISubParseResult, IUnparsed, StepParseResult, StepParse } from "../types/types.internal";

function mapFirst<TParse, TResult>(internals: IInternals, input: TParse, current: ILocation, collection: HandleValue<TParse, TResult>[]): StepParseResult<TParse, TResult> {
    for (let index = 0; index < collection.length; index++) {
        const handler = collection[index] as HandleValue<TParse, TResult>;
        const result = handler(input, current);
        if(result.success) {
            if(result.value){
                return result;
            }
        } else {
            return result;
        }
    }

    return internals.stopFindingResults();
}

class Parser<TParse, TResult> implements IParser<TParse, TResult> {
    private readonly _handlers: HandleValue<TParse, TResult>[] = [];
    private readonly _needsParsing: (input: TParse) => boolean;
    private readonly _util: IUtil;
    private readonly _internals: IInternals;

    constructor(util: IUtil, internals: IInternals, needsParsing: (input: TParse) => boolean, ...handlers: HandleValue<TParse, TResult>[]) {
        let that = this;
        function addHandler(handler: HandleValue<TParse, TResult>) {
            that._handlers[that._handlers.length] = handler;
        }

        this._util = util;
        this._internals = internals;
        this._needsParsing = needsParsing;
        handlers.forEach(addHandler);
    }

    parse(input: TParse, initialLocation: ILocation): ResultCode<[TResult[], IUnparsed<TParse>]> {
        const results: TResult[] = [];
        let current = initialLocation;

        function getUnparsed(): IUnparsed<TParse> {
            return {
                type: 'unparsed',
                location: current,
                remaining: input,
            };
        }

        while(this._needsParsing(input)) {
            let result = mapFirst(this._internals, input, current, this._handlers);
            
            if(!result.success) {
                return result;
            }

            if(result.value === 'stop') {
                return this._util.ok([results, getUnparsed()]);
            } 

            if(result.value){
                let parseResult = result.value;
                current =  this._util.toLocation(initialLocation, parseResult.location.line, parseResult.location.char);
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

        return this._util.ok([results, getUnparsed()]);
    }
}

const registerable: IRegisterable = {
    builder: (util: IUtil) => { 
        function createStringParser<T> (...handlers: HandleValue<string, T>[]): IParser<string, T> {
            return new Parser<string, T>(util, ret, (input: string) => (0 < input.length), ...handlers);
        }

        function createArrayParser<TParse, TResult>(...handlers: HandleValue<TParse[], TResult>[]): IParser<TParse[], TResult> {
            return new Parser<TParse[], TResult>(util, ret, (input: TParse[]) => (0 < input.length), ...handlers);
        }

        function buildStepParse<TParse, TResult>(step: IParseStepForward<TParse>, resultType: (ISubParseGroupResult<TResult> | ISubParseResult<TResult> | IDiscardResult)): StepParse<TParse, TResult> {
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
        }

        function noResultFound(): ISuccess<false> {
            return util.ok(false);
        }

        function stopFindingResults(): ISuccess<'stop'> {
            return util.ok('stop');
        }

        const ret: IInternals = {
            createStringParser,
            createArrayParser,
            buildStepParse,
            noResultFound,
            stopFindingResults,
        };
        return ret; 
    },
    name: 'internals',
    singleton: true,
    dependencies: ['util']
};

export {
    registerable as parser,
};