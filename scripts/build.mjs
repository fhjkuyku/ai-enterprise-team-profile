import { copyFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
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

// Only publish detail pages that the main site actually links to. This keeps
// backups, intermediate exports, and other stray files out of the deployment.
const mainHtml = await readFile(mainFile, "utf8");
const linkedDetailPages = new Set(
  [...mainHtml.matchAll(/(?:\.\/)?(产品与案例\/[^"'<>]+?\.html)/g)].map((match) => match[1])
);
const publishedAssets = new Set();

for (const relativePath of linkedDetailPages) {
  const source = resolve(root, relativePath);
  const destination = resolve(dist, relativePath);
  if (!source.startsWith(root + sep) || !destination.startsWith(dist + sep)) {
    throw new Error(`Refusing to publish path outside the site: ${relativePath}`);
  }
  await stat(source);
  await mkdir(dirname(destination), { recursive: true });
  const detailHtml = await readFile(source, "utf8");
  let imageIndex = 0;
  const optimizedHtml = detailHtml.replace(/<img\b[^>]*>/gi, (tag) => {
    imageIndex += 1;
    if (/\bloading\s*=/i.test(tag)) return tag;
    const loading = imageIndex === 1 ? "eager" : "lazy";
    const priority = imageIndex === 1 ? ' fetchpriority="high"' : "";
    return tag.replace(/^<img\b/i, `<img loading="${loading}" decoding="async"${priority}`);
  });
  await writeFile(destination, optimizedHtml, "utf8");

  const assetReferences = new Set([
    ...[...detailHtml.matchAll(/\bsrc\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]),
    ...[...detailHtml.matchAll(/\burl\(\s*["']?([^"')]+)["']?\s*\)/gi)].map((match) => match[1]),
  ].map((reference) => reference.split(/[?#]/)[0])
    .filter((reference) => reference && !/^(?:data:|https?:|\/\/|#)/i.test(reference))
    .filter((reference) => /\.(?:png|jpe?g|webp|gif|svg|avif)$/i.test(reference)));
  for (const assetReference of assetReferences) {
    const assetSource = resolve(dirname(source), assetReference);
    const assetDestination = resolve(dist, assetSource.slice(root.length + 1));
    if (!assetSource.startsWith(root + sep) || !assetDestination.startsWith(dist + sep)) {
      throw new Error(`Refusing to publish asset outside the site: ${assetReference}`);
    }
    if (publishedAssets.has(assetSource)) continue;
    await stat(assetSource);
    await mkdir(dirname(assetDestination), { recursive: true });
    await copyFile(assetSource, assetDestination);
    publishedAssets.add(assetSource);
  }
}

for (const file of ["_headers", "_redirects", "favicon.svg"]) {
  await copyFile(join(root, file), join(dist, file));
}

console.log(`Static site build completed (${linkedDetailPages.size} linked detail pages, ${publishedAssets.size} linked assets)`);
