const loremIpsumWordWeightList = [
  { word: "lorem", weight: 12 },
  { word: "ipsum", weight: 12 },
  { word: "et", weight: 12 },
  { word: "id", weight: 12 },
  { word: "dolor", weight: 11 },
  { word: "sit", weight: 11 },
  { word: "amet", weight: 11 },
  { word: "in", weight: 11 },
  { word: "a", weight: 11 },
  { word: "ad", weight: 11 },
  { word: "per", weight: 11 },
  { word: "non", weight: 11 },
  { word: "at", weight: 11 },
  { word: "ut", weight: 11 },
  { word: "vel", weight: 11 },
  { word: "sem", weight: 11 },
  { word: "nec", weight: 11 },
  { word: "hac", weight: 11 },
  { word: "ex", weight: 11 },
  { word: "est", weight: 11 },
  { word: "etiam", weight: 11 },
  { word: "eu", weight: 10 },
  { word: "sed", weight: 10 },
  { word: "quis", weight: 10 },
  { word: "ac", weight: 10 },
  { word: "ante", weight: 10 },
  { word: "leo", weight: 10 },
  { word: "eget", weight: 10 },
  { word: "quam", weight: 10 },
  { word: "odio", weight: 10 },
  { word: "arcu", weight: 10 },
  { word: "donec", weight: 10 },
  { word: "mi", weight: 10 },
  { word: "nisl", weight: 10 },
  { word: "nisi", weight: 10 },
  { word: "enim", weight: 10 },
  { word: "justo", weight: 10 },
  { word: "diam", weight: 10 },
  { word: "nunc", weight: 10 },
  { word: "lectus", weight: 10 },
  { word: "duis", weight: 10 },
  { word: "aenean", weight: 10 },
  { word: "sapien", weight: 10 },
  { word: "integer", weight: 10 },
  { word: "neque", weight: 10 },
  { word: "metus", weight: 10 },
  { word: "eros", weight: 10 },
  { word: "morbi", weight: 10 },
  { word: "augue", weight: 10 },
  { word: "congue", weight: 10 },
  { word: "nulla", weight: 10 },
  { word: "dictum", weight: 10 },
  { word: "elit", weight: 9 },
  { word: "vitae", weight: 9 },
  { word: "dui", weight: 9 },
  { word: "nostra", weight: 9 },
  { word: "cras", weight: 9 },
  { word: "felis", weight: 9 },
  { word: "porta", weight: 9 },
  { word: "libero", weight: 9 },
  { word: "massa", weight: 9 },
  { word: "velit", weight: 9 },
  { word: "risus", weight: 9 },
  { word: "praesent", weight: 9 },
  { word: "mauris", weight: 9 },
  { word: "proin", weight: 9 },
  { word: "volutpat", weight: 9 },
  { word: "tempus", weight: 9 },
  { word: "ligula", weight: 9 },
  { word: "tellus", weight: 9 },
  { word: "varius", weight: 9 },
  { word: "purus", weight: 9 },
  { word: "viverra", weight: 9 },
  { word: "convallis", weight: 9 },
  { word: "semper", weight: 9 },
  { word: "aliquet", weight: 9 },
  { word: "pretium", weight: 9 },
  { word: "facilisis", weight: 9 },
  { word: "vehicula", weight: 9 },
  { word: "cursus", weight: 9 },
  { word: "condimentum", weight: 9 },
  { word: "consectetur", weight: 8 },
  { word: "adipiscing", weight: 8 },
  { word: "erat", weight: 8 },
  { word: "urna", weight: 8 },
  { word: "nibh", weight: 8 },
  { word: "magna", weight: 8 },
  { word: "turpis", weight: 8 },
  { word: "tempor", weight: 8 },
  { word: "aliquam", weight: 8 },
  { word: "pulvinar", weight: 8 },
  { word: "curabitur", weight: 8 },
  { word: "faucibus", weight: 8 },
  { word: "dapibus", weight: 8 },
  { word: "luctus", weight: 8 },
  { word: "interdum", weight: 8 },
  { word: "malesuada", weight: 8 },
  { word: "lacinia", weight: 8 },
  { word: "fermentum", weight: 8 },
  { word: "molestie", weight: 8 },
  { word: "maecenas", weight: 8 },
  { word: "vivamus", weight: 8 },
  { word: "egestas", weight: 8 },
  { word: "rutrum", weight: 8 },
  { word: "pellentesque", weight: 8 },
  { word: "sagittis", weight: 8 },
  { word: "sodales", weight: 8 },
  { word: "platea", weight: 8 },
  { word: "porttitor", weight: 8 },
  { word: "tristique", weight: 8 },
  { word: "placerat", weight: 8 },
  { word: "lacus", weight: 8 },
  { word: "euismod", weight: 8 },
  { word: "auctor", weight: 8 },
  { word: "iaculis", weight: 8 },
  { word: "mollis", weight: 8 },
  { word: "accumsan", weight: 8 },
  { word: "maximus", weight: 8 },
  { word: "nullam", weight: 7 },
  { word: "elementum", weight: 7 },
  { word: "orci", weight: 7 },
  { word: "vestibulum", weight: 7 },
  { word: "pharetra", weight: 7 },
  { word: "gravida", weight: 7 },
  { word: "feugiat", weight: 7 },
  { word: "mattis", weight: 7 },
  { word: "litora", weight: 7 },
  { word: "rhoncus", weight: 7 },
  { word: "posuere", weight: 7 },
  { word: "ultrices", weight: 7 },
  { word: "eleifend", weight: 7 },
  { word: "bibendum", weight: 7 },
  { word: "primis", weight: 7 },
  { word: "cubilia", weight: 7 },
  { word: "curae", weight: 7 },
  { word: "ullamcorper", weight: 7 },
  { word: "fusce", weight: 7 },
  { word: "tortor", weight: 7 },
  { word: "hendrerit", weight: 7 },
  { word: "ornare", weight: 7 },
  { word: "blandit", weight: 7 },
  { word: "tincidunt", weight: 7 },
  { word: "consequat", weight: 7 },
  { word: "commodo", weight: 7 },
  { word: "efficitur", weight: 7 },
  { word: "dignissim", weight: 7 },
  { word: "suscipit", weight: 7 },
  { word: "suspendisse", weight: 7 },
  { word: "scelerisque", weight: 7 },
  { word: "laoreet", weight: 6 },
  { word: "ultricies", weight: 6 },
  { word: "lobortis", weight: 6 },
  { word: "taciti", weight: 6 },
  { word: "conubia", weight: 6 },
  { word: "phasellus", weight: 6 },
  { word: "fringilla", weight: 6 },
  { word: "vulputate", weight: 6 },
  { word: "finibus", weight: 6 },
  { word: "imperdiet", weight: 6 },
  { word: "fames", weight: 6 },
  { word: "venenatis", weight: 6 },
  { word: "sollicitudin", weight: 6 },
  { word: "habitasse", weight: 6 },
  { word: "dictumst", weight: 6 },
  { word: "class", weight: 5 },
  { word: "aptent", weight: 5 },
  { word: "sociosqu", weight: 5 },
  { word: "torquent", weight: 5 },
  { word: "inceptos", weight: 5 },
  { word: "himenaeos", weight: 5 }
];

