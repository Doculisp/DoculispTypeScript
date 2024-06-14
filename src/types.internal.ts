import { ILocation, ISuccess, Result } from "./types.general";

export interface IParseRemaining<TParse> {
    readonly rest: TParse;
};

export interface IParseStepForward<TParse> extends IParseRemaining<TParse> {
    readonly location: ILocation;
}

export interface IStringParseStepForward extends IParseStepForward<string> {};

export interface ISubParseResult<T> {
    readonly subResult: T;
    readonly type: 'parse result';
}

export interface ISubParseGroupResult<T> {
    readonly subResult: (IKeeper<T> | IDiscardResult)[];
    readonly type: 'parse group result';

};

export interface IKeeper<T> {
    readonly type: 'keep';
    readonly keptValue: T;
};

export interface IDiscardResult { 
    readonly type: 'discard';
};

export interface IUnparsedInfo<TParse> {
    readonly remaining: TParse;
    readonly type: 'unparsed';
}

export interface IUnparsed<TParse> extends IUnparsedInfo<TParse> {
    readonly location: ILocation;
};

export type StepParse<TParse, TResult> = IParseStepForward<TParse> & (ISubParseGroupResult<TResult> | ISubParseResult<TResult> | IDiscardResult);

export type StringStepParse<T> = StepParse<string, T>;

export type StepParseResult<TParse, TResult> = Result<StepParse<TParse, TResult> | false | 'stop'>;
export type DiscardedResult<TParse> = Result<(IParseStepForward<TParse> & IDiscardResult) | false | 'stop'>

export type StringStepParseResult<T> = StepParseResult<string, T>;

export type HandleValue<TParse, TResult> = (input: TParse, current: ILocation) => StepParseResult<TParse, TResult>;

export type HandleStringValue<T> = (input: string, current: ILocation) => StringStepParseResult<T>;

export interface IParser<TParse, TResult> {
    parse(input: TParse, initialLocation: ILocation): Result<[TResult[], IUnparsed<TParse>]>;
};

export type CreateParser<TParse, TResult> = (...handlers: HandleValue<TParse, TResult>[]) => IParser<TParse, TResult>;

export type CreateStringParser<T> = CreateParser<string, T>;

export interface IInternals {
    noResultFound(): ISuccess<false>;
    stopFindingResults(): ISuccess<'stop'>;
    buildStepParse<TParse, TResult>(step: IParseStepForward<TParse>, resultType: (ISubParseGroupResult<TResult> | ISubParseResult<TResult> | IDiscardResult)): StepParse<TParse, TResult>;
    createArrayParser<TParse, TResult>(...handlers: HandleValue<TParse[], TResult>[]): IParser<TParse[], TResult>;
    createStringParser<T>(...handlers: HandleStringValue<T>[]): IParser<string, T>;
}