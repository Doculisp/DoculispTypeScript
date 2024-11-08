#! /usr/bin/env node
import { container } from './container';
import { Command, OptionValues } from 'commander';
import { Result } from './types/types.general';
import { IController } from './types/types.controller';
import { IVersion } from './types/types.version';
import childProcess from 'child_process';
import Registry from '@slimio/npm-registry';
import figlet from 'figlet';
import path from 'path';

const program = new Command();
const controller = container.buildAs<IController>('controller');
const versionGetter = container.buildAs<IVersion>('version');
const versionMaybe = versionGetter.getVersion();

const nodePath = path.dirname(path.resolve(process.argv[0] as string));
const modulePath = path.resolve(process.argv[1] as string);
const isCli = modulePath.includes(nodePath);

async function checkVersion(version: string) {
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
        if(isCli){
            console.log('Run `npm update doculisp -g` to get the latest version.');
            console.log('Or');
            console.log('Run `doculisp --update`');
        }
        else {
            console.log('Run `npm update doculisp` to get the latest version.');
            console.log('Or');
            console.log(`Run \`node ${modulePath} --update\``);
        }
        console.log();
        console.log('************************************************');
    }
}


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
    '\n            Language Version: 0.2.2' +
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
        .option('--update', 'updates doculisp')
        .action(async (sourcePath: string | undefined, outputPath: string | undefined, options: OptionValues) => {
            if (options['update']){
                const updateCommand = isCli ? 'npm update doculisp -g' : 'npm update doculisp';
                childProcess.execSync(updateCommand, { stdio: 'inherit' });
                const updateCommand2 = isCli ? 'npm i doculisp@latest -g' : 'npm i doculisp@latest'
                childProcess.execFileSync(updateCommand2, {stdio: 'inherit'});
                console.log('Updated!');
                return;
            }
            else if (options['test']) {
                if(!sourcePath) {
                    console.log('Error: The `--test` option requires a source path.');
                }
                else {
                    const result = controller.test(sourcePath);
                    reportResult(result);
                }
            }
            else {
                if(!sourcePath) {
                    console.log('Error: The source path is required.');
                }
                else if(!outputPath) {
                    console.log('Error: The output path is required.');
                }
                else{
                    const result = controller.compile(sourcePath, outputPath);
                    reportResult(result);
                }
            }

            checkVersion(version);
        })
        .parseAsync(process.argv);


    function reportResult(result: Result<string | false>) {
        if (result.success) {
            const message = !!result.value ? `Ok! ${result.value} successfully written` : 'Ok!';
            console.log(message);
        }
        else {
            console.error(`Error in file: ${result.documentPath}`);
            console.error(result.message);
            process.exit(1);
        }
    }
    
}

main().catch(console.error);