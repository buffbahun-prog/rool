import { downloadTextAsFile } from './utils/download.js';
import { charCount, lineCount, toAlternatigCase, toCapitalizedCase, toInverseCase, toLowerCase, toSentenceCase, toTitleCase, toUpperCase, wordCount } from './utils/text-converter.js';
const url = new URL(window.location.href);
const pathSegments = url.pathname.split("/").filter(Boolean);
const caseConvertSubPaths = [
    "sentence-case",
    "lower-case",
    "upper-case",
    "capitalized-case",
    "title-case",
    "alternating-case",
    "inverse-case",
];
const textUtilitySubPaths = [
    "word-count",
    "case-convert",
    ...caseConvertSubPaths,
];
function main() {
    if (pathSegments.length === 2 && pathSegments[0] === "text" && textUtilitySubPaths.includes(pathSegments[1])) {
        const inputTextareaElm = document.getElementById("chrInp");
        const outputTextareaElm = document.getElementById("chrOutTextElm");
        const characterCountElm = document.getElementById("chrOut");
        const wordCountElm = document.getElementById("wrdOut");
        const lineCountElm = document.getElementById("lineOut");
        const copyBtnElm = document.getElementById("copyBtn");
        const shareBtnElm = document.getElementById("shareBtn");
        const downloadBtnElm = document.getElementById("downloadBtn");
        const clearBtnElm = document.getElementById("clearBtn");
        const scElement = { el: document.getElementById("sc"), convertCase: "sentence-case" };
        const lcElement = { el: document.getElementById("lc"), convertCase: "lower-case" };
        const ucElement = { el: document.getElementById("uc"), convertCase: "upper-case" };
        const ccElement = { el: document.getElementById("cc"), convertCase: "capitalized-case" };
        const tcElement = { el: document.getElementById("tc"), convertCase: "title-case" };
        const acElement = { el: document.getElementById("ac"), convertCase: "alternating-case" };
        const icElement = { el: document.getElementById("ic"), convertCase: "inverse-case" };
        [scElement, lcElement, ucElement, ccElement, tcElement, acElement, icElement].forEach(elmnt => {
            if (elmnt.el && inputTextareaElm) {
                elmnt.el.addEventListener("click", () => {
                    updateCaseConvertUI(inputTextareaElm, elmnt.convertCase, inputTextareaElm.value);
                });
            }
        });
        let prevCharCount = 0;
        let prevWordCount = 0;
        let prevLineCount = 0;
        if (!inputTextareaElm)
            return;
        inputTextareaElm.addEventListener("input", () => {
            if (outputTextareaElm && caseConvertSubPaths.includes(pathSegments[1])) {
                updateCaseConvertUI(outputTextareaElm, pathSegments[1], inputTextareaElm.value);
            }
            const consideringTextareaElm = outputTextareaElm ? outputTextareaElm : inputTextareaElm;
            const currentCharCount = charCount(consideringTextareaElm.value);
            const currentWordCount = wordCount(consideringTextareaElm.value);
            const currentLineCount = lineCount(consideringTextareaElm.value);
            if (characterCountElm && (prevCharCount !== currentCharCount)) {
                updateCountUI(characterCountElm, currentCharCount.toString());
                prevCharCount = currentCharCount;
            }
            if (wordCountElm && (prevWordCount !== currentWordCount)) {
                updateCountUI(wordCountElm, currentWordCount.toString());
                prevWordCount = currentWordCount;
            }
            if (lineCountElm && (prevLineCount !== currentLineCount)) {
                updateCountUI(lineCountElm, currentLineCount.toString());
                prevLineCount = currentLineCount;
            }
            if (copyBtnElm) {
                copyBtnElm.addEventListener("click", () => {
                    const textValue = consideringTextareaElm.value;
                    if (!textValue)
                        return;
                    navigator.clipboard
                        .writeText(textValue);
                });
            }
            if (shareBtnElm) {
                shareBtnElm.addEventListener("click", async () => {
                    const textValue = consideringTextareaElm.value;
                    if (!textValue)
                        return;
                    await navigator.share({
                        title: "Transformed Text",
                        text: textValue,
                    });
                });
            }
            if (downloadBtnElm) {
                downloadBtnElm.addEventListener("click", () => {
                    const textValue = consideringTextareaElm.value;
                    if (!textValue)
                        return;
                    downloadTextAsFile(textValue);
                });
            }
            if (clearBtnElm) {
                clearBtnElm.addEventListener("click", () => {
                    inputTextareaElm.value = "";
                    if (outputTextareaElm)
                        outputTextareaElm.value = "";
                    if (characterCountElm)
                        characterCountElm.textContent = "0";
                    if (wordCountElm)
                        wordCountElm.textContent = "0";
                    if (lineCountElm)
                        lineCountElm.textContent = "0";
                });
            }
        });
    }
}
main();
function updateCountUI(el, value) {
    el.textContent = value;
    el.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(2)', offset: 0.5 },
        { transform: 'scale(1)' }
    ], {
        duration: 200,
        easing: 'ease-out'
    });
}
function updateCaseConvertUI(el, convertCaseTo, inputTextValue) {
    switch (convertCaseTo) {
        case "sentence-case": {
            el.value = toSentenceCase(inputTextValue);
            break;
        }
        case "lower-case": {
            el.value = toLowerCase(inputTextValue);
            break;
        }
        case "upper-case": {
            el.value = toUpperCase(inputTextValue);
            break;
        }
        case "capitalized-case": {
            el.value = toCapitalizedCase(inputTextValue);
            break;
        }
        case "title-case": {
            el.value = toTitleCase(inputTextValue);
            break;
        }
        case "alternating-case": {
            el.value = toAlternatigCase(inputTextValue);
            break;
        }
        case "inverse-case": {
            el.value = toInverseCase(inputTextValue);
            break;
        }
    }
}
