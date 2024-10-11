#! /usr/bin/env node
import { container } from './container';
import { Command } from 'commander';
import { Result } from './types/types.general';
import { IController } from './types/types.controller';
import { IVersion } from './types/types.version';
import figlet from 'figlet';

const program = new Command();
const controller = container.buildAs<IController>('controller');
const versionGetter = container.buildAs<IVersion>('version');

const versionMaybe = versionGetter.getVersion();


let version = '?.?.?'

if(!versionMaybe.success) {
    console.log('doculisp cannot determine its version')
} else {
    version = versionMaybe.value;
}

const helptext = '\n\n' + figlet.textSync('doculisp', {
    font: 'Cybermedium'
}) + `\n                     Version: ${version}`;

program.addHelpText('beforeAll', helptext);
program.addHelpText('afterAll', '\n\n');

program
    .name('doculisp')
    .description('A compiler for markdown')
    .version(version)
    .requiredOption('-s, --source <source_path>', 'the source file to compile')
    .requiredOption('-d, --output <output_path>', 'the output document path for the compiled markdown')
    .option('-t, --test', 'runs the compiler without generating the output file.')
    .parse(process.argv);

function reportResult(result: Result<string | false>) {
    if (result.success) {
        const message = !!result.value ? `Ok! ${result.value} successfully written` : 'Ok!';
        console.log(message);
    }
    else {
        console.log(JSON.stringify(result, null, 4));
    }
}

const options = program.opts();

const sourcePath: string = options['source'];

if (options['test']) {
    const result = controller.test(sourcePath);
    reportResult(result);
}
else {
    const outputPath: string = options['output'];
    const result = controller.compile(sourcePath, outputPath);
    reportResult(result);
}
