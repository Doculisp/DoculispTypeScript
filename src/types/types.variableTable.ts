import { IPath } from "./types.filePath";
import { ILocation, Warning } from "./types.general";

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

export interface IWarnings {
    readonly warnings: Warning[];
    readonly type: 'variable-array-warnings';
}

export type Savable = IVariableId | IStringArray | IVariablePath | IVariableString | IVariableEmptyId | IWarnings;

export const sourceKey = ' source';
export const destKey = ' destination';

export interface IVariableTable {
    hasKey(key: string): boolean
    addValue<T extends Savable>(key: string, value: T): IVariableTable;
    addValueToStringList(key: string, value: IVariableString): IVariableTable;
    addGlobalValue<T extends Savable>(key: string, value: T): IVariableTable;
    addGlobalValueToStringList(key: string, value: IVariableString): IVariableTable;
    addWarning(warning: Warning): IVariableTable;
    getWarnings(): Warning[];
    hasWarnings(): boolean;
    getValue<T extends Savable>(key: string): T | false;
    getKeys(): string[];
    createChild(): IVariableTable;
};

export interface IVariableTestable extends IVariableTable {
    asJson(): any;
    clear(): IVariableTestable;
}
