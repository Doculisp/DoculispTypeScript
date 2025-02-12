import { configure } from "approvals/lib/config";
import { Options } from "approvals/lib/Core/Options";
import { getVerifiers } from "../tools";
import { IFail, IProjectLocation, ISuccess, IUtil } from "../../src/types/types.general";
import { Result } from "../../src/types/types.general";
import { buildProjectLocation, testable, buildPath } from "../testHelpers";
import { IDirectoryHandler, IFileHandler, IFileLoader } from "../../src/types/types.fileHandler";
import { container } from "../../src/container";
import { IDictionary, ITestableContainer } from "../../src/types/types.containers";
import { IVariableTestable } from "../../src/types/types.variableTable";
import { IPath, PathConstructor } from "../../src/types/types.filePath";

describe('stringWriter', () => {
    let verifyAsJson: (data: any, options?: Options) => void;
    let verifyMarkdown: (sut: any, options?: Options) => void;
    let toResult: (text: string, location: IProjectLocation) => Result<string> = null as any;
    let fail: (message: string, documentPath?: IPath) => IFail = undefined as any;
    let fileHandler: IFileHandler = null as any;
    let variableTable: IVariableTestable = undefined as any;

    function verifyMarkdownResult(textMaybe: Result<string>, options?: Options): void {
        if(textMaybe.success) {
            verifyMarkdown(textMaybe.value, options);
        }
        else {
            verifyAsJson(textMaybe, options);
        }
    }

    beforeAll(() => {
        const verifiers =  getVerifiers(configure);
        verifyAsJson = verifiers.verifyAsJson;
        verifyMarkdown = verifiers.verifyMarkdown;
    });

    function setupBuilder(environment: ITestableContainer): void {
        const pathConstructor: PathConstructor = (pathString: string): IPath => {
            return buildPath(pathString);
        }

        environment.replaceValue(pathConstructor, 'pathConstructor');

        const util: IUtil = environment.buildAs<IUtil>('util');
        
        fileHandler = environment.buildAs<IFileHandler>('fileHandler');

        fail = util.fail;
    }

    beforeEach(() => {
        fail = null as any;

        toResult = testable.stringWriter.resultBuilder(container, setupBuilder);
    });

    describe('basic functionality', () => {
        it('should not write an error', () => {
            const expectedResult = fail('Some failure', buildPath('S:/ome/path.md'));
            const writer = testable.stringWriter.writer(container);
            const result = writer.writeAst(expectedResult, variableTable);

            expect(result).toBe(expectedResult);
        });
    });

    describe('writing markup', () => {
        describe('text block', () => {
            it('should successfully write an empty string', () => {
                const result = toResult('', buildProjectLocation('C:/my_document.md', 4, 8));

                verifyMarkdownResult(result);
            });

            it('should write a simple text of "hello"', () =>{
                const result = toResult('hello', buildProjectLocation('C:/my_document.md', 3, 6));

                verifyMarkdownResult(result);
            });

            it('should write text of "blow fish"', () => {
                const result = toResult('blow fish', buildProjectLocation('C:/my_document.md', 7, 2));

                verifyMarkdownResult(result);
            });

            it('should write a multiline code block', () => {
                const md = `An example of an markdown document with html comments:

\`\`\`markdown
    # A document
    
    <!-- this need
    a summary
    -->
    
    ## Sub section title
\`\`\`
`;
                const result = toResult(md, buildProjectLocation('C:/markdown/multiline.md', 4, 3));
    
                verifyMarkdownResult(result);
            });
        });

        describe('lisp blocks', () => {
            describe('section-meta', () => {
                describe('title', () => {
                    it('should write the title', () => {
                        const contents = `
(section-meta
    (title My Cool Document)
)
`;
                        const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 1));
                
                        verifyMarkdownResult(result);
                    });
                    
                    it('should write the title at different depth', () => {
                        const contents = `
(section-meta
    (title My Cool Document)
)
`;
                        const result = toResult(contents, buildProjectLocation('main.dlisp', 2, 1));
                
                        verifyMarkdownResult(result);
                    });
                    
                    it('should write the title and subtitle', () => {
                        const contents = `
(section-meta
    (title My Cool Document)
    (subtitle A very nice document)
)
`;
                        const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 1));
                
                        verifyMarkdownResult(result);
                    });
                });
            });

            describe('dynamic header', () => {
                it('should write the dynamic header', () => {
                    const doc = `
<!--
(dl
    (section-meta
        (title The use of dynamic headers)
    )
)
-->

Here is how you would use the header.

<!-- (dl (# First Header)) -->

to which I write my word.

<!-- (dl (## Sub-Header)) -->

More words to put to it.

<!-- (dl (# Second Header)) -->

This is the end
`;

                    const result = toResult(doc, buildProjectLocation('./_main.md', 1, 1));

                    verifyMarkdownResult(result);
                });
            });

            describe('sub documents', () => {
                let ok: (value: any) => Result<any> = undefined as any;
                let addFile : (filePath: string, body: string) => void = undefined as any;

                beforeEach(() => {
                    let files: IDictionary<Result<string>> = undefined as any;
                    files = {};

                    addFile = (filePath: string, body: string): void => {
                        files[filePath] = ok(body);
                    };

                    toResult = testable.stringWriter.resultBuilder(container, environment => {
                        const util: IUtil = environment.buildAs<IUtil>('util');
                        ok = util.ok;

                        const fileHandler: IFileLoader & IDirectoryHandler = {
                            load: function(path: IPath): Result<string> {
                                const r = files[path.fullName];
                                if(r) {
                                    return r;
                                }

                                return fail('path not yet setup', path);
                            },
                            getProcessWorkingDirectory() {
                                return util.ok(buildPath('./', false));
                            },
                            setProcessWorkingDirectory() { return util.ok(undefined); }
                        };

                        environment.replaceBuilder(() => fileHandler, [], 'fileHandler', true);

                        const pathConstructor: PathConstructor = (pathString: string): IPath => {
                            return buildPath(pathString);
                        }
            
                        environment.replaceValue(pathConstructor, 'pathConstructor');
                    });
                });

                it('should write the contents of a sub document', () => {
                    const subPath = './sub.md'
                    const subDocument = `
<!--
(dl
    (section-meta
        (title My Sub Section)
    )
)
-->

This sub section rocks!
`;

                    addFile(subPath, subDocument);

                    const path = './_main.md';
                    const doc = `
<!--
(dl
    (section-meta
        (title Me and my sub section)
        (include
            (Section ${subPath})
        )
    )
)
-->

a truly divided tail.

<!-- (dl (content)) -->
`;

                    const result = toResult(doc, buildProjectLocation(path, 1, 1));
                    verifyMarkdownResult(result);
                });

                it('should write the table of contents', () => {
                    const subPath1 = './sub.md'
                    const subDocument1 = `
<!--
(dl
    (section-meta
        (title My First Sub Section)
    )
)
-->

This sub section rocks!
`;

                    const subPath2 = './second.md';
                    const subDocument2 = `
<!--
(dl
    (section-meta
        (title My second Sub Section)
    )
)
-->
`;

                    addFile(subPath1, subDocument1);
                    addFile(subPath2, subDocument2);

                    const path = './_main.md';
                    const doc = `
<!--
(dl
    (section-meta
        (title Me and my sub sections)
        (include
            (Section ${subPath1})
            (Block ${subPath2})
        )
    )
)
-->

a truly divided tail.

<!-- (dl (content (toc))) -->
`;

                    const result = toResult(doc, buildProjectLocation(path, 1, 1));
                    verifyMarkdownResult(result);
                });

                it('should write the unlabeled table of contents', () => {
                    const subPath1 = './sub.md'
                    const subDocument1 = `
<!--
(dl
    (section-meta
        (title My First Sub Section)
    )
)
-->

This sub section rocks!
`;

                    const subPath2 = './second.md';
                    const subDocument2 = `
<!--
(dl
    (section-meta
        (title My second Sub Section)
    )
)
-->
`;

                    addFile(subPath1, subDocument1);
                    addFile(subPath2, subDocument2);

                    const path = './_main.md';
                    const doc = `
<!--
(dl
    (section-meta
        (title Me and my sub sections)
        (include
            (Section ${subPath1})
            (Block ${subPath2})
        )
    )
)
-->

a truly divided tail.

<!-- (dl (content (toc unlabeled))) -->
`;

                    const result = toResult(doc, buildProjectLocation(path, 1, 1));
                    verifyMarkdownResult(result);
                });

                it('should write the numbered table of contents', () => {
                    const subPath1 = './sub.md'
                    const subDocument1 = `
<!--
(dl
    (section-meta
        (title My First Sub Section)
    )
)
-->

This sub section rocks!
`;

                    const subPath2 = './second.md';
                    const subDocument2 = `
<!--
(dl
    (section-meta
        (title My second Sub Section)
    )
)
-->
`;

                    addFile(subPath1, subDocument1);
                    addFile(subPath2, subDocument2);

                    const path = './_main.md';
                    const doc = `
<!--
(dl
    (section-meta
        (title Me and my sub sections)
        (include
            (Section ${subPath1})
            (Block ${subPath2})
        )
    )
)
-->

a truly divided tail.

<!-- (dl (content (toc numbered))) -->
`;

                    const result = toResult(doc, buildProjectLocation(path, 1, 1));
                    verifyMarkdownResult(result);
                });

                it('should write the numbered-labeled table of contents', () => {
                    const subPath1 = './sub.md'
                    const subDocument1 = `
<!--
(dl
    (section-meta
        (title My First Sub Section)
    )
)
-->

This sub section rocks!
`;

                    const subPath2 = './second.md';
                    const subDocument2 = `
<!--
(dl
    (section-meta
        (title My second Sub Section)
    )
)
-->
`;

                    addFile(subPath1, subDocument1);
                    addFile(subPath2, subDocument2);

                    const path = './_main.md';
                    const doc = `
<!--
(dl
    (section-meta
        (title Me and my sub sections)
        (include
            (Section ${subPath1})
            (Block ${subPath2})
        )
    )
)
-->

a truly divided tail.

<!-- (dl (content (toc numbered-labeled))) -->
`;

                    const result = toResult(doc, buildProjectLocation(path, 1, 1));
                    verifyMarkdownResult(result);
                });

                it('should write the bulleted table of contents', () => {
                    const subPath1 = './sub.md'
                    const subDocument1 = `
<!--
(dl
    (section-meta
        (title My First Sub Section)
    )
)
-->

This sub section rocks!
`;

                    const subPath2 = './second.md';
                    const subDocument2 = `
<!--
(dl
    (section-meta
        (title My second Sub Section)
    )
)
-->
`;

                    addFile(subPath1, subDocument1);
                    addFile(subPath2, subDocument2);

                    const path = './_main.md';
                    const doc = `
<!--
(dl
    (section-meta
        (title Me and my sub sections)
        (include
            (Section ${subPath1})
            (Block ${subPath2})
        )
    )
)
-->

a truly divided tail.

<!-- (dl (content (toc bulleted))) -->
`;

                    const result = toResult(doc, buildProjectLocation(path, 1, 1));
                    verifyMarkdownResult(result);
                });

                it('should write the bulleted-labeled table of contents', () => {
                    const subPath1 = './sub.md'
                    const subDocument1 = `
<!--
(dl
    (section-meta
        (title My First Sub Section)
    )
)
-->

This sub section rocks!
`;

                    const subPath2 = './second.md';
                    const subDocument2 = `
<!--
(dl
    (section-meta
        (title My second Sub Section)
    )
)
-->
`;

                    addFile(subPath1, subDocument1);
                    addFile(subPath2, subDocument2);

                    const path = './_main.md';
                    const doc = `
<!--
(dl
    (section-meta
        (title Me and my sub sections)
        (include
            (Section ${subPath1})
            (Block ${subPath2})
        )
    )
)
-->

a truly divided tail.

<!-- (dl (content (toc bulleted-labeled))) -->
`;

                    const result = toResult(doc, buildProjectLocation(path, 1, 1));
                    verifyMarkdownResult(result);
                });
            });

        });

        describe('own documentation', () => {
            let workingDir: string = null as any;
            beforeEach(() => {
                workingDir = process.cwd();
                process.chdir('./tests/Sample/complex');
                toResult = testable.stringWriter.resultBuilder(container, environment => {
                    const util: IUtil = environment.buildAs<IUtil>('util');
                    variableTable = environment.buildAs<IVariableTestable>('variableTable');
                    variableTable.addGlobalValue(' ID ', { type: 'variable-string', value: 'String Writer Test'});

                    environment.replace({
                        builder: () => variableTable,
                        name: 'variableTable',
                        singleton: true
                    });

                    fileHandler = environment.buildAs<IFileHandler>('fileHandler');
                    const fakeFileHandler: IFileHandler = {
                        load: function (path: IPath): Result<string> {
                            return fileHandler.load(path);
                        },
                        write: function (path: IPath, _text: Result<string>): Result<string> {
                            return util.ok(path.fullName);
                        },
                        getProcessWorkingDirectory: function (): Result<IPath> {
                            return fileHandler.getProcessWorkingDirectory();
                        },
                        setProcessWorkingDirectory: function (directory: IPath): Result<undefined> {
                            return fileHandler.setProcessWorkingDirectory(directory);
                        }
                    };

                    environment.replaceValue(fakeFileHandler, 'fileHandler');
                });
            });

            afterEach(() => {
                process.chdir(workingDir);
            });

            it('should write the structure part of its own documentation', () => {
                const filePath = './lang/structure.md';
                const doc: Result<string> = fileHandler.load(buildPath(filePath)) as ISuccess<string>;

                if(!doc.success) {
                    expect(JSON.stringify(doc, null, 4)).toBe('');
                }

                const result = toResult(doc.value, buildProjectLocation(filePath, 1, 1));
                verifyMarkdownResult(result);
            });

            it('should write the doculisp part of its own documentation', () => {
                const filePath = './lang/doculisp.md';
                const doc: Result<string> = fileHandler.load(buildPath(filePath)) as ISuccess<string>;

                if(!doc.success) {
                    expect(JSON.stringify(doc, null, 4)).toBe('');
                }

                const result = toResult(doc.value, buildProjectLocation(filePath, 1, 1));
                verifyMarkdownResult(result);
            });

            it('should write the section-meta part of its own documentation', () => {
                process.chdir('./lang/section-meta');
                const filePath = './_main.md';
                const doc: Result<string> = fileHandler.load(buildPath(filePath)) as ISuccess<string>;

                if(!doc.success) {
                    expect(JSON.stringify(doc, null, 4)).toBe('');
                }

                const result = toResult(doc.value, buildProjectLocation(filePath, 1, 1));
                verifyMarkdownResult(result);
            });

            it('should write the content part of its own documentation', () => {
                const filePath = './lang/content.md';
                const doc: Result<string> = fileHandler.load(buildPath(filePath)) as ISuccess<string>;

                if(!doc.success) {
                    expect(JSON.stringify(doc, null, 4)).toBe('');
                }

                const result = toResult(doc.value, buildProjectLocation(filePath, 1, 1));
                verifyMarkdownResult(result);
            });

            it('should write the headings part of its own documentation', () => {
                const filePath = './lang/headings.md';
                const doc: Result<string> = fileHandler.load(buildPath(filePath)) as ISuccess<string>;

                if(!doc.success) {
                    expect(JSON.stringify(doc, null, 4)).toBe('');
                }

                const result = toResult(doc.value, buildProjectLocation(filePath, 1, 1));
                verifyMarkdownResult(result);
            });

            it('should write the comment part of its own documentation', () => {
                const filePath = './lang/comment.md';
                const doc: Result<string> = fileHandler.load(buildPath(filePath)) as ISuccess<string>;

                if(!doc.success) {
                    expect(JSON.stringify(doc, null, 4)).toBe('');
                }

                const result = toResult(doc.value, buildProjectLocation(filePath, 1, 1));
                verifyMarkdownResult(result);
            });

            it('should write the keywords part of its own documentation', () => {
                const filePath = './lang/keywords.md';
                const doc: Result<string> = fileHandler.load(buildPath(filePath)) as ISuccess<string>;

                if(!doc.success) {
                    expect(JSON.stringify(doc, null, 4)).toBe('');
                }

                const result = toResult(doc.value, buildProjectLocation(filePath, 1, 1));
                verifyMarkdownResult(result);
            });

            it('should write the whole of its own documentation', () => {
                const filePath = './_main.md';
                const doc: Result<string> = fileHandler.load(buildPath(filePath)) as ISuccess<string>;

                variableTable.addValue(' destination', { type: 'variable-path', value: buildPath('./readme.md') })

                if(!doc.success) {
                    expect(JSON.stringify(doc, null, 4)).toBe('');
                }

                const result = toResult(doc.value, buildProjectLocation(filePath, 1, 1));
                verifyMarkdownResult(result);
            });
        });
    });
});