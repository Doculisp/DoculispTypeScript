import { IRegisterable } from "../types/types.containers";
import { ITrimArray } from "../types/types.trimArray";

function buildTrimArray(): ITrimArray {
    return {
        trim<T>(length: number, values: T[]): T[] {
            const ret: T[] = values.slice();
            for (let index = 0; index < length && 0 < ret.length; index++) {
                ret.shift();
            }
    
            return ret;
        }
    }
}

const trimBuilder: IRegisterable = {
    builder: () => buildTrimArray(),
    name: 'trimArray',
    dependencies: [],
    singleton: true
};

export {
    trimBuilder,
};