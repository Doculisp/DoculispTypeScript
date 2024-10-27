import { IDoculisp, IEmptyDoculisp } from "./types.astDoculisp";
import { Result } from "./types.general";
import { IVariableRetriever } from "./types.variableTable";

export interface IStringWriter {
    writeAst(astMaybe: Result<IDoculisp | IEmptyDoculisp>, variableTable: IVariableRetriever): Result<string>;
};