const nepaliWordWeightList = [
  { word: "र", weight: 600 },
  { word: "इति", weight: 546 },
  { word: "पनि", weight: 515 },
  {word: "रन्जिता", weight: 510},
  {word: "प्रथम", weight: 505},
  { word: "असिम", weight: 500 },
  { word: "छ", weight: 476 },
  { word: "हे", weight: 459 },
  { word: "यो", weight: 321 },
  { word: "त्यो", weight: 292 },
  { word: "म", weight: 245 },
  { word: "ती", weight: 231 },
  { word: "सबै", weight: 210 },
  { word: "त", weight: 200 },
  { word: "तथा", weight: 199 },
  { word: "भएका", weight: 196 },
  { word: "गरी", weight: 190 },
  { word: "भएको", weight: 187 },
  { word: "गर्ने", weight: 165 },
  { word: "न", weight: 165 },
  { word: "हो", weight: 156 },
  { word: "भन्नुभयो", weight: 155 },
  { word: "थियो", weight: 152 },
  { word: "भयो", weight: 152 },
  { word: "भएर", weight: 147 },
  { word: "भनी", weight: 147 },
  { word: "त्यस", weight: 144 },
  { word: "अध्याय", weight: 143 },
  { word: "उवाच", weight: 142 },
  { word: "गरेर", weight: 136 },
  { word: "त्यसपछि", weight: 135 },
  { word: "वर", weight: 134 },
  { word: "नमस्कार", weight: 132 },
  { word: "भने", weight: 130 },
  { word: "अगस्त्य", weight: 123 },
  { word: "एक", weight: 121 },
  { word: "गरे", weight: 117 },
  { word: "अत्यन्त", weight: 115 },
  { word: "कुरा", weight: 112 },
  { word: "हुन्छ", weight: 111 },
  { word: "हिमालयदिक्पाल", weight: 110 },
  { word: "धारण", weight: 109 },
  { word: "तिमी", weight: 108 },
  { word: "भगवान्‌", weight: 108 },
  { word: "यहाँ", weight: 106 },
  { word: "नै", weight: 105 },
  { word: "ति", weight: 105 },
  { word: "गर्न", weight: 104 },
  { word: "मुनि", weight: 103 },
  { word: "फल", weight: 102 },
  { word: "सम्पूर्ण", weight: 101 },
  { word: "नाम", weight: 99 },
  { word: "श्री", weight: 97 },
  { word: "तपस्या", weight: 97 },
  { word: "तहाँ", weight: 97 },
  { word: "थिए", weight: 96 },
  { word: "हिमवत्खण्ड", weight: 96 },
  { word: "युक्त", weight: 96 },
  { word: "गर्दा", weight: 95 },
  { word: "गरेको", weight: 94 },
  { word: "प्राप्त", weight: 93 },
  { word: "आफ्नो", weight: 92 },
  { word: "भई", weight: 90 },
  { word: "स्कन्द", weight: 84 },
  { word: "गर्नुभयो", weight: 84 },
  { word: "कार्तिक", weight: 82 },
  { word: "छन्‌", weight: 81 },
  { word: "मलाई", weight: 76 },
  { word: "हुन्‌", weight: 76 },
  { word: "गर्दै", weight: 76 },
  { word: "भए", weight: 76 },
  { word: "प्रकरण", weight: 76 },
  { word: "लिएर", weight: 75 },
  { word: "ब्रह्माजीले", weight: 75 },
  { word: "मेरो", weight: 74 },
  { word: "नमः", weight: 74 },
  { word: "यस", weight: 72 },
  { word: "सुनेर", weight: 72 },
  { word: "आफ्ना", weight: 70 },
  { word: "रूप", weight: 70 },
  { word: "धेरै", weight: 66 },
  { word: "सब्‌", weight: 66 },
  { word: "जुन", weight: 65 },
  { word: "पुत्र", weight: 65 },
  { word: "पर्वत", weight: 64 },
  { word: "जो", weight: 64 },
  { word: "देवता", weight: 63 },
  { word: "त्यहाँ", weight: 62 },
  { word: "उत्तम", weight: 62 },
  { word: "रुद्राक्ष", weight: 62 },
  { word: "के", weight: 61 },
  { word: "हजुरलाई", weight: 61 },
  { word: "सुन्दर", weight: 60 },
  { word: "स्नान", weight: 59 },
  { word: "लागि", weight: 58 },
  { word: "उसले", weight: 58 },
  { word: "शरीर", weight: 58 },
  { word: "भनेर", weight: 58 },
  { word: "पूजा", weight: 58 },
  { word: "दिव्य", weight: 58 },
  { word: "योजन", weight: 58 },
  { word: "एवं", weight: 57 },
  { word: "घरी", weight: 56 },
  { word: "छैन", weight: 55 },
  { word: "केही", weight: 55 },
  { word: "फेरि", weight: 55 },
  { word: "सब", weight: 55 },
  { word: "सधैँ", weight: 55 },
  { word: "महाँ", weight: 55 },
  { word: "विभिन्न", weight: 54 },
  { word: "अनि", weight: 53 },
  { word: "तिम्रो", weight: 53 },
  { word: "ठूलो", weight: 52 },
  { word: "मुक्त", weight: 52 },
  { word: "साथ", weight: 52 },
  { word: "जब", weight: 52 },
  { word: "देखेर", weight: 51 },
  { word: "मुने", weight: 51 },
  { word: "सृष्टि", weight: 51 },
  { word: "फेर", weight: 51 },
  { word: "भन्ने", weight: 50 },
  { word: "भन्यो", weight: 50 },
  { word: "नमो", weight: 50 },
  { word: "हामी", weight: 49 },
  { word: "यसरी", weight: 49 },
  { word: "हिमालय", weight: 49 },
  { word: "गरेका", weight: 48 },
  { word: "दिन", weight: 48 },
  { word: "रहेको", weight: 47 },
  { word: "त्यसको", weight: 47 },
  { word: "स्तुति", weight: 47 },
  { word: "गई", weight: 47 },
  { word: "तिमीले", weight: 46 },
  { word: "प्रसन्न", weight: 46 },
  { word: "इच्छा", weight: 45 },
  { word: "कुनै", weight: 45 },
  { word: "यदि", weight: 44 },
  { word: "हुँदै", weight: 44 },
  { word: "शिखरमा", weight: 44 },
  { word: "पाठ", weight: 43 },
  { word: "अब", weight: 43 },
  { word: "तर", weight: 37 },
  { word: "अघि", weight: 37 },
  { word: "बारम्बार", weight: 37 },
  { word: "ब्रह्मा", weight: 37 },
  { word: "राजा", weight: 37 },
  { word: "अरू", weight: 36 },
  { word: "तिमीलाई", weight: 36 },
  { word: "बसेर", weight: 36 },
  { word: "हुनुहुन्छ", weight: 36 },
  { word: "निर्माता", weight: 1 },
  { word: "चाहन्छै", weight: 1 },
  { word: "नेत्रको", weight: 1 },
  { word: "किरण", weight: 1 },
  { word: "भगवान", weight: 1 },
  { word: "तपाइँलाई", weight: 1 },
  { word: "तपाईंसँगै", weight: 1 },
  { word: "वेदज्ञ", weight: 1 },
  { word: "भोग्नेछ", weight: 1 },
  { word: "विलीन", weight: 1 },
  { word: "सञ्जनता", weight: 1 },
  { word: "स्वभाव", weight: 1 },
  { word: "विथिलि", weight: 1 },
  { word: "पुकार्‌", weight: 1 },
  { word: "स्वास", weight: 1 },
  { word: "भाग्यमानि", weight: 1 },
  { word: "खुशीसित", weight: 1 },
  { word: "उपवास्‌", weight: 1 },
  { word: "तिलक", weight: 1 },
  { word: "सन्मान", weight: 1 },
  { word: "पाउँला", weight: 1 },
  { word: "चाहिन्छन्‌", weight: 1 },
  { word: "खोलेर", weight: 1 },
  { word: "उहिबखत्‌", weight: 1 },
  { word: "लहडमा", weight: 1 },
  { word: "गुरुका", weight: 1 },
  { word: "सङ्मा", weight: 1 },
  { word: "गतीले", weight: 1 },
  { word: "आयोजन", weight: 1 },
  { word: "सन्तोषले", weight: 1 },
  { word: "गरिकन", weight: 1 },
  { word: "पाल्नू", weight: 1 },
  { word: "भाग्योदय", weight: 1 },
  { word: "झरी", weight: 1 },
  { word: "प्रेमका", weight: 1 },
  { word: "सागरमा", weight: 1 },
  { word: "नित्यै", weight: 1 },
  { word: "सञ्जन", weight: 1 },
  { word: "रचित", weight: 1 },
  { word: "मान्दीन", weight: 1 },
  { word: "एकरति", weight: 1 },
  { word: "मान्दछन्‌", weight: 1 },
  { word: "त्यसतै", weight: 1 },
  { word: "जनहरूलाइ", weight: 1 },
  { word: "मान्छ्रन्‌", weight: 1 },
  { word: "यहाँ", weight: 1 },
  { word: "तिमिहेरुलाइ", weight: 1 },
  { word: "सुल्क", weight: 1 },
  { word: "रतिभर", weight: 1 },
  { word: "साथ्‌", weight: 1 },
  { word: "गरिलिन्छ", weight: 1 },
  { word: "मनपरि", weight: 1 },
];

