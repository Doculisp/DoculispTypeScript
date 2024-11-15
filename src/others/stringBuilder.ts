import { IRegisterable } from "../types/types.containers";
import { IStringBuilder, StringBuilderConstructor } from "../types/types.sringBuilder";

class StringBuilder implements IStringBuilder {
    private _lines: string[];

    constructor() {
        this._lines = [];
    }

    addLine(): IStringBuilder
    addLine(value: string): IStringBuilder
    addLine(value?: string): IStringBuilder {
        let v = value ?? '';
        this._lines.push(v);
        return this;
    }

    add(value: string): IStringBuilder {
        if(!value) {
            return this;
        }

        if(this._lines.length === 0) {
            this._lines.push('');
        }

        this._lines[this._lines.length - 1] += value;
        return this;
    }

    toString(): string {
        return this._lines.join('\n');
    }

    get length(): number {
        let i = 0;

        this._lines.forEach(l => i += l.length);

        return i + this._lines.length - 1;
    }

    get lineLength(): number {
        if(this._lines.length < 1) {
            return 0;
        }

        return this._lines[this._lines.length - 1]?.length || 0;
    }
}

const builder: StringBuilderConstructor = () => new StringBuilder();

const stringWriter: IRegisterable = {
    builder: () => builder,
    name: 'stringBuilder',
    dependencies: [],
    singleton: true,
};

export {
    stringWriter,
};