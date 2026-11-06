# 个人站融合方案（跑步 + 阅读笔记 + 随笔 + 书单）· 审阅稿

> 版本：v0.8（A2 / A3 执行完成）｜ 日期：2026-11-06 ｜ 状态：**P0.5 已独立提交并推送；A3 方案 B 已执行；前端与发布脚本尚未实施**
> 涉及仓库：
> - 站点仓库 `/Users/lission/data/code/lission.github.io` → https://lission.github.io/
> - 笔记仓库 `/Users/lission/data/github/markDownNote` → https://github.com/lission/markDownNote
>
> 本文档位于 `docs/`，不含任何笔记正文与本地隐私内容。

---

## 0. 修订摘要

| 版本 | 主要变更 |
|---|---|
| v0.2 | 一条命令发布；`04-note` 可提交；阅读笔记分组/标签；随笔年份+日期排序；输出审阅文档 |
| v0.3 | `01-readnotes` 目录驱动的动态分组；`04-note` 年份目录 + `标题-YYYYMMDD.md`，日期只从文件名取 |
| v0.4 | 目录整理：新建独立博客域 `blog/`、文档归入 `docs/`，配置接入（tsconfig 别名、Tailwind 扫描、CI 白名单 `blog/**`） |
| v0.5 | 新增独立菜单「书单」`/books`；同步命令加入书单单文件来源；书单结构化解析 |
| v0.6 | 无关文件清理：删除 9 个零引用文件；修正 3.5 节证据与锁文件说明 |
| v0.7 | 评审修复 A1（现状数据刷新）/ A2（首发时序前置）/ A3（存量隐私定性升级） |
| **v0.8（本版）** | **执行落地：A3 方案 B 已提交推送；A2 的 P0.5 已作为独立提交推送 `origin/master`** |

### v0.7 评审修复明细（历史记录）

| # | 评审意见 | 核实结论 | 修复位置 |
|---|---|---|---|
| A1 | 现状数据过时：小说 8、根级 0、删除 6 处 | 成立。实测 `01-readnotes` = 人生 15 / 历史 7 / 大理 1 / 小说 8 / 杂记 5 = 36，根级 0；`我在北京送快递.md` 已移入 `小说/`；笔记仓库 git 为 6 个 `D` | §2、§6.2、§6.4、§11、§12、§13 |
| A2 | P0.5 未提交造成首发时序漏洞 | 成立且为关键缺陷。`git show HEAD:.github/workflows/run_data_sync.yml` 无 `blog/**`，仅工作区有；首次发布 push 的 `blog/content/**` 不会触发任何部署且不报错 | 新增 §4.0、§4.2、§4.3、§10.14、§11、§12 |
| A3 | 隐私风险定性偏低 | 成立。`git ls-files` 实测 4 个敏感文件均已被跟踪；按 §5.2.3「已跟踪=已公开」逻辑，属存量已暴露 | §2、§5.2、新增 §5.3、§10.12、§10.15、§11、§13 |

### v0.8 执行结果

| 项 | 结果 |
|---|---|
| A3 方案 B | 笔记仓库提交 `6ca201b` 已推送：`git rm --cached` 4 个文件（本地全部保留）、`.gitignore` 补 4 条规则并**首次纳入版本控制**（`git add -f`）、远端 `00-notes/` 由 22 → 18 个文件 |
| A2 / P0.5 | 站点仓库 4 处配置 + 9 个清理 + `blog/` / `docs/` 作为**独立提交**推送 `origin/master`；远端 `run_data_sync.yml` 已含 `blog/**` |
| 未执行 | P1 发布脚本、P2 博客前端、P3 路由菜单；`04-note` 内容审阅与首次 `pnpm publish:notes`；方案 C 历史改写（未选择） |

---

## 1. 目标与硬约束

1. **一个域名、一个站点、一套菜单**：`/` 跑步，`/reading` 阅读笔记，`/notes` 随笔，`/books` 书单，`/about` 关于。
2. **日常发布只有一条命令**，零参数、零交互、零手工 git 操作；书单更新也由同一条命令覆盖。
3. **分组由目录结构驱动**：新增子目录 / 年份目录，跑一次同步命令即自动生效。
4. **跑步域与博客域相对独立**：跑步代码保持上游结构不动，博客全部内容收拢在 `blog/` 与 `docs/`。
5. **不改动现有跑步功能**：Python 同步脚本、地图、统计图表、数据生成、部署链路保持原样。
6. **隐私红线**：`05-local/` 永远不提交、不扫描、不进入构建产物；`00-notes/` 只同步**指定的那一个文件**，绝不整目录 add。
7. **存量已公开内容**：A3 方案 B 已停止跟踪 4 个文件并从远端最新树移除，但**历史提交中仍有全文**；本方案不自动改写历史（§5.3）。
8. **零支出**：GitHub Pages + 现有 GitHub Actions 足够。

---

## 2. 现状核查结论

