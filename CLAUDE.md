# DocManager — AI 开发参考

## 项目定位

Electron 桌面文档管理工具。用户有大量学校访问方式文档（txt/doc/xlsx），需要拖放导入、自动分类、全文搜索。

## 技术栈

- **框架**: Electron 35 + electron-vite 5
- **前端**: React 18 + TypeScript + Zustand 5
- **文档解析**: mammoth (docx) + xlsx (xlsx) + fs (txt)
- **数据存储**: JSON 文件 (`%APPDATA%/docmanager/app-data/documents.json`)
- **打包**: electron-builder

## 目录结构

```
docmanager-v0/
├── index.html                       # 渲染进程 HTML 入口（electron-vite 要求根目录）
├── electron.vite.config.ts          # electron-vite 配置
├── electron-builder.yml
├── tsconfig.json / tsconfig.node.json
├── src/
│   ├── main/                        # Electron 主进程
│   │   ├── index.ts                 # BrowserWindow 创建、生命周期
│   │   ├── ipc/
│   │   │   ├── index.ts             # 注册所有 IPC handlers
│   │   │   ├── documents.ts         # 导入、搜索、删除、分类逻辑
│   │   │   └── storage.ts           # JSON 文件读写
│   │   └── parsers/
│   │       ├── txt.ts               # UTF-8 读取
│   │       ├── docx.ts              # mammoth.extractRawText
│   │       └── xlsx.ts              # xlsx sheet_to_csv
│   ├── preload/
│   │   └── index.ts                 # contextBridge API + webUtils.getPathForFile
│   └── renderer/
│       ├── index.html
│       ├── main.tsx                  # React 入口
│       ├── App.tsx                   # 初始化 store、错误处理、键盘事件
│       ├── env.d.ts                  # window.electronAPI 类型声明
│       ├── types/index.ts            # ImportedDoc, SearchResult
│       ├── stores/appStore.ts        # Zustand 全局状态
│       ├── components/
│       │   ├── layout/AppLayout      # 双栏布局 (侧边栏 + 主内容区)
│       │   ├── search/SearchBar      # 主搜索框，200ms 防抖
│       │   ├── dropzone/DropZone     # 拖放导入区域
│       │   ├── results/SearchResults # 搜索结果列表 + 关键字高亮
│       │   ├── preview/DocPreview    # 右侧滑出预览面板
│       │   └── sidebar/CategorySidebar # 分类侧边栏
│       └── styles/
│           ├── globals.css           # CSS reset
│           └── variables.css         # CSS 变量
```

## 数据模型

```typescript
interface ImportedDoc {
  id: string;               // 时间戳+随机数生成
  fileName: string;
  originalPath: string;
  fileType: 'txt' | 'docx' | 'xlsx';
  content: string;          // 完整提取文本
  contentPreview: string;   // 前200字符
  category: string;         // 自动分类
  tags: string[];           // 自动标签
  fileSize: number;
  importedAt: number;
}

interface SearchResult {
  doc: ImportedDoc;
  matches: Array<{ snippet: string; position: number }>;
  score: number;            // 匹配次数
}
```

## IPC 通道

| 通道 | 方向 | 请求 | 响应 |
|---|---|---|---|
| `doc:import` | renderer→main | `{ filePaths: string[] }` | `ImportedDoc[]` |
| `doc:search` | renderer→main | `{ query: string }` | `SearchResult[]` |
| `doc:get-all` | renderer→main | void | `ImportedDoc[]` |
| `doc:get-by-id` | renderer→main | `{ id: string }` | `ImportedDoc \| null` |
| `doc:delete` | renderer→main | `{ id: string }` | void |
| `doc:get-categories` | renderer→main | void | `string[]` |
| `app:data-dir` | renderer→main | void | `string` |

preload 额外暴露: `getFilePath(file: File): string` — 使用 `webUtils.getPathForFile()`

## 关键设计决策

1. **安全配置**: `nodeIntegration: false, contextIsolation: true, sandbox: true`, `autoHideMenuBar: true` (隐藏默认菜单栏)
2. **拖放路径获取**: 通过 preload 的 `webUtils.getPathForFile()`, 不用 `File.path`(沙箱禁用)
3. **搜索**: 全在主进程做（文档数据在主进程内存），子字符串匹配，返回±40字符上下文片段
4. **分类**: 关键字正则匹配，8个分类+1个兜底。规则在 `documents.ts` 的 `classifyDocument()`
5. **数据持久化**: 启动读 JSON → 内存 → 操作 → 写回 JSON。无增量写入。
6. **预览截断**: 无截断，全文展示。
7. **目录结构**: 使用 electron-vite 默认约定 (src/main/, src/preload/, src/renderer/)
8. **侧边栏**: 顶部文件名搜索框 + 分类树（可折叠展开，点击箭头折叠/展开，点击分类名筛选，点击文件名预览）
9. **搜索结果交互**: 点击文件标题 → 打开预览面板；点击匹配片段 → 打开预览并滚动到匹配位置+高亮
10. **右侧结果联动左侧**: 右侧搜索/显示结果受左侧分类+文件名筛选条件的约束
11. **右键菜单**: 右键文件条目 → 「用默认程序打开」打开原始文件、「标签」列表勾选/取消标签
12. **标签编辑**: `doc:update-tags` IPC 通道，主进程更新 JSON 并回传更新后的文档

## 已知问题和注意事项

- `D:\workplace\electron-starter` 是旧目录，`node_modules/electron` 被锁定，无法删除。当前工作目录是 `docmanager-v0`
- 启动后 Electron 可能在后台运行，需要关闭所有 Electron 进程后重新 `npm run dev`
- Excel 文件用 `sheet_to_csv` 转换，复杂格式可能丢失
- 搜索是大小写不敏感的简单子串匹配，不支持正则或分词
- mammoth 只能解析 docx 的文字，不能解析图片、表格格式
- JSON 文件随文档增多会变大，但没有索引优化
- `sandbox: true` 下 `File.path` 不可用是预期行为，已用 `webUtils` 解决

## 常用命令

```bash
npm run dev          # 开发模式（HMR）
npm run build        # 生产构建
npm run preview      # 预览生产构建
npm run package      # electron-builder 打包
```
