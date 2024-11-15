export interface IStringBuilder {
    addLine(): IStringBuilder;
    addLine(value: string): IStringBuilder;
    addLine(value?: string): IStringBuilder;
    add(value: string): IStringBuilder;
    toString(): string;
    get length(): number;
    get lineLength(): number
};

export type StringBuilderConstructor = () => IStringBuilder;