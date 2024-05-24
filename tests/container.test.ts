import { registry } from "../src/container";
import { IRegisterable, ITestableContainer } from "../src/types.containers";
import * as fs from 'fs';

function getRandomNumber(max?: number, min?: number) {
    return Math.floor(Math.random() * (max ?? 100) + (min ?? 1));
}

describe('the registry', () => {
    let testable: ITestableContainer = null as any;
    const environment: ITestableContainer = registry as ITestableContainer;

    beforeEach(() =>{
        testable = environment.buildTestable();
    });

    test('should create a testable version for tests', () => {
        expect(testable).not.toBe(environment);
    });

    test('should throw an exception when building something that has not been registered', () => {
        expect(() => testable.build('bad module')).toThrow('No module called "bad module" registered');
    });

    test('should restoreAll replaced modules', () => {
        let fnOne = jest.fn()
        let fnTwo = jest.fn()
        let fnThree = jest.fn();

        let fnFakeOne = jest.fn();
        let fnFakeTwo = jest.fn();
        let fnFakeThree = jest.fn();

        testable.
            registerBuilder(() => { fnOne(); }, [], 'one').
            registerBuilder(() => { fnTwo(); }, ['one'], 'two').
            registerBuilder(() => { fnThree(); }, ['two'], 'three');

        testable.
            replaceBuilder(() => { fnFakeOne(); }, [], 'one').
            replaceBuilder(() => { fnFakeTwo(); }, ['one'], 'two').
            replaceBuilder(() => { fnFakeThree(); }, ['two'], 'three');

        testable.restoreAll();

        testable.build('three');

        expect(fnFakeOne).not.toHaveBeenCalled();
        expect(fnFakeTwo).not.toHaveBeenCalled();
        expect(fnFakeThree).not.toHaveBeenCalled();

        expect(fnOne).toHaveBeenCalled();
        expect(fnTwo).toHaveBeenCalled();
        expect(fnThree).toHaveBeenCalled();
    });

    test('should return a list of all registered modules.', () => {
        const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y', 'z', ' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
        let holding = [];
        const numberOfNames = getRandomNumber(12);
        function randomName() {
            const cnt = getRandomNumber(10);
            let name = "";
            for (let index = 0; index < cnt; index++) {
                const letter = getRandomNumber(letters.length - 1, 0);
                name+=letters[letter];
            }
            return name;
        }

        for (let index = 0; index < numberOfNames; index++) {
            holding.push(randomName());
        }

        let names: string[] = [];

        holding.forEach(name => {
            if(!names.includes(name)) {
                names.push(name);
            }
        });

        names.forEach(name => {
            testable.registerBuilder(() => {return {};}, [], name);
        });

        let modules = testable.getModuleList();

        names.forEach(name => {
            expect(modules).toContain(name);
        });
    });

    test('should be able to build a default node package', () => {
        let fst = testable.build('fs');

        expect(fst.constants.X_OK).toBe(fs.constants.X_OK);
    });

    describe('has a register method that', () => {
        test('should register an item and call its function when built', () => {
            let fn = jest.fn();
            const expected = { value: 'hello' };
            let registerable: IRegisterable = {
                builder: function testRegister(...args: any[]) { fn(...args); return expected; },
                name: 'testRegister',
            };
    
            testable.register(registerable);
            let result = testable.build('testRegister');
    
            expect(fn).toHaveBeenCalledWith();
            expect(result).toBe(expected);
        });
    
        test('should build dependencies of registered item', () => {
            let fnBlue = jest.fn();
            let fnOrange = jest.fn();
    
            const blueValue = {
                value: 'blue',
                sTax: 55,
            }
    
            const orangeValue = {
                name: 'orange thing',
                printIt: function (v: string) {
                    console.log(v);
                },
            }
    
            let blue: IRegisterable = {
                builder: function blue(...args: any[]) { fnBlue(...args); return blueValue; },
                name: 'blue',
            };
    
            let orange: IRegisterable = {
                builder: function orange(...args:any[]) { fnOrange(...args); return orangeValue; },
                name: 'orange',
                dependencies: [ 'blue' ],
            };
    
            testable.
                register(blue).
                register(orange);
    
            let orangeResult = testable.build('orange');
    
            expect(fnBlue).toHaveBeenCalledWith();
            expect(fnOrange).toHaveBeenCalledWith(blueValue);
    
            expect(orangeResult).toBe(orangeValue);
        });
    
        test('should detect recursive dependencies', () => {
            let blue: IRegisterable = {
                builder: function blue() {},
                name: 'blue',
                dependencies: ['orange']
            };

            let orange: IRegisterable = {
                builder: function orange() {},
                name: 'orange',
                dependencies: ['blue']
            };
    
            testable.
                register(blue).
                register(orange);
    
            expect(() => { testable.build('orange'); }).toThrow('Circular dependencies between ("orange" => "blue" => ["orange"])');
        });
    
        test('should show a chain when circular dependency is not obvious.', () => {
            let blue: IRegisterable = {
                builder: function blue() {},
                name: 'blue',
                dependencies: ['green'],
            };

            let orange: IRegisterable = {
                builder: function orange() {},
                name: 'orange',
                dependencies: ['blue'],
            };

            let green: IRegisterable = {
                builder: function green() {},
                name: 'green',
                dependencies: ['orange', 'blue']
            };

            let purple: IRegisterable = {
                builder: function purple() {},
                name: 'purple',
            };
    
            testable.
                register(blue).
                register(orange).
                register(green).
                register(purple);
    
            expect(() => { testable.build('orange'); }).toThrow('Circular dependencies between ("orange" => "blue" => "green" => ["orange", "blue"])');
        });

        test('should call builder function each time the item is built.', () => {
            let fn = jest.fn();
            let registerable: IRegisterable = {
                builder: function cat() { fn(); return {}; },
                name: 'cat',
            };
    
            testable.register(registerable);
    
            let iterationCnt = getRandomNumber();
            for (let index = 0; index < iterationCnt; index++) {
                testable.build('cat');
            }
    
            expect(fn).toHaveBeenCalledTimes(iterationCnt);
        });
    
        test('should not call the builder function more then once if the registerable claims to be a singleton.', () => {
            let fn = jest.fn();
            let registerable: IRegisterable = {
                builder: function cat() { fn(); return {}; },
                name: 'cat',
                singleton: true,
            };
    
            testable.register(registerable);
    
            let iterationCnt =  getRandomNumber();
            for (let index = 0; index < iterationCnt; index++) {
                testable.build('cat');
            }
    
            expect(fn).toHaveBeenCalledTimes(1);
        });
    });

    describe('has a registerValue method that', () => {
        test('should not allow registering two modules with the same name', () => {
            let blue: IRegisterable = {
                builder: function blue() {},
                name: 'blue',
            };

            let orange: IRegisterable = {
                builder: function blue() { return 5; },
                name: 'blue',
            };
    
            testable.register(blue);
            expect(() => { testable.register(orange); }).toThrow('Module named "blue" already registered.');
        });
    
        test('should allow for the registration of a value with a name property', () => {
            const expected = {
                name: 'expectedThing',
                getValue: () => 44,
            }
    
            testable.registerValue(expected);
    
            let result = testable.build('expectedThing');
    
            expect(result).toBe(expected);
        });
    
        test('should not allow for registration of value without name prop or provided name', () => {
            const value = { word: 'hello' };
    
            expect(() => { testable.registerValue(value); }).toThrow('Most provide a name as a property or a parameter when registering a value as a module.');
        });
    
        test('should allow value to be registered when given a name parameter.', () => {
            const expected = 44;
    
            testable.registerValue(expected, 'fortyFour');
    
            let result = testable.buildAs<number>('fortyFour');
    
            expect(result).toBe(expected);
        });

        test('when given a name parameter and an object with a name it should take the parameter.', () => {
            const expected = {
                name: 'expectedThing',
                getValue: () => 44,
            }
    
            testable.registerValue(expected, 'dog');
    
            let result = testable.build('dog');
    
            expect(result).toBe(expected);
            expect(() => {testable.build('expectedThing'); }).toThrow('No module called "expectedThing" registered');
        });
    });

    describe('has a registerBuilder method that', () =>{
        test('should call the builder when build is called.', () => {
            let fn = jest.fn();
            function neon(...args: any[]){ fn(...args);  return 'blue'; }

            testable.registerBuilder(neon, []);

            let result = testable.build('neon');

            expect(fn).toHaveBeenCalledWith();
            expect(result).toBe('blue');
        });

        test('should fail registration if function does not have name and no name is provided.', () => {
            expect(() => { testable.registerBuilder(() => 'black', []); }).toThrow('Must provide a name on the function or as a parameter to register a builder.');
        });

        test('should register the builder by the name parameter if provided.', () => {
            let fn = jest.fn();
            function neon(...args: any[]){ fn(...args);  return 65; }

            testable.registerBuilder(neon, [], 'dog');

            let result = testable.build('dog');

            expect(fn).toHaveBeenCalledWith();
            expect(result).toBe(65);
            expect(() => { testable.build('neon'); }).toThrow('No module called "neon" registered');
        });

        test('should build the dependencies when built', () => {
            let redValue = {
                red: true
            }
            let redFn = jest.fn();
            function red(...args: any[]) { redFn(...args); return redValue; }

            let blueValue = { color: 0x0000FF };
            let blueFn = jest.fn();
            function blue(...args: any[]) { blueFn(...args); return blueValue; }

            let greenValue = { right: 'left', up: 'down' };
            let greenFn = jest.fn();
            function green(...args: any[]) { greenFn(...args); return greenValue; }

            const hueValue = { place: [51.470020, -0.454295] };
            let hueFn = jest.fn();
            let hue: IRegisterable = {
                builder: function hue(...args: any[]) { hueFn(...args); return hueValue; },
                name: 'hue',
            };

            testable.
                registerBuilder(red, []).
                register(hue).
                registerBuilder(blue, ['red', 'hue']).
                registerBuilder(green, ['blue']);

            let result = testable.build('green');

            expect(redFn).toHaveBeenCalledWith();
            expect(hueFn).toHaveBeenCalledWith();
            expect(blueFn).toHaveBeenCalledWith(redValue, hueValue);
            expect(greenFn).toHaveBeenCalledWith(blueValue);

            expect(result).toBe(greenValue);
        });

        test('should call the builder function once if it is a singleton.', () => {
            let fn = jest.fn();
            function borg() { fn(); return {}; }

            testable.registerBuilder(borg, [], undefined, true);

            const cnt = getRandomNumber();
            for (let index = 0; index < cnt; index++) {
                testable.build('borg');
            }

            expect(fn).toHaveBeenCalledTimes(1);
        });

        test('should call the builder multiple times if not a singleton.', () => {
            let fn = jest.fn();
            function borg() { fn(); return {}; }

            testable.registerBuilder(borg, []);

            const cnt = getRandomNumber();
            for (let index = 0; index < cnt; index++) {
                testable.build('borg');
            }

            expect(fn).toHaveBeenCalledTimes(cnt);
        });
    });

    describe('when handling replacement', () => {
        test('should not support replacement if not a testable.', () => {
            expect(environment.supportsReplace()).toBe(false);
        });
    
        test('should support replacement if it is a testable', () => {
            expect(testable.supportsReplace()).toBe(true);
        });

        test.skip('should not allow you to replace a module if it is not testable.', () => {
            // TODO: need a real module to test this.
        });

        test('should allow you to replace a module if it is testable', () => {
            let fn = jest.fn();
            let registerable: IRegisterable = {
                builder: function getNumberTest() { fn(); return 'no number' },
                name: 'getNumberTest',
            };

            testable.registerValue(45, 'getNumberTest');

            testable.replace(registerable);
            let result = testable.build('getNumberTest');

            expect(fn).toHaveBeenCalled();
            expect(result).toBe('no number');
        });

        test('should not let you replace a module that has not been registered', () => {
            let registerable: IRegisterable = {
                builder: function getNumberTest() { },
                name: 'getNumberTest',
            };

            expect(() => { testable.replace(registerable); }).toThrow('Cannot replace module "getNumberTest" as it has not been registered.');
        });

        test('should not let you replace a module that has been replaced', () => {
            let registerable: IRegisterable = {
                builder: function replaced() { },
                name: 'replaced',
            };

            let aRegisterable: IRegisterable = {
                builder: function replaced() { },
                name: 'replaced',
            };

            let bRegisterable: IRegisterable = {
                builder: function replaced() { },
                name: 'replaced',
            };

            testable.register(registerable);
            testable.replace(aRegisterable);

            expect(() => testable.replace(bRegisterable)).toThrow('Cannot replace module "replaced" as it has not been registered.');
        });

        test('should allow you to replace a non singleton with a singleton', () => {
            let original: IRegisterable = {
                builder: function original() {},
                name: 'original',
            };

            let fn = jest.fn();
            let replacement: IRegisterable = {
                builder: function original() { fn(); return []; },
                name: 'original',
                singleton: true,
            };

            testable.register(original);
            testable.replace(replacement);

            const cnt = getRandomNumber();
            for (let index = 0; index < cnt; index++) {
                testable.build('original');
            }

            expect(fn).toHaveBeenCalledTimes(1);
        });

        test('should allow the replacement of a singleton with non singleton.', () => {
            let origValue = { some: 'original' };
            let registerable: IRegisterable = {
                builder: function blah() { return origValue; },
                name: 'blah',
                singleton: true,
            };

            let repFn = jest.fn();
            let repValue = { its: 'a fake' };
            let rep: IRegisterable = {
                builder: function blah() { repFn(); return repValue; },
                name: 'blah',
            };

            testable.register(registerable);
            testable.build(registerable.name);

            testable.replace(rep);

            const cnt = getRandomNumber();
            for (let index = 0; index < cnt; index++) {
                testable.build(registerable.name);
            }

            expect(repFn).toHaveBeenCalledTimes(cnt);
        });
    });

    describe('has a restore method that', () => {
        test('call original method when replacement is restored.', () => {
            const origValue = { original: true };
            let fnOrig = jest.fn();
            let registerable: IRegisterable = {
                builder: function toDo() { fnOrig(); return origValue; },
                name: 'toDo',
            };


            let repFn = jest.fn();
            const repValue = { original: false };
            let rep: IRegisterable = {
                builder: function toDo() { repFn(); return repValue; },
                name: 'toDo',
            };

            testable.register(registerable);
            testable.replace(rep);
            testable.restore(registerable.name);

            let result = testable.build(registerable.name);

            expect(fnOrig).toHaveBeenCalled();
            expect(repFn).not.toHaveBeenCalled();
            expect(result).toBe(origValue);
        });

        test('uses cached value when restored', () => {
            const origValue = { original: true };
            let registerable: IRegisterable = {
                builder: function toDo() { return origValue; },
                name: 'toDo',
                singleton: true,
            };
            
            const repValue = { original: false };
            let rep: IRegisterable = {
                builder: function toDo() { return repValue; },
                name: 'toDo',
                singleton: true,
            };

            testable.register(registerable);
            testable.build(registerable.name);

            testable.replace(rep);
            let fake = testable.build(registerable.name);

            testable.restore(registerable.name);
            let result = testable.build(registerable.name);

            expect(result).toBe(origValue);
            expect(fake).toBe(repValue);
        });
    });

    describe('has a replaceBuilder method that', () => {
        test('should replace a module with a builder function', () => {
            let origFn = jest.fn();
            let registerable: IRegisterable = {
                builder: function bang() { origFn(); },
                name: 'bang',
            };

            let fakeFn = jest.fn();
            function bang() { fakeFn(); }

            testable.register(registerable);
            testable.replaceBuilder(bang, []);

            testable.build('bang');

            expect(origFn).not.toHaveBeenCalled();
            expect(fakeFn).toHaveBeenCalled();
        });

        test('should not allow you to replace using an anonymous function without using the name parameter.', () => {
            let registerable: IRegisterable = {
                builder: function bang() { },
                name: 'bang',
            }

            testable.register(registerable);

            expect(() => { testable.replaceBuilder(() => {}, []); }).toThrow('Must provide a name either on the passed method or parameter to replace builder.');
        });

        test('should allow replacement with anonymous function if name is passed', () => {
            let origFn = jest.fn();
            let registerable: IRegisterable = {
                builder: () => { origFn(); },
                name: 'bang',
            };

            let fakeFn = jest.fn();

            testable.register(registerable);
            testable.replaceBuilder(() => { fakeFn(); }, [], 'bang');

            testable.build('bang');
            
            expect(origFn).not.toHaveBeenCalled();
            expect(fakeFn).toHaveBeenCalled();
        });

        test('should allow for dependencies on replacement builder', () => {
            testable.registerBuilder(() => {}, [], 'cyan');
            let fnPurple = jest.fn()
            testable.registerBuilder(() => { fnPurple(); }, [], 'purple');
            
            testable.replaceBuilder(() => { }, ['purple'], 'cyan');

            testable.build('cyan');

            expect(fnPurple).toHaveBeenCalled();
        });

        test('should replace a non singleton with a singleton', () => {
            let origFn = jest.fn();
            testable.registerBuilder(() => { origFn(); return {}; }, [], 'teal');


            let fakeFn = jest.fn();
            testable.replaceBuilder(() => { fakeFn(); return {}; }, [], 'teal', true);

            const cnt = getRandomNumber();
            for (let index = 0; index < cnt; index++) {
                testable.build('teal');
            }

            expect(fakeFn).toHaveBeenCalledTimes(1);
        });
    });

    describe('has a replaceValue method that', () => {
        test('should replace a module with a value', () => {
            let origFn = jest.fn();
            testable.registerBuilder(() => { origFn() ;return { original: false }; }, [], 'red');
            let expected = { original: false, name: 'red'};
            testable.replaceValue(expected);

            let result = testable.build('red');

            expect(origFn).not.toHaveBeenCalled();
            expect(result).toBe(expected);
        });

        test('should not allow a replacement with no name attribute or name parameter', () => {
            testable.registerBuilder(() => {}, [], 'grey');

            expect(() => testable.replaceValue({ orange: 'jam' })).toThrow('Cannot replace value unless it has a name property or the name is passed as a parameter.');
        });

        test('should allow replacement of module when name is passed as a parameter', () => {
            testable.registerBuilder(() => { return { isGrey: true } }, [], 'grey');
            const expected = { isGrey: false };
            testable.replaceValue(expected, 'grey');

            let result = testable.build('grey');

            expect(result).toBe(expected);
        });
    });

    describe('has replacePackageBuilder method that', () => {
        test('should replace fs', () => {
            const fakeFs = { is: 'not fs' };
            function fs () { return fakeFs; }
            testable.replacePackageBuilder(fs);

            let result = testable.build('fs');

            expect(result).toBe(fakeFs);
        });

        test('should not allow replacement of anonymous function if no name is given as a parameter', () => {
            expect(() => testable.replacePackageBuilder(() => { return {}; })).toThrow('Must provide a name either on the passed method or parameter to replace package builder.')
        });

        test('should allow replacement of anonymous function if name is give as a parameter', () => {
            const fakePath = { isNot: 'a path' };
            testable.replacePackageBuilder(() => { return fakePath; }, 'path');
        });

        test('should allow for a package to be replaced with a singleton', () => {
            const fakeBuffer = { iAm: 'not a buffer' };
            let fakeFn = jest.fn();
            testable.replacePackageBuilder(() => { fakeFn(); return fakeBuffer; }, 'buffer', true);

            const cnt = getRandomNumber();
            for (let index = 0; index < cnt; index++) {
                testable.build('buffer');
            }

            expect(fakeFn).toHaveBeenCalledTimes(1);
        });
    });

    describe('has replacePackageValue method that', () => {
        test('should replace a package with a value.', () => {
            const expected = { real: 'you kidding me', name: 'child_process' };
            testable.replacePackageValue(expected);

            let result = testable.build('child_process');

            expect(result).toBe(expected);
        });

        test('should not replace a package with value that does not have a name if no name is provided as a parameter.', () => {
            expect(() => testable.replacePackageValue({ bad: true })).toThrow('Cannot replace package with value unless it has a name property or the name is passed as a parameter.')
        });

        test('should allow for a value without a name property if the name is passed as a parameter.', () => {
            const fakeCrypto = { secure: 'Nope!' };
            testable.replacePackageValue(fakeCrypto, 'crypto');

            let result = testable.build('crypto');

            expect(result).toBe(fakeCrypto);
        });
    });
});