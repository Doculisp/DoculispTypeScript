import { IContainer } from "./types/types.containers";
import path from "node:path";
import { globSync } from 'glob';
import { container } from "./container";

async function importModules(container: IContainer, moduleNames: string[]) {
    moduleNames.forEach(n => {
        if(n.endsWith('index')) {
            return;
        }

        import(n).then(module => {
            const keys = Object.keys(module);
            keys
                .filter(key => {
                    let value = module[key];
                    return !!value?.name && !!value?.builder;
                })
                .forEach(key => container.register(module[key]));
        });
    });
}

async function loadModules(container: IContainer) {
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

    return importModules(container, moduleNames).then(() => container);
}

const containerPromise = loadModules(container);

export {
    containerPromise
}