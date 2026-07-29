import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const outputDirectory = resolve("out");
const previewDirectory = resolve(".pages-preview");
const deploymentDirectory = resolve(previewDirectory, "truth-or-dare");

if (!existsSync(resolve(outputDirectory, "index.html"))) {
  throw new Error("Khong tim thay out/index.html. Hay chay pnpm build:pages truoc.");
}

rmSync(previewDirectory, { recursive: true, force: true });
mkdirSync(previewDirectory, { recursive: true });
cpSync(outputDirectory, deploymentDirectory, { recursive: true });

console.log(`Pages preview ready at ${deploymentDirectory}`);
