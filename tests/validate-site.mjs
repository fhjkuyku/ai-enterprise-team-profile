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
assert(main.indexOf('productUrl.searchParams.set("return", returnUrl.href)') < main.indexOf('card.addEventListener("click"'), "Product return-state must be embedded before click navigation");
assert(main.includes('restoreProductFromLocation'), "Carousel state restoration is missing");
assert(main.includes('function isProductGalleryReturn()'), "Product return must bypass the landing screen");
assert(main.includes('if (isProductGalleryReturn()) {') && main.includes('document.body.classList.remove("landing-locked")'), "Landing screen is not dismissed for product returns");

const productPaths = [...main.matchAll(/path:\s*"([^"]+)"/g)].map((match) => match[1]);
assert(productPaths.length === 15, `Expected 15 product paths, found ${productPaths.length}`);
assert(productPaths.every((path) => path.startsWith("./产品与案例/产品说明文档/")), "A product document path uses an old prefix");

const productDocFiles = await collectHtml(productDocsDir);
assert(productDocFiles.length === 15, `Expected 15 product documents, found ${productDocFiles.length}`);
const productIdsByFile = new Map([
  ["IP-OS操盘工作台-产品花皮书.html", "ipos"],
  ["见舟工作台花皮书.html", "jianzhou"],
  ["金牌销售大师-产品花皮书.html", "sales"],
  ["启程AI自动化发票报销系统说明书.html", "expense"],
  ["AI智联房产_花皮书界面版_应用说明书.html", "realestate"],
  ["家居智能体-使用说明书.html", "home"],
  ["织序-AI穿搭顾问-安卓端使用说明书.html", "style"],
  ["旅图种草引擎_旅游内容全流程与效果说明.html", "travel"],
  ["1688图文二创工作台-快速操作花皮书.html", "1688"],
  ["飞书爆款对标库插件使用手册.html", "feishu"],
  ["口播数字人工作台-产品说明花皮书.html", "avatar"],
  ["见舟画布录制Beta_快速操作手册.html", "recorder"],
  ["PSD智能工作台-使用介绍与功能说明.html", "psd"],
  ["北辰导读-产品花皮书.html", "reader"],
  ["重生修仙_AI漫画生成全流程与效果说明.html", "comic"],
]);
for (const productDocPath of productDocFiles) {
  const productDoc = await readFile(productDocPath, "utf8");
  const fileName = productDocPath.split(/[\\/]/).pop();
  const productId = productIdsByFile.get(fileName);
  assert(productId, `Product ID mapping is missing for ${productDocPath}`);
  assert(productDoc.includes('class="team-return-button"'), `Team return button is missing in ${productDocPath}`);
  assert(productDoc.includes(`href="../../AI企业落地团队介绍.html?product=${productId}#product-gallery"`), `Exact team return path is incorrect in ${productDocPath}`);
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
