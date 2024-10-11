import path from "node:path";
import { IContainer, IDependencyContainer, IDependencyManager, IDictionary, IRegisterable, ITestableContainer, Valid } from "./types/types.containers";
import { globSync } from 'glob';

function importModules(container: IContainer, moduleNames: string[]) {
    moduleNames.forEach(n => {
        if(n.endsWith('index')) {
            return;
        }

        const module = require(n);
        const keys = Object.keys(module);
        keys
            .filter(key => {
                let value = module[key];
                return !!value?.name && !!value?.builder;
            })
            .forEach(key => container.register(module[key]));
    });
}

function findModules(container: IContainer) {
    let modulePath = __dirname;
    if(modulePath.endsWith('src')) {
        modulePath = path.resolve(path.join(modulePath, '../dist'));
    }

    if(!modulePath.endsWith('dist')) {
        modulePath = path.resolve(path.join(modulePath, './dist'));
    }

    const globPattern = modulePath + '/**/*.js';
    let moduleNames = (
        globSync(globPattern)
        .map(p => {
            let r = path.resolve(p);

            return r.replace('.js', '').replaceAll('\\', '/');
        })
    );

    importModules(container, moduleNames);
}

class TreeNode {
    _parent: TreeNode[];
    _children: TreeNode[];
    _value: string;

    constructor();
    constructor(value: string);
    constructor(value: string, parent: TreeNode);
    constructor(value: string = '<{tree-root}>', parent?: TreeNode) {
        this._parent = [];
        this._children = [];
        if(parent) {
            this._parent[0] = parent;
        }

        this._value = value;
    }

    containsParent(name: string, trace: string[] = []): string[] | false {
        if(!this._parent) {
            return false;
        }

        for (let index = 0; index < this._parent.length; index++) {
            const t: string[] = [];
            trace.forEach(item => t[t.length] = item);
            const found = this._parent[index]?.check(name, t);
            if(found) {
                return found;
            }
        }

        return false;
    }

    check(name: string, trace: string[] = []): string[] | false {
        if(trace.length === 0) {
            trace.push(name);
        }
        trace.push(this._value);
        if(this._value === name) {
            return trace;
        }
        
        return this.containsParent(name, trace);
    }

    find(name: string, checked: string[] = []): TreeNode | false {
        if(checked.includes(this._value)) {
            return false;
        }

        if(this._value === name) {
            return this;
        }

        checked[checked.length] = this._value;

        for (let index = 0; index < this._parent.length; index++) {
            const found = this._parent[index]?.find(name, checked);
            if(found) {
                return found;
            }
        }

        for (let index = 0; index < this._children.length; index++) {
            const found = this._children[index]?.find(name, checked);
            if(found) {
                return found;
            }
        }

        return false;
    }

    _addChild(node: TreeNode) {
        this._children[this._children.length] = node;
    }

    _addParent(node: TreeNode) {
        this._parent[this._parent.length] = node;
    }

    addChild(name: string): TreeNode {
        const found = this.find(name);

        if(found) {
            found._addParent(this)
            this._addChild(this);
            return found;
        }

        const node = new TreeNode(name, this);
        this._addChild(node);
        return node;
    }
}

class Container implements ITestableContainer {
    _registry: IDictionary<IRegisterable> = {};
    _replacements: IDictionary<IRegisterable> = {};
    _cache: IDictionary<Valid<any>> = {};
    _repCache: IDictionary<Valid<any>> = {};
    _testable = false;
    _id: number;

    constructor();
    constructor(registry: IDictionary<IRegisterable>);
    constructor(registry?: IDictionary<IRegisterable>) {
        this._testable = !!registry;
        if(!!registry) {
            const keys = Object.keys(registry);
            keys.forEach(key => this._registry[key] = registry[key]);
        }
        else {
            findModules(this);
        }

        this._id = Math.random();
    }

    _hasKey(registry: IDictionary<IRegisterable>, key: string): boolean {
        return !!registry[key];
    }

    _register(registry: IDictionary<IRegisterable>, registerable: IRegisterable): ITestableContainer {
        let key = registerable.name;
        if (this._hasKey(registry, key)) {
            throw new Error(`Module named "${key}" already registered.`);
        }

        registry[key] = registerable;
        return this;
    }

    register(registerable: IRegisterable): ITestableContainer {
        if (!registerable.name) {
            throw new Error('Must have a valid name to be registered.');
        }
        this._register(this._registry, registerable);
        return this;
    }
    
    registerValue(value: any, name?: string | undefined): ITestableContainer {
        if (!value.name && !name) {
            throw new Error('Most provide a name as a property or a parameter when registering a value as a module.');
        }

        const registerable: IRegisterable = {
            builder: () => { return value; },
            name: name ?? value.name,
            singleton: true
        };

        return this.register(registerable);
    }
    
