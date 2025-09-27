# Copilot Instructions for DoculispTypeScript

## Project Overview
DoculispTypeScript is a scripting language for building markdown documents. Follow Test-Driven Development (TDD) with Chicago-style testing patterns that emphasize integration testing and real object interactions over extensive mocking.

## Testing Philosophy & Patterns

### Chicago-Style TDD Approach
- **Integration Over Isolation**: Prefer testing real object interactions rather than heavily mocked units
- **Outside-In Development**: Start with acceptance tests and work inward
- **Minimal Mocking**: Only mock external dependencies and infrastructure concerns
- **Real Collaborations**: Test objects working together as they would in production

### Test Structure Standards

#### 1. Test File Organization
```typescript
// Follow this naming pattern: [module].test.ts
// Example: controller.test.ts, container.test.ts

describe('the [module name]', () => {
    let testable: ITestableContainer = null as any;
    let sut: IModuleUnderTest = null as any; // System Under Test
    
    beforeEach(() => {
        testable = environment.buildTestable();
        sut = testable.buildAs<IModuleUnderTest>('moduleName');
    });
    
    // Group related tests
    describe('when [scenario]', () => {
        it('should [expected behavior]', () => {
            // Arrange, Act, Assert
        });
    });
});
```

#### 2. Dependency Injection Testing Pattern
```typescript
// Use the testable container for dependency management
beforeEach(async () => {
    environment = await containerPromise as ITestableContainer;
    testable = environment.buildTestable();
    
    // Replace only external dependencies, not internal collaborators
    const mockFileWriter: IFileWriter = {
        write: function (path: IPath, text: ResultGeneral<string>): ResultGeneral<string> {
            // Configure behavior for test
            return util.ok(path.fullName);
        }
    };
    testable.replaceValue(mockFileWriter, 'fileHandler');
    
    sut = testable.buildAs<IController>('controller');
});
```

#### 3. Approval Testing Pattern
```typescript
// Use approval testing for complex outputs
import { getVerifier } from "../tools";
import { configure } from "approvals/lib/config";

describe('complex behavior', () => {
    let verifyAsJson: (data: any, options?: Options) => void;
    
    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });
    
    it('should produce expected output', () => {
        const result = sut.complexMethod(input);
        verifyAsJson(result);
    });
});
```

## Testing Patterns by Layer

### 1. Integration Tests (Preferred)
Focus on testing complete workflows through the system:

```typescript
it('should process document from source to output', () => {
    // Arrange - minimal setup, real objects
    const sourcePath = buildPath('./input.dlisp');
    const expectedPath = buildPath('./output.md');
    
    // Act - exercise the full pipeline
    const results = sut.compile(sourcePath, expectedPath);
    
    // Assert - verify end-to-end behavior
    expect(results).toBeDefined();
    verifyAsJson(results);
});
```

### 2. Container and Dependency Tests
```typescript
// Test the DI container behavior
it('should build dependencies correctly', () => {
    const result = testable.build('moduleName');
    expect(result).toBeDefined();
});

it('should allow replacement for testing', () => {
    const mockDependency = jest.fn();
    testable.replaceValue(mockDependency, 'dependencyName');
    
    const result = testable.build('moduleUnderTest');
    // Verify mock was used
});
```

### 3. Error Scenario Testing
```typescript
it('should handle parse failures gracefully', () => {
    // Arrange - inject failure condition
    includeConfig.result = util.codeFailure('Parse error', location);
    
    // Act
    const result = sut.process(input);
    
    // Assert - verify error propagation
    expect(result.success).toBe(false);
    verifyAsJson(result);
});
```

## Finding Dependency Names

### How to Find Magic Strings for DI System
The dependency injection system uses string keys to identify modules. To find the correct strings:

1. **Check the container registration** in `src/container.ts`:
```typescript
// Look for .register() calls to find module names
registry.register({
    name: 'controller',      // Use 'controller' in buildAs/replaceValue
    builder: buildController,
    dependencies: ['includeBuilder', 'stringWriter', 'fileHandler']
});
```

2. **Use the container's module list** in tests:
```typescript
// Get all available module names
const moduleNames = testable.getModuleList();
console.log('Available modules:', moduleNames);
```

3. **Common module names** (from existing codebase):
   - `'controller'` - Main controller
   - `'fileHandler'` - File operations
   - `'pathConstructor'` - Path creation
   - `'stringWriter'` - String output writer
   - `'includeBuilder'` - Include processor
   - `'astParser'` - AST parser
   - `'documentParse'` - Document parser
   - `'tokenizer'` - Token processor
   - `'variableTable'` - Variable management
   - `'util'` - Utility functions

4. **Package names** for Node.js modules:
   - `'fs'`, `'path'`, `'crypto'`, etc. (standard Node.js modules)

### Usage Examples
```typescript
// Building modules
const controller = testable.buildAs<IController>('controller');
const util = testable.buildAs<IUtil>('util');

// Replacing dependencies
testable.replaceValue(mockFileWriter, 'fileHandler');
testable.replaceValue(pathConstructor, 'pathConstructor');
```

## Test Helper Usage

