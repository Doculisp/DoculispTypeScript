import { IContainer, IDependencyContainer, IDependencyManager, IDictionary, IRegisterable, ITestableContainer, Valid } from "./types.containers";
import { globSync } from 'glob';

function findModules(container: IContainer) {
    let moduleNames = (
        globSync('./dist/**/*.js')
        .map(p => {
            return p.replace('dist', '.').replace('\\src', '').replace('.js', '').replaceAll('\\', '/');
        })
    );

    moduleNames.forEach(n => {
        import(n).then(m => {
            const keys = Object.keys(m);
            keys.
                filter(key => {
                    let value = m[key];
                    return !!value.name && !!value.builder;
                }).
                forEach(key => container.register(m[key]));
        });
    });
}

class Container implements ITestableContainer {
    _registry: IDictionary<IRegisterable> = {};
    _replacements: IDictionary<IRegisterable> = {};
    _cache: IDictionary<Valid<any>> = {};
    _repCache: IDictionary<Valid<any>> = {};
    _testable = false;

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
        return this
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

    _build<T>(moduleName: string, modules: string[]): Valid<T> {
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

        let recursive = 
            moduleBuilder.dependencies?.filter(name => modules.includes(name)) ?? [];

        modules[modules.length] = moduleName;

        if (0 < recursive.length) {
            let moduleNames = modules.map(name => `"${name}"`).join(' => ');
            let recursiveModules = recursive.map(name => `"${name}"`).join(', ');
            throw new Error(`Circular dependencies between (${moduleNames} => [${recursiveModules}])`);
        }

        let dependencies: Valid<any>[] = 
            moduleBuilder.dependencies?.map((name) => this._build(name, modules)) ?? [];

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
        return this._build<any>(moduleName, []);
    }
    
    buildAs<T>(moduleName: string): Valid<T> {
        return this._build<T>(moduleName, []);
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
        
        return this._replace(registerable);// 
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