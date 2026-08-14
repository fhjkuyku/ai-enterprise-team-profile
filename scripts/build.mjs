import { cp, copyFile, mkdir, rm, stat } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const dist = resolve(root, "dist");

if (!dist.startsWith(root + sep) || dirname(dist) !== root) {
  throw new Error("Refusing to build outside the project directory");
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const mainFile = join(root, "AI企业落地团队介绍.html");
await stat(mainFile);
await copyFile(mainFile, join(dist, "index.html"));
await copyFile(mainFile, join(dist, "AI企业落地团队介绍.html"));
await cp(join(root, "产品与案例"), join(dist, "产品与案例"), { recursive: true });

for (const file of ["_headers", "_redirects", "favicon.svg"]) {
  await copyFile(join(root, file), join(dist, file));
}

console.log("Static site build completed");
