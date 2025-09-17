# Usage Examples

## Basic Compilation Pipeline

Here's how to use the container to perform a complete document compilation:

```typescript
import { container } from './container';
import { IController, IPathConstructor } from './types';

// Get required services
const controller = container.buildAs<IController>('controller');
const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

// Create paths
const sourcePath = pathConstructor.buildPath('./input.dlisp');
const outputPath = pathConstructor.buildPath('./output.md');

// Compile the document
const result = controller.compile(sourcePath, outputPath);

if (result.success) {
    console.log('Compilation successful:', result.value);
} else {
    console.error('Compilation failed:', result.message);
}
```

## Parsing Text Manually

To parse Doculisp text without file I/O:

```typescript
import { container } from './container';

// Get parsing services
const tokenizer = container.buildAs<ITokenizer>('tokenizer');
const astParser = container.buildAs<IAstParser>('astParser');
const doculispParser = container.buildAs<IAstDoculispParser>('astDoculispParse');
const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

const sourcePath = pathConstructor.buildPath('./example.md');
const input = '<!-- (dl section-meta This is a test document) -->\n\nHere is test markdown!';

// Step 1: Tokenize
const tokens = tokenizer.tokenize(input, sourcePath);
if (!tokens.success) {
    console.error('Tokenization failed:', tokens.message);
    return;
}

// Step 2: Parse to AST  
const ast = astParser.parse(tokens.value, sourcePath);
if (!ast.success) {
    console.error('AST parsing failed:', ast.message);
    return;
}

// Step 3: Parse to Doculisp structures
const doculisp = doculispParser.parse(ast.value, sourcePath);
if (!doculisp.success) {
    console.error('Doculisp parsing failed:', doculisp.message);
    return;
}

console.log('Parsed successfully:', doculisp.value);
```

## Working with Variables

The variable table in Doculisp has very limited functionality. It primarily manages:

1. **System-generated string variables**: `source` and `destination` (set automatically)
2. **ID variables**: For tracking header IDs and ensuring uniqueness

```typescript
import { container } from './container';

const variableTable = container.buildAs<IVariableTable>('variableTable');

// Check for system variables (automatically set during compilation)
const hasSource = variableTable.hasKey('source');
const hasDestination = variableTable.hasKey('destination');

if (hasSource) {
    const sourceVar = variableTable.getValue<IVariableString>('source');
    if (sourceVar.success) {
        console.log('Source path:', sourceVar.value.value);
    }
}

// The variable table is primarily used internally for ID tracking
// Custom string variables are NOT supported - only system-generated ones
```

## File Operations

Working with files through the container:

```typescript
import { container } from './container';

const fileHandler = container.buildAs<IFileWriter>('fileHandler');
const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

const filePath = pathConstructor.buildPath('./example.md');

// Check if file exists
const exists = fileHandler.exists(filePath);
if (exists.success && exists.value) {
    // Read file contents
    const content = fileHandler.read(filePath);
    if (content.success) {
        console.log('File content:', content.value);
        
        // Process and write back
        const processed = content.value.toUpperCase();
        const writeResult = fileHandler.write(filePath, processed);
        
        if (writeResult.success) {
            console.log('File updated successfully');
        }
    }
}
```

## Document Structure Analysis

Analyzing document structure and relationships:

```typescript
import { container } from './container';

const structure = container.buildAs<IStructure>('structure');
const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

const projectPath = pathConstructor.buildPath('./project.dlproj');

// Analyze structure
const analysis = structure.analyze(projectPath);
if (analysis.success) {
    console.log('Document structure:', analysis.value);
    
    // Access individual documents
    analysis.value.documents.forEach(doc => {
        console.log(`Document: ${doc.name}`);
        console.log(`Source: ${doc.sourcePath.fullName}`);
        console.log(`Output: ${doc.outputPath.fullName}`);
    });
}
```

## String Generation

Generating markdown output from parsed structures:

```typescript
import { container } from './container';

const stringWriter = container.buildAs<IStringWriter>('stringWriter');
const variableTable = container.buildAs<IVariableTable>('variableTable');

// Assume you have a parsed Doculisp structure
const doculispStructure: DoculispPart[] = [
    {
        type: 'header',
        level: 1,
        text: 'Example Header',
        id: 'example-header',
        location: someLocation
    }
];

// Generate markdown
const markdown = stringWriter.write(doculispStructure, variableTable);
if (markdown.success) {
    console.log('Generated markdown:', markdown.value);
}
```