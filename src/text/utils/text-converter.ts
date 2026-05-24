const SMALL_WORDS = new Set([
  "a", "an", "the",
  "and", "but", "or", "nor",
  "for", "so", "yet",
  "at", "by", "in", "of",
  "off", "on", "per", "to",
  "up", "via", "as", "is", "am",
  "by",
]);

export function charCount(textCont: string) {
    const segmenter = new Intl.Segmenter(undefined, {
        granularity: "grapheme"
    });

    return [...segmenter.segment(textCont)].length;
}

export function wordCount(textCont: string) {
    const segmenter = new Intl.Segmenter(undefined, {
        granularity: "word"
    });

    return [...segmenter.segment(textCont)]
    .filter(x => x.isWordLike).length;
}

export function lineCount(textCont: string) {
    if (!textCont) return 0;
    return textCont.split(/\r\n|\r|\n/).length;
}

export function toSentenceCase(textCont: string) {
    return textCont
            .toLocaleLowerCase()
            .replace(
                /(^\s*\p{L}|[.!?]\s*\p{L})/gu,
                m => m.slice(0, -1) + m.slice(-1).toLocaleUpperCase()
            ).replace(
                /\s+[i]\s+/gu,
                m => m.toLocaleUpperCase()
            );
}

export function toLowerCase(textCont: string) {
    return textCont
            .toLocaleLowerCase();
}

export function toUpperCase(textCont: string) {
    return textCont
            .toLocaleUpperCase();
}

export function toCapitalizedCase(textCont: string) {
    return textCont
            .toLocaleLowerCase()
            .replace(
                /\b\p{L}/gu,
                char => char.toLocaleUpperCase()
            );
}

export function toTitleCase(textCont: string) {
  
    let wordIndex = 0;

    const words = [...textCont.matchAll(/\p{L}+/gu)];
    const totalWords = words.length;

    return toSentenceCase(textCont).replace(
        /\p{L}+/gu,
        word => {
            const isFirst = wordIndex === 0;
            const isLast = wordIndex === totalWords - 1;

            wordIndex++;

            if (
                !isFirst &&
                !isLast &&
                charCount(word) <= 2 &&
                SMALL_WORDS.has(word)
            ) {
                return word;
            }

            return (
                word.charAt(0).toLocaleUpperCase() +
                word.slice(1)
            );
        }
    );
}

export function toAlternatigCase(textCont: string) {
    let upper = false;

    const segmenter = new Intl.Segmenter(undefined, {
        granularity: "grapheme"
    });

    return [...segmenter.segment(textCont)].map((char) => {
        if (/\p{L}/u.test(char.segment)) {
            const result = upper ? char.segment.toLocaleUpperCase() : char.segment.toLocaleLowerCase();
            upper = !upper;
            return result;
        }

        upper = !upper;

        return char.segment;
    })
    .join("");
}

export function toInverseCase(textCont: string) {
    const segmenter = new Intl.Segmenter(undefined, {
        granularity: "grapheme"
    });

    return [...segmenter.segment(textCont)].map((char) => {
        if (/\p{L}/u.test(char.segment)) {
            return inverseAlphabet(char.segment);
        }

        return char.segment;
    })
    .join("");
}

function inverseAlphabet(char: string) {
    const charCode = char.charCodeAt(0);

    if (charCode >= 65 && charCode <= 90) {
        return String.fromCharCode(charCode + 32);
    } else if (charCode >= 97 && charCode <= 122) {
        return String.fromCharCode(charCode - 32);
    } else {
        return char;
    }
}

export function generateSlug(str: string) {
    const lowerCasedStr = toLowerCase(str.trim());

    let hyphenRepeat = 0;
    const alphaNumHypenedStr = lowerCasedStr.split("").map(char => {
        const charCode = char.charCodeAt(0);
        if ((charCode >= 97 && charCode <= 122) || (charCode >= 48 && charCode <= 57)) {
            return char;
        } else {
            return "-";
        }
    }).filter(char => {
        if (char === "-") {
            hyphenRepeat++;
        } else {
            hyphenRepeat = 0;
        }
        if (hyphenRepeat > 1) return false;
        else return true;
    }).join("");
    if (!alphaNumHypenedStr) return "n-a";
    else return alphaNumHypenedStr;
}