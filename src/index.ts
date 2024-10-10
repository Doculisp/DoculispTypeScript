import { container } from './container';
import { Command } from 'commander';
import { Result } from './types/types.general';
import { IController } from './types/types.controller';

const program = new Command();
const controller = container.buildAs<IController>('controller');

program
    .name('doculisp')
    .description('A compiler for markdown')
    .version('0.0.1')
    .requiredOption('-s, --source <source_path>', 'The source file to compile')
    .requiredOption('-d, --output <output_path>', 'The output document path for the compiled markdown')
    .option('-t, --test', 'runs the compiler without generating the output file.');

program.parse(process.argv);

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
