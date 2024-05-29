import { IRegisterable } from "../types.containers";
import { DiscardResult, HandleValue, IParser } from "../types.internal";

function mapFirst<From, To>(collection: From[], mapper: (value: From) => NonNullable<To> | DiscardResult | false): NonNullable<To> | DiscardResult | false {
    for (let index = 0; index < collection.length; index++) {
        const element = collection[index] as any as From;
        const result = mapper(element);
        if(result) {
            return result;
        }
    }

    return false;
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

    parse(value: string, line: number, char: number): T[] {
        const results: T[] = [];
        while(0 < value.length) {
            let result = mapFirst(this._handlers, h => h(value, line, char));
            if(result) {
                let parseResult = result;
                line = parseResult.line;
                char = parseResult.char;
                value = parseResult.rest;

                if(parseResult.type === 'parse result'){
                    results[results.length] = parseResult.result;
                }
            }
        }

        return results;
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