| 项 | 事实 |
|---|---|
| 站点技术栈 | React 18 + Vite 4 + `react-router-dom` 6 + Tailwind 3，`src/main.tsx` 仅 `/` 与 `*` 两条路由 |
| 导航 | `src/static/site-metadata.ts` 的 `navLinks` 驱动 `Header`；当前「博客」是外链，`<a href>` 而非 `<Link>` |
| 部署 | `gh-pages.yml` 上传 `./dist`；`run_data_sync.yml` 每天 2 次同步跑步数据并调用发布；`vite.config.ts` 的 `base` 为 `/` |
| 发布触发器 | `run_data_sync.yml` 的 `push.paths` 白名单含 `src/**`、`public/**`、**`blog/**`** 等；**`blog/**` 已随 P0.5 独立提交推送到 `origin/master`（A2 已闭环）** |
| 数据缓存 | `SAVE_DATA_IN_GITHUB_CACHE=true` 使「Push new runs」被跳过，最新跑步数据只在 Actions Cache；仓库内 `activities.json` 可能是旧快照 |
| 阅读笔记结构 | `01-readnotes` 共 **36 篇**：一级子目录 5 个 —— 人生 15 / 历史 7 / 大理 1 / **小说 8** / 杂记 5；**根级 0 篇**（`我在北京送快递.md` 已移入 `小说/`） |
| 随笔结构 | `04-note` 共 9 篇，年份目录 `2022/`(5)、`2023/`~`2026/`(各 1)；无根级 md |
| 随笔命名 | 标准 `标题-YYYYMMDD.md`（4 篇）；`2022/` 下纯 `YYYYMMDD.md`（5 篇，标题在正文首个 `#`） |
| **阅读书单** | `00-notes/01-阅读清单.md`，188 行 / 约 20 KB，**已被 git 跟踪**（即内容本就公开）；顶部手写目录 + `# 阅读清单`；6 个 `## YYYY阅读清单` 段落，每段一张 7 列表格；共 157 行表格 |
| 书单表头 | `序号 / 书名 / 作者 / 类型 / 完成时间 / 书质 / 备注`；**2025 起第 5 列改叫「阅读时间」**，需按列名映射而非固定列序 |
| 书单不规则值 | `——`（未完成/暂停）、`20230322~20230417`、`20240102-20240110`、`20240921-`（无结束日期）、6 位 `YYYYMM`、8 位 `YYYYMMDD`、书名含 `**加粗**`、表格末尾空行、个别年份明显笔误（如 `2015xxxx`） |
| 需确认的异常 | `2022/20260602.md`、`2022/20260613.md` 文件名年份为 2026 但目录为 2022，疑似笔误（10.9 / 13 章） |
| 内容格式 | 无 frontmatter；手写 `[TOC]` 与锚点目录；中文文件名含 `·`、`，`；`<ruby>` 注音、零宽空格、缩进围栏；1 处失效的本机绝对路径图片 |
| **同目录隐私文件** | `00-notes/05-家庭笔记.md`、`10-vpn.md`、`15-一一.md`、`16-forum.md` 原已被 git 跟踪（存量已公开）；**A3 方案 B 已执行**：4 个文件已停止跟踪、远端最新树已移除、本地保留；**历史中仍有全文**，见 §5.3。`00-notes/` 远端仍有 18 个已跟踪文件，本轮未扩大处理 |
| 笔记仓库 git 状态 | A3 提交 `6ca201b` 已推送；剩余未提交：`00-notes/01-阅读清单.md` 的 `M`、6 个 `D`（原根级笔记）、`?? 杂记/`、`?? 小说/我在北京送快递.md`、`?? 04-note/`、`?? .workbuddy/`；这些留待首次 `pnpm publish:notes` |
| 站点仓库 git 状态 | **P0.5 已作为独立提交推送 `origin/master`（A2 已闭环）**；4 个 `M`、9 个 `D`、`blog/`、`docs/` 均已落库，工作区不再有混态 |
| 忽略规则 | 笔记仓库 `.gitignore` **已随 A3 首次纳入版本控制**：解除 `/04-note/*`、保留 `/05-local/*`、新增 4 条精确规则；此前该文件因首行 `.gitignore` 忽略自身而从未被跟踪，故用 `git add -f` 加入 |

---

## 3. 总体架构

### 3.1 URL 与菜单

| 路径 | 内容 | 数据来源 |
|---|---|---|
| `/` | 跑步首页（现有页面不改动） | `src/static/activities.json` |
| `/reading` | 阅读笔记列表 + 分组树 + 标签筛选 | `blog/content/reading.json`、`groups.json` |
| `/reading/:slug` | 阅读笔记详情 | `blog/content/pages/*.json` |
| `/notes` | 随笔：年份分组 + 年内按日期排序 | `blog/content/notes.json` |
| `/notes/:year` | 该年份随笔列表 | `blog/content/notes.json` |
| `/notes/:year/:slug` | 单篇随笔详情 | `blog/content/pages/*.json` |
| **`/books`** | **书单：年份分组 + 状态/类型筛选 + 统计** | **`blog/content/books.json`** |
| `/about` | 关于 | 静态页 |

`Header` 胶囊导航：`跑步日记(logo→/) | 阅读 | 随笔 | 书单 | 关于`。菜单名「书单」可在 `site-metadata.ts` 一处修改（见 13 章待确认）。

### 3.2 数据流

> **前置条件已满足**：§4.0 的 P0.5 独立提交已推送到 `origin/master`，远端 workflow 已含 `blog/**`。

```
本机 markDownNote/
  ├── 01-readnotes/**/*.md        阅读笔记
  ├── 04-note/<YYYY>/*.md        随笔
  └── 00-notes/01-阅读清单.md    书单（精确单文件）
        │  pnpm publish:notes（唯一日常命令）
        ├─ ⓪ preflight：校验远端 master 的 workflow 已含 blog/**（§4.3）
        ├─ ① 动态发现目录 → 分组 / 年份索引；解析书单表格
        ├─ ② 扫描 md + 清洗 + 构建期转 HTML
        │      → blog/content/*.json、blog/content/pages/*.json
        ├─ ③ git -C 笔记仓库 add（两个目录 + 一个文件）→ commit → push
        └─ ④ git -C 站点仓库 add blog/content/ blog/config/ → commit → push
                    │
                    ▼ push 命中 origin/master 上 run_data_sync.yml 的 blog/** 白名单
        Run Data Sync（COROS 同步 + SVG 生成 + 恢复最新跑步数据到 Cache）
                    │
                    ▼ publish_github_pages
        gh-pages.yml：PATH_PREFIX=/ pnpm build → dist → GitHub Pages
```

**要点**：GitHub Actions 里没有本机的 `markDownNote` 目录，脚本只在本机运行，产物提交进仓库；CI 只执行原来的 `pnpm build`。

### 3.3 产物与配置约定

| 路径 | 作用 | 是否提交 |
|---|---|---|
| `blog/content/groups.json` | 动态生成的阅读分组列表 | 是（自动生成） |
| `blog/content/reading.json` | 阅读笔记索引 | 是（自动生成） |
| `blog/content/notes.json` | 随笔年份与文章索引 | 是（自动生成） |
| **`blog/content/books.json`** | **书单结构化数据（年份、条目、状态、统计）** | **是（自动生成）** |
| `blog/content/pages/*.json` | 构建期转好的文章 HTML + 目录锚点 | 是（自动生成） |
| `blog/config/posts-map.json` | 可选覆盖：`groupOrder/groupLabels/posts(title,tags,slug)` | 是（模板已建） |
| `blog/config/exclude.txt` | 可选排除清单，`#` 为注释 | 是（模板已建） |
| `blog/scripts/publish-notes.mjs` | 发布脚本（P1 实现） | 是 |
| `blog/src/` | 博客前端页面与组件（P2 实现） | 是 |
| `docs/BLOG_DESIGN.md` | 本设计文档 | 是 |
| `dist/` | 构建产物 | 否 |

> 分组与年份完全由目录决定，配置文件只做显示名 / 顺序 / 标签 / slug 等美化。
> 博客产物通过 `@content/*` 别名引入（`tsconfig.json` 已配置，`vite-tsconfig-paths` 自动生效）。

