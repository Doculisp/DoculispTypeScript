#! /usr/bin/env node
import { container } from './container';
import { Command, OptionValues } from 'commander';
import { Result } from './types/types.general';
import { IController } from './types/types.controller';
import { IVersion } from './types/types.version';
import childProcess from 'child_process';
import Registry from '@slimio/npm-registry';
import figlet from 'figlet';

const program = new Command();
const controller = container.buildAs<IController>('controller');
const versionGetter = container.buildAs<IVersion>('version');
const versionMaybe = versionGetter.getVersion();

async function main() {
    let version = '?.?.?'

    if(!versionMaybe.success) {
        console.log('doculisp cannot determine its version')
    } else {
        version = versionMaybe.value;
    }

    const helptext = '\n\n' + figlet.textSync('doculisp', {
        font: 'Cybermedium'
    }) + 
    `\n            Compiler Version: ${version}` +
    '\n            Language Version: 0.1.0' +
    '\n';

    program.addHelpText('beforeAll', helptext);
    program.addHelpText('afterAll', '\n\n');

    program
        .name('doculisp')
        .description('A compiler for markdown')
        .version(version)
        .argument('[source]', 'the path to the file to compile')
        .argument('[output]', 'the path to the output location including output file name')
        .option('-t, --test', 'runs the compiler without generating the output file')
        .option('--update', 'updates the global install of doculisp')
        .action((sourcePath: string | undefined, outputPath: string | undefined, options: OptionValues) => {
            if (options['update']){
                childProcess.execSync(`npm install doculisp@latest -g`, { stdio: 'inherit' });
                console.log('Updated!');
                return;
            }
            else if (options['test']) {
                if(!sourcePath) {
                    console.log('Error: The `--test` option requires a source path.');
                    return;
                }
                const result = controller.test(sourcePath);
                reportResult(result);
            }
            else {
                if(!sourcePath) {
                    console.log('Error: The source path is required.');
                    return;
                }

                if(!outputPath) {
                    console.log('Error: The output path is required.');
                    return;
                }

                const result = controller.compile(sourcePath, outputPath);
                reportResult(result);
            }
        })
        .parseAsync(process.argv);

    const npmReg = new Registry();
    const pkg = await npmReg.package("doculisp");

    if(pkg.lastVersion !== version) {
        console.log('************************************************');
        console.log();
        console.log('A newer version of doculisp is available!');
        console.log();
        console.log(`Your version: ${version}`);
        console.log(`Latest version: ${pkg.lastVersion}`);
        console.log();
        console.log('Run `npm update doculisp -g` to get the latest version.');
        console.log();
        console.log('************************************************');
    }


    function reportResult(result: Result<string | false>) {
        if (result.success) {
            const message = !!result.value ? `Ok! ${result.value} successfully written` : 'Ok!';
            console.log(message);
        }
        else {
            console.error(JSON.stringify(result, null, 4));
            process.exit(1);
        }
    }
    
}

main().catch(console.error);