const nepaliFullStop = "।";

enum Sentences {
    Short,
    Medium,
    Long,
}

const sentenceWeight = [
    {sentence: Sentences.Medium, weight: 60, min: 9, max: 16,},
    {sentence: Sentences.Short, weight: 25, min: 4, max: 8,},
    {sentence: Sentences.Long, weight: 15, min: 17, max: 28,},
];

const sentenceEndPuncuationWeight = [
    {puncuation: ".", weight: 80},
    {puncuation: "?", weight: 5},
    {puncuation: ";", weight: 5},
    {puncuation: ":", weight: 3},
    {puncuation: "!", weight: 2},
];

const commanWeight = [
    {addComma: false, weight: 60},
    {addComma: true, weight: 40},
];

const paragraphSentenceWeight = [
  { sentences: 4, weight: 30 },
  { sentences: 3, weight: 20 },
  { sentences: 5, weight: 20 },
  { sentences: 6, weight: 12 },
  { sentences: 2, weight: 10 },
  { sentences: 7, weight: 6 },
  { sentences: 8, weight: 2 },
];

const totalWordWeight = loremIpsumWordWeightList.reduce((sum, w) => sum + w.weight, 0);
const totalNepaliWordWeight = nepaliWordWeightList.reduce((sum, w) => sum + w.weight, 0);
const totalSentenceWeight = sentenceWeight.reduce((sum, s) => sum + s.weight, 0);
const totalEndPuncuationWeight = sentenceEndPuncuationWeight.reduce((sum, p) => sum + p.weight, 0);
const totalCommaAddWeight = commanWeight.reduce((sum, c) => sum + c.weight, 0);
const totalSentenceInParagraphWeight = paragraphSentenceWeight.reduce((sum, p) => sum + p.weight, 0);