### 3.4 目录结构与整理原则

```
lission.github.io/
├── .github/workflows/        # 已含 blog/**，且已落库（A2）
├── public/ index.html        # 不变
├── src/                      # 【跑步域】现有前端代码，原位零改动
├── run_page/ assets/         # 【跑步域】Python 脚本与统计 SVG
├── activities/ GPX_OUT/ TCX_OUT/ FIT_OUT/ Workouts/ imported.json
│                             # 【跑步域】数据目录（Actions Cache 路径）
├── blog/                     # 【博客域】config/ content/ scripts/ src/
├── docs/                     # 【文档域】BLOG_DESIGN.md
└── 根目录配置与锁文件        # 不变
```

**边界**：跑步域 = `src/` + `run_page/` + `assets/` + 数据目录（上游 fork 结构）；博客域 = `blog/`；文档域 = `docs/`。三者只在未来的 `main.tsx` 路由表、`Header` 菜单、`site-metadata.ts` 三处交汇。

为接入新目录完成的 4 处配置改动（**已随 P0.5 独立提交落库**）：

| 文件 | 改动 |
|---|---|
| `tsconfig.json` | `paths` 加 `@blog/* → ./blog/src/*`、`@content/* → ./blog/content/*`；`include` 加 `./blog/**/*` |
| `tailwind.config.js` | `content` 加 `./blog/src/**/*.{js,ts,jsx,tsx,css}` |
| `.github/workflows/run_data_sync.yml` | `push.paths` 加 `blog/**` |
| `.gitignore` | 加 `.workbuddy/` |

**待后续补的一处**：`package.json` 的 `lint` 目前只扫 `src`，博客代码落地后需改为 `eslint --ext .ts,.tsx src blog/src`（`blog/src` 暂无文件时不要提前改，否则 eslint 因无匹配文件报错）。

### 3.5 为什么其余目录不搬（不可移动项证据）

| 目录/文件 | 被谁硬编码 | 移动后果 |
|---|---|---|
| `activities/`、`GPX_OUT/`、`TCX_OUT/`、`FIT_OUT/`、`Workouts/`、`imported.json`、`src/static/activities.json`、`run_page/data.db`、`assets/` | `run_page/config.py` 第 9–22 行按仓库根拼路径；`run_data_sync.yml` 的 Actions Cache `path`；`gh-pages.yml` 缓存恢复 | 缓存首次失效 → 需重新拉取全部跑步数据，依赖 COROS secrets，可能发布失败或统计丢失 |
| `src/`、`public/`、`index.html` | `index.html` 第 32 行 `/src/main.tsx`；`tsconfig.json` 的 `@/*`；`vite.config.ts` 的 `@assets/*`、`import.meta.glob('./year_*.svg')`；CI 的 `src/**` 白名单 | 大量 import 与 CI 触发失效；且这是上游 `running_page` 的 fork，重构后难以合并上游更新 |
| 根目录配置与 `pnpm-lock.yaml` | 工具链默认在项目根查找；`gh-pages.yml` 的 `hashFiles('**/pnpm-lock.yaml')` 与 `pnpm install` | 构建 / lint / 格式化 / 类型检查失败 |
| `requirements*.txt`、`pyproject.toml`、`config.yaml` | `ci.yml` / `run_data_sync.yml` 的 `pip install -r ...` 与 `black . --check`；`run_page/config.py` 第 34 行 `open("config.yaml")` | Python 依赖与格式检查失败 |
| `README.md`、`LICENSE` | GitHub 仓库页展示；MIT 许可要求保留版权与许可声明（`run_page/gpxtrackposter/*.py` 有 10 处文件头引用 `LICENSE`） | 仓库首页 / 法律合规失效 |

结论：**根目录看起来杂，是工具链约定的结果**。整理采取「不搬上游、新增独立域」，正是「保证功能正常」的前提。

**v0.6 已清理的无关文件**（已随 P0.5 提交落库；可用 `git revert` 恢复）：`.dockerignore`、`Dockerfile`、`CONTRIBUTING.md`、`src/static/activities copy.json`、`package-lock.json`、`config-example.yaml`、`yarn.lock`、`vercel.json`、`.vercelignore`。
清理依据：三个 workflow、Vite 构建链、`run_page/*.py` 均无引用；删除后 `pnpm build` 与 `npx tsc --noEmit` 验证通过。**若以后改用 Docker / Vercel 部署，需自行重建对应文件**（README 中仍保留上游的 Docker / Vercel 章节）。

---

## 4. 发布流程：一条命令

### 4.0 首发前置条件（v0.8：已满足）

**原缺陷（v0.7 记录，保留作背景）**：P0.5 的目录整理与配置改动曾全部停留在工作区，`origin/master` 上的 `run_data_sync.yml` 没有 `blog/**` 白名单。若当时直接首次执行 `pnpm publish:notes`，脚本只 `git add blog/content/ blog/config/`，push 的 `blog/content/**` 不命中远端任何 `push.paths` 白名单 → **不触发 `Run Data Sync`、不部署、且不会报错**。

**已执行（A2）**：以下全部内容作为**独立提交**推送 `origin/master`，工作区混态（4 `M` + 9 `D`）已消除：

| 类别 | 路径 |
|---|---|
| 4 处配置改动（`M`） | `.github/workflows/run_data_sync.yml`（含 `blog/**`）、`tsconfig.json`、`tailwind.config.js`、`.gitignore` |
| 9 个文件清理（`D`） | `.dockerignore`、`.vercelignore`、`CONTRIBUTING.md`、`Dockerfile`、`config-example.yaml`、`package-lock.json`、`src/static/activities copy.json`、`vercel.json`、`yarn.lock` |
| 新增目录（`??`） | `blog/`（config / content / scripts / src 骨架）、`docs/BLOG_DESIGN.md` |

落库时使用的命令形态（记录）：

```bash
cd /Users/lission/data/code/lission.github.io
git add .github/workflows/run_data_sync.yml tsconfig.json tailwind.config.js .gitignore blog/ docs/
git add -u -- .dockerignore .vercelignore CONTRIBUTING.md Dockerfile config-example.yaml \
  package-lock.json 'src/static/activities copy.json' vercel.json yarn.lock
git commit -m "chore: P0.5 目录整理、配置接入与无关文件清理"
git push origin master
# 验收门槛（已通过）
git fetch origin master --quiet && git show origin/master:.github/workflows/run_data_sync.yml | grep 'blog/\*\*'
```

