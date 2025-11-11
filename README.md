# AuroraVoyage · AI Travel Planner

这是一个全新的 Web 版 AI 旅行规划师项目骨架，功能目标与 `example/` 目录下的参考实现保持一致，但在视觉与交互设计上采用「浅色极光」风格：地图主视图 + 双栏卡片 + 浮动语音面板。

## 当前状态
- ✅ Git 仓库初始化（main 分支）
- ✅ Next.js + TypeScript + Tailwind 基础结构
- ✅ 自定义布局（AuroraLayout）、地图/时间线/预算面板
- ✅ Voice Console + Planner 表单，驱动 Zustand Store
- ✅ API Status / Plan 路由与 LLM/Supabase Provider 占位
- ✅ 环境变量模板 `.env.example`
- ✅ Dockerfile + docker-compose + 脚本化 setup/dev/check

## 快速开始
```bash
npm install
npm run dev
```
访问 `http://localhost:3000` 即可看到骨架 UI。所有功能模块仍使用 mock 数据，用于后续接入真实 API。

## 后续开发建议
1. **数据层**：连接 Supabase，按照 `docs/需求规格说明.md` 中的数据模型创建表与 RLS 政策。
2. **LLM 服务**：在 `src/lib/providers/llm.ts` 中根据 `LLM_PROVIDER` 选择 DeepSeek / 百炼，并补全行程解析逻辑。
3. **语音系统**：实现讯飞实时语音 WebSocket 客户端，将转写结果写入 Zustand store 并驱动 UI。
4. **AI/数据层**：`/api/plan` 已与 mock LLM 对接，可替换为真实 DeepSeek/百炼 调用，返回结构与 `src/types/itinerary.ts` 对齐；进一步把结果写入 Supabase。
5. **地图与可视化**：替换 `MapPanel` 占位，在客户端加载高德 JS SDK，自定义 AuroraVoyage 主题，并与时间线联动。
6. **DevOps**：配置 GitHub Actions（lint/test/build/docker），并按任务书要求输出 Docker 镜像及 PDF 文档。
7. **安装提示**：若 `nvm install` 拉取版本失败，请在宿主机自行下载 Node 20.x 二进制后放入 `~/.nvm` 的 `bin` 目录或使用镜像源，再运行 `./scripts/setup.sh`。

更多需求、架构、计划、UI 与测试细节见 `docs/` 目录。
