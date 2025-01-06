import { IDictionary, IRegisterable } from "../types/types.containers";
import { IVariableExists, IVariableString, IVariableTestable, Savable } from "../types/types.variableTable";

function buildVariableTable(): IVariableTestable {
    const table: IDictionary<Savable> = {};
0
    const variableTable: IVariableTestable = {
        addValue<T extends Savable>(key: string, value: T): IVariableExists {
            table[key] = value;
            return variableTable;
        },

        addValueToStringList(key: string, value: IVariableString): IVariableExists {
            if(table[key]) {
                let tableValue = table[key] as Savable;
                if(tableValue.type === 'variable-array-string')
                    if(!tableValue.value.some(t => t.value == value.value)) {
                        tableValue.value.push(value);
                    }
            }
            else {
                table[key] = { value: [value], type: 'variable-array-string' };
            }
            return variableTable;
        },

        hasKey(key: string): boolean {
            return !!table[key];
        },

        getValue<T extends Savable>(key: string): T | false {
            if(!!table[key]) {
                return table[key] as T;
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
