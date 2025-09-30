import { containerPromise } from './src/moduleLoader';
import { ITestableContainer } from './src/types/types.containers';

async function verifyDocumentParser() {
    try {
        console.log('Loading container...');
        const environment = await containerPromise as ITestableContainer;
        const testable = environment.buildTestable();
        
        console.log('Building document parser...');
        const documentParser = testable.buildAs('documentParse');
        const util = testable.buildAs('util');
        
        // Create a mock project location
        const projectLocation = {
            documentPath: {
                fullName: 'test.md',
                extension: '.md'
            },
            documentDepth: 1,
            documentIndex: 1
        };
        
        // Test input - the simple case that's causing issues
        const input = `<!-- (dl (# h))-->`;
        
        console.log('Input:', JSON.stringify(input));
        console.log('Parsing document...');
        
        const result = documentParser(input, projectLocation);
        
        if (result.success) {
            console.log('\n=== PARSING SUCCESS ===');
            console.log('Number of parts:', result.value.parts.length);
            
            result.value.parts.forEach((part: any, index: number) => {
                console.log(`\nPart ${index}:`);
                console.log('  Type:', part.type);
                console.log('  Text:', JSON.stringify(part.text));
                console.log('  Location:', {
                    line: part.location.line,
                    char: part.location.char,
                    documentPath: part.location.documentPath.fullName
                });
            });
            
            // Look specifically for lisp parts
            const lispParts = result.value.parts.filter((p: any) => p.type === 'lisp');
            console.log(`\n=== LISP PARTS (${lispParts.length}) ===`);
            lispParts.forEach((part: any, index: number) => {
                console.log(`Lisp Part ${index}:`);
                console.log('  Text:', JSON.stringify(part.text));
                console.log('  Location: Line', part.location.line, 'Char', part.location.char);
                
                // Let's analyze character by character what should be at this location
                const lines = input.split('\n');
                if (part.location.line <= lines.length) {
                    const line = lines[part.location.line - 1];
                    console.log('  Line content:', JSON.stringify(line));
                    if (part.location.char <= line.length) {
                        const charAtLocation = line[part.location.char - 1];
                        console.log('  Character at location:', JSON.stringify(charAtLocation));
                        console.log('  Context around location:', JSON.stringify(line.substring(Math.max(0, part.location.char - 5), part.location.char + 5)));
                    }
                }
            });
            
        } else {
            console.log('\n=== PARSING FAILED ===');
            console.log('Error:', result.error);
            if (result.location) {
                console.log('Error location:', {
                    line: result.location.start.line,
                    char: result.location.start.char
                });
            }
        }
        
    } catch (error) {
        console.error('Error during verification:', error);
    }
}

verifyDocumentParser().catch(console.error);