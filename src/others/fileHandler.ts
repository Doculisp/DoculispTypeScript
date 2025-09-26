import { IRegisterable } from "../types/types.containers";
import { IFileHandler } from "../types/types.fileHandler";
import { IPath, PathConstructor } from "../types/types.filePath";
import { ResultGeneral, UtilBuilder } from "../types/types.general";

function buildLoader(utilBuilder: UtilBuilder, fs: any, pathConstructor: PathConstructor): IFileHandler {

    const util = utilBuilder();

    function load(filePath: IPath): ResultGeneral<string> {
        try {
            const value: string = fs.readFileSync(filePath.fullName, {encoding: 'utf8'});
            return util.ok(value);
        } catch (error) {
            return util.generalFailure(`${(error as any).message}`, filePath);
        }
    }

    function write(filePath: IPath, text: ResultGeneral<string>): ResultGeneral<string> {
        if(!text.success) {
            return text;
        }

        const output = text.value;

        try {
            fs.writeFileSync(filePath.fullName, output, {encoding: 'utf8'});
            return text;
        }
        catch(error) {
            return util.generalFailure(`${(error as any)}`, filePath);
        }
    }

    function getProcessWorkingDirectory(): ResultGeneral<IPath> {
        try {
            return util.ok(pathConstructor(process.cwd()));
        } catch (error) {
            return util.generalFailure(`${(error as any).message}`);
        }
    }

    function setProcessWorkingDirectory(directory: IPath): ResultGeneral<undefined> {
        try {
            process.chdir(directory.fullName);
            return util.ok(undefined);
        } catch(error) {
            return util.generalFailure(`${(error as any).message}`, directory);
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
    builder: (utilBuilder: UtilBuilder, fs: any, pathConstructor: PathConstructor) => buildLoader(utilBuilder, fs, pathConstructor),
    name: 'fileHandler',
    dependencies: ['utilBuilder', 'fs', 'pathConstructor'],
    singleton: true
};

export {
    loader,
};