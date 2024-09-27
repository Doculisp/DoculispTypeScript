import { IRegisterable } from "./types.containers";

const documentWriter: IRegisterable = {
    builder: () => () => {},
    name: 'docWriter',
    singleton: true,
    dependencies: []
};

export {
    documentWriter,
};