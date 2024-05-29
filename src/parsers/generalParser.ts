import { IRegisterable } from "../types.containers";
import { Result, fail, ok } from "../types.general";
import { DiscardResult, HandleValue, IParser } from "../types.internal";

function mapFirst<From, To>(collection: From[], mapper: (value: From) => Result<NonNullable<To> | DiscardResult | false>): Result<NonNullable<To> | DiscardResult | false> {
    for (let index = 0; index < collection.length; index++) {
        const element = collection[index] as any as From;
        const result = mapper(element);
        if(result.success && result.value) {
            return result;
        }
    }

    return ok(false);
}

class Parser<T> implements IParser<T> {
    private readonly _handlers: HandleValue<T>[] = [];

    constructor(...handlers: HandleValue<T>[]) {
        let that = this;
        function addHandler(handler: HandleValue<T>) {
            that._handlers[that._handlers.length] = handler;
        }

        handlers.forEach(addHandler);
    }

    parse(value: string, line: number, char: number): Result<T[]> {
        const results: T[] = [];
        while(0 < value.length) {
            let result = mapFirst(this._handlers, h => h(value, line, char));
            
            if(!result.success) {
                return fail(result.message, result.documentPath);
            }

            if(result.value){
                let parseResult = result.value;
                line = parseResult.line;
                char = parseResult.char;
                value = parseResult.rest;

                if(parseResult.type === 'parse result'){
                    results[results.length] = parseResult.result;
                }
            }
        }

        return ok(results);
    }
}

function createHandler<T> (...handlers: HandleValue<T>[]) {
    return new Parser<T>(...handlers);
}

const registerable: IRegisterable = {
    builder: () => createHandler,
    name: 'parser',
    singleton: true,
    dependencies: []
};

export {
    registerable as document,
};