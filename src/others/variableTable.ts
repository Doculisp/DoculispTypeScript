import { IDictionary, IRegisterable } from "../types/types.containers";
import { IVariableExists, IVariableTestable } from "../types/types.variableTable";

function buildVariableTable(): IVariableTestable {
    const table: IDictionary<any> = {};
0
    const variableTable: IVariableTestable = {
        addValue<T>(key: string, value: T): IVariableExists {
            table[key] = value;
            return variableTable;
        },

        addValueToList<T>(key: string, value: T): IVariableExists {
            if(!!table[key]) {
                if(!(table[key] as any[]).includes(value)){
                    (table[key] as any[]).push(value);
                }
            }
            else {
                table[key] = [value];
            }
            return variableTable;
        },

        hasKey(key: string): boolean {
            return !!table[key];
        },

        getValue<T>(key: string): T | false {
            if(!!table[key]) {
                return table[key];
            }

            return false;
        },

        getKeys(): string[] {
            return Object.keys(table);
        },

        asJson(): any {
            const keys = Object.keys(table);
            const ret: IDictionary<any> = {};

            keys.forEach(key => ret[key] = table[key]);

            return ret;
        },

        clear() {
            const keys = Object.keys(table);

            keys.forEach(key => delete table[key]);

            return variableTable;
        }
    };

    return variableTable;
}

const variableBuilder: IRegisterable = {
    builder: () => buildVariableTable(),
    name: 'variableTable',
    dependencies: [],
    singleton: true
};

export {
    variableBuilder,
};
