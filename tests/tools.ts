import { JestReporter } from "approvals/lib/Providers/Jest/JestReporter";
import { verifyAsJson, verify } from "approvals/lib/Providers/Jest/JestApprovals";
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
    } else if((thing as any).asJson) {
        thing = (thing as any).asJson();
    }

    const a = thing as any;
    if(a.constructor?.name !== null && a.constructor.name !== 'Object') {
        return thing;
    }

    const keys = 
        Object.
            keys(a).
            filter(key => !key.startsWith('_')).
            sort();
    const ret: any = {};
    
    keys.forEach(key => ret[key] = order(a[key]));

    return ret;
}

function verifyJsonObject(data: any, options?: Options): void {
    verifyAsJson(order(data), options);
}

function verifyMarkdownObject(text: string, options?: Options): void {
  options = options || new Options();
  options = options.forFile().withFileExtention(".md");
  verify(text, options);
}

function setupVerifier(configure: (overrideOptions?: Partial<Config> | undefined) => Config): void {
    configure({
        reporters: [new JestReporter()],
        errorOnStaleApprovedFiles: true,
        failOnLineEndingDifferences: false,
        normalizeLineEndingsTo: '\n',
    });
}

export function getVerifier(configure: (overrideOptions?: Partial<Config> | undefined) => Config): ((data: any, options?: Options) => void) {
    setupVerifier(configure);

    return verifyJsonObject;
}

export function getVerifiers(configure: (overrideOptions?: Partial<Config> | undefined) => Config) {
    setupVerifier(configure);
    
    return {
        verifyAsJson: verifyJsonObject,
        verifyMarkdown: verifyMarkdownObject,
    };
};