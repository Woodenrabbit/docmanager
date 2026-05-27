# DocManager — AI 开发参考

## 项目定位

Electron 桌面文档管理工具。拖放/选择导入 txt/doc/xlsx，自动分类，全文搜索，VS Code 风格界面。

## 技术栈

- **框架**: Electron 35 + electron-vite 5 (frame: false 自定义标题栏)
- **前端**: React 18 + TypeScript + Zustand 5
- **文档解析**: mammoth (docx) + xlsx (xlsx) + fs (txt)
- **数据存储**: JSON (`%APPDATA%/docmanager/app-data/documents.json`)
- **打包导出**: archiver (ZipArchive) → ZIP
- **通知音**: Web Audio API (utils/sound.ts)
- **打包**: electron-builder

## 目录结构

```
docmanager-v0/
├── index.html
├── electron.vite.config.ts
├── electron-builder.yml
├── tsconfig.json / tsconfig.node.json
├── src/
│   ├── main/
│   │   ├── index.ts                 # BrowserWindow (frame:false), 生命周期
│   │   ├── ipc/
│   │   │   ├── index.ts             # 注册所有 IPC + 窗口控制 + 导出 + 文件对话框
│   │   │   ├── documents.ts         # 导入/搜索/删除/分类/标签 CRUD（按路径去重）
│   │   │   └── storage.ts           # JSON 读写
│   │   └── parsers/
│   │       ├── txt.ts
│   │       ├── docx.ts              # mammoth.extractRawText
│   │       └── xlsx.ts              # xlsx sheet_to_csv + cleanCsvLine 清洗
│   ├── preload/
│   │   └── index.ts                 # contextBridge + webUtils.getPathForFile
│   └── renderer/
│       ├── App.tsx                   # store 初始化、错误 banner、Escape 快捷键、Toast
│       ├── env.d.ts
│       ├── types/index.ts            # ImportedDoc, SearchResult
│       ├── utils/sound.ts            # 成功/错误提示音
│       ├── stores/appStore.ts        # Zustand（含 activeView / message 状态）
│       ├── components/
│       │   ├── layout/
│       │   │   ├── TitleBar          # 自定义标题栏（打包按钮+窗口控制）
│       │   │   ├── AppBar            # 最左侧48px活动栏（explorer/import 视图切换）
│       │   │   ├── AppLayout         # 整体布局+侧栏拖拽调整+视图切换
│       │   │   ├── StatusBar         # 底部状态栏（文档数/分类）
│       │   │   └── Toast             # 底部居中消息提示（3秒自动消失）
│       │   ├── search/SearchBar      # 200ms防抖全文搜索
│       │   ├── results/SearchResults # 搜索结果+右键菜单
│       │   ├── preview/DocPreview    # 预览面板（支持滚动定位+高亮）
│       │   ├── import/ImportPage     # 独立导入页面（拖放+文件选择器）
│       │   └── sidebar/CategorySidebar # 文件名搜索+折叠分类树+底部上传区+右键改分类
│       └── styles/
│           ├── globals.css
│           └── variables.css
```

## 数据模型

```typescript
interface ImportedDoc {
  id: string;
  fileName: string;
  originalPath: string;      // normalize 后的绝对路径
  fileType: 'txt' | 'docx' | 'xlsx';
  content: string;
  contentPreview: string;    // 前200字符
  category: string;
  tags: string[];            // 登录凭证/网址链接/联系方式/操作指南
  fileSize: number;
  importedAt: number;
}
```

## IPC 通道全表

| 通道 | 方向 | 用途 |
|---|---|---|
| `doc:import` | r→m | 导入文件（按路径去重，已存在则更新） |
| `dialog:open-files` | r→m | 打开系统文件选择器 |
| `doc:search` | r→m | 全文搜索 |
| `doc:get-all` | r→m | 获取全部文档 |
| `doc:get-by-id` | r→m | 获取单个文档 |
| `doc:delete` | r→m | 删除文档 |
| `doc:get-categories` | r→m | 获取分类列表 |
| `doc:update-tags` | r→m | 更新标签 |
| `doc:update-category` | r→m | 更新分类 |
| `doc:export-all` | r→m | 打包导出 ZIP |
| `shell:open-path` | r→m | 系统默认程序打开 |
| `win:minimize/maximize/close/is-maximized` | r→m | 窗口控制 |
| `app:data-dir` | r→m | 获取数据目录 |

## 关键设计决策

1. **frame: false** — 自定义标题栏替代系统标题栏，顶部放打包按钮
2. **webUtils.getPathForFile** — 沙箱安全模式下获取拖放文件路径
3. **搜索全在主进程** — 文档数据在主进程内存，子串匹配，返回±40字符上下文
4. **分类** — 关键字正则匹配 (classifyDocument)，支持手动改为任意自定义分类名
5. **侧栏联动** — 右侧搜索结果受左侧 activeCategory + fileNameQuery 约束
6. **点击片段** → openPreviewWithHighlight → DocPreview scrollIntoView + mark 高亮
7. **Excel 清洗** — cleanCsvLine 仅处理 3 个以上连续逗号，保留正常 CSV 结构
8. **ZIP 导出** — archiver v7 API: new ZipArchive({zlib:{level:9}}) 而非 archiver(format, opts)
9. **窗口拖拽** — title-bar 整体 -webkit-app-region:drag，按钮 no-drag
10. **导入去重** — `resolve()` 规范化路径后比较 originalPath，已存在则原地更新内容
11. **视图切换** — AppBar 两个图标切换 explorer（文件树+搜索）/ import（独立导入页）
12. **消息提示** — 底部居中 Toast 组件，3 秒自动消失，替代 alert 弹窗

## 常见踩坑

- `archiver` v7 不再 export 函数，用 `new ZipArchive(opts)`
- `archiver` 需 externalize，否则打包后 `self._module.on is not a function`
- `sandbox:true` 下渲染进程 `File.path` 不可用，用 preload 的 `webUtils`
- electron-vite 约定 src/main/, src/preload/, src/renderer/ 目录结构
- index.html 必须放在 renderer 目录内（electron-vite 要求）
- Windows 路径格式不一致可能导致去重失败，需用 `resolve()` 规范化

## 常用命令

```bash
npm run dev          # 开发模式
npm run build        # 生产构建
npm run package      # electron-builder 打包
```
