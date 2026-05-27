import { removeDuplicateLines } from "./dublicate-line-removee";
import { fisherYatesShuffle, isEmptyLine } from "./shared";

export type SortType = "natural" | "alphabetic" | "numeric" | "byLen" | "random";
export interface TextSortOptions {
    sortType: SortType;
    isCaseSensitive: boolean;
    trimWhitespace: boolean;
    removeEmptyLines: boolean;
    reverse: boolean;
    removeDuplicate: boolean;
}

export function sortText(textCont: string, sortOptions: TextSortOptions) {
  const {sortType, isCaseSensitive, trimWhitespace, removeEmptyLines, reverse, removeDuplicate} = sortOptions;
  textCont = textCont.replace(/\r\n/g, "\n");
  textCont = textCont.normalize("NFC");
  textCont = textCont.replace(/\u200B/g, "");

  const emptyLinesIndex: number[] = [];

  const lines = textCont.split("\n").map(line => {
    let ouptupLine = line;
    if (trimWhitespace) ouptupLine = ouptupLine.trim();
    return ouptupLine; 
  }).filter((line, indx) => {
    // if (removeEmptyLines && (!line || isEmptyLine(line))) return false;
    if (!line || isEmptyLine(line)) {
      emptyLinesIndex.push(indx);
      return false;
    }
    return true;
  });

  const segmenter = new Intl.Segmenter(undefined, {
    granularity: "grapheme"
  });

  if (sortType === "natural") {
    reverse ? lines.sort((a, b) => b.localeCompare(a, undefined, {
        numeric: true,
        sensitivity: isCaseSensitive ? 'variant' : 'base',
    })) : lines.sort((a, b) => a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: isCaseSensitive ? 'variant' : 'base',
    }));
  } else if (sortType === "alphabetic") {
    reverse ? lines.sort((a, b) => b.localeCompare(a, undefined, {
        sensitivity: isCaseSensitive ? 'variant' : 'base',
    })) : lines.sort((a, b) => a.localeCompare(b, undefined, {
        sensitivity: isCaseSensitive ? 'variant' : 'base',
    }));
  } else if (sortType === "numeric") {
    reverse ? lines.sort((a, b) => Number(b) - Number(a))
    : lines.sort((a, b) => Number(a) - Number(b));
  } else if (sortType === "byLen") {
    reverse ? lines.sort((a, b) => [...segmenter.segment(b)].length - [...segmenter.segment(a)].length)
    : lines.sort((a, b) => [...segmenter.segment(a)].length - [...segmenter.segment(b)].length);
  } else if (sortType === "random") {
    // reversing it or not doesnt affect as it is random
    fisherYatesShuffle(lines);
  }

  if (!removeEmptyLines) {
    for (const indx of emptyLinesIndex) {
        lines.splice(indx, 0, "");
    }
  }

  if (removeDuplicate) {
    return removeDuplicateLines(lines.join("\n"), isCaseSensitive, trimWhitespace, removeEmptyLines);
  }

  return lines.join("\n");
}