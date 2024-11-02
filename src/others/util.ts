import { IRegisterable } from "../types/types.containers";
import { IUtil, UtilBuilder } from "../types/types.general";

function buildUtil(builder: UtilBuilder): IUtil {
    return builder();
}

const utilRegister: IRegisterable = {
    builder: (builder: UtilBuilder) => buildUtil(builder),
    name: 'util',
    singleton: true,
    dependencies: ['utilBuilder']
};

export {
    utilRegister,
};
