import { IRegisterable } from "./types.containers";
import { IFileHandler } from "./types.fileHandler";
import fs from 'fs';

import { IUtil, Result } from "./types.general";

function buildLoader(util: IUtil, fd: any): IFileHandler {
    function load(path: string): Result<string> {
        try {
            const value: string = fs.readFileSync(path, {encoding: 'utf8'});
            return util.ok(value);
        } catch (error) {
            return util.fail(`${error}`, path);
        }
    }

    function write(path: string, text: Result<string>): Result<string> {
        if(!text.success) {
            return text;
        }

        const output = text.value;

        try {
            fs.writeFileSync(path, output, {encoding: 'utf8'});
            return text;
        }
        catch(error) {
            return util.fail(`${error}`, path);
        }
    }

    return {
        load,
        write,
    };
}

const loader: IRegisterable = {
    builder: (util: IUtil, fs: any) => buildLoader(util, fs),
    name: 'fileHandler',
    dependencies: ['util', 'fs'],
    singleton: true
};

export {
    loader,
};