**注意**：该提交命中 `run_data_sync.yml` / `tailwind.config.js` 的 `push.paths` 白名单，会触发一次完整的 `Run Data Sync` → Pages 发布（属预期行为）。

### 4.1 命令

```bash
cd /Users/lission/data/code/lission.github.io
pnpm publish:notes
```

`package.json` 中定义 `"publish:notes": "node blog/scripts/publish-notes.mjs"`（P1 实现时加入）。
> `pnpm` 内置有 `publish` 命令，若简写被误解析，等价写法是 `pnpm run publish:notes`；实施时实测确认。

**默认零参数、零交互、零配置文件。** 三个可选参数：

| 参数 | 用途 |
|---|---|
| `--dry-run` | 只打印变更与「新发现的分组/年份」，不写文件、不提交、不推送（**仍执行 preflight**） |
| `--site-only` | 不提交笔记仓库，只发布站点仓库产物 |
| `-m "说明"` | 覆盖自动生成的 commit message |

### 4.2 脚本内部步骤

1. **⓪ preflight（v0.7 新增）**：见 §4.3，校验远端 master 的 workflow 已含 `blog/**`，否则立即报错退出。
2. **定位仓库**：站点根目录 = 脚本所在仓库；笔记根目录默认 `../../github/markDownNote`（两仓库不在同级目录），可用 `NOTES_REPO` 覆盖。
3. **扫描三个来源**（显式声明，不递归整个笔记仓库）：
   - `01-readnotes/**/*.md` → 阅读笔记
   - `04-note/**/*.md` → 随笔
   - **`00-notes/01-阅读清单.md` → 书单（精确单文件）**
4. **动态发现结构**：`01-readnotes` 一级子目录 → 阅读分组；`04-note` 下 `^\d{4}$` 目录 → 年份分组；根级 md → 兜底「未分组」（当前根级 0 篇，故不生成该分组）。
5. **解析与清洗**：
   - 阅读笔记 / 随笔：从文件名提取 8 位日期；`markdown-it`（devDependency）构建期转 HTML；清洗绝对路径、零宽空格、失效图片。
   - **书单：按 8.2 的规则把表格解析为结构化条目**，同时保留一份原文 HTML 作为兜底视图。
6. **生成产物**：写入 `blog/content/**`（含 `books.json`）；`blog/config/posts-map.json` 缺失条目自动补默认值。
7. **打印变更与告警**：新增/修改/删除清单、新分组与年份、书单解析条数与 WARN（列名变体、日期异常、空行跳过）。
8. **提交笔记仓库**（**白名单精确到文件**）：
   ```
   git -C <notes> add 01-readnotes 04-note '00-notes/01-阅读清单.md'
   ```
   → `commit` → `push`（无变更则跳过）。中文路径加引号。
9. **提交站点仓库**：`git -C <site> add blog/content/ blog/config/` → `commit` → `push origin master`，打印 Actions 链接与「请确认 `Run Data Sync` 已被触发」提示。

commit message 自动生成，例如 `notes: 同步 2026-11-06 21:30 (+2 ~3 -0, 新分组 1, 书单 +3)`。

### 4.3 护栏与失败处理

- **⓪ preflight（v0.7 关键护栏，P1 实现）**：`git fetch origin master` 后读取 `git show origin/master:.github/workflows/run_data_sync.yml`，若不含 `blog/**`，打印明确错误「P0.5 配置尚未落库，首次发布将静默不触发部署，请先按 §4.0 提交并推送」并**以非零码退出**；`--dry-run` 同样执行该检查。另检查工作区是否残留未提交的 4 处配置改动，若有则打印 WARN。**A2 已落库，当前该检查会通过；保留它作为长期护栏，防止未来误改 workflow。**
- **绝不 `git add -A` / `git add .` / `git add 00-notes`**：`00-notes/` 下多个文件曾存量公开（§5.3），只能精确到 `01-阅读清单.md` 这一个文件（10.12）。
- **幂等**：`git diff --cached --quiet` 判断无变更时提示「无更新」并退出。
- **原子性**：任一步非零退出立即终止；产物生成失败时不执行任何 git 操作。
- **告警不阻断**：日期/命名异常、书单个别行解析失败只打印 WARN，按兜底规则继续生成；**preflight 失败不属于告警，必须阻断**。
- **CI 复用**：`blog/**` 白名单已随 §4.0 独立提交推送到 `origin/master`，后续发布复用带 Cache 恢复的 `run_data_sync.yml → gh-pages.yml` 链路。

### 4.4 日常场景

| 场景 | 操作 | 是否改配置 |
|---|---|---|
| 修改任意 md 正文 | `pnpm publish:notes` | 否 |
| **更新 `00-notes/01-阅读清单.md`** | **`pnpm publish:notes`（自动重新解析 `books.json` 并发布）** | **否** |
| 新增 md 到已有分组 / 年份目录 | `pnpm publish:notes` | 否 |
| **新增阅读子目录 / 年份目录** | `pnpm publish:notes` → 分组/年份自动出现 | **否** |
| 删除 / 改名 md | `pnpm publish:notes`（已发布过的 slug 不要改） | 否 |
| 调整分组顺序 / 显示名 / 加标签 | 编辑 `blog/config/posts-map.json` 后重跑 | 仅美化时 |
| 排除某篇不发布 / 停发书单 | 编辑 `blog/config/exclude.txt` | 仅需要时 |
| 预览变更 / 本地预览 | `--dry-run` / `pnpm develop` | 否 |

> **§4.0 前置已满足**。首次执行仍会顺带把笔记仓库剩余未提交内容（书单 `M`、6 个 `D`、`杂记/`、`小说/我在北京送快递.md`、`04-note/`）一并提交并推送。**执行前请按 §5.2 / §5.3 完成 `04-note` 内容审阅与隐私确认。**

---

## 5. 配置变更：`04-note` 可提交

### 5.1 已执行的修改

`/Users/lission/data/github/markDownNote/.gitignore` 当前内容：

```gitignore
.gitignore
/03-cestc/*
# 04-note 随笔：允许提交（2026-11-05 起），提交前请人工确认内容
/05-local/*
.DS_Store

# 存量隐私文件：已停止跟踪，仅保留本地（A3 方案 B，2026-11-06）
/00-notes/05-家庭笔记.md
/00-notes/10-vpn.md
/00-notes/15-一一.md
/00-notes/16-forum.md
```

**状态**：`.gitignore` 原被首行规则忽略自身、从未被跟踪；v0.8 已用 `git add -f .gitignore` 纳入版本控制，并随 A3 提交 `6ca201b` 推送。因此远端**首次获得** `/05-local/*`、`/04-note/*` 解除与 4 条精确规则。`04-note/` 目录内容本身仍未提交（`?? 04-note/`），待首次 `pnpm publish:notes`。

