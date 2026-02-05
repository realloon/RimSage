# CLAUDE.md

该文件为 Agent 在与本仓库代码协作时提供指导。

## 项目简介

RimSage 是一个 MCP Server，为 Agent 提供 RimWorld 源码检索工具。

## 项目依赖

- Bun
- Ripgrep

## 项目结构

```
src/
├── main.ts
├── tools/               # MCP Tools
├── utils/               # 共享模块
│   ├── path-sandbox.ts  # 安全沙箱
│   ├── db.ts            # SQLite 连接管理
│   ├── env.ts           # 环境配置
│   ├── def-resolver.ts
│   └── xml-utils.ts
└── scripts/             # 用户脚本
└── server               # 注册 Tools
└── stdio                # stdio transport
└── http                 # Streamable HTTP transport
test/
├── tools/
└── utils/
```

## 添加新工具

1. 在 `src/tools/` 中实现函数
2. 若涉及相关功能，应使用 path-sandbox、db 或 env 模块
3. 在 `src/tools/index.ts` 中导出
4. 在 `src/main.ts` 中使用 `server.registerTool()` 注册
5. 在 `test/tools/` 中编写测试

## 测试

```
bun test
```
