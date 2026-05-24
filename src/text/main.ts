import { downloadTextAsFile } from './utils/download';
import { charCount, generateSlug, lineCount, toAlternatigCase, toCapitalizedCase, toInverseCase, toLowerCase, toSentenceCase, toTitleCase, toUpperCase, wordCount } from './utils/text-converter';
import { formNSentences, formParagraphs, formSentence } from './word-generator';

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

type caseConvertTypes = "sentence-case" | "lower-case" | "upper-case" | "capitalized-case" | "title-case" | "alternating-case" | "inverse-case";

const textUtilitySubPaths = [
  "word-count",
  "case-convert",
  "slug-generator",
  "lorem-ipsum-generator",
  "nepali-lorem-ipsum-generator",
  ...caseConvertSubPaths,
];

function main() {
  if (pathSegments.length === 2 && pathSegments[0] === "text" && textUtilitySubPaths.includes(pathSegments[1])) {
    const inputTextareaElm = document.getElementById("chrInp") as HTMLTextAreaElement | null;
    const outputTextareaElm = document.getElementById("chrOutTextElm") as HTMLTextAreaElement | null;
    const consideringTextareaElm = outputTextareaElm ? outputTextareaElm : inputTextareaElm;
    const allTextAreaElms = [inputTextareaElm, outputTextareaElm];

    if (consideringTextareaElm) updateActionUI(consideringTextareaElm, allTextAreaElms);

    const scElement: {el: HTMLElement | null; convertCase: caseConvertTypes} = {el: document.getElementById("sc"), convertCase: "sentence-case"};
    const lcElement: {el: HTMLElement | null; convertCase: caseConvertTypes} = {el: document.getElementById("lc"), convertCase: "lower-case"};
    const ucElement: {el: HTMLElement | null; convertCase: caseConvertTypes} = {el: document.getElementById("uc"), convertCase: "upper-case"};
    const ccElement: {el: HTMLElement | null; convertCase: caseConvertTypes} = {el: document.getElementById("cc"), convertCase: "capitalized-case"};
    const tcElement: {el: HTMLElement | null; convertCase: caseConvertTypes} = {el: document.getElementById("tc"), convertCase: "title-case"};
    const acElement: {el: HTMLElement | null; convertCase: caseConvertTypes} = {el: document.getElementById("ac"), convertCase: "alternating-case"};
    const icElement: {el: HTMLElement | null; convertCase: caseConvertTypes} = {el: document.getElementById("ic"), convertCase: "inverse-case"};

    [scElement, lcElement, ucElement, ccElement, tcElement, acElement, icElement].forEach(elmnt => {
      if (elmnt.el && consideringTextareaElm) {
        elmnt.el.addEventListener("click", () => {
          updateCaseConvertUI(consideringTextareaElm, elmnt.convertCase, consideringTextareaElm.value);
        });
      }
    });

    // For lorem ipsum generator --------------------------------------------
    const generatorCountInpElm = document.getElementById("genCount") as HTMLInputElement | null;
    const generatorButtonElm = document.getElementById("genBtn");

    if (generatorCountInpElm && generatorButtonElm && consideringTextareaElm) {
      generatorButtonElm.addEventListener("click", () => {
        const selectedElm = document.querySelector('input[name="genType"]:checked') as HTMLInputElement | null;
        if (!selectedElm || !selectedElm.value) return;
        if (!generatorCountInpElm.value || +generatorCountInpElm.value <= 0 || +generatorCountInpElm.value > 100) {
          popoverUI("error", "The \"Amount to generate\" field is required and should be between 1 to 100.");
          return;
        }
        const lang = pathSegments[1] === "lorem-ipsum-generator" ? "eng" : "nep";
        const selectedGenerateType = selectedElm.value as "paragraph" | "sentence" | "word";
        updateDummyGeneratorUI(consideringTextareaElm, selectedGenerateType, Number(generatorCountInpElm.value), lang)
        updateCountUI(consideringTextareaElm);
      });
    }
    // For lorem ipsum generator --------------------------------------------

    if (inputTextareaElm) {
      inputTextareaElm.addEventListener("input", () => {
        if (outputTextareaElm && caseConvertSubPaths.includes(pathSegments[1])) {
          updateCaseConvertUI(outputTextareaElm, pathSegments[1] as caseConvertTypes, inputTextareaElm.value);
        }

        if (outputTextareaElm && pathSegments[1] === "slug-generator") {
          outputTextareaElm.value = generateSlug(inputTextareaElm.value);
        }

        if(consideringTextareaElm) updateCountUI(consideringTextareaElm);
      });
    }
    
  }
}

main();

