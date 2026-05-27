import { isEmptyLine } from "./shared.js";
export function removeDuplicateLines(textCont, caseSensitive, trimWhitespace, emptyLinesRemove) {
    textCont = textCont.replace(/\r\n/g, "\n");
    textCont = textCont.normalize("NFC");
    textCont = textCont.replace(/\u200B/g, "");
    const lines = textCont.split("\n").map(line => {
        let ouptupLine = line;
        if (trimWhitespace)
            ouptupLine = ouptupLine.trim();
        return ouptupLine;
    }).filter(line => {
        if (emptyLinesRemove && (!line || isEmptyLine(line)))
            return false;
        else
            return true;
    });
    const segmenter = new Intl.Segmenter(undefined, {
        granularity: "grapheme"
    });
    const collator = new Intl.Collator(undefined, {
        sensitivity: caseSensitive ? 'variant' : 'base',
        numeric: true
    });
    const uniqueLines = [];
    const duplicateIndex = [];
    for (let i = 0; i < lines.length; i++) {
        if (duplicateIndex.includes(i))
            continue;
        const line1 = lines[i];
        if (isEmptyLine(line1)) {
            uniqueLines.push(line1);
            continue;
        }
        for (let j = i + 1; j < lines.length; j++) {
            if (duplicateIndex.includes(j))
                continue;
            const line2 = lines[j];
            if (isEmptyLine(line2)) {
                continue;
            }
            const line1CharList = [...segmenter.segment(line1)].map((sg) => sg.segment);
            const line2CharList = [...segmenter.segment(line2)].map((sg) => sg.segment);
            if (isLinesIdentical(collator, line1CharList, line2CharList)) {
                duplicateIndex.push(j);
            }
        }
        uniqueLines.push(line1);
    }
    return uniqueLines.join("\n");
}
function isCharsIdentical(collator, char1, char2) {
    return collator.compare(char1, char2) === 0;
}
function isLinesIdentical(collator, line1, line2) {
    if (line1.length !== line2.length)
        return false;
    for (let i = 0; i < line1.length; i++) {
        const char1 = line1[i];
        const char2 = line2[i];
        if (!isCharsIdentical(collator, char1, char2))
            return false;
    }
    return true;
}
