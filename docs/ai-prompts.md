# AI Prompts Log

## 2026-07-06

用户需求：

> 我们要实现一个github issue分析平台，这是个大项目，目前我们先要实现后续所有功能的基石：搭建一个能从github链接拉项目的各类信息并做好分类的python后端，以及一个简陋的展示这些信息的React前端，这会作为后续小组成员开发的基石和框架，所以确保可拓展性即可，开始干吧

补充约束：

> 现在项目里只有文档，其实就是空的，不用看文档就按我说的要求，直接从零开始放开手脚干即可，python用uv，react用npm

本轮实现决策：

- 后端使用 `uv + FastAPI + httpx + pydantic-settings`。
- 前端使用 `npm + React + Vite + TypeScript`。
- 当前先用内存存储，避免过早引入 PostgreSQL、Redis、Celery 的部署成本。
- GitHub 数据同步先覆盖仓库元信息、README、语言、目录树、Issue、PR、提交记录。
- 分类先使用可解释规则，后续可扩展为规则初筛、LLM 复核、RAG 上下文增强。