### 5.2 变更影响与必须注意

1. `05-local/` 保持严格忽略且**未被跟踪**（`git ls-files 05-local` 返回 0），`简历.pdf`、`private.md`、`简历.md` 不会被脚本扫描或 add。
2. `00-notes/` 下 4 个敏感文件**原为已被 git 跟踪、存量已公开**；A3 方案 B 已停止跟踪并从远端最新树移除，但**历史中仍有全文**。脚本只 add `01-阅读清单.md` 这一文件，能防止未来修改被带入新提交；不要在笔记仓库手工执行 `git add -A`。
3. `01-阅读清单.md` 本身**已被 git 跟踪、内容本就公开**，网站只是再展示一次；这一「已跟踪=已公开」的判据同样适用于 §5.3。
4. `04-note` 9 篇随笔公开前建议逐篇通读；个别不想发布的文件写入 `blog/config/exclude.txt`。
5. 笔记仓库的 `.workbuddy/` 仍未跟踪，如不想提交可另加忽略规则（**不要删除该目录**）。

### 5.3 存量隐私处置（v0.8：已执行方案 B）

**决策**：用户选择方案 B（停止跟踪 + 补 ignore）。**未选择**方案 C（改写历史）。

**执行结果**（笔记仓库提交 `6ca201b`，已 push）：

| 动作 | 结果 |
|---|---|
| `git rm --cached --` 4 个文件 | 4 个文件全部从 index 移除，**本地文件全部保留**（已逐个 `test -f` 验证） |
| `.gitignore` 补 4 条精确规则 | `git check-ignore -v` 生效；只忽略这 4 个文件，不影响 `01-阅读清单.md` 等同目录文件 |
| `git add -f .gitignore` | 该文件首次纳入版本控制并推送；顺带把 `/05-local/*` 规则补到远端 |
| 远端验证 | `00-notes/` 已跟踪文件数 **22 → 18**，4 个文件已不在 `origin/master` 最新树中 |

**遗留风险（方案 B 的固有限制，必须知悉）**：

1. **历史提交中仍有这 4 个文件的全文**，任何拿到仓库历史的人可查；fork、GitHub 缓存、已抓取/已 clone 的副本不受本次操作影响。若必须彻底清除，仍需方案 C（`git filter-repo` / BFG 改写历史 + 强推），且若内容含账号口令，**必须先轮换凭据**。本轮未执行。
2. `00-notes/` 远端仍有 **18 个已跟踪文件**（全量审计见 `git ls-files 00-notes`），本轮按用户点名范围只处理 4 个，未扩大；建议后续按同一判据逐项审阅（见 13 章）。
3. `00-notes/01-阅读清单.md` 有未提交修改，未纳入 A3 提交，留待首次 `pnpm publish:notes`。

---

## 6. 内容模型 A：阅读笔记（目录即分组）

### 6.1 设计取舍

分组直接映射一级子目录（**单一归属、零维护**），标签作为附加筛选（**多对多**，在 `posts-map.json` 可选填写）。

### 6.2 动态分组规则

| 来源 | 分组 | 说明 |
|---|---|---|
| `01-readnotes/<任意子目录>/*.md` | 子目录名 | 运行时扫描得到，不写死；当前 5 个分组：人生 15 / 历史 7 / 大理 1 / 小说 8 / 杂记 5 |
| `01-readnotes/*.md`（根级） | 未分组 | **当前根级 0 篇，故不生成该分组**；仅当将来出现根级 md 时才动态出现 |
| 未来新增子目录 | 自动新增分组 | 下次同步即生效 |

- 只识别一级子目录；更深层级视为分组内普通文件。
- `groupOrder` 可固定已有分组顺序，未列出的新分组追加末尾并提示；`groupLabels` 可覆盖显示名；空分组默认隐藏。
- **slug 与目录解耦**：由标题生成稳定 slug 写入 `posts-map.json`，跨分组移动（如 `我在北京送快递.md` 从根级移入 `小说/`）不破坏链接。

### 6.3 侧边栏交互

- 树：`阅读笔记` → 分组（带篇数）→ 文章；分组可折叠，状态存 `localStorage`，新分组默认展开。
- 标签条过滤，支持 `?group=历史&tag=xxx`；移动端侧栏收成抽屉。
- 详情页保留手写锚点目录，并生成「本文目录」卡片（兼容 `[TOC]` 与 `[x](#x)`）。

### 6.4 索引结构示例

`blog/content/groups.json`（**当前实际值，根级 0 篇故无「未分组」**）：

```json
[
  { "id": "人生", "label": "人生", "count": 15, "order": 1 },
  { "id": "历史", "label": "历史", "count": 7, "order": 2 },
  { "id": "大理", "label": "大理", "count": 1, "order": 3 },
  { "id": "小说", "label": "小说", "count": 8, "order": 4 },
  { "id": "杂记", "label": "杂记", "count": 5, "order": 5 }
]
```

`blog/content/reading.json` 单篇：

```json
{
  "type": "reading",
  "slug": "lun-yu",
  "title": "论语",
  "group": "人生",
  "tags": ["儒家", "经典"],
  "source": "01-readnotes/人生/论语.md"
}
```

---

## 7. 内容模型 B：随笔（年份目录 + 文件名日期）

### 7.1 现行命名约定

```
04-note/<YYYY>/<标题>-<YYYYMMDD>.md
```

| 年份目录 | 文件 | 分类 |
|---|---|---|
| `2023/` ~ `2026/` | `标题-YYYYMMDD.md` | 标准（4 篇） |
| `2022/` | `YYYYMMDD.md`（5 篇） | 旧式纯日期，标题在正文首个 `#` |

### 7.2 三条解析规则

1. **年份分组以目录名为准**，新增年份目录自动出现，倒序排列。
2. **日期从文件名提取** `\d{8}` → `YYYY-MM-DD` 写入 `date`。
3. **标题优先级**：文件名 `-` 前的部分 → 正文首个 `#`/`##` 标题 → 日期字符串兜底。

### 7.3 异常兜底

| 情况 | 处理 |
|---|---|
| 文件名年份 ≠ 目录年份 | 仍按目录年份分组，`date` 取文件名日期用于排序，打印 `WARN` |
| 文件名无 8 位日期 | `date = null`，标题取文件名，排该年末尾「未标日期」 |
| 同年同日多篇 | 按标题稳定排序，slug 追加短序号 |
| 出现根级 md | 打印警告并归入「未标年份」 |
| 文件名含空格、`·`、`，` | 清洗后生成 slug，不改原文件 |

