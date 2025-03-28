import { Options } from "approvals/lib/Core/Options";
import { configure } from "approvals/lib/config";
import { getVerifier } from "../../tools";
import { containerPromise } from "../../../src/moduleLoader";
import { IDoculisp, IDoculispParser, IEmptyDoculisp } from '../../../src/types/types.astDoculisp'
import { IFail, IProjectLocation, ISuccess, IUtil, Result } from "../../../src/types/types.general";
import { buildPath, buildProjectLocation, testable } from "../../testHelpers";
import { IAstEmpty, RootAst } from '../../../src/types/types.ast';
import { destKey, IVariableTestable, sourceKey } from "../../../src/types/types.variableTable";
import { IPath, PathConstructor } from "../../../src/types/types.filePath";
import { IContainer } from "../../../src/types/types.containers";

describe('astDoculisp', () => {
    let container: IContainer = null as any;
    let verifyAsJson: (data: any, options?: Options) => void;
    let ok: (successfulValue: any) => ISuccess<any> = undefined as any;
    let fail: (message: string, documentPath?: IPath) => IFail = undefined as any;
    let util: IUtil = undefined as any;
    let toResult: (text: string, projectLocation: IProjectLocation) => Result<IDoculisp | IEmptyDoculisp> = undefined as any;
    let variableTable: IVariableTestable = undefined as any;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    beforeEach(async () => {
        container = await containerPromise;
        toResult = testable.doculisp.resultBuilder(container, environment => {
            variableTable = environment.buildAs<IVariableTestable>('variableTable');
            variableTable.clear();

            const pathHandler: PathConstructor = 
                function(filePath) {
                    return buildPath(filePath);
            };
            environment.replaceValue(pathHandler, 'pathConstructor');
            util = environment.buildAs<IUtil>('util');
        });
        
        ok = util.ok;
        fail = util.fail;
    });

    describe('basic functionality', () => {
        let parser: IDoculispParser = undefined as any;

        beforeEach(() => {
            util = null as any;
            parser = testable.doculisp.parserBuilder(container, environment => {
                const pathHandler: PathConstructor = function (filePath) {
                        return buildPath(filePath);
                };
                environment.replaceValue(pathHandler, 'pathConstructor');
                util = environment.buildAs<IUtil>('util');
            });
        });
    
        it('should return an empty doculisp if given empty ast', () => {
            const empty: IAstEmpty = {
                type: 'ast-Empty',
                location: buildProjectLocation('./myDoc.md'),
            };
    
            const result = parser.parse(ok(empty), variableTable);
    
            verifyAsJson(result);
        });

        it('should return failure if given failure', () => {
            const failure = fail('this is a document failure', buildPath('Z:/mybad.dlisp'));
    
            const result = parser.parse(failure, variableTable);
    
            verifyAsJson(result);
        });
    
        it('should parse a value', () => {
            const projectLocation = buildProjectLocation('T:/ext/only.md', 2, 9);

            const ast: RootAst = {
                ast: [
                    {
                        type: 'ast-value',
                        value: 'Some text',
                        location: util.toLocation(projectLocation, 2, 1),
                    }
                ],
                location: projectLocation,
                type: 'RootAst'
            };
    
            const result = parser.parse(ok(ast), variableTable);
    
            verifyAsJson(result);
        });
    
        it('should parse multiple value ast elements', () => {
            const projectLocation = buildProjectLocation('T:/ext/only.md', 4, 8);
            const ast: RootAst = {
                ast: [
                    {
                        type: 'ast-value',
                        value: 'Intro text',
                        location: util.toLocation(projectLocation, 1, 1),
                    },
                    {
                        type: 'ast-value',
                        value: 'Text after some comment',
                        location: util.toLocation(projectLocation, 5, 1),
                    }
                ],
                type: 'RootAst',
                location: projectLocation,
            };
    
            const result = parser.parse(ok(ast), variableTable);
    
            verifyAsJson(result);
        });
    });

    describe('lisp', () => {
        describe('header', () => {
            it('should parse simple ast', () => {
                const contents = `<!--
(dl (# My heading))
-->`;
                const result = toResult(contents, buildProjectLocation('S:/ome/file.md', 2, 1));
        
                verifyAsJson(result);
            });
        
            it('should not parse a header without a parameter', () => {
                const contents = `<!--
(dl (#))
-->`;
                const result = toResult(contents, buildProjectLocation('S:/ome/file.md', 2, 3));
        
                verifyAsJson(result);
            });
            
            it('should parse a header with an id', () => {
                const contents = `<!--
(dl (#first My heading))
-->`;
                const result = toResult(contents, buildProjectLocation('S:/ome/file.md', 2, 1));
        
                verifyAsJson(result);
            });
            
            it('should not parse a header with an id that contains uppercase letters', () => {
                const contents = `<!--
(dl (#First My heading))
-->`;
                const result = toResult(contents, buildProjectLocation('S:/ome/file.md', 2, 1));
        
                verifyAsJson(result);
            });
            
            it('should not parse a header with an id that contains a symbol', () => {
                const contents = `<!--
(dl (#F|rst My heading))
-->`;
                const result = toResult(contents, buildProjectLocation('S:/ome/file.md', 2, 1));
        
                verifyAsJson(result);
            });
        });

        it('should parse a document with all the parts', () => {
            const text = `
(section-meta
    (title Doculisp)
    (include
        (Section ./structure.md)
        (Section ./doculisp.md)
        (Section ./section-meta.md)
        (Section ./content.md)
        (Section ./headings.md)
        (Section ./comment.md)
        (Section ./keywords.md)
    )
)

(## An introduction to Doculisp)

(content (toc numbered-labeled))
`;

            const result = toResult(text, buildProjectLocation('./_main.dlisp', 4, 7));

            verifyAsJson(result);
        });

        describe('section-meta', () => {
            it('should handle all subparts put together out of order', () => {
                const contents = `
(section-meta
(ref-link doculisp_is_)
(include
    (Section ./structure.md)
    (Section ./doculisp.md)
)
(title Doculisp is ✨)
)`;

                const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 4));

                verifyAsJson(result);
            });

            it('should not parse a section-meta that contains a section-meta', () => {
                const content = `
(section-meta
    (section-meta
        (title A Subtitle?)
    )
    (title The Document)
)
`;
                
                const result = toResult(content, buildProjectLocation('A:/malformed/file.dlisp', 1, 7));

                verifyAsJson(result);
            });

            it('should not parse a second section-meta in a file', () => {
                const content = `
(section-meta
    (title My Section)
)

(section-meta
    (title A tale of two sections)
)
`;

                const result = toResult(content, buildProjectLocation('./two/sections.dlisp', 3, 2));

                verifyAsJson(result);
            });

            it('should not parse a section meta with a invalid atom', () => {
                const content = `<!--
(dl
    (section-meta
        (title A Bad atom)
        (bad does stuff)
        (include
                (sample ./good.md)
        )
    )
)
-->

A story of a misbehaving parser.

`

                const result = toResult(content, buildProjectLocation('./_main.md', 1, 1));

                verifyAsJson(result);
            });

            describe('title', () => {
                it('should parse a title as a parameter', () => {
                    const contents = `(section-meta My Cool Document)`;
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 7));
            
                    verifyAsJson(result);
                });

                it('should parse a title', () => {
                    const contents = `
(section-meta
    (title My Cool Document)
)
`;
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 7));
            
                    verifyAsJson(result);
                });
            
                it('should not parse a title without a parameter', () => {
                    const contents = `(section-meta (title))`;
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 1));
            
                    verifyAsJson(result);
                });

                it('should not parse a title with a sub group', () => {
                    const contents = `(section-meta (title (bad group)))`;
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 1));
            
                    verifyAsJson(result);

                });

                it('should not parse multiple titles', () => {
                    const contents = '(section-meta (title A Title) (title B Title))';
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 1));

                    verifyAsJson(result);
                });
            });

            describe('author', () => {
                it('should parse an author block', () => {
                    const contents = `
(section-meta
    (title My Cool Document)
    (author Jason Kerney)
)
`;
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 7));
                    
                    if(!result.success) {
                        verifyAsJson(result);
                    }
                    else {
                        verifyAsJson(variableTable.asJson());
                    }
                });

                it('should parse two author blocks', () => {
                    const contents = `
(section-meta
    (title My Cool Document)
    (author Jason Kerney)
    (author Chris Stead)
)
`;
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 7));
            
                    if(!result.success) {
                        verifyAsJson(result);
                    }
                    else {
                        verifyAsJson(variableTable.asJson());
                    }
                });

                it('should not parse an author block with no name', () => {
                    const contents = `
(section-meta
    (title My Cool Document)
    (author)
)
`;

                    const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 7));
                                
                    verifyAsJson(result);
                });

                it('should not parse an author block that contains another block', () => {
                    const contents = `
(section-meta
    (title My Cool Document)
    (author
        (title MR.)
        (name Jason Kerney)
        (github jason-kerney)
    )
)
`;
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 7));
                                                    
                    verifyAsJson(result);
                });

                it('should not add a duplicate author block', () => {
                    const contents = `
(section-meta
    (title My Cool Document)
    (author Jason Kerney)
    (author Jason Kerney)
)
`;
                    
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 7));
                                
                    if(!result.success) {
                        verifyAsJson(result);
                    }
                    else {
                        verifyAsJson(variableTable.asJson());
                    }
                });
            });

            describe('ref-link', () => {
                it('should parse the ref-link', () => {
                    const contents = `
(section-meta
    (title My cool title✨)
    (ref-link my_cool_title)
)
`;
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 3, 10));
        
                    verifyAsJson(result);
                });

                it('should parse the ref-link if it comes before the title', () => {
                    const contents = `
(section-meta
    (ref-link my_cool_title)
    (title My cool title✨)
)
`;
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 3, 10));
        
                    verifyAsJson(result);
                });

                it('should not parse a ref-link with no parameter', () => {
                    const contents = `
(section-meta
    (ref-link)
    (title My cool title✨)
)
`;
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 3, 10));
                            
                    verifyAsJson(result);
                });

                it('should not parse a ref-link with a sub block', () => {
                    const contents = `
(section-meta
    (title My cool title✨)
    (ref-link (weird block))
)
`;
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 3, 11));
                    verifyAsJson(result);
                });

                it('should not parse multiple ref-links', () => {
                    const contents = `
(section-meta
    (ref-link my_cool_title)
    (title My cool title✨)
    (ref-link my-cool-title)
)
`;
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 1));
                    verifyAsJson(result);
                });

                it('should strip out some special characters from the ref-link', () => {
                    const content = `<!--
    (dl
        (section-meta
            (title A !@#$%^&*+=\\(\\){[]}|\\\\;:'" Story ,./<>? about things)
        )
    )
    -->`;
    
                    const result = toResult(content, buildProjectLocation('./_main.md', 1, 1));
                    verifyAsJson(result);
                });
            });

            describe('subtitle', () => {
                it('should parse the subtitle command', () => {
                    const contents = `
(section-meta
    (title My cool title)
    (subtitle This is information)
)
`;
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 4, 4));
        
                    verifyAsJson(result);
                });

                it('should parse the subtitle before title command', () => {
                    const contents = `
(section-meta
    (subtitle This is information)
    (title My cool title)
)
`;
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 2, 7));
        
                    verifyAsJson(result);
                });

                it('should not parse a subtitle without a parameter', () => {
                    const contents = `
(section-meta
    (title My cool title)
    (subtitle)
)
`;
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 10));
        
                    verifyAsJson(result);
                });

                it('should not parse a subtitle with a sub block', () => {
                     const contents = `
(section-meta
    (title My cool title)
    (subtitle (link-ref tom))
)
`;
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 10));
        
                    verifyAsJson(result);
                })

                it('should not parse multiple subtitles', () => {
                    const contents = `
(section-meta
    (subtitle This is information)
    (title My cool title)
    (subtitle A journey in lisp)
)
`;
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 2, 7));
        
                    verifyAsJson(result);
                });
            });

            describe('include', () => {
                it('should parse include', () => {
                    const contents = `
(section-meta
    (title Doculisp a short description)
    (include
        (section ./doculisp.md)
        (section ./section-meta.md)
    )
)`;

                    const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 4));

                    verifyAsJson(result);
                });

                it('should parse include without section information', () => {
                    const contents = `
(section-meta
    (title Doculisp a short description)
    (include)
)`;

                    const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 4));

                    verifyAsJson(result);
                });

                it('should replace hyphens with spaces in load labels', () => {
                    const contents = `
(section-meta
    (title Annoying Space)
    (include
        (My-Section ./first.md)
    )
)
`;
                    const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 4));

                    verifyAsJson(result);
                });

                it('should handle them all put together', () => {
                    const contents = `
(section-meta
    (title Doculisp is ✨)
    (ref-link doculisp_is_)
    (include
        (Section ./structure.md)
        (Section ./doculisp.md)
    )
)`;

                    const result = toResult(contents, buildProjectLocation('main.dlisp', 1, 4));

                    verifyAsJson(result);
                });
            });

            describe('id', () => {
                it('should parse the id command', () => {
                    const contents = `
<!-- (dl
(section-meta
    (title The use of IDs)
    (id my-id)
)
) -->
`;

                    const result = toResult(contents, buildProjectLocation('main.md', 1, 1));
                    verifyAsJson(result);
                });

                it('should not parse the id command it it contains capital letters', () => {
                    const contents = `
<!-- (dl
(section-meta
    (title The use of IDs)
    (id my-Id)
)
) -->
`;

                    const result = toResult(contents, buildProjectLocation('main.md', 1, 1));
                    verifyAsJson(result);
                });

                it('should not parse the id command if it contains symbols.', () => {
                    const contents = `
<!-- (dl
(section-meta
    (title The use of IDs)
    (id my-✨-id)
)
) -->
`;

                    const result = toResult(contents, buildProjectLocation('main.md', 1, 1));
                    verifyAsJson(result);
                });
            });
        });

        describe('content', () => {
            it('should parse the content location', () => {
                const text = `
(section-meta
    (title Using Content)
    (include
        (Section ./HelloContent.md)
    )
)

(content)
`;

                const result = toResult(text, buildProjectLocation('../main.dlisp', 2, 7));

                verifyAsJson(result);
            });

            it('should not parse the content if it has a parameter text', () => {
                const text = `
(section-meta
    (title Using Content)
    (include
        (Section ./HelloContent.md)
    )
)

(content toc)
`;

                const result = toResult(text, buildProjectLocation('../main.dlisp', 2, 7));

                verifyAsJson(result);
            });

            it('should not parse the toc if it has a sub block', () => {
                const text = `
(section-meta
    (title Using Content)
    (include
        (Section ./HelloContent.md)
    )
)

(content (toc (type bulleted)))
`;

                const result = toResult(text, buildProjectLocation('../main.dlisp', 2, 7));

                verifyAsJson(result);
            });

            it('should not parse the content if it is before the section-meta', () => {
                const text = `
(content)

(section-meta
    (title Using Content)
    (include
        (Section ./HelloContent.md)
    )
)
`;

                const result = toResult(text, buildProjectLocation('../main.dlisp', 4, 2));

                verifyAsJson(result);
            });

            it('should not parse the content location when there are no externals', () => {
                const text = `
(section-meta
    (title Using Content)
)

(content)
`;

                const result = toResult(text, buildProjectLocation('../noInclude.dlisp', 2, 7));

                verifyAsJson(result);
            });

            it('should not parse the content location when there is an empty include', () => {
                const text = `
(section-meta
    (title Using Content)
    (include)
)

(content)
`;

                const result = toResult(text, buildProjectLocation('../noInclude.dlisp', 2, 7));

                verifyAsJson(result);
            });

            it('should parse a table of contents', () => {
                const text = `
(section-meta
    (title Sing Me a Song)
    (include
        (Chapter ./sleep.md)
    )
)

(content (toc))
`;

                const result = toResult(text, buildProjectLocation('./itty.dlisp', 2, 1));

                verifyAsJson(result);
            });

            it.each([
                'no-table',
                'unlabeled',
                'labeled',
                'numbered',
                'numbered-labeled',
                'bulleted',
                'bulleted-labeled',
            ])('should parse a table of contents with bullet style of %s', (bulletType: string) => {
                const text = `
(section-meta
    (title Sing Me a Song)
    (include
        (Chapter ./songs.dlisp)
    )
)

(content (toc ${bulletType}))
`;

                const result = toResult(text, buildProjectLocation('./itty.dlisp', 2, 1));

                verifyAsJson(result);
            });

            it('should not parse a content whith a sub command other then toc', () => {
                const text = `
(section-meta
    (title Sing Me a Song)
    (include
        (Chapter ./songs.dlisp)
    )
)

(content (# Incorrect))
`;
                const result = toResult(text, buildProjectLocation('./itty.dlisp', 2, 1));

                verifyAsJson(result);
            });

            it('should not parse a table of contents with unrecognizable bullet style', () => {
                const text = `
(section-meta
    (title Sing Me a Song)
    (include
        (Chapter ./sleep.md)
    )
)

(content (toc unknown))
`;

                const result = toResult(text, buildProjectLocation('./itty.dlisp', 2, 1));

                verifyAsJson(result);
            });

            it('should parse a table of contents with a label', () => {
                const text = `
(section-meta
    (title Sing Me a Song)
    (include
        (Chapter ./songs.dlisp)
    )
)

(content
    (toc
        (label Table of Awesome)
    )
)
`;

                const result = toResult(text, buildProjectLocation('./itty.dlisp', 2, 1));

                verifyAsJson(result);
            });

            it('should parse a table of contents with a style block', () => {
                const text = `
(section-meta
    (title Sing Me a Song)
    (include
        (Chapter ./songs.dlisp)
    )
)

(content
    (toc
        (style bulleted-labeled)
    )
)
`;

                const result = toResult(text, buildProjectLocation('./itty.dlisp', 2, 1));

                verifyAsJson(result);
            });

            it('should parse a table of contents with both a style block and label', () => {
                const text = `
(section-meta
    (title Sing Me a Song)
    (include
        (Chapter ./songs.dlisp)
    )
)

(content
    (toc
        (label Awesome)
        (style bulleted-labeled)
    )
)
`;

                const result = toResult(text, buildProjectLocation('./itty.dlisp', 2, 1));

                verifyAsJson(result);
            });

            it('should parse a table of contents with both a style block and label reversed', () => {
                const text = `
(section-meta
    (title Sing Me a Song)
    (include
        (Chapter ./songs.dlisp)
    )
)

(content
    (toc
        (style bulleted-labeled)
        (label Awesome)
    )
)
`;

                const result = toResult(text, buildProjectLocation('./itty.dlisp', 2, 1));

                verifyAsJson(result);
            });
        })

        describe('get-path', () => {
            it('should get the id path', () => {
                const readMeOutput = './readme.md';

                const contribSource = './src/contrib/_main.md';
                const contribOutput = './contrib.md';

                const contribText = `<!-- (dl
(section-meta
    (title Using Dynamic Path)
)
) -->

[back](<!-- (dl (get-path readme)) -->)
`;

                variableTable.addGlobalValue('readme', { type: 'variable-id', headerLinkText: false, value: buildPath(readMeOutput), source: util.location(buildPath('./project.dlproj', true), 1, 1, 3, 5) });
                variableTable.addValue(sourceKey, { type: 'variable-path', value: buildPath(contribSource) });
                variableTable.addValue(destKey, { type: 'variable-path', value: buildPath(contribOutput) });

                const result = toResult(contribText, buildProjectLocation('../main.md', 2, 7));

                verifyAsJson(result);
            });
        });
    });
});