import { IDoculisp, IEmptyDoculisp } from "./types.astDoculisp";
import { ResultCode } from "./types.general";
import { IVariableTable } from "./types.variableTable";

export interface IStringWriter {
    writeAst(astMaybe: ResultCode<IDoculisp | IEmptyDoculisp>, variableTable: IVariableTable): ResultCode<string>;
};