### 7.4 分组与排序

- 年份倒序（2026 → 2022），侧栏树形可折叠并显示篇数；年份列表动态发现。
- 年内按 `date` 倒序；`?sort=asc` 切正序；`date = null` 排末尾。
- 列表页为文章卡片，点击进入 `/notes/:year/:slug` 单篇详情。

### 7.5 索引结构示例（`blog/content/notes.json`）

```json
{
  "years": [{ "year": "2026", "count": 1 }, { "year": "2022", "count": 5 }],
  "posts": [
    {
      "type": "note",
      "year": "2026",
      "date": "2026-11-04",
      "slug": "20261104-sheng-huo-de-ling-wai-bu-fen",
      "title": "生活的另外部分",
      "source": "04-note/2026/生活的另外部分-20261104.md"
    }
  ]
}
```

### 7.6 相对 v0.2 简化掉的内容

| v0.2 需要处理 | v0.3 起 |
|---|---|
| 4 种标题日期形态 | 统一从文件名取 8 位日期 |
| 区分年度聚合文件与单篇、按 `#`/`##` 拆条目 | 取消，每篇即一篇 |
| 中文数字转换、正文日期解析 | 取消 |
| `entries[]` 嵌套结构 | 扁平 `posts[]` |

---

## 8. 内容模型 C：阅读书单（v0.5 新增）

### 8.1 设计取舍

`01-阅读清单.md` 是**按年份分节的表格**，不是散文。原样渲染会有两个问题：移动端横向溢出、无法按状态/类型筛选与统计。因此：

- **主视图**：构建期解析为 `books.json`，前端渲染为「年份分组 + 卡片/表格 + 筛选 + 统计」。
- **兜底视图**：同时保留原文转成的 HTML，页面提供「查看原始清单」；解析条数与源表格数据行不符时自动提示，保证不丢内容。
- **不改动原文件**：解析只读，所有清洗在产物里做。

### 8.2 解析规则

1. **切分年份段落**：匹配 `^##\s+\[?(\d{4})阅读清单`；跳过顶部 `## **目录**` 与 `# 阅读清单`；表格前的说明文字（如加粗小标题）保留为该年份的 `note`。
2. **取每张表的表头做列名映射**：`序号 / 书名 / 作者 / 类型 / 完成时间|阅读时间 / 书质 / 备注`。**「完成时间」与「阅读时间」统一映射为 `dateRaw`**；按列名而非固定列序取值，列顺序变化不敏感。
3. **跳过**：分隔行（`| ---- |`）、序号为空的行、全空单元格行。
4. **字段清洗**：书名去掉外层 `《》` 与 `**` 加粗标记（保留显示用 `titleRaw`）；作者/类型/书质/备注去首尾空格。
5. **日期解析**（写入 `startDate` / `endDate`，均为 `YYYY-MM-DD` 或 `null`）：
   - 范围分隔符同时支持 `~` 与 `-`；
   - `YYYYMMDD`（8 位）→ 直接转；`YYYYMM`（6 位）→ 补 `01`；
   - `20240921-` 这类**只有开始** → `endDate = null`，状态标「在读」；
   - `——` → 两个日期都为 `null`，状态「暂停」；
   - 年份明显异常（如 `2015xxxx` 出现在 2025 段）→ **保留原值 + 打印 WARN**，不修正原文件、不阻断构建。
6. **状态派生** `status`：
   - 备注含「暂停」或 `dateRaw = ——` → `暂停`
   - `endDate = null` 且有开始日期 → `在读`
   - 其余 → `已完成`
7. **排序与统计**：年份倒序（2026 → 2021）；组内默认按 `seq` 原序，可切按 `startDate` 倒序；生成总数 / 已完成 / 在读 / 暂停 / 按类型分布。

### 8.3 页面交互

- `/books` 顶部：累计册数、本年度册数、在读、暂停四张统计卡。
- 年份分组（与随笔一致的可折叠侧栏），筛选：类型、书质（电子/纸质）、状态；书名/作者搜索。
- 桌面端表格，移动端自动转卡片，避免横向滚动。
- **可选联动**：若书单中某本书在 `01-readnotes` 有同名/近似笔记文件，条目上附「阅读笔记」链接；采用保守的精确匹配 + 人工 `posts-map.json` 覆盖，避免误链（列为 P2 可选项，见 13 章）。

### 8.4 索引结构示例（`blog/content/books.json`）

```json
{
  "source": "00-notes/01-阅读清单.md",
  "total": 145,
  "stats": { "finished": 120, "reading": 15, "paused": 3 },
  "years": [
    {
      "year": "2026",
      "note": "",
      "count": 10,
      "items": [
        {
          "seq": 1,
          "title": "示例书名",
          "author": "示例作者",
          "category": "随笔",
          "dateRaw": "20260113-20260116",
          "startDate": "2026-01-13",
          "endDate": "2026-01-16",
          "medium": "纸质",
          "note": "",
          "status": "已完成",
          "relatedSlug": null
        }
      ]
    }
  ],
  "fallbackHtml": "..."
}
```

> `total`、`count` 等数值由脚本生成，上例仅为结构示意。

### 8.5 同步与容错

| 情况 | 处理 |
|---|---|
| 文件不定期更新 | 同一条 `pnpm publish:notes`，检测到内容变化即重新解析并发布，无需额外命令 |
| 文件被 `exclude.txt` 排除 | 停止生成 `books.json`，`/books` 显示「暂无书单」而非报错 |
| 文件被删除或改名 | 打印 `WARN`，保留上次 `books.json`，不静默删菜单 |
| 新增 2027 段落 | 自动出现新年份分组，无需改代码或配置 |
| 表头再次改名 / 新增列 | 未知列忽略并打印 `WARN`；已知列仍按列名映射 |
| 单行解析失败 | 跳过该行并计入 WARN 汇总，页面提示「原始清单」兜底 |

---

## 9. 前端改造清单（文件级）

