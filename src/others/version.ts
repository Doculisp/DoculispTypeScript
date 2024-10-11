import path from "path";
import { IRegisterable } from "../types/types.containers";
import { IUtil, Result } from "../types/types.general";
import { IVersion } from "../types/types.version";

function buildVersion(util: IUtil): IVersion {
    function getVersion(): Result<string> {
        const file = require('../../package.json');

        if(!file || !file['version']) {
            return util.fail('Could not find the verions', path.resolve('../../package.json'));
        }

        return util.ok(file['version'] as string);
    }

    return {
        getVersion,
    };
}

const versionBuilder: IRegisterable = {
    builder: (util: IUtil) => buildVersion(util),
    name: 'version',
    dependencies: ['util'],
    singleton: true
};

export {
    versionBuilder,
};