#! /usr/bin/env node

import { DoculispApi, Result } from 'doculisp-api';
import { Command, OptionValues } from 'commander';
import childProcess from 'child_process';
import Registry from '@slimio/npm-registry';
import figlet from 'figlet';
import path from 'path';

// Helper function to get version from package.json
function getVersion(): string {
    try {
        const packageJson = require('../package.json');
        return packageJson.version || '?.?.?';
    } catch {
        return '?.?.?';
    }
}

// Helper function to validate source file extensions
function isValidSourceFile(filePath: string): boolean {
    return filePath.endsWith('.md') || filePath.endsWith('.dlisp') || filePath.endsWith('.dlproj');
}

async function checkVersion(version: string, modulePath: string, isCli: boolean) {
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
    const program = new Command();
    const api = await DoculispApi.create();
    const version = getVersion();
    
    const nodePath = path.dirname(path.resolve(process.argv[0] as string));
    const modulePath = path.resolve(process.argv[1] as string);
    const isCli = modulePath.includes(nodePath);

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
        .action(async (sourcePathString: string | undefined, outputPathString: string | undefined, options: OptionValues) => {
            if (options['update']){
                try {
                    const updateCommand = isCli ? 'npm update doculisp -g' : 'npm update doculisp';
                    childProcess.execSync(updateCommand, { stdio: 'inherit' });
                    const updateCommand2 = isCli ? 'npm i doculisp@latest -g' : 'npm i doculisp@latest'
                    childProcess.execFileSync(updateCommand2, {stdio: 'inherit'});
                    console.log('Updated!');
                }
                catch {
                    // intentionally left blank
                }
                return;
            }
            else if (options['test']) {
                if(!sourcePathString) {
                    console.error('Error: The `--test` option requires a source path.');
                    process.exit(1);
                }
                else if(!isValidSourceFile(sourcePathString)) {
                    console.error(`Error: The source file must be either a markdown, dlisp, or a dlproj file.\n\t'${sourcePathString}'`)
                    process.exit(1);
                }
                else {
                    const result = await api.testFile(sourcePathString);
                    reportResult(...result);
                }
            }
            else {
                if(!sourcePathString) {
                    console.error('Error: The source path is required.');
                    process.exit(1);
                }
                else if(!isValidSourceFile(sourcePathString)) {
                    console.error(`Error: The source file must be either a markdown, dlisp, or a dlproj file.\n\t'${sourcePathString}'`);
                    process.exit(1);
                }
                else if(outputPathString && !outputPathString.endsWith('.md')) {
                    console.error(`Error: The output file must be a markdown file.\n\t'${outputPathString}'`);
                    process.exit(1);
                }
                else {
                    const result = await api.compileFile(sourcePathString, outputPathString);
                    reportResult(...result);
                }
            }

            await checkVersion(version, modulePath, isCli);
        })
        .parseAsync(process.argv);

    function reportResult(...results: Result<string | false>[]) {
        let failed = false;
        results.forEach(result => {
            if (result.success) {
                if (typeof result.value === 'string' && result.value.endsWith(' valid.')) {
                    // Test mode: value already contains the complete message
                    console.log(`Ok! ${result.value}`);
                } else {
                    // Compile mode: add "successfully written"
                    const message = !!result.value ? `Ok! ${result.value} successfully written` : 'Ok!';
                    console.log(message);
                }
            }
            else {
                console.error(`Error in file: ${result.documentPath}`);
                console.error(result.message);
                failed = true;
            }
        });

        if(failed) {
            process.exit(1);
        }
    }
}

main().catch(console.error);