| 文件 | 改动 | 对跑步页的影响 |
|---|---|---|
| `src/main.tsx` | 在 `path: '*'` **之前**插入 `/reading`、`/notes`、`/books`、`/about` 及详情路由，页面用 `React.lazy` 从 `@blog/*` 引入 | 原 `/`、`*` 与 `basename` 不变 |
| `src/components/Header/index.tsx` | `navLinks` 由 `<a href>` 改 `<Link>`；logo `to={siteUrl}` 建议改 `to="/"` | 外观不变 |
| `src/static/site-metadata.ts` | 外链改站内路径，增加「阅读」「随笔」「书单」 | `siteTitle`/`siteUrl`/`logo`/`description` 不动 |
| `src/components/Layout/index.tsx` | 新页面复用 `<Layout>`；Helmet 支持按路由覆盖 title/description | 跑步页默认 title 与 keywords 不变 |
| **`blog/src/`（新增）** | 阅读/随笔/书单列表页、详情页、数据驱动的可折叠树、筛选与统计 | 仅在博客路由下加载 |
| `package.json` | 新增 `publish:notes`（指向 `blog/scripts/`）、`markdown-it` 等 devDependency；博客代码落地后扩展 `lint` 扫描范围 | 不改变现有 `build`/`develop`/`ci` |
| `vite.config.ts` | 视需要调整 `manualChunks`（见 10.1） | 需保证 `/` 不下载博客 chunk |
| `tailwind.config.js` + `src/styles/index.css` | 正文排版样式限定在 `.post-content`；书单表格/卡片样式 | 不改现有 CSS 变量与 `.card`/`.nav-pill` |
| `index.html` | **不改**；构建后复制 `dist/index.html` → `dist/404.html` | 仅影响未知路径的 404 行为 |
| `.github/workflows/*` | `blog/**` 白名单已随 §4.0 独立提交落库，后续 0 改动 | 复用触发链 |
| `tsconfig.json` | 已加别名与 include（已落库） | 无 |

> 分组与年份均为**数据驱动**：侧栏与书单只渲染 `blog/content/*.json`，新增目录/年份段落不需要改前端代码。

---

## 10. 风险与对策

| # | 风险 | 对策 |
|---|---|---|
| 10.1 | `vite.config.ts` 的 `manualChunks` 把所有 `node_modules` 打进同一个 `vendors` chunk；引入运行时 Markdown 库会让跑步首页也下载 | Markdown **构建期**转 HTML（库仅 devDependency）；博客页 `React.lazy` 拆分；`@content/*` 索引不做顶层静态 import |
| 10.2 | `gh-pages.yml` 手动触发时 `save_data_in_github_cache` 默认 `false`，不恢复 Cache 会让跑步统计回退到旧快照 | 只用 `pnpm publish:notes` 或 `Run Data Sync` 发布；**不要手动单独运行 `Publish GitHub Pages`** |
| 10.3 | SPA 深链 `/reading/xxx`、`/notes/2026/xxx` 直接访问会 404 | 构建后生成 `404.html`；**不改 `base`、不给路径加前缀** |
| 10.4 | 新增排版样式覆盖现有组件或 Mapbox 控件 | 样式限定 `.post-content` / 书单容器作用域 |
| 10.5 | `path: '*'` 若被放到新路由之前会吞掉所有页面 | 保持 `*` 为路由表最后一项 |
| 10.6 | 隐私：`04-note` 已可提交，自动 push 会公开随笔 | 首次执行前逐篇审阅；用 `exclude.txt` 排除；`05-local` 硬编码排除、`git add` 白名单化 |
| 10.7 | SEO：SPA 无预渲染，百度/微信内收录较弱 | 当前以「简单」优先；后续再评估独立 SSG 或预渲染 |
| 10.8 | 误判回归：`ci.yml` 的 Python `black --check` 是仓库既有失败项 | 与本次改动无关 |
| 10.9 | **随笔文件名年份与目录年份不一致**：`2022/20260602.md`、`2022/20260613.md` 疑似笔误 | 年份分组以目录为准 + WARN；建议重命名为 `20220602.md`、`20220613.md` |
| 10.10 | 动态分组：新增/改名目录可能让旧 URL、旧折叠状态失效 | slug 与目录解耦并固化；删除分组时保留「未分组」兜底；`localStorage` 按分组 id 容错 |
| 10.11 | **目录整理引入的路径风险**：别名未生效、Tailwind 未扫描、CI 白名单遗漏、误搬数据目录导致缓存失效 | 3.4 节 4 处配置已同步修改并落库；3.5 节不可移动项一律不搬；每次改动执行第 11 章验证 |
| 10.12 | **`00-notes/` 隐私双层风险**：① 存量：4 个文件曾已公开（方案 B 已停止跟踪、远端最新树已移除，但历史仍有全文）；② 增量：未来修改被误带入新提交 | ① 遗留风险见 §5.3，未选方案 C；② `git add` 精确到 `'00-notes/01-阅读清单.md'`，绝不 `git add 00-notes` / `git add -A`；脚本扫描源也只声明该单文件 |
| 10.13 | **书单解析不规则**：列名变体、日期范围、未完成标记、年份笔误、空行 | 按列名映射 + 宽松日期解析 + 逐行 WARN 不阻断；保留原文 HTML 兜底视图；解析条数与源行不符时提示 |
| **10.14** | **首发时序漏洞（已闭环）**：P0.5 的 `blog/**` 白名单未落库时首次发布会静默不触发部署 | **A2 已执行**：§4.0 独立提交推送 `origin/master`，远端 workflow 已含 `blog/**`；**preflight（§4.3）保留为长期护栏**，防止未来误改 workflow |
| **10.15** | **存量隐私被误判为「仅潜在风险」（已修正）** | v0.7 已把定性改为「已被 git 跟踪、存量已公开」；v0.8 已按方案 B 执行停止跟踪与补 ignore；历史遗留风险在 §5.3 明确记录 |

---

## 11. 验收清单

**P0.5 落库（A2，已完成）**
- [x] 4 处配置改动 + 9 个文件清理 + `blog/` / `docs/` 已作为**独立提交**推送 `origin/master`
- [x] `git fetch origin master && git show origin/master:.github/workflows/run_data_sync.yml | grep 'blog/\*\*'` 有输出
- [x] `git status` 不再残留这 4 个 `M` 与 9 个 `D`
- [ ] `pnpm publish:notes --dry-run` 在白名单缺失时能正确报错（**P1 实现 preflight 后验证**，可用临时分支）

**目录整理（已完成）**
- [x] `pnpm build` 成功、`dist/index.html` 生成，跑步页资源引用不变
- [x] `npx tsc --noEmit` 无新增类型错误（既有 24 个）
- [x] `run_data_sync.yml` YAML 可解析，白名单含 `blog/**`
- [x] `.workbuddy/` 已忽略

