#! /usr/bin/env node
import { container } from './container';
import { Command, OptionValues } from 'commander';
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
    .argument('<source>', 'the path to the file to compile')
    .argument('<output>', 'the path to the output location including output file name')
    .option('-t, --test', 'runs the compiler without generating the output file')
    .action((sourcePath: string, outputPath: string, options: OptionValues) => {
        if (options['test']) {
            const result = controller.test(sourcePath);
            reportResult(result);
        }
        else {
            const result = controller.compile(sourcePath, outputPath);
            reportResult(result);
        }
    })
    .parse(process.argv);

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
