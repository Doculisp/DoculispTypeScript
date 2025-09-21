# Advanced Usage

## Custom Module Registration

You can extend the container by registering your own modules:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Define your custom service
interface ICustomProcessor {
    process(input: string): Result<string>;
}

class CustomProcessor implements ICustomProcessor {
    constructor(
        private textHelpers: ITextHelpers,
        private util: IUtil
    ) {}
    
    process(input: string): Result<string> {
        try {
            const processed = this.textHelpers.format(input);
            return this.util.ok(processed);
        } catch (error) {
            return this.util.fail(`Processing failed: ${error.message}`);
        }
    }
}

// Register the custom service (container is async)
const container = await containerPromise;
container.registerBuilder(
    (textHelpers: ITextHelpers, util: IUtil) => new CustomProcessor(textHelpers, util),
    ['textHelpers', 'util'],
    'customProcessor',
    true // singleton
);

// Use the custom service
const processor = container.buildAs<ICustomProcessor>('customProcessor');
```

## Container Lifecycle Management

### Manual Module Loading

For advanced scenarios, you can manually control module loading:

```typescript
// Note: Creating custom containers requires direct access to internal classes
// This is an advanced use case - most users should use the default container
const { Container } = require('doculisp/dist/container');

// Create a new container instance
const customContainer = new Container();

// Register specific modules only
customContainer.registerValue(console, 'logger');
customContainer.registerBuilder(
    (logger: Console) => ({
        log: (msg: string) => logger.log(`[CUSTOM] ${msg}`)
    }),
    ['logger'],
    'customLogger'
);

const logger = customContainer.buildAs<{ log: (msg: string) => void }>('customLogger');
logger.log('Hello from custom container!');
```

## Performance Considerations

### Singleton Strategy

Most objects should be singletons for performance:

```typescript
// Good: Singleton registration (container is async)
const container = await containerPromise;
container.registerBuilder(
    (dep1: IDep1) => new ExpensiveService(dep1),
    ['dependency1'],
    'expensiveService',
    true // singleton = true
);

// Avoid: Non-singleton for expensive objects
container.registerBuilder(
    (dep1: IDep1) => new ExpensiveService(dep1),
    ['dependency1'],
    'expensiveService',
    false // Creates new instance every time
);
```

### Lazy Loading

The container supports lazy loading - objects are only created when first requested:

```typescript
// This registration doesn't create the object yet (container is async)
const container = await containerPromise;
container.registerBuilder(
    () => new HeavyObject(),
    [],
    'heavyObject',
    true
);

// Object is created here on first build()
const heavy = container.buildAs<HeavyObject>('heavyObject');

// Subsequent calls return the same instance
const same = container.buildAs<HeavyObject>('heavyObject');
console.log(heavy === same); // true
```

## Error Recovery and Fallbacks

### Graceful Degradation

```typescript
interface IOptionalService {
    isAvailable(): boolean;
    doWork(): Result<string>;
}

class OptionalServiceImpl implements IOptionalService {
    private available: boolean;
    
    constructor(dependency?: IDependency) {
        this.available = !!dependency;
    }
    
    isAvailable(): boolean {
        return this.available;
    }
    
    doWork(): Result<string> {
        if (!this.available) {
            return { success: false, message: 'Service not available' };
        }
        // Do actual work
        return { success: true, value: 'Work completed' };
    }
}

// Register with optional dependency (container is async)
const container = await containerPromise;
container.registerBuilder(
    (optionalDep?: IDependency) => new OptionalServiceImpl(optionalDep),
    [], // No required dependencies
    'optionalService'
);
```

## Container Inspection

### Debugging and Monitoring

```typescript
// Get list of all registered modules (container is async)
const container = await containerPromise;
const modules = container.getModuleList();
console.log('Registered modules:', modules);

// Check container state
console.log('Container ID:', container.id);
console.log('Is testable:', container.isTestable);

// Custom monitoring wrapper
async function withLogging<T>(moduleName: string): Promise<T> {
    console.log(`Building module: ${moduleName}`);
    const start = Date.now();
    
    const container = await containerPromise;
    const result = container.buildAs<T>(moduleName);
    
    const duration = Date.now() - start;
    console.log(`Built ${moduleName} in ${duration}ms`);
    
    return result;
}

// Usage (async because container is Promise-based)
const tokenizer = await withLogging<ITokenizer>('tokenizer');
```

## Package Integration

### External Package Registration

For integrating external packages:

```typescript
// Register Node.js built-in modules (container is async)
const container = await containerPromise;
container.registerValue(require('fs'), 'fs');
container.registerValue(require('path'), 'path');

// Register npm packages
container.registerValue(require('lodash'), 'lodash');

// Create wrapper services
container.registerBuilder(
    (fs: any, path: any) => ({
        readFileSync: (filePath: string) => fs.readFileSync(filePath, 'utf8'),
        joinPath: (...segments: string[]) => path.join(...segments)
    }),
    ['fs', 'path'],
    'nodeUtils'
);
```

## Memory Management

### Container Cleanup

For long-running applications:

```typescript
// In test environments, clean up containers
afterEach(() => {
    if (testContainer.supportsReplace()) {
        testContainer.restoreAll();
    }
});

// For memory-sensitive applications, you might need custom cleanup
class ManagedService {
    dispose() {
        // Clean up resources
    }
}

// Implement cleanup patterns
const managedServices: ManagedService[] = [];

// Container needs to be async
containerPromise.then(container => {
    container.registerBuilder(
        () => {
            const service = new ManagedService();
            managedServices.push(service);
            return service;
        },
        [],
        'managedService'
    );
});

// Application shutdown
process.on('exit', () => {
    managedServices.forEach(service => service.dispose());
});
```

## Advanced Testing Scenarios

### Partial Mock Replacement

```typescript
// Replace only specific methods of a service (container is async)
const container = await containerPromise;
const realFileHandler = container.buildAs<IFileWriter>('fileHandler');

const partialMock = {
    ...realFileHandler,
    read: jest.fn().mockReturnValue({ success: true, value: 'mocked content' })
};

testContainer.replaceValue(partialMock, 'fileHandler');
```

### State Verification

```typescript
// Create stateful service for testing
class StatefulService {
    private state: string[] = [];
    
    addState(value: string) {
        this.state.push(value);
    }
    
    getState(): string[] {
        return [...this.state];
    }
}

testContainer.registerValue(new StatefulService(), 'statefulService');

// Test state changes
const service = testContainer.buildAs<StatefulService>('statefulService');
service.addState('test');

expect(service.getState()).toContain('test');
```