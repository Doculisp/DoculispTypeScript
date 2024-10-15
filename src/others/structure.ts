import { IRegisterable } from "../types/types.containers";

interface IValidateSubItem {
    isValidSubAtom(name: string): boolean;
    getStructureForSubAtom(name: string): IStructure | false;
    getMandatorySubAtoms(): IStructure[];
}

interface IStructure {
    hasParameter: true | false | 'maybe';
    hasSubAtom: false | IValidateSubItem;
    mandatory?: true;
    type: 'comment' | 'section' | 'include' | 'ref-link' | 'subtitle' | 'title' | 'section-meta' | 'toc' | 'content' | 'header' | 'dl';
};


function buildStructure(): IStructure {
    const commentBlock: IStructure = {
        hasParameter: 'maybe',
        hasSubAtom: {
            getStructureForSubAtom(_name) { return commentBlock; },
            isValidSubAtom(_name) { return true; },
            getMandatorySubAtoms() { return []; }
        },
        type: 'comment',
    }

    const sectionBlock: IStructure = {
        hasParameter: true,
        hasSubAtom: false,
        type: 'section',
    };

    const includeBlock: IStructure = {
        hasParameter: false,
        hasSubAtom: {
            isValidSubAtom(_name: string) {
                return true;
            },
            getStructureForSubAtom(name: string) {
                if(name.startsWith('*')) {
                    return commentBlock;
                }

                return sectionBlock;
            },
            getMandatorySubAtoms() { return []; },
        },
        type: 'include',
    };

    const refLinkBlock: IStructure = {
        hasParameter: true,
        hasSubAtom: false,
        type: 'ref-link',
    }

    const subtitleBlock: IStructure = {
        hasParameter: true,
        hasSubAtom: false,
        type: 'subtitle',
    }

    const titleBlock: IStructure = {
        hasParameter: true,
        hasSubAtom: false,
        mandatory: true,
        type: 'title',
    }

    const sectionMetaBlock: IStructure = {
        hasParameter: false,
        hasSubAtom: {
            getMandatorySubAtoms() {
                return [ titleBlock ];
            },
            getStructureForSubAtom(name) {
                switch (name) {
                    case 'title':
                        return titleBlock;

                    case 'subtitle':
                        return subtitleBlock;

                    case 'ref-link':
                        return refLinkBlock;

                    case 'include':
                        return includeBlock;
                
                    default:
                        if(name.startsWith('*')) {
                            return commentBlock;
                        }

                        return false;
                }
            },
            isValidSubAtom(name) {
                return (
                    [
                        'title',
                        'subtitle',
                        'ref-link',
                        'include'
                    ].includes(name)
                    || name.startsWith('*')
                );
            },
        },
        type: 'section-meta',
    }

    const tocBlock: IStructure = {
        hasParameter: true,
        hasSubAtom: false,
        type: 'toc',
    }

    const contentBlock: IStructure = {
        hasParameter: false,
        hasSubAtom: {
            getMandatorySubAtoms() { return []; },
            getStructureForSubAtom(name) {
                if (name === 'toc') {
                    return tocBlock;
                }

                if (name.startsWith('*')) {
                    return commentBlock;
                }

                return false;
            },
            isValidSubAtom(name) {
                return (
                    [
                        'toc'
                    ].includes(name)
                    || name.startsWith('*')
                );
            },
        },
        type: 'content',
    }

    const headerBlock: IStructure = {
        hasParameter: true,
        hasSubAtom: false,
        type: 'header',
    }

    const doculispBlock: IStructure = {
        hasParameter: false,
        hasSubAtom: {
            getMandatorySubAtoms() { return []; },
            getStructureForSubAtom(name) {
                if(name.startsWith('*')) {
                    return commentBlock;
                }

                if(name.replaceAll('#', '').length === 0) {
                    return headerBlock;
                }

                if(name === 'content') {
                    return contentBlock;
                }

                if(name === 'section-meta') {
                    return sectionMetaBlock;
                }

                return false;
            },
            isValidSubAtom(name) {
                return (
                    name.startsWith('*')
                    || name.replaceAll('#', '').length === 0
                    || name === 'content'
                    || name === 'section-meta'
                );
            },
        },
        type: 'dl',
    }

    return doculispBlock;
}

const structureLoader: IRegisterable = {
    builder: () => buildStructure(),
    name: 'structure',
    dependencies: [],
    singleton: true
};

export {
    structureLoader,
};