    registerBuilder(fn: (...args: any[]) => any, dependencies: string[], name?: string | undefined, singleton?: boolean | undefined): ITestableContainer {
        if(!fn.name && !name) {
            throw new Error('Must provide a name on the function or as a parameter to register a builder.');
        }

        const registerable: IRegisterable = {
            builder: fn,
            name: name ?? fn.name,
            dependencies: dependencies ?? [],
            singleton: !!singleton,
        }
        
        this.register(registerable);
        return this;
    }

    _build<T>(moduleName: string, modules: string[], tree: TreeNode): Valid<T> {
        let moduleBuilder = this._replacements[moduleName];
        let replaced = true;
        if (!moduleBuilder) {
            moduleBuilder = this._registry[moduleName];
            replaced = false;
        }

        if (!moduleBuilder) {
            let t: any = undefined;
            try {
                t = require(moduleName);
            }
            catch {
            }

            if (!t) {
                throw new Error(`No module called "${moduleName}" registered`);
            }
            this.registerBuilder(() => require(moduleName), [], moduleName);
            moduleBuilder = this._registry[moduleName] as IRegisterable;
        }

        if(this._repCache[moduleName]) {
            return this._repCache[moduleName];
        }
        
        if(!replaced && this._cache[moduleName]) {
            return this._cache[moduleName];
        }

        const recursive = tree.check(moduleName);

        if (recursive) {
            let recursiveModules = recursive.reverse().map(name => `"${name}"`).join(' => ');
            throw new Error(`Circular dependencies between (${recursiveModules})`);
        }

        modules[modules.length] = moduleName;

        let dependencies: Valid<any>[] = 
            moduleBuilder.dependencies?.map((name) => this._build(name, modules, tree.addChild(moduleName))) ?? [];

        let result: Valid<T> = moduleBuilder.builder.apply(moduleBuilder.builder, dependencies);

        if(moduleBuilder.singleton) {
            if(replaced) {
                this._repCache[moduleName] = result;
            }
            else {
                this._cache[moduleName] = result;
            }
        }

        return result;
    }
    
    build(moduleName: string): Valid<any> {
        return this._build<any>(moduleName, [], new TreeNode());
    }
    
    buildAs<T>(moduleName: string): Valid<T> {
        return this._build<T>(moduleName, [], new TreeNode());
    }
    
    buildTestable(): ITestableContainer {
        return new Container(this._registry);
    }
    
    supportsReplace(): boolean {
        return this._testable;
    }

    _replace(registerable: IRegisterable, isPackage?: boolean) : ITestableContainer {
        let key = registerable.name;
        if(!isPackage && !this._hasKey(this._registry, key)) {
            throw new Error(`Cannot replace module "${key}" as it has not been registered.`);
        }
        if(!isPackage && this._hasKey(this._replacements, key)) {
            throw new Error (`Cannot replace module "${key}" as it has not been registered.`)
        }

        return this._register(this._replacements, registerable);
    }
    
    replace(registerable: IRegisterable): ITestableContainer {
        return this._replace(registerable);
    }
    
    replaceBuilder(fn: (...args: any[]) => any, dependencies: string[], name?: string | undefined, singleton?: boolean | undefined): ITestableContainer {
        if (!fn.name && !name) {
            throw new Error('Must provide a name either on the passed method or parameter to replace builder.');
        }

        let registerable: IRegisterable = {
            builder: fn,
            dependencies: dependencies ?? [],
            name: name ?? fn.name,
            singleton: !!singleton,
        };
        
        return this._replace(registerable);
    }
    
    replaceValue(value: any, name?: string | undefined): ITestableContainer {
        let key = name ?? value.name;
        if (!key) {
            throw new Error('Cannot replace value unless it has a name property or the name is passed as a parameter.');
        }

        return this.replaceBuilder(() => { return value; }, [], key, true);
    }
    
    replacePackageBuilder(fn: (...args: any[]) => any, name?: string | undefined, singleton?: boolean | undefined): ITestableContainer {
        if(!fn.name && !name) {
            throw new Error('Must provide a name either on the passed method or parameter to replace package builder.');
        }

        let registerable: IRegisterable = {
            builder: fn,
            name: name ?? fn.name,
            singleton: !!singleton,
        };
        
        return this._replace(registerable, true);
    }
    
    replacePackageValue(value: any, name?: string | undefined): ITestableContainer {
        if(!value.name && !name) {
            throw new Error('Cannot replace package with value unless it has a name property or the name is passed as a parameter.');
        }

        return this.replacePackageBuilder(() => value, name ?? value.name);
    }
    
    restore(moduleName: string): ITestableContainer {
        delete this._replacements[moduleName];
        delete this._repCache[moduleName];
        return this;
    }
    
    restoreAll(): ITestableContainer {
        const keys = Object.keys(this._replacements);
        let that = this;
        keys.forEach(key => that.restore(key));
        return this;
    }
    
    getModuleList(): string[] {
        const keys = Object.keys(this._registry);
        return Object.assign([], keys);
    }

    get id(): number {
        return this._id;
    }

    get isTestable(): boolean {
        return this._testable;
    }
}

const core = new Container();
const registry = core as IDependencyContainer;
const manager = core as IDependencyManager;
const container = core as IContainer;

export {
    registry,
    manager,
    container,
};