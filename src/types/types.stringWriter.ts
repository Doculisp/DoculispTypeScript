import { IDoculisp, IEmptyDoculisp } from "./types.astDoculisp";
import { Result } from "./types.general";
import { IVariableTable } from "./types.variableTable";

export interface IStringWriter {
    writeAst(astMaybe: Result<IDoculisp | IEmptyDoculisp>, variableTable: IVariableTable): Result<string>;
};