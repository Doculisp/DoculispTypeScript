import { IDictionary, IRegisterable } from "../types/types.containers";
import { TextHelper } from "../types/types.textHelpers";

function isLetter(charCode: number) : Boolean {
    if(charCode == 45) {
        return true;
    }

    //latin
    if(48 <= charCode && charCode <= 57) {
        return true;
    }

    if(65 <= charCode && charCode <= 90) {
        return true;
    }

    if(97 <= charCode && charCode <= 122) {
        return true;
    }

    //latin supplement
    if(192 <= charCode && charCode <= 246) {
        return true;
    }

    if(248 <= charCode && charCode <= 255) {
        return true;
    }

    //latin extend-a
    if(256 <= charCode && charCode <= 305) {
        return true;
    }

    if(308 <= charCode && charCode <= 337) {
        return true;
    }

    if(340 <= charCode && charCode <= 383) {
        return true;
    }

    //latin extend-b
    if(384 <= charCode && charCode <= 591) {
        return true;
    }

    //latin ipa
    if(592 <= charCode && charCode <= 685) {
        return true;
    }

    //diacritical marks
    if(768 <= charCode && charCode <= 879) {
        return true;
    }

    //creek and coptic
    if(880 <= charCode && charCode <= 883) {
        return true;
    }

    if(886 <= charCode && charCode <= 887) {
        return true;
    }

    if(902 == charCode) {
        return true;
    }

    if(904 <= charCode && charCode <= 974) {
        return true;
    }

    if(984 <= charCode && charCode <= 1007) {
        return true;
    }

    if(1015 <= charCode && charCode <= 1016) {
        return true;
    }

    if(1018 <= charCode && charCode <= 1019) {
        return true;
    }

    //Cyrillic / Slavonic / Slavic
    if(1024 <= charCode && charCode <= 1153) {
        return true;
    }

    if(1162 <= charCode && charCode <= 1187) {
        return true;
    }

    if(1190 <= charCode && charCode <= 1203) {
        return true;
    }

    if(1206 <= charCode && charCode <= 1235) {
        return true;
    }

    if(1238 < charCode && charCode <= 1279) {
        return true;
    }

    //Cyrillic Supplement
    if(1280 <= charCode && charCode <= 1319) {
        return true;
    }

    return false;
}

function toLinkText(word: string): string {
    let start = word.toLowerCase().replaceAll(' ', '-');
    let toRemove = containsSymbols(start);

    if(!toRemove) {
        return start;
    }

    toRemove.forEach(r => start = start.replaceAll(r, ''))
    return start;
}

function containsSymbols(word: string): string[] | false {
    let toRemove: string[] = [];
    let newWord = word;

    for (let index = 0; index < newWord.length; index++) {
        const c = newWord.codePointAt(index);
        if(!c || isLetter(c)) {
            continue;
        }

        toRemove.push(newWord[index] as string)
    }

    if(toRemove.length == 0) {
        return false;
    }

    return toRemove;
}

function isLowercase(word: string): boolean {
    return (word === word.toLocaleLowerCase())
}

function symbolLocation(word: string): IDictionary<number>|false {
    let table : IDictionary<number> = {};
    let found = false;

    let bad = containsSymbols(word);

    if(!bad) {
        return false;
    }

    bad.forEach(s => {
        if(!!table[s]) {
            return;
        }

        table[s] = word.indexOf(s) + 1;
        found = true;
    });

    if(found) {
        return table;
    }

    return false;
}

function build(): TextHelper {
    return {
        isLetter,
        toLinkText,
        containsSymbols,
        isLowercase,
        symbolLocation,
    }
}

const registerable: IRegisterable = {
    builder: build,
    name: 'textHelpers',
    singleton: true,
};

export {
    registerable,
};