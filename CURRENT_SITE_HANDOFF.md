# 当前站点交接状态

- 站点类型：纯静态团队与产品展示站
- 托管平台：GitHub Pages
- 生产地址：https://fhjkuyku.github.io/ai-enterprise-team-profile/
- GitHub 仓库：https://github.com/fhjkuyku/ai-enterprise-team-profile
- 内容发布基线：`main` 最新发布提交
- 自动发布：`.github/workflows/pages.yml`
- 持续集成：`.github/workflows/ci.yml`
- 源码入口：`AI企业落地团队介绍.html`
- 构建入口：`dist/index.html`
- 产品入口：主页面 `AI企业落地团队介绍.html#products`
- 产品说明：`产品与案例/产品说明文档/` 下 15 份独立 HTML
- 图片策略：团队头像、二维码和案例图片均嵌入 HTML，无外部图片目录依赖
- 转化上线：不适用；当前没有表单、支付、会员、Webhook 或服务端函数

## 验收状态

- `npm test`：通过
- `npm run build`：通过
- `npm audit --omit=dev`：0 个漏洞
- GitHub Actions 持续集成：通过
- GitHub Pages 自动部署：通过
- 生产环境：首页、15 份产品说明及 favicon 均返回 HTTP 200
- HTTPS：已强制启用，生产响应包含 HSTS
- 页面内容：生产首页与本地构建产物一致；产品页经换行归一化后与本地构建产物一致

## 回滚方式

如需回滚本次改版，可在 Git 中回退到上一线上稳定版本 `37925da`，推送后由 GitHub Pages 工作流自动重新发布；也可在 GitHub Actions 中重新运行对应历史提交的部署工作流。

## 已知边界

- GitHub Pages 不应用仓库中的 `_headers` 文件；该文件保留给后续迁移到 Cloudflare Pages 等支持自定义响应头的平台使用
- 中国大陆访问速度受 GitHub Pages 网络链路影响，不作绝对稳定性承诺
- 联系方式为静态展示，不收集或存储访客提交数据
- Cloudflare Pages 本次未启用，原因是本机授权页面持续加载；不影响当前 GitHub Pages 正式站点
