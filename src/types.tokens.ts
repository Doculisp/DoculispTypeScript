import { ILocation } from "./types.general";

export type TextToken = {
    readonly text: string;
    readonly location: ILocation;
    readonly type: 'text';
};

export type OpenParenthesis = {
    readonly location: ILocation;
    readonly type: 'open parenthesis';
};

export type CloseParenthesis = {
    readonly location: ILocation;
    readonly type: 'close parenthesis';
};

export type Value = {
    readonly value: string;
    readonly location: ILocation;
    readonly type: 'value';
}