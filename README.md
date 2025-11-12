# AuroraVoyage · AI Travel Planner

这是一个全新的 Web 版 AI 旅行规划师项目骨架，功能目标与 `example/` 目录下的参考实现保持一致，但在视觉与交互设计上采用「浅色极光」风格：地图主视图 + 双栏卡片 + 浮动语音面板。

## 功能概览
- ✅ Next.js + TypeScript + Tailwind 骨架，AuroraVoyage 三列布局（地图 / Planner / 预算）
- ✅ DeepSeek + 高德地图：实时行程规划、POI 落点、AI 预算预测
- ✅ Supabase Auth：魔法链接登录、会话同步、行程列表（加载/删除）
- ✅ 预算与记账：按行程绑定，支持表单记账、语音记账、AI 预算分析
- ✅ 语音交互：语音规划需求、语音记账解析，均可手动确认后提交
- ✅ 完整 API：`/api/plan`、`/api/itineraries`、`/api/expenses`、`/api/voice/*`、`/api/status`
- ✅ Dockerfile / 脚本化 setup；`.env` 在镜像内一并打包，开箱即用

## 快速开始

> **开箱即用（推荐验收）**
> 1. 在 Release 中下载加密的 `auroravoyage.tar.enc`
> 2. 解密并加载镜像：
>    ```bash
>    openssl enc -aes-256-cbc -d -pbkdf2 -in auroravoyage.tar.enc -out auroravoyage.tar
>    docker load -i auroravoyage.tar
>    docker run --rm -p 3000:3000 auroravoyage
>    ```
> 3. 浏览器访问 `http://localhost:3000` 即可验收。

> **本地开发模式**
> ```bash
> npm install
> npm run dev
> ```
访问 `http://localhost:3000` 即可看到骨架 UI。所有功能模块仍使用 mock 数据，用于后续接入真实 API。

## 后续开发建议
1. **数据层**：按 `docs/需求规格说明.md` 与 `docs/Supabase配置指南.md` 创建表/RLS，确保 `/api/itineraries` 可写入云端。
2. **LLM 服务**：`src/lib/providers/llm.ts` 已支持 DeepSeek；可按需切换至百炼并增强 Prompt/异常处理。
3. **语音系统**：实现讯飞实时语音 WebSocket 客户端，将转写结果写入 Zustand store 并驱动 UI。
4. **AI/数据层**：`/api/plan` + `/api/itineraries` 形成“生成→落库”链路，按需将响应写入 Supabase 并结合用户 auth。
5. **地图与可视化**：替换 `MapPanel` 占位，在客户端加载高德 JS SDK，自定义 AuroraVoyage 主题，并与时间线联动。
6. **DevOps**：配置 GitHub Actions（lint/test/build/docker），并按任务书要求输出 Docker 镜像及 PDF 文档。
7. **安装提示**：若 `nvm install` 拉取版本失败，请在宿主机自行下载 Node 20.x 二进制后放入 `~/.nvm` 的 `bin` 目录或使用镜像源，再运行 `./scripts/setup.sh`。

更多需求、架构、计划、UI 与测试细节见 `docs/` 目录。

## Docker 构建和运行

```bash
docker build -t auroravoyage .
docker run --name auroravoyage -p 3000:3000 auroravoyage
```
构建阶段会自动复制 `.env` 到容器内，运行后访问 `http://localhost:3000` 即可。