function pickWord(lang: "nep" | "eng" = "eng") {
  const wordWeight = lang === "nep" ? totalNepaliWordWeight : totalWordWeight;
  const wordWeightList = lang === "nep" ? nepaliWordWeightList : loremIpsumWordWeightList;
  let r = Math.floor(Math.random() * wordWeight) + 1;

  for (let i = 0; i < wordWeightList.length; i++) {
    r -= wordWeightList[i].weight;
    if (r <= 0) {
      return wordWeightList[i].word;
    }
  }
}

function pickEndPuncuation(lang: "eng" | "nep" = "eng") {
  let r = Math.floor(Math.random() * totalEndPuncuationWeight) + 1;

  for (let i = 0; i < sentenceEndPuncuationWeight.length; i++) {
    r -= sentenceEndPuncuationWeight[i].weight;
    if (r <= 0) {
      const puncuation = lang === "nep" && sentenceEndPuncuationWeight[i].puncuation === "." ? nepaliFullStop : sentenceEndPuncuationWeight[i].puncuation;
      return puncuation;
    }
  }

  return lang === "nep" && sentenceEndPuncuationWeight[0].puncuation === "." ? nepaliFullStop : sentenceEndPuncuationWeight[0].puncuation;
}

function addComma() {
  let r = Math.floor(Math.random() * totalCommaAddWeight) + 1;
  
  for (let i = 0; i < commanWeight.length; i++) {
    r -= commanWeight[i].weight;
    if (r <= 0) {
      return commanWeight[i].addComma;
    }
  }

  return false;
}

