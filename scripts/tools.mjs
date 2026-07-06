import fs from "fs-extra";
import path from "path";

const baseHTMLtmpl = fs.readFileSync('./templates/base-layout.html', "utf-8");
const entries = await fs.readdir('./src/tools', { withFileTypes: true });;

await processDirectories('./src/tools');

async function processDirectories(targetDir) {
  try {
    // 1. Loop through the main directory
    const entries = await fs.readdir(targetDir, { withFileTypes: true });

    // 2. Filter out files, keeping only directories
    const subdirectories = entries.filter(entry => entry.isDirectory());

    for (const dir of subdirectories) {
      const subDirPath = path.join(targetDir, dir.name);
      console.log(`\nProcessing Subdirectory: ${subDirPath}`);

      // 3. Loop again inside the nested directory
      const innerEntries = await fs.readdir(subDirPath, { withFileTypes: true });

      const metaJsonFile = innerEntries.find((innerItem) => innerItem.isFile() && innerItem.name === "meta.json");

      if (!metaJsonFile) new Error(`no meta json file in ${subDirPath}`);

      const filePath = path.join(subDirPath, metaJsonFile.name);

      // 2. Read the file contents as a UTF-8 string
      const fileContentString = await fs.readFile(filePath, 'utf-8');
      const {
        pageTitle,
        brandName,
        metaDescription,
        canonicalUrl,
        author,
        themeColor,
        faviconPath,
        appleFaviconPath,
        siteType,
        ogDescription,
        ogImage,
        twitterImage,
        twitterDescription,
        utilityName,
        faq
      } = JSON.parse(fileContentString);
      
      for (const innerItem of innerEntries) {
        if (innerItem.isFile() && innerItem.name === "meta.json")
        console.log(` -> [${type}] ${innerItem.name}`);
      }
    }
  } catch (error) {
    console.error('Error reading directories:', error);
  }
}

