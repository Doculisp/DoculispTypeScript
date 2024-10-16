import fs from 'fs';
import path from 'path';
import { Options } from "approvals/lib/Core/Options";
import { configure } from "approvals/lib/config";
import { getVerifier } from "../../tools";
import { container } from "../../../src/container";
import { IDoculisp, IDoculispParser, IEmptyDoculisp } from '../../../src/types/types.astDoculisp'
import { IFail, IProjectLocation, ISuccess, IUtil, Result } from "../../../src/types/types.general";
import { buildLocation, testable } from "../../testHelpers";
import { IAstEmpty, RootAst } from '../../../src/types/types.ast';

describe('astDoculisp', () => {
    let verifyAsJson: (data: any, options?: Options) => void;
    let ok: (successfulValue: any) => ISuccess<any> = undefined as any;
    let fail: (message: string, documentPath: string) => IFail = undefined as any;
    let util: IUtil = undefined as any;
    let toResult: (text: string, projectLocation: IProjectLocation) => Result<IDoculisp | IEmptyDoculisp> = undefined as any;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    beforeEach(() => {
        toResult = testable.doculisp.resultBuilder(container, environment => {
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
                util = environment.buildAs<IUtil>('util');
            });
        });
    
        it('should return an empty doculisp if given empty ast', () => {
            const empty: IAstEmpty = {
                type: 'ast-Empty',
            };
    
            const result = parser.parse(ok(empty));
    
            verifyAsJson(result);
        });

        it('should return failure if given failure', () => {
            const failure = fail('this is a document failure', 'Z:/mybad.dlisp');
    
            const result = parser.parse(failure);
    
            verifyAsJson(result);
        });
    
        it('should parse a value', () => {
            const projectLocation = buildLocation('T:/ext/only.md', 2, 9);

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
    
            const result = parser.parse(ok(ast));
    
            verifyAsJson(result);
        });
    
        it('should parse multiple value ast elements', () => {
            const projectLocation = buildLocation('T:/ext/only.md', 4, 8);
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
    
            const result = parser.parse(ok(ast));
    
            verifyAsJson(result);
        });
    });

    describe('lisp', () => {
        it('should simple ast', () => {
            const contents = `<!--
(dl (# My heading))
-->`;
            const result = toResult(contents, buildLocation('S:/ome/file.md', 2, 1));
    
            verifyAsJson(result);
        });
    
        it('should not parse a bad header', () => {
            const contents = `<!--
(dl (#head My heading))
-->`;
            const result = toResult(contents, buildLocation('S:/ome/file.md', 3, 2));
    
            verifyAsJson(result);
        });
    
        it('should not parse a header without a parameter', () => {
            const contents = `<!--
(dl (#))
-->`;
            const result = toResult(contents, buildLocation('S:/ome/file.md', 2, 3));
    
            verifyAsJson(result);
        });

        it.skip('should parse a document with all the parts', () => {
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

            const result = toResult(text, buildLocation('./_main.dlisp', 4, 7));

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

                const result = toResult(contents, buildLocation('main.dlisp', 1, 4));

                verifyAsJson(result);
            });

            it.skip('should not parse a section-meta that contains a section-meta', () => {
                const content = `
(section-meta
    (section-meta
        (title A Subtitle?)
    )
    (title The Document)
)
`;
                
                const result = toResult(content, buildLocation('A:/malformed/file.dlisp', 1, 7));

                verifyAsJson(result);
            });

            it.skip('should not parse a second section-meta in a file', () => {
                const content = `
(section-meta
    (title My Section)
)

(section-meta
    (title A tale of two sections)
)
`;

                const result = toResult(content, buildLocation('./two/sections.dlisp', 3, 2));

                verifyAsJson(result);
            });

            it.skip('should not parse a section meta with a invalid atom', () => {
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

                const result = toResult(content, buildLocation('./_main.md', 1, 1));

                verifyAsJson(result);
            });

            describe('title', () => {
                it('should parse a title', () => {
                    const contents = `
(section-meta
    (title My Cool Document)
)
`;
                    const result = toResult(contents, buildLocation('main.dlisp', 1, 7));
            
                    verifyAsJson(result);
                });
            
                it('should not parse a title without a parameter', () => {
                    const contents = `(section-meta (title))`;
                    const result = toResult(contents, buildLocation('main.dlisp', 1, 1));
            
                    verifyAsJson(result);
                });

                it('should not parse a title with a sub group', () => {
                    const contents = `(section-meta (title (bad group)))`;
                    const result = toResult(contents, buildLocation('main.dlisp', 1, 1));
            
                    verifyAsJson(result);

                });

                it('should not parse multiple titles', () => {
                    const contents = '(section-meta (title A Title) (title B Title))';
                    const result = toResult(contents, buildLocation('main.dlisp', 1, 1));

                    verifyAsJson(result);
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
                    const result = toResult(contents, buildLocation('main.dlisp', 3, 10));
        
                    verifyAsJson(result);
                });

                it('should parse the ref-link if it comes before the title', () => {
                    const contents = `
(section-meta
    (ref-link my_cool_title)
    (title My cool title✨)
)
`;
                    const result = toResult(contents, buildLocation('main.dlisp', 3, 10));
        
                    verifyAsJson(result);
                });

                it('should not parse a ref-link with no parameter', () => {
                    const contents = `
(section-meta
    (ref-link)
    (title My cool title✨)
)
`;
                    const result = toResult(contents, buildLocation('main.dlisp', 3, 10));
                            
                    verifyAsJson(result);
                });

                it('should not parse a ref-link with a sub block', () => {
                    const contents = `
(section-meta
    (title My cool title✨)
    (ref-link (weird block))
)
`;
                    const result = toResult(contents, buildLocation('main.dlisp', 3, 11));
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
                    const result = toResult(contents, buildLocation('main.dlisp', 1, 1));
                    verifyAsJson(result);
                });

                it('should strip out some special characters from the ref-link', () => {
    //                 const content = `<!--
    // (dl
    //     (section-meta
    //         (title A !@#$%^&*+=\(\){[]}|\\;:'" Story ,./<>? about things)
    //     )
    // )
    // -->`;
                    const content = `<!--
    (dl
        (section-meta
            (title A !@#$%^&*+=;:'" Story ,./<>? about things)
        )
    )
    -->`;
    
                    const result = toResult(content, buildLocation('./_main.md', 1, 1));
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
                    const result = toResult(contents, buildLocation('main.dlisp', 4, 4));
        
                    verifyAsJson(result);
                });

                it('should parse the subtitle before title command', () => {
                    const contents = `
(section-meta
    (subtitle This is information)
    (title My cool title)
)
`;
                    const result = toResult(contents, buildLocation('main.dlisp', 2, 7));
        
                    verifyAsJson(result);
                });

                it('should not parse a subtitle without a parameter', () => {
                    const contents = `
(section-meta
    (title My cool title)
    (subtitle)
)
`;
                    const result = toResult(contents, buildLocation('main.dlisp', 1, 10));
        
                    verifyAsJson(result);
                });

                it('should not parse a subtitle with a sub block', () => {
                     const contents = `
(section-meta
    (title My cool title)
    (subtitle (link-ref tom))
)
`;
                    const result = toResult(contents, buildLocation('main.dlisp', 1, 10));
        
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
                    const result = toResult(contents, buildLocation('main.dlisp', 2, 7));
        
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

                    const result = toResult(contents, buildLocation('main.dlisp', 1, 4));

                    verifyAsJson(result);
                });

                it('should parse include without section information', () => {
                    const contents = `
(section-meta
    (title Doculisp a short description)
    (include)
)`;

                    const result = toResult(contents, buildLocation('main.dlisp', 1, 4));

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

                    const result = toResult(contents, buildLocation('main.dlisp', 1, 4));

                    verifyAsJson(result);
                });
            });
        });

        describe.skip('content', () => {
            it.skip('should parse the content location', () => {
                const text = `
(section-meta
    (title Using Content)
    (include
        (Section ./HelloContent.md)
    )
)

(content)
`;

                const result = toResult(text, buildLocation('../main.dlisp', 2, 7));

                verifyAsJson(result);
            });

            it.skip('should not parse the content if it is before the section-meta', () => {
                const text = `
(content)

(section-meta
    (title Using Content)
    (include
        (Section ./HelloContent.md)
    )
)
`;

                const result = toResult(text, buildLocation('../main.dlisp', 4, 2));

                verifyAsJson(result);
            });

            it.skip('should not parse the content location when there are no externals', () => {
                const text = `
(section-meta
    (title Using Content)
)

(content)
`;

                const result = toResult(text, buildLocation('../main.dlisp', 2, 7));

                verifyAsJson(result);
            });

            it.skip('should parse a table of contents', () => {
                const text = `
(section-meta
    (title Sing Me a Song)
    (include
        (Chapter ./sleep.md)
    )
)

(content (toc))
`;

                const result = toResult(text, buildLocation('./itty.dlisp', 2, 1));

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

                const result = toResult(text, buildLocation('./itty.dlisp', 2, 1));

                verifyAsJson(result);
            });

            it.skip('should not parse a content whith a sub command other then toc', () => {
                const text = `
(section-meta
    (title Sing Me a Song)
    (include
        (Chapter ./songs.dlisp)
    )
)

(content (# Incorrect))
`;
                const result = toResult(text, buildLocation('./itty.dlisp', 2, 1));

                verifyAsJson(result);
            });

            it.skip('should not parse a table of contents with unrecognizable bullet style', () => {
                const text = `
(section-meta
    (title Sing Me a Song)
    (include
        (Chapter ./sleep.md)
    )
)

(content (toc unknown))
`;

                const result = toResult(text, buildLocation('./itty.dlisp', 2, 1));

                verifyAsJson(result);
            });
        })
    });

    describe.skip('parse its own documentation', () => {
        function getContents(fileName: string, depth: number, index: number): Result<IDoculisp | IEmptyDoculisp> {
            const filePath = path.join('./documentation/', fileName);
            const location: IProjectLocation = buildLocation(filePath, depth, index);

            const content = fs.readFileSync(filePath, { encoding: 'utf8' });

            return toResult(content, location);
        }

        it.skip('should build ast for structure.md', () => {
            const result = getContents('structure.md', 2, 1);
            verifyAsJson(result);
        });

        it.skip('should build ast for doculisp.md', () => {
            const result = getContents('doculisp.md', 2, 2);
            verifyAsJson(result);
        });

        it.skip('should build ast for section-meta.md', () => {
            const result = getContents('section-meta.md', 2, 3);
            verifyAsJson(result);
        });

        it.skip('should build ast for content.md', () => {
            const result = getContents('content.md', 2, 4);
            verifyAsJson(result);
        });

        it.skip('should build ast for headings.md', () => {
            const result = getContents('headings.md', 2, 5);
            verifyAsJson(result);
        });

        it.skip('should build ast for comment.md', () => {
            const result = getContents('comment.md', 2, 6);
            verifyAsJson(result);
        });

        it.skip('should build ast for keywords.md', () => {
            const result = getContents('keywords.md', 2, 7);
            verifyAsJson(result);
        });

        it.skip('should build ast for contributors.md', () => {
            const result = getContents('contributors.md', 2, 8);
            verifyAsJson(result);
        });

        it.skip('should build ast for _main.md', () => {
            const result = getContents('_main.md', 1, 1);
            verifyAsJson(result);
        });
    });
});