import { IDictionary, IRegisterable } from "../types/types.containers";
import { IVariableExists, IVariableString, IVariableTable, IVariableTestable, Savable } from "../types/types.variableTable";

function buildVariableTable(): IVariableTestable {
    class VariableTable implements IVariableTable, IVariableTestable {
        private table: IDictionary<Savable> = {};
        private parent: IVariableTable | false = false;

        constructor();
        constructor(baseTable: (IVariableTable & IVariableTestable));
        constructor(baseTable?: (IVariableTable & IVariableTestable)) {
            if(!baseTable) {
                return;
            }

            const baseKeys = baseTable.getKeys();

            baseKeys.forEach(key => this.table[key] = baseTable.getValue(key) as Savable);
            this.parent = baseTable;
        }

        createChild(): IVariableTable {
            return new VariableTable(this);
        }
        
        addValue<T extends Savable>(key: string, value: T): IVariableExists {
            this.table[key] = value;
            return this;
        }

        addValueToStringList(key: string, value: IVariableString): IVariableExists {
            if(this.table[key]) {
                let tableValue = this.table[key] as Savable;
                if(tableValue.type === 'variable-array-string')
                    if(!tableValue.value.some(t => t.value == value.value)) {
                        tableValue.value.push(value);
                    }
            }
            else {
                this.table[key] = { value: [value], type: 'variable-array-string' };
            }
            return this;
        }

        private parentHasKey(key: string): boolean {
            return !!this.parent && !!this.parent.hasKey(key);
        }

        hasKey(key: string): boolean {
            return !!this.table[key] || this.parentHasKey(key);
        }

        private getValueFromParent<T extends Savable>(key: string): T | false {
            return !!this.parent ? this.parent.getValue(key) : false;
        }

        getValue<T extends Savable>(key: string): T | false {
            if(!!this.table[key]) {
                return this.table[key] as T;
            }

            return this.getValueFromParent(key);
        }

        asJson(): any {
            const keys = Object.keys(this.table);
            const ret: IDictionary<any> = {};

            keys.forEach(key => ret[key] = this.table[key]);

            return ret;
        }

        clear(): IVariableTestable {
            const keys = Object.keys(this.table);

            keys.forEach(key => delete this.table[key]);

            return this;
        }

        private addValueToParent<T extends Savable>(key: string, value: T): void {
            if(this.parent) {
                this.parent.addGlobalValue(key, value);
            }
        }

        addGlobalValue<T extends Savable>(key: string, value: T): IVariableExists {
            this.addValueToParent(key, value);
            this.addValue(key, value);
            return this;
        }

        addGlobalValueToStringList(key: string, value: IVariableString): IVariableExists {
            if(this.parent) {
                this.parent.addGlobalValueToStringList(key, value);
            }

            this.addValueToStringList(key, value);

            return this;
        }

        private getParentKeys(): string[] {
            if(!this.parent) {
                return [];
            }

            return this.parent.getKeys();
        }
        
        getKeys(): string[] {
            const mine = Object.keys(this.table);
            const theirs = this.getParentKeys();

            const both = new Set([...mine, ...theirs]);

            return Array.from(both);
        }
    }

    return new VariableTable();
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
