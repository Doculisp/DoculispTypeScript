import { IRegisterable } from "../types/types.containers";
import { IFileHandler } from "../types/types.fileHandler";
import { Result, UtilBuilder } from "../types/types.general";
import path from "node:path";

function buildLoader(utilBuilder: UtilBuilder, fs: any): IFileHandler {

    function resolvePath(filePath: string): string {
        return path.resolve(filePath);
    }

    const util = utilBuilder({ resolvePath });

    function load(filePath: string): Result<string> {
        try {
            const value: string = fs.readFileSync(filePath, {encoding: 'utf8'});
            return util.ok(value);
        } catch (error) {
            return util.fail(`${(error as any).message}`, filePath);
        }
    }

    function write(filePath: string, text: Result<string>): Result<string> {
        if(!text.success) {
            return text;
        }

        const output = text.value;

        try {
            fs.writeFileSync(filePath, output, {encoding: 'utf8'});
            return text;
        }
        catch(error) {
            return util.fail(`${(error as any)}`, filePath);
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
        resolvePath,
    };
}

const loader: IRegisterable = {
    builder: (utilBuilder: UtilBuilder, fs: any) => buildLoader(utilBuilder, fs),
    name: 'fileHandler',
    dependencies: ['utilBuilder', 'fs'],
    singleton: true
};

export {
    loader,
};