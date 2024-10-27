
export interface IVariableExists {
    hasKey(key: string): boolean
};

export interface IVariableSaver extends IVariableExists {
    addValue<T>(key: string, value: T): IVariableExists;
    addValueToList<T>(key: string, value: T): IVariableExists;
};

export interface IVariableRetriever extends IVariableExists {
    getValue<T>(key: string): T | false;
    getKeys(): string[];
};


export interface IVariableTable extends IVariableSaver, IVariableRetriever {
};

export interface IVariableTestable extends IVariableTable {
    asJson(): any;
    clear(): IVariableTestable;
}
