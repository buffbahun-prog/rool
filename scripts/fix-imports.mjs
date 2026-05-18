import fs from "fs";
import path from "path";

const DIST_DIR = "./public/dist";

// match: import ... from "./something"
const IMPORT_REGEX =
  /(import\s+[^'"]+from\s+["'])(\.\/[^"']+?)(["'])/g;

// match dynamic imports too
const DYNAMIC_IMPORT_REGEX =
  /(import\s*\(\s*["'])(\.\/[^"']+?)(["']\s*\))/g;

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, "utf8");

  let changed = false;

  const replacer = (match, p1, p2, p3) => {
    if (!p2.endsWith(".js")) {
      changed = true;
      return `${p1}${p2}.js${p3}`;
    }
    return match;
  };

  code = code.replace(IMPORT_REGEX, replacer);
  code = code.replace(DYNAMIC_IMPORT_REGEX, replacer);

  if (changed) {
    fs.writeFileSync(filePath, code, "utf8");
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      walk(full);
    } else if (file.endsWith(".js")) {
      fixFile(full);
    }
  }
}

walk(DIST_DIR);

console.log("✔ Import paths fixed (.js added)");