import { IRegisterable } from "../types/types.containers";
import { IFileHandler } from "../types/types.fileHandler";
import { IUtil, Result } from "../types/types.general";

function buildLoader(util: IUtil, fs: any): IFileHandler {
    function load(path: string): Result<string> {
        try {
            const value: string = fs.readFileSync(path, {encoding: 'utf8'});
            return util.ok(value);
        } catch (error) {
            return util.fail(`${(error as any).message}`, path);
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
            return util.fail(`${(error as any)}`, path);
        }
    }

    function getProcessWorkingDirectory(): Result<string> {
        try {
            return util.ok(process.cwd());
        } catch (error) {
            return util.fail(`${(error as any).message}`, '');
        }
    }

    function setProcessWorkingDirectory(directory: string): Result<undefined> {
        try {
            process.chdir(directory);
            return util.ok(undefined);
        } catch(error) {
            return util.fail(`${(error as any).message}`, directory);
        }
    }

    return {
        load,
        write,
        getProcessWorkingDirectory,
        setProcessWorkingDirectory,
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