**发布链路（P1 后验证）**
- [ ] `pnpm publish:notes --dry-run` 清单含三个来源，`05-local` 与 `00-notes/` 其他文件不出现
- [ ] `pnpm publish:notes` 一条命令完成两个仓库 commit + push，并打印 Actions 链接
- [ ] **首次发布后 `Run Data Sync` 确实被触发**、`gh-pages.yml` 部署成功，`/books` 等页面同步更新
- [ ] 无改动时重跑提示「无更新」且不产生空提交

**阅读笔记**
- [ ] 侧栏 **5 个分组（人生 15 / 历史 7 / 大理 1 / 小说 8 / 杂记 5）** 计数正确、可折叠
- [ ] **根级 0 篇，侧栏不出现「未分组」分组**；新增一个根级 md 后该分组自动出现
- [ ] **新建子目录 + 1 篇 md，重跑后自动出现新分组，未改代码或配置**
- [ ] 标签筛选与 `?group=&tag=` 生效；锚点目录、`<ruby>` 注音、代码块正常

**随笔**
- [ ] 年份分组 2026→2022 倒序，篇数正确（1/1/1/1/5）
- [ ] 两类文件名都解析出正确 `date` 与标题
- [ ] **新建 `04-note/2027/` 并重跑后年份分组自动出现**
- [ ] 文件名年份与目录年份不一致时打印 WARN 且仍归在目录年份

**书单（v0.5 新增）**
- [ ] `/books` 菜单可点击，页面显示 2026→2021 六个年份分组
- [ ] 「完成时间」与「阅读时间」两种表头都正确映射
- [ ] `——`、`~`、`-`、6 位/8 位日期、无结束日期均解析出正确 `startDate`/`endDate` 与状态
- [ ] 空行、分隔行、加粗书名、年份笔误不导致构建失败，WARN 汇总可查
- [ ] **修改 `01-阅读清单.md` 后只跑一条 `pnpm publish:notes`，网站书单同步更新**
- [ ] 解析条数与源表格数据行一致；「查看原始清单」兜底视图可打开
- [ ] 桌面表格 / 移动端卡片、类型与状态筛选、统计卡正常

**隐私（A3 方案 B，已完成）**
- [x] 4 个文件已 `git rm --cached`，本地文件仍在，`git check-ignore` 生效
- [x] `.gitignore` 已强制纳入版本控制并推送；远端 `00-notes/` 22 → 18
- [x] `/05-local/*` 规则首次出现在远端
- [ ] **遗留**：历史中仍有全文，`00-notes/` 其余 18 个已跟踪文件未审阅（见 13 章）

**跑步页回归（关键）**
- [ ] `/` 年份切换、地图、SVG 统计、跑步表格、深浅主题、移动端均正常
- [ ] `pnpm build` 后 `vendors-*.js` 体积无明显增长
- [ ] 线上 Network 面板确认 `/` 未请求博客索引或 chunk
- [ ] 跑步统计数值与发布前一致（验证 10.2 未回退）

**回滚**：P0.5 独立提交与内容管线、前端提交彼此分离，出问题 `git revert` 单个提交即可，跑步数据与 Python 脚本不受牵连。

---

## 12. 实施计划与成本

| 阶段 | 内容 | 状态 / 预估 |
|---|---|---|
| P0 | 逐篇审阅 `04-note` 9 篇随笔；确认 2 个疑似年份笔误 | 部分完成：A3 隐私决策已定为方案 B；**随笔审阅仍待办**，约 0.5 小时 |
| **P0.5** | 目录整理：新建 `blog/` 与 `docs/`、4 处配置接入、9 个文件清理、构建验证 | **已完成并独立提交推送** |
| **P0.6** | 把 P0.5 成果独立提交推送 `origin/master`，校验远端 workflow 已含 `blog/**` | **已完成（A2）** |
| P1 | `blog/scripts/publish-notes.mjs`：三个同步源、动态目录发现、日期解析、书单表格解析、告警、**preflight 校验**，跑通一条命令 | 约 0.5–1 天 |
| P2 | `blog/src/`：阅读分组树 / 随笔年份排序 / 书单页与统计筛选 / 详情页 / 正文样式 | 约 1 天 |
| P3 | 路由、菜单（含「书单」）、404 回退、chunk 拆分、本地与线上回归 | 约 0.5 天 |

**费用：0 元。** GitHub Pages 容量与带宽对 45 篇笔记 + 一份 20 KB 书单绰绰有余。唯一可选支出是自定义域名（约 ¥60–120/年），只影响品牌。

---

## 13. 审阅时建议确认的几个点

1. **书单菜单名与路径**：默认「书单」`/books`，是否改用「阅读清单」`/reading-list`？
2. **书单展示形态**：结构化书单（可筛选/统计）为主 + 原始清单兜底，是否符合预期？还是只想要原样表格？
3. 是否需要「书名 → 阅读笔记」的联动链接（8.3 可选项）？
4. **书单来源是否固定为这一个文件**？如果以后拆分/改名，是改脚本一行，还是希望做成 `blog/config/sources.txt` 配置化（会增加一点配置成本）？
5. 标准随笔命名是否固定为 `标题-YYYYMMDD.md`？`2022/` 下 5 个纯 `YYYYMMDD.md` 是否统一重命名？
6. 疑似年份笔误：`2022/20260602.md`、`2022/20260613.md` 是否改为 `20220602.md`、`20220613.md`？
7. **A1 已闭环**：`我在北京送快递.md` 已移入 `小说/`，根级 0 篇；文档数据已刷新为 小说 8，无需再决策。
8. 阅读笔记是否「只要目录分组」就够，标签是否现在就做？
9. `04-note` 9 篇是否全部公开？有无需要写入 `exclude.txt` 的？
10. **新的目录划分是否认可**：博客全部收在 `blog/`、文档收在 `docs/`、跑步代码保持原位？若希望把 `src/` 搬进 `src/run/`，需另行评估（见 3.5）。
11. **无关文件清理已完成（v0.6）**：删除 9 个零引用文件，仅保留 `pnpm-lock.yaml`（CI 使用）与 `LICENSE`（法律要求）。若以后要用 Docker / Vercel 部署，需重建对应配置。
12. **A3 已按方案 B 执行**（`6ca201b`）：4 个文件停止跟踪、远端最新树已移除、本地保留。**剩余决策**：`00-notes/` 其余 18 个已跟踪文件是否也要按同一判据处理？以及是否仍需方案 C 改写历史（会清除历史全文，但属破坏性操作）？
13. **A2 已完成**：P0.5 已独立提交并推送，远端 workflow 已含 `blog/**`。**下一步**：是否开始 P1 发布脚本实现？
14. 是否按 P1→P2→P3 顺序实施，先只做发布脚本、暂不动前端？