function updateCountUI(textElm: HTMLTextAreaElement) {
  const characterCountElm = document.getElementById("chrOut");
  const wordCountElm = document.getElementById("wrdOut");
  const lineCountElm = document.getElementById("lineOut");

  const currentCharCount = charCount(textElm.value);
  const currentWordCount = wordCount(textElm.value);
  const currentLineCount = lineCount(textElm.value);

  const changedElm: HTMLElement[] = []

  if (characterCountElm && currentCharCount !== Number(characterCountElm.textContent)) {
    characterCountElm.textContent = currentCharCount.toString();
    changedElm.push(characterCountElm);
  }
  if (wordCountElm && currentWordCount !== Number(wordCountElm.textContent)) {
    wordCountElm.textContent = currentWordCount.toString();
    changedElm.push(wordCountElm);
  }
  if (lineCountElm && currentLineCount !== Number(lineCountElm.textContent)) {
    lineCountElm.textContent = currentLineCount.toString();
    changedElm.push(lineCountElm);
  }

  changedElm.forEach(el => el.animate([
    { transform: 'scale(1)' },
      { transform: 'scale(2)', offset: 0.5 },
      { transform: 'scale(1)' }
      ], {
      duration: 200,
      easing: 'ease-out'
  }));
}

function updateCaseConvertUI(el: HTMLTextAreaElement, convertCaseTo: caseConvertTypes, inputTextValue: string) {
  switch (convertCaseTo) {
    case "sentence-case": {
      el.value = toSentenceCase(inputTextValue);
      break;
    } case "lower-case": {
      el.value = toLowerCase(inputTextValue);
      break;
    } case "upper-case": {
      el.value = toUpperCase(inputTextValue);
      break;
    } case "capitalized-case": {
      el.value = toCapitalizedCase(inputTextValue);
      break;
    } case "title-case": {
      el.value = toTitleCase(inputTextValue);
      break;
    } case "alternating-case": {
      el.value = toAlternatigCase(inputTextValue);
      break;
    } case "inverse-case": {
      el.value = toInverseCase(inputTextValue);
      break;
    }
  }
}

function popoverUI(type: "error" | "success", message: string) {
  if (type === "error") {
    const errorPopoverElm = document.getElementById("errorPop");
    const errorMessageElm = document.getElementById("errPopMsg");

    if (!errorPopoverElm || !errorMessageElm) return;
    errorPopoverElm.classList.remove("show");
    errorPopoverElm.classList.add("show");
    errorMessageElm.textContent = message;

    const keyframes = [
      { transform: 'translateX(200px)', opacity: 0 },
      { transform: 'translateX(0px)', opacity: 1 },
    ];

    const options = {
      duration: 500,
      iterations: 1,
      easing: 'ease-in-out'
    };

    errorPopoverElm.animate(keyframes, options);
    setTimeout(() => {
      const dissaperKeyframe = [
        { transform: 'translateX(0px)', opacity: 1 },
        { transform: 'translateX(200px)', opacity: 0 },
      ];

      const dissaperAnim = errorPopoverElm.animate(dissaperKeyframe, options);
      dissaperAnim.onfinish = () => {
        errorPopoverElm.classList.remove("show");
      };
    }, 5000);
  }

}

function updateDummyGeneratorUI(el: HTMLTextAreaElement, type: "paragraph" | "sentence" | "word", count: number, lang: "nep" | "eng") {
  let dummyText = "";
  if (type === "paragraph") {
    dummyText = formParagraphs(count, lang);
  } else if (type === "sentence") {
    dummyText = formNSentences(count, lang);
  } else {
    dummyText = formSentence(count, lang);
  }

  el.value = toSentenceCase(dummyText.trim());
}

function updateActionUI(consideringTextareaElm: HTMLTextAreaElement, allTextAreaElms: (HTMLTextAreaElement | null)[]) {
  const copyBtnElm = document.getElementById("copyBtn");
  const shareBtnElm = document.getElementById("shareBtn");
  const downloadBtnElm = document.getElementById("downloadBtn");
  const clearBtnElm = document.getElementById("clearBtn");

  if (copyBtnElm) {
    copyBtnElm.addEventListener("click", () => {
      const textValue = consideringTextareaElm.value;
      if (!textValue) return;
      navigator.clipboard
        .writeText(textValue);
    });
  }

  if (shareBtnElm) {
    shareBtnElm.addEventListener("click", async () => {
        const textValue = consideringTextareaElm.value;
        if (!textValue) return;
        await navigator.share({
            title: "Transformed Text",
            text: textValue,
        });
    });
  }
  
  if (downloadBtnElm) {
    downloadBtnElm.addEventListener("click", () => {
        const textValue = consideringTextareaElm.value;
        if (!textValue) return;
        downloadTextAsFile(textValue);
    });
  }
  
  if (clearBtnElm) {
    clearBtnElm.addEventListener("click", () => {
      allTextAreaElms.forEach(el => {
        if (el) el.value = "";
      });
      updateCountUI(consideringTextareaElm);
    });
  }

}