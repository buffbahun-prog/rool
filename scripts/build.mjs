import { execSync } from "child_process";
import { execSync as run } from "child_process";

// 1. clean dist
run("rm -rf dist");

// 2. compile TS
console.log("🔨 Compiling TypeScript...");
execSync("tsc --noEmit", { stdio: "inherit" });
execSync("tsc", { stdio: "inherit" });

// 3. fix imports
console.log("🔧 Fixing import paths...");
execSync("node scripts/fix-imports.mjs", { stdio: "inherit" });

console.log("✅ Build complete");