export function formSentence(wordsLen: number = 0, lang: "nep" | "eng" = "eng") {
  const wordList: string[] = [];
  if (wordsLen <= 0) {
    let r = Math.floor(Math.random() * totalSentenceWeight) + 1;

    for (let i = 0; i < sentenceWeight.length; i++) {
      r -= sentenceWeight[i].weight;
      if (r <= 0) {
        wordsLen = getRand(sentenceWeight[i].min, sentenceWeight[i].max);
        break;
      }
    }
  }

  while (wordsLen > 0) {
    const choosenWord = pickWord(lang);
    if (!choosenWord) continue;
    if (wordList.slice(-getRand(2, 4)).includes(choosenWord)) continue;
    // the word "र" never in begining of the sentence
    if (lang === "nep" && wordList.length === 0 && choosenWord === nepaliWordWeightList[0].word) {
        console.log(choosenWord);
        continue;
    }
    wordList.push(pickWord(lang) ?? "");
    wordsLen--;
  }

  if (addComma() && wordList.length > 3) {
    const commaIndex = getRand(1, wordList.length - 2);

    wordList[commaIndex] += ",";
  }

  return wordList.join(" ") + pickEndPuncuation(lang);
}

export function formNSentences(sentenceCount: number, lang: "nep" | "eng" = "eng") {
  const sentenceList: string[] = [];

  while (sentenceCount > 0) {
    sentenceList.push(formSentence(undefined, lang));
    sentenceCount--;
  }

  return sentenceList.join(" ");
}

function pickParagraph(lang: "nep" | "eng" = "eng") {
  let r = Math.floor(Math.random() * totalSentenceInParagraphWeight) + 1;

  let totalSentenceCount = 4;

  for (let i = 0; i < paragraphSentenceWeight.length; i++) {
    r -= paragraphSentenceWeight[i].weight;
    if (r <= 0) {
      totalSentenceCount = paragraphSentenceWeight[i].sentences;
      break;
    }
  }

  const sentences = formNSentences(totalSentenceCount, lang);

  return sentences + "\n\n";
}

export function formParagraphs(paragraphCount: number, lang: "nep" | "eng" = "eng") {
    const paragraphList: string[] = [];
    while (paragraphCount > 0) {
        paragraphList.push(pickParagraph(lang));
        paragraphCount--;
    }

    return paragraphList.join("");
}

function getRand(min: number, max: number) {
  return min + (Math.floor(Math.random() * 100) % (max - min + 1));
}
