import { IPath } from "./types.filePath";
import { ILocation } from "./types.general";

export interface IVariableId {
    value: IPath;
    source: ILocation;
    headerLinkText: string | false;
    type: 'variable-id';
};

export interface IVariablePath {
    value: IPath;
    type: 'variable-path';
};

export interface IVariableEmptyId {
    value: '';
    type: 'variable-empty-id';
}

export interface IVariableString {
    value: string;
    type: 'variable-string'
}

export interface IStringArray {
    value: IVariableString[];
    type: 'variable-array-string';
}

export type Savable = IVariableId | IStringArray | IVariablePath | IVariableString | IVariableEmptyId;

export const sourceKey = ' source';
export const destKey = ' destination';

export interface IVariableTable {
    hasKey(key: string): boolean
    addValue<T extends Savable>(key: string, value: T): IVariableTable;
    addValueToStringList(key: string, value: IVariableString): IVariableTable;
    addGlobalValue<T extends Savable>(key: string, value: T): IVariableTable;
    addGlobalValueToStringList(key: string, value: IVariableString): IVariableTable;
    getValue<T extends Savable>(key: string): T | false;
    getKeys(): string[];
    createChild(): IVariableTable;
};

export interface IVariableTestable extends IVariableTable {
    asJson(): any;
    clear(): IVariableTestable;
}
