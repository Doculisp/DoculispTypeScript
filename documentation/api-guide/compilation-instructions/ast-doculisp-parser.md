<!-- (dl (section-meta AstDoculispParser API Reference)) -->

<!-- (dl (# AstDoculispParser API Reference)) -->

The **AstDoculispParser** is the **fourth stage** of the DoculispTypeScript compilation pipeline that converts generic Abstract Syntax Trees (AST) into Doculisp-specific structured data. It transforms the parsed AST nodes from AstParser into semantic Doculisp structures that understand the meaning and relationships of Doculisp constructs like headers, sections, includes, and table of contents.

<!-- (dl (# Integration Patterns)) -->

**AstDoculispParser** serves as the **fourth stage** in the parsing pipeline, consuming AstParser output to generate Doculisp-specific structures for further processing:

```typescript
async function parseToDoculispPipeline(text: string, projectLocation: IProjectLocation): Promise<IDoculisp | IEmptyDoculisp | null> {
    const container = await containerPromise;
    
    // Stage 1: Parse document structure (DocumentParse)
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const documentMap = documentParser(text, projectLocation);
    
    if (!documentMap.success) {
        console.error('Document parsing failed:', documentMap.message);
        return null;
    }
    
    // Stage 2: Tokenize the content (Tokenizer)
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');
    const tokenResult = tokenizer(documentMap);
    
    if (!tokenResult.success) {
        console.error('Tokenization failed:', tokenResult.message);
        return null;
    }
    
    // Stage 3: Parse tokens into AST (AstParser)
    const astParser = container.buildAs<IAstParser>('astParser');
    const astResult = astParser.parse(tokenResult);
    
    if (!astResult.success) {
        console.error('AST parsing failed:', astResult.message);
        return null;
    }
    
    // Stage 4: Parse AST into Doculisp structures (AstDoculispParser)
    const doculispParser = container.buildAs<IDoculispParser>('astDoculispParse');
    const variableTable = container.buildAs<IVariableTable>('variableTable');
    const doculispResult = doculispParser.parse(astResult, variableTable);
    
    if (!doculispResult.success) {
        console.error('Doculisp parsing failed:', doculispResult.message);
        return null;
    }
    
    // Note: Additional pipeline stages exist beyond Doculisp structure generation
    return doculispResult.value;
}
```

<!-- (dl (## Overview)) -->

**AstDoculispParser** is the **fourth stage** in the Doculisp compilation pipeline that processes generic AST structures and produces semantic Doculisp data structures. It understands the meaning of Doculisp constructs and transforms them into structured objects that can be used for document generation, validation, and manipulation. This parser bridges the gap between syntax (AST) and semantics (Doculisp structures).

**Pipeline Position:** AstDoculispParser is stage 4 in the multi-stage compilation pipeline (DocumentParse → Tokenizer → AstParser → AstDoculispParser → ...)

**Primary Responsibilities:**

- Parse `section-meta` blocks into title and include structures
- Transform dynamic headers (`#`, `##`, etc.) into semantic header objects
- Process `content` blocks and table of contents configurations
- Handle cross-reference links with `get-path` commands
- Validate Doculisp syntax and structure rules
- Manage variable tables for ID tracking and cross-referencing

<!-- (dl (## Container Registration)) -->

Register AstDoculispParser with the dependency injection container:

```typescript
{
    name: 'astDoculispParse',
    singleton: false,
    dependencies: ['internals', 'util', 'trimArray', 'pathConstructor', 'textHelpers']
}
```

Access it from the container:
```typescript
const container = await containerPromise;
const doculispParser = container.buildAs<IDoculispParser>('astDoculispParse');
```

<!-- (dl (## Type Definitions)) -->

Understanding the types used by AstDoculispParser is essential for working with the generated Doculisp structures.

<!-- (dl (### Core Interface)) -->

```typescript
interface IDoculispParser {
    parse(tokenResults: Result<RootAst | IAstEmpty>, variableTable: IVariableTable): Result<IDoculisp | IEmptyDoculisp>;
}
```

The `IDoculispParser` provides a single `parse` method that transforms AST structures into Doculisp-specific semantic objects.

<!-- (dl (### Input Types)) -->

**Primary Inputs:**

```typescript
// AST result from previous parsing stage
tokenResults: Result<RootAst | IAstEmpty>

// Variable table for ID tracking and cross-references
variableTable: IVariableTable
```

**RootAst Structure (from AstParser):**
```typescript
type RootAst = {
    readonly ast: CoreAst[];
    readonly location: IProjectLocation;
    readonly type: 'RootAst';
}
```

**IVariableTable Interface:**
```typescript
interface IVariableTable {
    hasKey(key: string): boolean;
    getValue(key: string): IVariableValue | undefined;
    addGlobalValue(key: string, value: IVariableValue): void;
    // ... other methods
}
```

<!-- (dl (### Output Types)) -->

**Return Value:**
```typescript
Result<IDoculisp | IEmptyDoculisp>
```

**IDoculisp Structure:**
```typescript
interface IDoculisp {
    projectLocation: IProjectLocation;
    section: ISectionWriter;
    type: 'doculisp-root';
}
```

**ISectionWriter Structure:**
```typescript
interface ISectionWriter extends ILocationSortable {
    readonly doculisp: DoculispPart[];
    readonly include: ILoad[];
    readonly type: 'doculisp-section';
}
```

**IEmptyDoculisp Structure:**
```typescript
interface IEmptyDoculisp {
    readonly type: 'doculisp-empty';
}
```

<!-- (dl (### Doculisp Part Types)) -->

The parser generates various Doculisp-specific structures:

**IWrite (Text Content):**
```typescript
interface IWrite extends ILocationSortable {
    readonly type: 'doculisp-write';
    readonly value: string;
}
```

**ITitle (Section Titles):**
```typescript
interface ITitle extends ILocationSortable {
    readonly type: 'doculisp-title';
    readonly title: string;
    readonly label: string;
    readonly id?: string | undefined;
    readonly ref_link: string;
    readonly subtitle?: string | undefined;
}
```

**IHeader (Dynamic Headers):**
```typescript
interface IHeader extends ILocationSortable {
    readonly type: 'doculisp-header';
    readonly depthCount: number;
    readonly text: string;
    readonly id?: string | undefined;
}
```

**ILoad (Include References):**
```typescript
interface ILoad extends ILocationSortable {
    readonly type: 'doculisp-load';
    readonly path: IPath;
    readonly sectionLabel: string;
    document: ISectionWriter | false; //false means it has not been loaded yet.
}
```

**ITableOfContents (TOC Configuration):**
```typescript
interface ITableOfContents extends ILocationSortable {
    readonly type: 'doculisp-toc';
    readonly label: string | false;
    readonly bulletStyle: DoculispBulletStyle;
}
```

**IContentLocation (Content Placement):**
```typescript
interface IContentLocation extends ILocationSortable {
    readonly type: 'doculisp-content';
}
```

**IPathId (Cross-references):**
```typescript
interface IPathId extends ILocationSortable {
    readonly type: 'doculisp-path-id';
    readonly id: string;
}
```

<!-- (dl (## Basic Usage)) -->

<!-- (dl (### Simple Parsing)) -->

Parse an AST result into Doculisp structures:

```typescript
const container = await containerPromise;
const doculispParser = container.buildAs<IDoculispParser>('astDoculispParse');
const variableTable = container.buildAs<IVariableTable>('variableTable');

// Assume astResult is a Result<RootAst | IAstEmpty> from AstParser
const doculispResult = doculispParser.parse(astResult, variableTable);

if (doculispResult.success) {
    if (doculispResult.value.type === 'doculisp-root') {
        // Process the Doculisp structures
        const section = doculispResult.value.section;
        
        console.log(`Found ${section.doculisp.length} Doculisp parts`);
        console.log(`Found ${section.include.length} include references`);
        
        // Process each part
        section.doculisp.forEach(part => {
            console.log(`Part type: ${part.type}`);
        });
    } else {
        // Handle empty document
        console.log('Document is empty');
    }
} else {
    console.error('Doculisp parsing failed:', doculispResult.message);
}
```

<!-- (dl (### Processing Different Part Types)) -->

Handle various Doculisp part types:

```typescript
function processDoculispPart(part: DoculispPart): void {
    switch (part.type) {
        case 'doculisp-write':
            // Handle text content
            console.log(`Text: ${part.value}`);
            break;
            
        case 'doculisp-header':
            // Handle dynamic headers
            console.log(`Header (depth ${part.depthCount}): ${part.text}`);
            if (part.id) {
                console.log(`  ID: ${part.id}`);
            }
            break;
            
        case 'doculisp-title':
            // Handle section titles
            console.log(`Title: ${part.title}`);
            console.log(`  Label: ${part.label}`);
            console.log(`  Ref Link: ${part.ref_link}`);
            if (part.subtitle) {
                console.log(`  Subtitle: ${part.subtitle}`);
            }
            break;
            
        case 'doculisp-toc':
            // Handle table of contents
            console.log(`TOC: ${part.label || 'No label'}`);
            console.log(`  Style: ${part.bulletStyle}`);
            break;
            
        case 'doculisp-content':
            // Handle content placement markers
            console.log('Content placement marker');
            break;
            
        case 'doculisp-path-id':
            // Handle cross-references
            console.log(`Cross-reference: ${part.id}`);
            break;
    }
}
```

<!-- (dl (## Advanced Usage)) -->

<!-- (dl (### Error Handling Patterns)) -->

Robust error handling for Doculisp parsing:

```typescript
function parseWithErrorHandling(astResult: Result<RootAst | IAstEmpty>, variableTable: IVariableTable): void {
    const container = await containerPromise;
    const doculispParser = container.buildAs<IDoculispParser>('astDoculispParse');
    
    try {
        const result = doculispParser.parse(astResult, variableTable);
        
        if (!result.success) {
            console.error(`Doculisp parse error: ${result.message}`);
            if (result.documentPath) {
                console.error(`At: ${result.documentPath.fullName}`);
            }
            return;
        }
        
        // Process successful result
        if (result.value.type === 'doculisp-empty') {
            console.log('Document contains no Doculisp content');
        } else {
            console.log(`Parsed Doculisp document with ${result.value.section.doculisp.length} parts`);
        }
    } catch (error) {
        console.error('Unexpected Doculisp parsing error:', error);
    }
}
```

<!-- (dl (### Variable Table Management)) -->

Working with variable tables for cross-references:

```typescript
function parseWithVariableTracking(): void {
    const container = await containerPromise;
    const doculispParser = container.buildAs<IDoculispParser>('astDoculispParse');
    const variableTable = container.buildAs<IVariableTable>('variableTable');
    
    // Parse document with variable tracking
    const result = doculispParser.parse(astResult, variableTable);
    
    if (result.success && result.value.type === 'doculisp-root') {
        // Check for header IDs that were registered
        result.value.section.doculisp.forEach(part => {
            if (part.type === 'doculisp-header' && part.id) {
                if (variableTable.hasKey(part.id)) {
                    console.log(`Header ID '${part.id}' is available for cross-referencing`);
                }
            }
        });
        
        // Process cross-references
        result.value.section.doculisp.forEach(part => {
            if (part.type === 'doculisp-path-id') {
                if (variableTable.hasKey(part.id)) {
                    console.log(`Found cross-reference to '${part.id}'`);
                } else {
                    console.warn(`Cross-reference to undefined ID '${part.id}'`);
                }
            }
        });
    }
}
```

<!-- (dl (### Structure Analysis)) -->

Analyze document structure and hierarchy:

```typescript
function analyzeDocumentStructure(doculisp: IDoculisp): void {
    const analysis = {
        titles: 0,
        headers: 0,
        includes: 0,
        tocs: 0,
        crossRefs: 0,
        maxHeaderDepth: 0,
        headersByDepth: {} as Record<number, number>
    };
    
    // Analyze Doculisp parts
    doculisp.section.doculisp.forEach(part => {
        switch (part.type) {
            case 'doculisp-title':
                analysis.titles++;
                break;
            case 'doculisp-header':
                analysis.headers++;
                analysis.maxHeaderDepth = Math.max(analysis.maxHeaderDepth, part.depthCount);
                analysis.headersByDepth[part.depthCount] = (analysis.headersByDepth[part.depthCount] || 0) + 1;
                break;
            case 'doculisp-toc':
                analysis.tocs++;
                break;
            case 'doculisp-path-id':
                analysis.crossRefs++;
                break;
        }
    });
    
    // Analyze includes
    analysis.includes = doculisp.section.include.length;
    
    console.log('Document structure analysis:', analysis);
    
    // Validate structure
    if (analysis.titles > 1) {
        console.warn('Multiple titles found - only one title per document is recommended');
    }
    
    if (analysis.includes > 0 && analysis.tocs === 0) {
        console.warn('Document has includes but no table of contents');
    }
}
```

<!-- (dl (## Doculisp Structure Patterns)) -->

<!-- (dl (### Section Meta Processing)) -->

Understanding how section-meta blocks are processed:

```typescript
// Input AST (conceptual)
const sectionMetaAst = {
    type: 'ast-container',
    value: 'section-meta',
    subStructure: [
        { type: 'ast-command', value: 'title', parameter: { value: 'My Section' } },
        { type: 'ast-command', value: 'subtitle', parameter: { value: 'A comprehensive guide' } },
        { type: 'ast-command', value: 'author', parameter: { value: 'John Doe' } },
        { type: 'ast-command', value: 'id', parameter: { value: 'my-document' } },
        {
            type: 'ast-container',
            value: 'include',
            subStructure: [
                { type: 'ast-command', value: 'Section-One', parameter: { value: './section1.md' } },
                { type: 'ast-command', value: 'Section-Two', parameter: { value: './section2.md' } }
            ]
        }
    ]
};

// Resulting Doculisp structures
const resultingStructures = [
    {
        type: 'doculisp-title',
        title: 'My Section',
        subtitle: 'A comprehensive guide',
        label: '# My Section',
        ref_link: '#my-section',
        id: 'my-section'
    },
    {
        type: 'doculisp-load',
        sectionLabel: 'Section One',
        path: './section1.md'
    },
    {
        type: 'doculisp-load',
        sectionLabel: 'Section Two', 
        path: './section2.md'
    }
];
```

<!-- (dl (### Dynamic Header Processing)) -->

How dynamic headers are transformed:

```typescript
// Input AST
const headerAst = {
    type: 'ast-command',
    value: '##',
    parameter: { value: 'Installation Guide' }
};

// Resulting Doculisp structure
const headerStructure = {
    type: 'doculisp-header',
    depthCount: 3, // documentDepth (1) + header level (2) = 3
    text: 'Installation Guide',
    id: undefined // No ID specified
};

// With ID specified
const headerWithIdAst = {
    type: 'ast-command',
    value: '##installation',
    parameter: { value: 'Installation Guide' }
};

const headerWithIdStructure = {
    type: 'doculisp-header',
    depthCount: 3,
    text: 'Installation Guide',
    id: 'installation'
};
```

<!-- (dl (### Table of Contents Processing)) -->

How content and TOC blocks are processed:

```typescript
// Input AST
const contentAst = {
    type: 'ast-container',
    value: 'content',
    subStructure: [
        {
            type: 'ast-container',
            value: 'toc',
            subStructure: [
                { type: 'ast-command', value: 'label', parameter: { value: 'Table of Contents' } },
                { type: 'ast-command', value: 'style', parameter: { value: 'numbered-labeled' } }
            ]
        }
    ]
};

// Resulting Doculisp structures
const contentStructures = [
    {
        type: 'doculisp-content'
    },
    {
        type: 'doculisp-toc',
        label: 'Table of Contents',
        bulletStyle: 'numbered-labeled'
    }
];
```

<!-- (dl (## Integration Patterns)) -->

<!-- (dl (### Pipeline Integration)) -->

**AstDoculispParser** serves as the **fourth stage** in the parsing pipeline, consuming AstParser output to generate Doculisp structures for further processing:

```typescript
async function parseToDoculispPipeline(text: string, projectLocation: IProjectLocation): Promise<IDoculisp | IEmptyDoculisp | null> {
    const container = await containerPromise;
    
    // Stage 1: Parse document structure (DocumentParse)
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const documentMap = documentParser(text, projectLocation);
    
    if (!documentMap.success) {
        console.error('Document parsing failed:', documentMap.message);
        return null;
    }
    
    // Stage 2: Tokenize the content (Tokenizer)
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');
    const tokenResult = tokenizer(documentMap);
    
    if (!tokenResult.success) {
        console.error('Tokenization failed:', tokenResult.message);
        return null;
    }
    
    // Stage 3: Parse tokens into AST (AstParser)
    const astParser = container.buildAs<IAstParser>('astParser');
    const astResult = astParser.parse(tokenResult);
    
    if (!astResult.success) {
        console.error('AST parsing failed:', astResult.message);
        return null;
    }
    
    // Stage 4: Parse AST into Doculisp structures (AstDoculispParser)
    const doculispParser = container.buildAs<IDoculispParser>('astDoculispParse');
    const variableTable = container.buildAs<IVariableTable>('variableTable');
    const doculispResult = doculispParser.parse(astResult, variableTable);
    
    if (!doculispResult.success) {
        console.error('Doculisp parsing failed:', doculispResult.message);
        return null;
    }
    
    // Note: Additional pipeline stages exist beyond Doculisp structure generation
    return doculispResult.value;
}
```

<!-- (dl (### Type Guards)) -->

Implement type guards for safe Doculisp structure processing:

```typescript
function isDoculispRoot(result: IDoculisp | IEmptyDoculisp): result is IDoculisp {
    return result.type === 'doculisp-root';
}

function isDoculispTitle(part: DoculispPart): part is ITitle {
    return part.type === 'doculisp-title';
}

function isDoculispHeader(part: DoculispPart): part is IHeader {
    return part.type === 'doculisp-header';
}

function isDoculispToc(part: DoculispPart): part is ITableOfContents {
    return part.type === 'doculisp-toc';
}

// Usage
const doculispResult = doculispParser.parse(astResult, variableTable);
if (doculispResult.success && isDoculispRoot(doculispResult.value)) {
    doculispResult.value.section.doculisp.forEach(part => {
        if (isDoculispTitle(part)) {
            console.log(`Title: ${part.title} (ID: ${part.id || 'none'})`);
        } else if (isDoculispHeader(part)) {
            console.log(`Header (${part.depthCount}): ${part.text}`);
        } else if (isDoculispToc(part)) {
            console.log(`TOC: ${part.label} (${part.bulletStyle})`);
        }
    });
}
```

<!-- (dl (## Common Patterns)) -->

<!-- (dl (### Empty Document Handling)) -->

Handle empty documents gracefully:

```typescript
function processDoculispResult(doculispResult: Result<IDoculisp | IEmptyDoculisp>): void {
    if (!doculispResult.success) {
        throw new Error(`Doculisp parsing failed: ${doculispResult.message}`);
    }
    
    if (doculispResult.value.type === 'doculisp-empty') {
        console.log('Document is empty - no Doculisp content to process');
        return;
    }
    
    // Process the Doculisp structures
    const doculisp = doculispResult.value;
    console.log(`Processing document with ${doculisp.section.doculisp.length} parts`);
    doculisp.section.doculisp.forEach(processDoculispPart);
}
```

<!-- (dl (### Structure Extraction)) -->

Extract specific structures from the Doculisp result:

```typescript
function extractStructures(doculisp: IDoculisp) {
    const structures = {
        titles: doculisp.section.doculisp.filter(isDoculispTitle),
        headers: doculisp.section.doculisp.filter(isDoculispHeader),
        tocs: doculisp.section.doculisp.filter(isDoculispToc),
        includes: doculisp.section.include
    };
    
    return structures;
}

// Usage
const doculispResult = doculispParser.parse(astResult, variableTable);
if (doculispResult.success && doculispResult.value.type === 'doculisp-root') {
    const structures = extractStructures(doculispResult.value);
    
    console.log(`Found ${structures.titles.length} titles`);
    console.log(`Found ${structures.headers.length} headers`);
    console.log(`Found ${structures.tocs.length} TOCs`);
    console.log(`Found ${structures.includes.length} includes`);
}
```

<!-- (dl (### Cross-Reference Resolution)) -->

Work with cross-references and variable tables:

```typescript
function resolveCrossReferences(doculisp: IDoculisp, variableTable: IVariableTable): void {
    const crossRefs = doculisp.section.doculisp.filter(part => part.type === 'doculisp-path-id') as IPathId[];
    
    crossRefs.forEach(ref => {
        if (variableTable.hasKey(ref.id)) {
            const variable = variableTable.getValue(ref.id);
            console.log(`Cross-reference '${ref.id}' resolves to:`, variable);
        } else {
            console.warn(`Unresolved cross-reference: '${ref.id}'`);
        }
    });
}
```

<!-- (dl (## Performance Considerations)) -->

- **Non-singleton**: Each parse operation gets a fresh parser instance
- **Variable table management**: Ensure proper variable table initialization and cleanup
- **Memory efficiency**: Doculisp structures maintain minimal required data
- **Location tracking**: All structures include precise location information for debugging
- **Error propagation**: Parse errors include detailed semantic context

<!-- (dl (## Dependencies)) -->

AstDoculispParser requires these container dependencies:

- **internals**: Internal parsing utilities and array parsers
- **util**: Core utilities for Result types and location handling
- **trimArray**: Array manipulation utilities for AST consumption
- **pathConstructor**: Path construction utilities for include processing
- **textHelpers**: Text manipulation utilities for link generation

<!-- (dl (## Related Components)) -->

- **AstParser**: Provides input for AstDoculispParser (RootAst structures)
- **VariableTable**: Manages ID tracking and cross-reference resolution
- **IncludeBuilder**: Often consumes AstDoculispParser output for include processing
- **Controller**: High-level API that orchestrates AstDoculispParser with other components
- **DocumentGenerator**: Uses Doculisp structures for final document generation