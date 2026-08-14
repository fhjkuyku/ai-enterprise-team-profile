# 发布记录

## 2026-08-15 GitHub Pages 首次正式发布

- 发布类型：内容上线
- 生产地址：https://fhjkuyku.github.io/ai-enterprise-team-profile/
- GitHub 仓库：https://github.com/fhjkuyku/ai-enterprise-team-profile
- 内容发布基线：`a6b9cb6f658cdefe3d0fee93a86be942919219ee`
- 持续集成任务：https://github.com/fhjkuyku/ai-enterprise-team-profile/actions/runs/31823248396
- 生产部署任务：https://github.com/fhjkuyku/ai-enterprise-team-profile/actions/runs/31823248348
- 桌面验收视口：1440 × 1000
- 移动端验收视口：390 × 844
- 转化上线：不适用；站点不包含表单、支付、会员、Webhook 或服务端函数

### 发布范围

- 团队介绍首页
- 三位团队成员介绍
- 产品与案例介绍
- 15 份产品说明 HTML
- 线下培训案例
- 合作边界与流程
- 联系方式

### 发布优化

- 全部展示图片继续使用 Base64 内嵌，无图片目录依赖
- 首页主要头像由 1023 × 1537 PNG 优化为 820 × 1232 JPEG
- 首页文件由约 3.12 MB 降至约 0.84 MB，显示尺寸与清晰度验收正常
- 使用 Git LFS 管理 15 份体积较大的产品说明 HTML

### 回滚基线

- 上一稳定版本：`b18fed6`
- 当前内容版本：`a6b9cb6`
- 回滚后推送到 `main`，GitHub Pages 会自动重新部署

### 已知边界

- 中国大陆访问速度与稳定性受 GitHub Pages 网络链路影响
- GitHub Pages 不应用 `_headers` 中的自定义安全响应头
- 联系方式为静态展示，不收集或存储访客提交数据
