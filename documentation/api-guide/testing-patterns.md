# Testing Patterns

## Creating Testable Containers

The container system provides excellent support for testing through dependency replacement:

```typescript
import { container } from './container';

describe('My Service Tests', () => {
    let testContainer: ITestableContainer;
    
    beforeEach(() => {
        // Create a testable container
        testContainer = container.buildTestable();
    });
    
    afterEach(() => {
        // Clean up replacements
        testContainer.restoreAll();
    });

    it('should handle file operations', () => {
        // Mock the file handler
        const mockFileHandler = {
            read: jest.fn().mockReturnValue({ success: true, value: 'test content' }),
            write: jest.fn().mockReturnValue({ success: true, value: true }),
            exists: jest.fn().mockReturnValue({ success: true, value: true })
        };
        
        // Replace the file handler in the container
        testContainer.replaceValue(mockFileHandler, 'fileHandler');
        
        // Build your service that depends on fileHandler
        const myService = testContainer.buildAs<IMyService>('myService');
        
        // Test the service
        const result = myService.doSomething();
        
        expect(mockFileHandler.read).toHaveBeenCalled();
        expect(result.success).toBe(true);
    });
});
```

## Mocking Dependencies

### Simple Value Replacement

```typescript
// Replace with a simple mock object
const mockUtil = {
    ok: (value: any) => ({ success: true, value }),
    fail: (message: string) => ({ success: false, message })
};

testContainer.replaceValue(mockUtil, 'util');
```

### Builder Function Replacement

```typescript
// Replace with a builder function
testContainer.replaceBuilder(
    (dependency: IDependency) => new MockService(dependency),
    ['mockDependency'],
    'originalService'
);
```

## Testing Parser Pipeline

Testing the complete parsing pipeline:

```typescript
describe('Parser Pipeline', () => {
    let testContainer: ITestableContainer;
    
    beforeEach(() => {
        testContainer = container.buildTestable();
        
        // Mock file operations for consistent testing
        const mockFileHandler = {
            read: jest.fn(),
            write: jest.fn(),
            exists: jest.fn()
        };
        
        testContainer.replaceValue(mockFileHandler, 'fileHandler');
    });

    it('should parse doculisp correctly', () => {
        const tokenizer = testContainer.buildAs<ITokenizer>('tokenizer');
        const astParser = testContainer.buildAs<IAstParser>('astParser');
        const doculispParser = testContainer.buildAs<IAstDoculispParser>('astDoculispParse');
        const pathConstructor = testContainer.buildAs<IPathConstructor>('pathConstructor');
        
        const input = '(#intro Introduction)\n\nContent here.';
        const path = pathConstructor.buildPath('./test.dlisp');
        
        // Test each stage
        const tokens = tokenizer.tokenize(input, path);
        expect(tokens.success).toBe(true);
        
        const ast = astParser.parse(tokens.value, path);
        expect(ast.success).toBe(true);
        
        const doculisp = doculispParser.parse(ast.value, path);
        expect(doculisp.success).toBe(true);
        expect(doculisp.value).toHaveLength(2); // Header + content
    });
});
```

## Variable Table Testing

Testing variable management (limited to system variables and IDs):

```typescript
describe('Variable Table', () => {
    let testContainer: ITestableContainer;
    let variableTable: IVariableTable;
    
    beforeEach(() => {
        testContainer = container.buildTestable();
        variableTable = testContainer.buildAs<IVariableTable>('variableTable');
    });

    it('should provide access to system variables', () => {
        // Note: Variable table primarily used for system variables like 'source', 'destination'
        // and ID tracking. Custom string variables are not supported.
        
        // Test checking for system variables
        const hasSource = variableTable.hasKey('source');
        const hasDestination = variableTable.hasKey('destination');
        
        // System variables may or may not be present depending on compilation context
        expect(typeof hasSource).toBe('boolean');
        expect(typeof hasDestination).toBe('boolean');
    });
    
    it('should handle ID variable queries', () => {
        // The variable table is primarily used for ID tracking during compilation
        const hasTestId = variableTable.hasKey('some-header-id');
        expect(typeof hasTestId).toBe('boolean');
    });
});
```

## Error Scenario Testing

Testing error conditions and edge cases:

```typescript
describe('Error Handling', () => {
    let testContainer: ITestableContainer;
    
    beforeEach(() => {
        testContainer = container.buildTestable();
    });

    it('should handle missing files gracefully', () => {
        // Mock file handler to simulate missing file
        const mockFileHandler = {
            exists: jest.fn().mockReturnValue({ success: true, value: false }),
            read: jest.fn().mockReturnValue({ 
                success: false, 
                message: 'File not found' 
            })
        };
        
        testContainer.replaceValue(mockFileHandler, 'fileHandler');
        
        const controller = testContainer.buildAs<IController>('controller');
        const pathConstructor = testContainer.buildAs<IPathConstructor>('pathConstructor');
        
        const sourcePath = pathConstructor.buildPath('./nonexistent.dlisp');
        const result = controller.compile(sourcePath);
        
        expect(result.success).toBe(false);
        expect(result.message).toContain('File not found');
    });
    
    it('should handle circular dependencies', () => {
        // This test would involve creating modules with circular deps
        // and verifying the container throws appropriate errors
        expect(() => {
            testContainer.registerBuilder(
                (dep: any) => dep,
                ['circularDep'],
                'circularDep'
            );
            testContainer.build('circularDep');
        }).toThrow(/Circular dependencies/);
    });
});
```

## Integration Testing

Testing complete workflows:

```typescript
describe('Integration Tests', () => {
    it('should compile a complete document', () => {
        // Use the real container for integration tests
        const controller = container.buildAs<IController>('controller');
        const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');
        
        // Test with a known good file
        const sourcePath = pathConstructor.buildPath('./test-fixtures/sample.dlisp');
        const outputPath = pathConstructor.buildPath('./test-output/result.md');
        
        const result = controller.compile(sourcePath, outputPath);
        
        expect(result.success).toBe(true);
        
        // Verify output file was created and has expected content
        const fileHandler = container.buildAs<IFileWriter>('fileHandler');
        const outputExists = fileHandler.exists(outputPath);
        expect(outputExists.success).toBe(true);
        expect(outputExists.value).toBe(true);
    });
});
```