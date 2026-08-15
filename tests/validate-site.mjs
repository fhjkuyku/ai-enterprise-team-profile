import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mainPath = join(root, "AI企业落地团队介绍.html");
const productDocsDir = join(root, "产品与案例", "产品说明文档");

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

async function collectHtml(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory() && !["node_modules", "dist", ".git", ".wrangler"].includes(entry.name)) {
      result.push(...await collectHtml(full));
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === ".html") {
      result.push(full);
    }
  }
  return result;
}

const main = await readFile(mainPath, "utf8");

assert((main.match(/<img src="data:image\/(?:jpeg|png);base64,/g) || []).length === 9, "Expected six team/contact images and three case images");
assert(!main.includes("./图片/"), "External image-folder dependency remains");
assert(!main.includes("./产品与案例/产品与案例.html"), "Obsolete intermediate product-page link remains");
assert(main.includes('id="productCarousel"'), "Integrated product carousel is missing");
assert(main.includes('id="case"'), "Integrated offline case is missing");
assert(main.includes('product-carousel-audience'), "Product audience descriptions are missing from carousel cards");
assert(main.includes('product-carousel-flow-step'), "Product input/process/result descriptions are missing from carousel cards");
assert(!main.includes('card.target = "_blank"'), "Product cards should navigate directly in the current page");
assert(!main.includes('product-carousel-control'), "Visible carousel arrow controls should be removed");
assert(main.includes('id="productPrevArea"') && main.includes('id="productNextArea"'), "Clickable carousel side regions are missing");
assert(main.includes('returnUrl.searchParams.set("product", product.id)'), "Product return-state link is missing");
assert(main.includes('restoreProductFromLocation'), "Carousel state restoration is missing");

const productPaths = [...main.matchAll(/path:\s*"([^"]+)"/g)].map((match) => match[1]);
assert(productPaths.length === 15, `Expected 15 product paths, found ${productPaths.length}`);
assert(productPaths.every((path) => path.startsWith("./产品与案例/产品说明文档/")), "A product document path uses an old prefix");

const productDocFiles = await collectHtml(productDocsDir);
assert(productDocFiles.length === 15, `Expected 15 product documents, found ${productDocFiles.length}`);
for (const productDocPath of productDocFiles) {
  const productDoc = await readFile(productDocPath, "utf8");
  assert(productDoc.includes('class="team-return-button"'), `Team return button is missing in ${productDocPath}`);
  assert(productDoc.includes('href="../../AI企业落地团队介绍.html#products"'), `Team return path is incorrect in ${productDocPath}`);
  assert(productDoc.includes('id="team-return-script"'), `Team return-state script is missing in ${productDocPath}`);
}

const missing = [];
for (const htmlPath of await collectHtml(root)) {
  const html = await readFile(htmlPath, "utf8");
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  if (htmlPath === mainPath) refs.push(...productPaths);
  for (const ref of refs) {
    if (/^(?:#|data:|https?:|mailto:|tel:|javascript:|about:)/.test(ref) || ref.includes("' +")) continue;
    const clean = ref.split(/[?#]/)[0];
    if (!clean) continue;
    try {
      await stat(resolve(dirname(htmlPath), clean));
    } catch {
      missing.push(`${htmlPath}: ${ref}`);
    }
  }
}
assert(missing.length === 0, `Missing local references:\n${missing.join("\n")}`);

const secretPatterns = [
  /open\.feishu\.cn\/open-apis\/bot\/v2\/hook\//i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*["'][^"']{12,}/i
];
for (const htmlPath of await collectHtml(root)) {
  const html = await readFile(htmlPath, "utf8");
  assert(secretPatterns.every((pattern) => !pattern.test(html)), `Potential secret found in ${htmlPath}`);
}

console.log("Site validation passed");