### Using TestHelpers
```typescript
import { testable, buildPath, buildProjectLocation } from "../testHelpers";

// Use builders for complex object creation
const documentParser = testable.document.resultBuilder(container, setup);
const astParser = testable.ast.resultBuilder(container, setup);
const stringWriter = testable.stringWriter.resultBuilder(container, setup);
```

### Builder Pattern for Test Data
```typescript
// Create consistent test data
function buildTestDocument(text: string, location?: IProjectLocation): Document {
    const projectLocation = location ?? buildProjectLocation('./test.dlisp', 1, 1);
    return documentParser(text, projectLocation);
}
```

## Code Quality Standards

### 1. Test Naming
- **Describe blocks**: Use "the [module]", "when [scenario]", "has a [method] that"
- **It blocks**: Use "should [expected behavior]" format
- **Be specific**: Include context about the scenario being tested

### 2. Assertion Patterns
```typescript
// Use specific expectations
expect(result.success).toBe(true);
expect(result.value).toEqual(expectedValue);

// For complex objects, use approval testing
verifyAsJson(complexResult);

// For error cases, verify the error structure
expect(result.success).toBe(false);
expect(result.error).toContain('expected error message');
```

### 3. Setup and Teardown
```typescript
beforeEach(() => {
    // Reset testable container for each test
    testable = environment.buildTestable();
    testable.restoreAll(); // Clean slate for each test
});
```

## Mocking Guidelines

### What TO Mock
- **External file system operations** (use mock IFileWriter)
- **Network calls** (if any)
- **System dependencies** (process, environment)
- **Complex external libraries**
- **Path Constructor** (ALWAYS replace to avoid machine-specific paths in test outputs)

### What NOT to Mock
- **Internal domain objects** (AST nodes, parsers, builders)
- **Value objects** (paths, results, configurations - except Path Constructor)
- **Business logic collaborators**
- **The dependency injection container itself**

### Mock Configuration Pattern
```typescript
// Configure mocks with realistic behavior
const mockFileWriter: IFileWriter = {
    write: jest.fn().mockImplementation((path: IPath, text: ResultGeneral<string>) => {
        fileConfig.outputPath = path;
        fileConfig.fileText = text;
        return fileConfig.result ?? util.ok(path.fullName);
    })
};

// ALWAYS replace PathConstructor to avoid machine-specific paths
const pathConstructor: PathConstructor = function(pathString: string): IPath {
    const t: IPath = {
        extension: path.extname(pathString),
        getContainingDir: function (): IPath {
            return pathConstructor("./");
        },
        getRelativeFrom: function (rootPath: IPath): string {
            return "./"
        },
        type: "path",
        toJSON: function () {
            return pathString;
        },
        fullName: pathString,
    };
    return t;
};
testable.replaceValue(pathConstructor, 'pathConstructor');
```

## TDD Workflow

### Red-Green-Refactor Cycle
1. **Red**: Write a failing test that describes the desired behavior
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code quality while keeping tests green

### Test-First Development
```typescript
// 1. Start with the test
it('should parse include statements', () => {
    const input = '<<include "other.md">>';
    const result = parser.parse(input, location);
    
    expect(result.success).toBe(true);
    expect(result.value.type).toBe('include');
    expect(result.value.path).toBe('other.md');
});

// 2. Implement minimal functionality
// 3. Refactor when test passes
```

## File Organization

### Test Structure
```
tests/
├── [module].test.ts           # Primary module tests
├── testHelpers.ts             # Shared test utilities
├── tools.ts                   # Approval testing setup
├── others/                    # Supporting module tests
├── parsers/                   # Parser-specific tests
│   └── [parser]/              # Grouped by parser type
└── Sample/                    # Test fixtures and data
```

### Test File Template
```typescript
import { containerPromise } from "../src/moduleLoader";
import { ITestableContainer } from "../src/types/types.containers";
import { getVerifier } from "../tools";
import { configure } from "approvals/lib/config";

describe('the [module name]', () => {
    let environment: ITestableContainer = null as any;
    let testable: ITestableContainer = null as any;
    let verifyAsJson: (data: any, options?: Options) => void;
    let sut: IModuleInterface = null as any;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    beforeEach(async () => {
        environment = await containerPromise as ITestableContainer;
        testable = environment.buildTestable();
        sut = testable.buildAs<IModuleInterface>('moduleName');
    });

    describe('when [scenario]', () => {
        it('should [expected behavior]', () => {
            // Arrange
            
            // Act
            
            // Assert
            verifyAsJson(result);
        });
    });
});
```

## Key Principles

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how
2. **Realistic Test Scenarios**: Use real data and realistic workflows
3. **Clear Test Intent**: Each test should have a single, clear purpose
4. **Maintainable Tests**: Tests should be easy to understand and modify
5. **Fast Feedback**: Tests should run quickly to support TDD workflow
6. **Comprehensive Coverage**: Cover both happy path and error scenarios

## Integration with Existing Patterns

When adding new functionality:
1. **Follow existing container patterns** for dependency injection
2. **Use approval testing** for complex output verification  
3. **Leverage testHelpers** for consistent test object creation
4. **Maintain the builder pattern** for test configuration
5. **Keep error handling patterns** consistent across modules

Remember: The goal is working software that meets requirements, with tests serving as both specification and safety net for refactoring.