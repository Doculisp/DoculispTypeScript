export type Valid<T> = T extends undefined | null ? never : T;

export interface IContainerId {
    readonly id: number;
}

export interface IRegisterable {
    readonly builder: (...args: any[]) => Valid<any>;
    readonly name: string;
    readonly dependencies?: string[];
    readonly singleton?: boolean;
}

export interface IDependencyManager extends IContainerId {
    build(moduleName: string): Valid<any>;
    buildAs<T>(moduleName: string): Valid<T>;
    getModuleList(): string[];
}

export interface IDependencyContainer extends IContainerId {
    register(registerable: IRegisterable): IContainer;
    registerValue(value: any, name?: string): IContainer;
    registerBuilder(fn: (...args: Valid<any>[]) => Valid<any>, dependencies: string[], name?: string, singleton?: boolean): IContainer;
    buildTestable(): ITestableContainer;
}

export interface IContainer extends IDependencyManager, IDependencyContainer {
    isTestable: boolean;
}

export interface ITestableContainer extends IContainer {
    replace(registerable: IRegisterable): ITestableContainer;
    replaceBuilder(fn: (...args: Valid<any>[]) => Valid<any>, dependencies: string[], name?: string, singleton?: boolean): ITestableContainer;
    replaceValue(value: any, name?: string): ITestableContainer

    replacePackageBuilder(fn: (...args: Valid<any>[]) => Valid<any>, name?: string, singleton?: boolean): ITestableContainer;
    replacePackageValue(value: any, name?: string): ITestableContainer

    restore(moduleName: string): ITestableContainer;
    restoreAll(): ITestableContainer;
    supportsReplace(): boolean;
}

export interface IDictionary<T> {
    [key: string]: T | undefined;
}