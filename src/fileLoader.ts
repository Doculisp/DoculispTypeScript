import { IRegisterable } from "./types.containers";
import { IFileLoader } from "./types.fileLoader";

import { IUtil, Result } from "./types.general";

function buildLoader(util: IUtil, fs: any): IFileLoader {
    function load(path: string): Result<string> {
        try {
            const value: string = fs.readFileSync(path, {encoding: 'utf8'});
            return util.ok(value);
        } catch (error) {
            return util.fail(`${error}`, path);
        }
    }

    return {
        load
    };
}

const loader: IRegisterable = {
    builder: (util: IUtil, fs: any) => buildLoader(util, fs),
    name: 'fileLoader',
    dependencies: ['util', 'fs'],
    singleton: true
};

export {
    loader,
};