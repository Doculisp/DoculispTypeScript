import { IRegisterable } from "../types/types.containers";
import { IPathHandler } from "../types/types.fileHandler";
import { IUtil, UtilBuilder } from "../types/types.general";

function buildUtil(builder: UtilBuilder, pathHandler: IPathHandler): IUtil {
    return builder(pathHandler);
}

const utilRegister: IRegisterable = {
    builder: (builder: UtilBuilder, pathHandler: IPathHandler) => buildUtil(builder, pathHandler),
    name: 'util',
    singleton: true,
    dependencies: ['utilBuilder', 'fileHandler']
};

export {
    utilRegister,
};
