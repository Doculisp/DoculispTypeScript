import { JestReporter } from "approvals/lib/Providers/Jest/JestReporter";
import { verifyAsJson } from "approvals/lib/Providers/Jest/JestApprovals";
import { Config } from "approvals/lib/config";
import { Options } from "approvals/lib/Core/Options";


export function order<T>(thing: T): T {
    if(!thing) { return thing; }

    if(['string', 'number', 'boolean', 'function'].includes(typeof(thing))) {
        return thing;
    } else if(Array.isArray(thing)) {
        let b: any[] = thing as any;
        for (let index = 0; index < b.length; index++) {
            b[index] = order(b[index]);
        }
        return b as any;
    }
    let a = thing as any;
    if(a.constructor?.name !== null && a.constructor.name !== 'Object') {
        return thing;
    }

    const keys = 
        Object.
            keys(a).
            sort();
    const ret: any = {};
    
    keys.forEach(key => ret[key] = order(a[key]));

    return ret;
}

export function getVerifier(configure: (overrideOptions?: Partial<Config> | undefined) => Config): ((data: any, options?: Options) => void) {
    configure({
        reporters: [new JestReporter()],
    });

    return function(data: any, options?: Options): void {
        verifyAsJson(order(data), options);
    };
}