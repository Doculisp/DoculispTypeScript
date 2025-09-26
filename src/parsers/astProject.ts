import { AtomAst, CoreAst, IAstEmpty, RootAst } from "../types/types.ast";
import { IProjectDocument, IProjectDocuments, IProjectParser } from "../types/types.astProject";
import { IRegisterable } from "../types/types.containers";
import { IPath, PathConstructor } from "../types/types.filePath";
import { ILocation, IUtil, ResultCode } from "../types/types.general";
import { IInternals, StepParseResult } from "../types/types.internal";
import { TextHelper } from "../types/types.textHelpers";
import { ITrimArray } from "../types/types.trimArray";
import { IVariableTable } from "../types/types.variableTable";

interface ISource {
    source: IPath,
    location: ILocation,
    type: 'i-source',
};

interface IOutput {
    output: IPath,
    location: ILocation
    type: 'i-output',
}

function buildAstProject(internals: IInternals, util: IUtil, trimArray: ITrimArray, pathConstructor: PathConstructor, textHelper: TextHelper): IProjectParser {
    function parse(tokenResults: ResultCode<RootAst | IAstEmpty>, variableTable: IVariableTable): ResultCode<IProjectDocuments> {
        if(!tokenResults.success) {
            return tokenResults;
        }

        if(tokenResults.value.type === 'ast-Empty') {
            const empty: IProjectDocuments = {
                type: 'project-documents',
                documents: [],
                location: util.location(tokenResults.value.location.documentPath, tokenResults.value.location.documentDepth, tokenResults.value.location.documentIndex, 0, 0),
            };

            return util.ok(empty);
        }

       function parseDocuments(input: CoreAst[], current: ILocation): StepParseResult<CoreAst[], IProjectDocuments> {
            const ast = input[0] as CoreAst;

            if(ast.type !== 'ast-atom' && ast.type !== 'ast-container') {
                return internals.noResultFound();
            }

            if(ast.value !== 'documents') {
                return internals.noResultFound();
            }

            if(ast.type === 'ast-atom') {
                const empty: IProjectDocuments = {
                    type: 'project-documents',
                    documents: [],
                    location: ast.location,
                };

                return util.ok({
                    type: 'parse result',
                    location: ast.location,
                    subResult: empty,
                    rest: trimArray.trim(1, input),
                });
            }

            const parser = internals.createArrayParser(parseDocument);
            const maybe = parser.parse(ast.subStructure, (ast.subStructure[0] as AtomAst).location);

            if(!maybe.success) {
                return maybe;
            }

            const [result, remaining] = maybe.value;

            if(0 < remaining.remaining.length) {
                const bad = remaining.remaining[0] as CoreAst;
                return util.codeFailure(`Documents block at '${current.documentPath.fullName}' Line: ${current.line}, Char: ${current.char} contains unknown atom of '${bad.value}' at Line: ${bad.location.line}, Char ${bad.location.char}.`, { documentPath: current.documentPath, line: current.line, char: current.char });
            }

            const documents: IProjectDocuments = {
                type: 'project-documents',
                documents: result,
                location: ast.location,
            };

            return util.ok({
                type: 'parse result',
                location: current,
                subResult: documents,
                rest: trimArray.trim(1, input),
            });
        }

        function parseSource(input: CoreAst[], current: ILocation): StepParseResult<CoreAst[], ISource> {
            const ast = input[0] as AtomAst;

            if(ast.type !== 'ast-command') {
                return internals.noResultFound();
            }

            if(ast.value !== 'source') {
                return internals.noResultFound();
            }

            let source: ISource = {
                source: pathConstructor(ast.parameter.value),
                location: current,
                type: 'i-source'
            };

            return util.ok({
                type: 'parse result',
                location: current,
                subResult: source,
                rest: trimArray.trim(1, input),
            });
        }

        function parseOutput(input: CoreAst[], current: ILocation): StepParseResult<CoreAst[], IOutput> {
            const ast = input[0] as AtomAst;

            if(ast.type !== 'ast-command') {
                return internals.noResultFound();
            }

            if(ast.value !== 'output') {
                return internals.noResultFound();
            }

            const output: IOutput = {
                output: pathConstructor(ast.parameter.value),
                location: current,
                type: 'i-output'
            };

            return util.ok({
                type: 'parse result',
                location: current,
                subResult: output,
                rest: trimArray.trim(1, input),
            });
        }

        function parseDocumentByParts(originalLocation: ILocation, originalAst: CoreAst[] | false, id?: string | undefined): (input: CoreAst[], current: ILocation) => StepParseResult<CoreAst[], IProjectDocument> {
            return function(input: CoreAst[], current: ILocation): StepParseResult<CoreAst[], IProjectDocument> {
                const parser = internals.createArrayParser<CoreAst, IOutput | ISource>(parseSource, parseOutput);

                const maybe = parser.parse(input, current);

                if(!maybe.success) {
                    return maybe;
                }

                const [result, remaining] = maybe.value;

                if(result.length === 0) {
                    return internals.noResultFound();
                }

                if(0 < remaining.remaining.length) {
                    const first = remaining.remaining[0] as AtomAst;
                    return util.codeFailure(`Unknown atom at '${current.documentPath.fullName}' Line: ${first.location.line}, Char: ${first.location.char} of '${first.value}'`, { documentPath: current.documentPath, line: first.location.line, char: first.location.char });
                }

                const sources = result.filter(r => r.type === 'i-source');
                const outputs = result.filter(r => r.type === 'i-output');

                if(0 === sources.length && 0 === outputs.length) {
                    return internals.noResultFound();
                }

                if(0 === sources.length) {
                    return util.codeFailure(`Document identifier block at '${originalLocation.documentPath}' Line: ${originalLocation.line}, Char: ${originalLocation.char} does not contain a source block.`, { documentPath: originalLocation.documentPath, line: originalLocation.line, char: originalLocation.char });
                }

                if(0 === outputs.length) {
                    return util.codeFailure(`Document identifier block at '${originalLocation.documentPath}' Line: ${originalLocation.line}, Char: ${originalLocation.char} does not contain a output block.`, { documentPath: originalLocation.documentPath, line: originalLocation.line, char: originalLocation.char });
                }

                if(1 < sources.length) {
                    const bad = sources[1] as ISource;
                    return util.codeFailure(`Duplicate source block at '${current.documentPath}' Line: ${bad.location.line}, Char: ${bad.location.char}.`, { documentPath: current.documentPath, line: bad.location.line, char: bad.location.char });
                }

                if(1 < outputs.length) {
                    const bad = outputs[1] as IOutput;
                    return util.codeFailure(`Duplicate output block at '${current.documentPath}' Line: ${bad.location.line}, Char: ${bad.location.char}.`, { documentPath: current.documentPath, line: bad.location.line, char: bad.location.char });
                }

                const source = sources[0] as ISource;
                const output = outputs[0] as IOutput;

                if(id){
                    variableTable.addGlobalValue(id, { type: 'variable-id', value: output.output, source: current, headerLinkText: false });
                }

                const found: IProjectDocument = {
                    type: 'project-document',
                    destinationPath: output.output,
                    sourcePath: source.source,
                    location: originalLocation,
                    id: id,
                };

                return util.ok({
                    type: 'parse result',
                    location: originalLocation,
                    subResult: found,
                    rest: trimArray.trim(2, originalAst ? originalAst : input),
                });
            }
        }

        function parseDocId(input: CoreAst[], current: ILocation): StepParseResult<CoreAst[], IProjectDocument> {
            const ast = input[0] as CoreAst;

            if(ast.type !== 'ast-container') {
                return internals.noResultFound();
            }

            const id = ast.value;

            const table = textHelper.symbolLocation(id)
            if(!!table) {
                let bads = Object.keys(table);
                let badMsg = bads.map(badS => `'${badS}' @ id char ${table[badS]}`).join('\n\t');

                return util.codeFailure(`Symbol(s) in document id ${id}' at '${current.documentPath.fullName}' Line: ${current.line}, Char: ${current.char}\n${badMsg}`, { documentPath: current.documentPath, line: current.line, char: current.char });
            }

            if(!textHelper.isLowercase(id)) {
                return util.codeFailure(`Id must be lowercase '${id}' at '${current.documentPath.fullName}' Line: ${current.line}, Char: ${current.char}. Did you mean '${id.toLocaleLowerCase()}'?`, { documentPath: current.documentPath, line: current.line, char: current.char });
            }

            if(variableTable.hasKey(id)) {
                let orig = variableTable.getValue(id);
                let msg = '';

                if(orig && orig.type === 'variable-id') {
                    msg = `\n\tOriginal us of Id was in '${orig.source.documentPath}' Line: ${orig.source.line}, Char: ${orig.source.char}.`;
                }

                return util.codeFailure(`Duplicate id '${id}' at '${current.documentPath.fullName}' Line: ${current.line}, Char: ${current.char}.${msg}`, { documentPath: current.documentPath, line: current.line, char: current.char });
            }
            return parseDocumentByParts(current, input, id)(ast.subStructure, (ast.subStructure[0] as AtomAst).location);
        }

        function parseDocument(input: CoreAst[], current: ILocation): StepParseResult<CoreAst[], IProjectDocument> {
            const ast = input[0] as CoreAst;

            if(ast.type !== 'ast-container') {
                return internals.noResultFound();
            }

            if(ast.value !== 'document') {
                return internals.noResultFound();
            }

            const parseByParts = parseDocumentByParts(current, false)
            const parser = internals.createArrayParser(parseByParts, parseDocId);

            const maybe = parser.parse(ast.subStructure, (ast.subStructure[0] as AtomAst).location);

            if(!maybe.success) {
                return maybe;
            }

            const [result, remaining] = maybe.value;

            if(0 < remaining.remaining.length) {
                const bad = remaining.remaining[0] as CoreAst;
                return util.codeFailure(`Document block at '${current.documentPath}' Line: ${current.line}, Char: ${current.char} contains unknown block '${bad.value}' at Line: ${bad.location.line}, Char: ${bad.location.char}.`, { documentPath: current.documentPath, line: current.line, char: current.char });
            }

            if(result.length === 0) {
                return util.codeFailure(`Document block at '${current.documentPath}' Line: ${current.line}, Char: ${current.char} does not contain a source or output.`, { documentPath: current.documentPath, line: current.line, char: current.char });
            }

            if(1 < result.length) {
                const bad = result[0] as IProjectDocument;
                return util.codeFailure(`Duplicate block at '${current.documentPath.fullName}' Line: ${bad.location.line}, Char: ${bad.location.char}.`, { documentPath: current.documentPath, line: bad.location.line, char: bad.location.char });
            }

            const doc = result[0] as IProjectDocument;

            return util.ok({
                type: 'parse result',
                location: current,
                subResult: doc,
                rest: trimArray.trim(1, input)
            });
        }

        const parser = internals.createArrayParser(parseDocuments);
        const maybe = parser.parse(tokenResults.value.ast, util.location(tokenResults.value.location.documentPath, tokenResults.value.location.documentDepth, tokenResults.value.location.documentIndex, 1, 1));

        if(!maybe.success) {
            return maybe;
        }

        const [result, remaining] = maybe.value;

        if(0 < remaining.remaining.length) {
            const bad = remaining.remaining[0] as CoreAst;
            return util.codeFailure(`Unknown atom at '${bad.location.documentPath.fullName}' Line: ${bad.location.line}, Char: ${bad.location.char} of '${bad.value}'.`, { documentPath: bad.location.documentPath, line: bad.location.line, char: bad.location.char });
        }

        if(0 === result.length) {
            const empty: IProjectDocuments = {
                type: 'project-documents',
                documents: [],
                location: util.location(tokenResults.value.location.documentPath, tokenResults.value.location.documentDepth, tokenResults.value.location.documentIndex, 0, 0),
            };

            return util.ok(empty);
        }

        if(1 < result.length) {
            const bad = result[1] as IProjectDocuments;
            return util.codeFailure(`Project file may only contain a single documents block. Duplicate documents block detected at '${bad.location.documentPath.fullName}' Line: ${bad.location.line}, Char: ${bad.location.char}.`, { documentPath: bad.location.documentPath, line: bad.location.line, char: bad.location.char });
        }

        return util.ok(result[0] as IProjectDocuments);
    }

    return {
        parse,
    };
}

const doculispParser: IRegisterable = {
    builder: (internals: IInternals, util: IUtil, trimArray: ITrimArray, pathConstructor: PathConstructor, textHelper: TextHelper) => buildAstProject(internals, util, trimArray, pathConstructor, textHelper),
    name: 'astProjectParse',
    singleton: false,
    dependencies: ['internals', 'util', 'trimArray', 'pathConstructor', 'textHelpers']
};

export {
    doculispParser,
};
