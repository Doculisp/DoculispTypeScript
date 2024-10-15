export interface IValidateSubItem {
    isValidSubAtom(name: string): boolean;
    getStructureForSubAtom(name: string): IStructure | false;
    getMandatorySubAtoms(): IStructure[];
}

export interface IStructure {
    hasParameter: true | false | 'maybe';
    hasSubAtom: false | IValidateSubItem;
    mandatory?: true;
    type: 'comment' | 'section' | 'include' | 'ref-link' | 'subtitle' | 'title' | 'section-meta' | 'toc' | 'content' | 'header';
};

export interface IRootStructure {
    hasParameter: false;
    SubAtoms: IValidateSubItem;
    type: 'dl';
};