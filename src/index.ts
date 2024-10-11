#! /usr/bin/env node
import { container } from './container';
import { Command } from 'commander';
import { Result } from './types/types.general';
import { IController } from './types/types.controller';
import { IVersion } from './types/types.version';

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

program
    .name('doculisp')
    .description('A compiler for markdown')
    .version(version)
    .requiredOption('-s, --source <source_path>', 'The source file to compile')
    .requiredOption('-d, --output <output_path>', 'The output document path for the compiled markdown')
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

const sourcePath = options['source'];

console.log(`sourcePath = ${sourcePath}`);

if (options['test']) {
    const result = controller.test(sourcePath);
    reportResult(result);
}
else {
    const outputPath = options['output'];
    const result = controller.compile(sourcePath, outputPath);
    reportResult(result);
}
