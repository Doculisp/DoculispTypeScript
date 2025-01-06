import { IPath } from "./types.filePath";

export interface IVariableId {
    value: string;
    documentPath: IPath;
    headerLinkText?: string | undefined;
    type: 'variable-id';
};

export interface IVariablePath {
    value: IPath;
    type: 'variable-path';
};

export interface IVariableString {
    value: string;
    type: 'variable-string'
}

export interface IStringArray {
    value: IVariableString[];
    type: 'variable-array-string';
}

export interface IVariableExists {
    hasKey(key: string): boolean
};

export type Savable = IVariableId | IStringArray | IVariablePath | IVariableString;

export interface IVariableSaver extends IVariableExists {
    addValue<T extends Savable>(key: string, value: T): IVariableExists;
    addValueToStringList(key: string, value: IVariableString): IVariableExists;
    addGlobalValue<T extends Savable>(key: string, value: T): IVariableExists;
    addGlobalValueToStringList(key: string, value: IVariableString): IVariableExists;
};

export interface IVariableRetriever extends IVariableExists {
    getValue<T extends Savable>(key: string): T | false;
    getKeys(): string[];
};


export interface IVariableTable extends IVariableSaver, IVariableRetriever {
    createChild(): IVariableTable;
};

export interface IVariableTestable extends IVariableTable {
    asJson(): any;
    clear(): IVariableTestable;
}
