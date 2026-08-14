import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mainPath = join(root, "AI企业落地团队介绍.html");
const productPath = join(root, "产品与案例", "产品与案例.html");
const productDocs = join(root, "产品与案例", "产品说明文档");

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
const product = await readFile(productPath, "utf8");

assert((main.match(/<img src="data:image\/(?:jpeg|png);base64,/g) || []).length === 6, "Expected six embedded team/contact images");
assert(!main.includes("./图片/"), "External image-folder dependency remains");
assert(main.includes("./产品与案例/产品与案例.html"), "Main-to-products link is incorrect");
assert(product.includes("../AI企业落地团队介绍.html#products"), "Products-to-main return link is incorrect");

const productPaths = [...product.matchAll(/path:\s*"([^"]+)"/g)].map((match) => match[1]);
assert(productPaths.length === 15, `Expected 15 product paths, found ${productPaths.length}`);
assert(productPaths.every((path) => path.startsWith("./产品说明文档/")), "A product document path uses an old prefix");

const missing = [];
for (const htmlPath of await collectHtml(root)) {
  const html = await readFile(htmlPath, "utf8");
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  if (htmlPath === productPath) refs.push(...productPaths);
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
