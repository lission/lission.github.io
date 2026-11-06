# 阅读笔记 / 随笔更新到网站 · 操作命令手册

> **适用场景**：本机 `/Users/lission/data/github/markDownNote` 中的阅读笔记、随笔（或阅读书单）发生变动，需要同步到 <https://lission.github.io/>。
>
> **核对日期**：2026-11-06。本文所有命令均在本机实测通过（Node v22.2.0 / pnpm 9.2.0 / macOS）。
>
> **文档定位**：`docs/BLOG_DESIGN.md` 是设计审阅稿，讲「为什么这样设计」；本文是可直接复制执行的**操作命令清单**。
>
> 本文只描述操作，不含任何笔记正文，也不包含 `05-local/` 等本地隐私内容。

---

## 0. 一句话结论

```bash
cd /Users/lission/data/code/lission.github.io
pnpm publish:notes
```

这条命令完成：**扫描笔记 → 生成 `blog/content/**` → 提交推送笔记仓库 → 提交推送站点仓库 → 由 GitHub Actions 构建并发布到 Pages**。

> **但当前（2026-11-06）还不能直接用**：远端 `origin/master` 上还没有博客代码，必须先执行一次 [§2 一次性首发](#2-一次性前置首发博客代码当前必做)。首发完成后，日常更新才永远是上面这一条命令。

---

## 1. 环境与路径

| 项 | 值 |
|---|---|
| 笔记仓库（内容来源） | `/Users/lission/data/github/markDownNote` |
| 站点仓库（发布脚本与前端） | `/Users/lission/data/code/lission.github.io` |
| 笔记仓库远端 / 分支 / 上游 | `git@github.com:lission/markDownNote.git` / `master` / `origin/master` |
| 站点仓库远端 / 分支 / 上游 | `git@github.com:lission/lission.github.io.git` / `master` / `origin/master` |
| 发布脚本 | `blog/scripts/publish-notes.mjs`（零第三方依赖，Node ≥ 18） |
| npm scripts | `publish:notes`、`blog:content`、`build`、`develop` |
| 部署链路 | push 到站点仓库 `master` 且命中 `blog/**` → `Run Data Sync` → `Publish GitHub Pages` |
| 线上地址 | <https://lission.github.io/reading> · `/notes` · `/books` · `/about` |
| Actions 看板 | <https://github.com/lission/lission.github.io/actions/workflows/run_data_sync.yml> |

前置检查（首次配置或换机器时执行一次）：

```bash
node -v && pnpm -v

# 缺少依赖时安装
cd /Users/lission/data/code/lission.github.io
pnpm install

# 核对两个仓库的远端与上游（脚本里笔记仓库用的是无参数 git push，依赖上游存在）
git -C /Users/lission/data/github/markDownNote remote -v
git -C /Users/lission/data/github/markDownNote rev-parse --abbrev-ref --symbolic-full-name '@{u}'
git -C /Users/lission/data/code/lission.github.io remote -v

# 核对远端 workflow 白名单（preflight 每次会自动做这一项）
git -C /Users/lission/data/code/lission.github.io fetch origin master --quiet
git -C /Users/lission/data/code/lission.github.io show origin/master:.github/workflows/run_data_sync.yml | grep 'blog/\*\*'
```

若上游缺失，先补一次：

```bash
git -C /Users/lission/data/github/markDownNote push -u origin master
```

---

## 2. 一次性前置：首发博客代码（当前必做）

### 2.1 为什么需要这一步

2026-11-06 实测状态：

| 位置 | 事实 |
|---|---|
| `origin/master` | 只有 P0.5 骨架：`blog/scripts/` 里仅有 `.gitkeep`，`package.json` 的 `build` 仍是 `vite build`，`src/main.tsx` 只有 `/` 与 `*` 两条路由 |
| 本地工作区 | 博客前端（`blog/src/`）、发布脚本（`blog/scripts/*.mjs`）、内容产物（`blog/content/**`）、路由与样式改动（`src/**`、`index.html`、`package.json`）**均未提交** |
| 结论 | 线上目前没有 `/reading`、`/notes`、`/books` 页面；只跑 `pnpm publish:notes` 会推送内容 JSON，但线上没有能渲染它们的页面代码 |

因此需要先把本地代码整体发布一次。**这一步属于代码发布，只需执行一次**，之后不再需要。

### 2.2 首发命令

```bash
cd /Users/lission/data/code/lission.github.io

# ① 看清将要提交的内容（-c core.quotepath=false 让中文路径不显示为转义码）
git -c core.quotepath=false status --short

# ② 精确 add；不要使用 git add -A / git add .
git add index.html package.json tsconfig.json tailwind.config.js \
  src/main.tsx src/components src/hooks src/styles src/static \
  blog/ docs/

# ③ 复核暂存区
git diff --cached --stat

# ④ 提交并推送
git commit -m "feat(blog): 阅读笔记 / 随笔 / 书单页面与一条命令发布脚本"
git push origin master
```

**三个必须注意的点**：

1. `blog/` 必须整体提交，特别是 `blog/content/*.json` 与 `blog/content/pages/*.json`。前端用 `import.meta.glob('../../content/*.json')` 加载索引，产物缺失时页面会报「缺少内容索引 xxx.json，请先执行 pnpm publish:notes」。
2. 这次 push 命中 `blog/**`、`package.json`、`src/**` 白名单，会自动触发一次完整的 `Run Data Sync → Publish GitHub Pages`。等它跑完再继续。
3. `docs/` 是否一起提交可自行决定；若只想提交代码，把 `docs/` 从 `git add` 命令中去掉即可。

### 2.3 首发验收

```bash
# 远端确实拿到了脚本与内容
git -C /Users/lission/data/code/lission.github.io ls-tree -r --name-only origin/master -- blog/scripts blog/content | head -20

# 打开 Actions 看板确认部署成功
open https://github.com/lission/lission.github.io/actions/workflows/run_data_sync.yml

# 浏览器确认页面可访问（部署有 1–3 分钟延迟）
open https://lission.github.io/reading
open https://lission.github.io/notes
open https://lission.github.io/books
```

---

## 3. 数据链路（命令背后发生了什么）

```
markDownNote/                                   lission.github.io/
├── 01-readnotes/<分组>/*.md   阅读笔记          ├── blog/scripts/publish-notes.mjs
├── 04-note/<YYYY>/*.md       随笔              ├── blog/content/*.json + pages/*.json  ← 生成的产物
└── 00-notes/01-阅读清单.md    书单              └── blog/config/{posts-map.json,exclude.txt}
        │                                              │
        │  pnpm publish:notes                           │
        │  ⓪ preflight：fetch origin/master + 校验远端 workflow 含 blog/**
        │  ① 扫描上述三个来源（动态发现分组 / 年份）
        │  ② 清洗 + 构建期转 HTML + 关联书单的日期/作者
        │  ③ 写入 blog/content/**，回写 posts-map.json，清理过期 pages
        │  ④ git -C 笔记仓库 add 01-readnotes 04-note '00-notes/01-阅读清单.md' → commit → push
        │  ⑤ git -C 站点仓库 add blog/content/ blog/config/ → commit → push origin master
        ▼                                              ▼
   笔记仓库 commit（公开原文）              站点仓库 commit 命中 blog/** 白名单
                                                       ▼
                          GitHub Actions：Run Data Sync（恢复跑步数据 Cache）
                                                       ▼
                          Publish GitHub Pages：PATH_PREFIX=/ pnpm build → dist → Pages
                                                       ▼
                                    https://lission.github.io/{reading,notes,books}
```

要点：

- GitHub Actions 里**没有**本机 `markDownNote` 目录，脚本只在本机运行，产物提交进站点仓库；CI 只执行原有的 `pnpm build`。
- 笔记仓库的 push **不会**触发站点 CI；触发部署的是站点仓库的 `blog/**` 提交。
- `Run Data Sync` 另有定时触发（`cron: '14 1,13 * * *'` UTC，每天两次），即使 push 未命中白名单，最多半天内也会重新部署一次。

---

## 4. 标准流程（每次笔记变动）

### Step 0 · 进入站点仓库

```bash
cd /Users/lission/data/code/lission.github.io
```

> 脚本通过自身位置推算 `SITE_ROOT`，笔记仓库默认解析为 `../../github/markDownNote`，即 `/Users/lission/data/github/markDownNote`。**必须在站点仓库目录下执行**（`pnpm` 要在站点仓库找 `package.json`）。

### Step 1 · 预览变更（强烈建议）

```bash
pnpm publish:notes --dry-run
```

只读：不写文件、不 commit、不 push，但**会执行 preflight**（需要能 `git fetch origin master`）。输出包含变更清单（`+ / ~ / -`）、统计（阅读篇数 / 分组、随笔篇数 / 年份、书单条数）、新分组 / 新年份、以及 `WARN` 汇总。

### Step 2 · 可选：只生成本地产物，不碰 git

```bash
pnpm blog:content
```

等价于 `node blog/scripts/publish-notes.mjs --content-only`：写 `blog/content/**`，跳过 preflight 与全部 git 操作。适合离线、或想先看看产物再决定要不要发布。

### Step 3 · 可选：本地预览与构建验证

```bash
# 另开一个终端执行，Ctrl+C 退出
pnpm develop
open http://localhost:5173/reading
open http://localhost:5173/notes
open http://localhost:5173/books
```

```bash
# 构建验证（会顺带生成 dist/404.html 供 SPA 深链回退）
pnpm build
ls -l dist/index.html dist/404.html
```

### Step 4 · 正式发布

```bash
pnpm publish:notes
```

脚本自动生成 commit message，形如：

```
notes: 同步 2026-11-06 11:30 (+2 ~3 -0, 新分组 1, 书单 +3)
```

两个仓库使用同一条 message。若任一仓库无变更，提示「无更新，跳过 commit/push」，不会产生空提交。

### Step 5 · 验收

```bash
# ① 两个仓库的最新提交
git -C /Users/lission/data/github/markDownNote --no-pager log -1 --oneline
git -C /Users/lission/data/code/lission.github.io --no-pager log -1 --oneline

# ② 站点仓库工作区是否干净（blog/content 应已提交）
git -C /Users/lission/data/code/lission.github.io status --short -- blog/content blog/config

# ③ 打开 Actions 看板，确认 Run Data Sync 与 Publish GitHub Pages 均成功
open https://github.com/lission/lission.github.io/actions/workflows/run_data_sync.yml

# ④ 线上确认（部署有延迟，必要时 Shift+Cmd+R 强刷）
open https://lission.github.io/reading
open https://lission.github.io/notes
```

---

## 5. 场景速查

| 场景 | 命令 | 说明 |
|---|---|---|
| 修改任意阅读笔记 / 随笔正文 | `pnpm publish:notes --dry-run` → `pnpm publish:notes` | 全量重生成，不需要指定文件 |
| 新增 md 到已有分组 / 年份目录 | 同上 | 无需改任何配置 |
| **新增阅读子目录 / 随笔年份目录** | 同上 | 分组、年份由目录动态发现，自动出现 |
| 删除 / 改名 md | 同上 | 过期 `blog/content/pages/*.json` 自动清理；见下方「改名注意」 |
| 更新书单 `00-notes/01-阅读清单.md` | 同上 | 同一条命令自动重新解析 `books.json` |
| 改分组顺序 / 显示名 / 标题 / 标签 / slug / 作者 / 日期 | 编辑 `blog/config/posts-map.json` → `pnpm publish:notes` | 配置是可选的「美化层」 |
| 某篇不发布到网站 | 把相对路径写入 `blog/config/exclude.txt` → `pnpm publish:notes` | 一行一个路径，`#` 为注释 |
| 只发布站点产物（笔记仓库已手动提交） | `pnpm publish:notes --site-only` | 跳过笔记仓库的 commit/push |
| 自定义 commit message | `pnpm publish:notes -m "notes: 补一篇随笔"` | 两仓库共用 |
| 离线 / 只想本地看效果 | `pnpm blog:content` → `pnpm develop` | 不联网、不碰 git |
| 换机器或笔记仓库换了位置 | `NOTES_REPO=/abs/path/to/markDownNote pnpm publish:notes` | 环境变量覆盖默认路径 |
| 查看全部参数 | `pnpm publish:notes --help` | — |

**改名注意**：`posts-map.json` 的键是 `reading::<标题>` / `note::<日期>::<标题>`，**改标题会生成新键和新 slug，旧链接可能失效**。若必须改名，先在该文件里把原条目的 `slug` 固定下来，或保留重定向意识。

---

## 6. 参数、环境变量与产物

### 6.1 参数

| 参数 | 行为 |
|---|---|
| 无参数 | 生成 + preflight + 两个仓库 commit/push |
| `--dry-run` | 只打印变更与 WARN；**执行 preflight**，不写文件、不提交 |
| `--content-only` | 写 `blog/content/**`；**不执行 preflight、不碰 git**（`pnpm blog:content` 即此模式） |
| `--site-only` | 跳过笔记仓库提交，只发布站点仓库 `blog/content/`、`blog/config/` |
| `-m "说明"` / `--message=说明` | 覆盖自动生成的 commit message |
| `--help` / `-h` | 打印帮助 |
| `NOTES_REPO=<绝对路径>` | 覆盖笔记仓库根目录（默认 `../../github/markDownNote`） |

示例：

```bash
cd /Users/lission/data/code/lission.github.io

pnpm publish:notes --dry-run
pnpm publish:notes --site-only
pnpm publish:notes -m "notes: 新增《示例》读书笔记"
NOTES_REPO=/Users/lission/data/github/markDownNote pnpm publish:notes --dry-run
```

### 6.2 生成 / 提交的产物

| 路径 | 作用 |
|---|---|
| `blog/content/groups.json` | 阅读分组（目录驱动） |
| `blog/content/reading.json` | 阅读笔记索引（含 `date` / `author`，来自书单关联或手工配置） |
| `blog/content/notes.json` | 随笔年份与文章索引 |
| `blog/content/books.json` | 书单结构化数据 + 原文 HTML 兜底 |
| `blog/content/pages/<slug>.json` | 单篇 HTML 与目录锚点（构建期转好，运行时不引入 Markdown 库） |
| `blog/config/posts-map.json` | slug / 标题 / 标签 / 分组顺序与显示名 / 书单联动；**脚本每次会回写补全默认值** |
| `blog/config/exclude.txt` | 排除清单（手工维护，脚本只读） |

### 6.3 源文件命名约定

| 类型 | 约定 | 说明 |
|---|---|---|
| 阅读笔记 | `01-readnotes/<分组>/*.md` | 一级子目录名即分组；更深层级视为分组内普通文件 |
| 随笔 | `04-note/<YYYY>/<标题>-<YYYYMMDD>.md` | 年份以目录为准，日期只从文件名 8 位数字取；旧式 `YYYYMMDD.md` 标题取正文首个 `#` |
| 书单 | `00-notes/01-阅读清单.md` | 精确单文件，按 `## YYYY阅读清单` 分节，表头按列名映射 |

---

## 7. 手动兜底（不使用脚本的 git 部分）

脚本出问题、或需要自己控制提交时，可按同样顺序手工执行：

```bash
NOTES=/Users/lission/data/github/markDownNote
SITE=/Users/lission/data/code/lission.github.io

# ① 只生成产物（不联网、不碰 git）
cd "$SITE"
node blog/scripts/publish-notes.mjs --content-only

# ② 提交笔记仓库：白名单精确到三个来源
cd "$NOTES"
git add -- 01-readnotes 04-note '00-notes/01-阅读清单.md'
git -c core.quotepath=false status --short
git commit -m "notes: 手动同步笔记"
git push

# ③ 提交站点仓库产物（这一步才会触发部署）
cd "$SITE"
git add -- blog/content/ blog/config/
git commit -m "notes: 手动同步站点产物"
git push origin master
```

> 绝不要替换成 `git add -A` / `git add .` / `git add 00-notes`，原因见 [§9](#9-隐私红线与注意事项)。

---

## 8. 验收与排错

| 现象 | 原因 | 处理命令 / 动作 |
|---|---|---|
| `preflight：git fetch origin master 失败` | 无网络 / SSH key 无效 | 检查 `ssh -T git@github.com`；离线时改用 `pnpm blog:content`（跳过 preflight） |
| `preflight 失败：origin/master 的 run_data_sync.yml 未包含 blog/**` | 远端 workflow 被改坏 | `git fetch origin master --quiet && git show origin/master:.github/workflows/run_data_sync.yml \| grep 'blog/\*\*'`；修复并推送 workflow 后重试 |
| `笔记仓库不存在：…（可用 NOTES_REPO 覆盖）` | 默认相对路径解析不到 | `NOTES_REPO=/绝对路径 pnpm publish:notes` |
| 页面提示「缺少内容索引 xxx.json，请先执行 pnpm publish:notes」 | `blog/content/*.json` 未提交到站点仓库 | 确认 §2 首发已包含 `blog/`，或执行一次 `pnpm publish:notes` |
| push 后线上没变化、Actions 没有新运行 | 提交未命中 `push.paths` 白名单 | 确认改的是 `blog/**`；`pnpm publish:notes` 只提交 `blog/content/`、`blog/config/`，必然命中；也可在 Actions 手动 `Run workflow` |
| `git push` 报 `no upstream branch` | 笔记仓库缺上游 | `git -C /Users/lission/data/github/markDownNote push -u origin master` |
| 中文路径显示成 `"\345\260\217..."` | git 默认 `core.quotepath=true` | `git -c core.quotepath=false status --short` |
| 输出 `WARN（N）` | 日期笔误、本机绝对路径图片、未知表头列等 | **不阻断**，按提示逐条检查源文件；脚本保留原值或移除失效图片 |
| 提示「无更新」但想重新部署 | 脚本幂等，不产生空提交 | 在 Actions 手动运行 `Run Data Sync`，或等每日两次定时触发 |
| 只想确认线上 SPA 是否可访问 | Pages 深链由 `404.html` 回退 | `curl -s https://lission.github.io/reading \| grep -o 'id="root"'`（有输出即回退生效）；更直观用浏览器打开 |
| 本地构建报 `dist/index.html` 找不到 | 单独运行了 `copy-404.mjs` | 用 `pnpm build`（已串好 `vite build && node blog/scripts/copy-404.mjs`），不要单独跑该脚本 |

---

## 9. 隐私红线与注意事项

1. **扫描范围写死在脚本里**，只有三处：`01-readnotes/`、`04-note/`、`00-notes/01-阅读清单.md`。`05-local/`、`.workbuddy/`、`.git/`、`node_modules/`、`dist/` 永不扫描。
2. **笔记仓库的 `git add` 是白名单**：`01-readnotes`、`04-note`、`00-notes/01-阅读清单.md`。`00-notes/` 下其它文件绝不会进入暂存区；不要手工执行 `git add -A` / `git add .` / `git add 00-notes`。
3. **`exclude.txt` 只影响网站，不影响 git**：写入的 md 不生成博客产物，但仍在 `01-readnotes` / `04-note` 白名单内，**依然会被提交并公开到笔记仓库**。含隐私内容请不要放进这两个目录。
4. **首次发布会把 `04-note/` 全部随笔提交并公开**（当前该目录在笔记仓库还是未跟踪状态）。执行 §2 或首次 `pnpm publish:notes` 前，建议逐篇通读一遍。
5. **只改一篇也会全量处理**：脚本会重扫三个来源，并把这三个范围内**所有未提交的改动一起 commit**。发布前用 `--dry-run` 和 `git -c core.quotepath=false status --short` 看清楚清单。
6. **已跟踪 = 已公开**：公开仓库里凡是被 git 跟踪过的文件，即便后来 `git rm --cached` 并加 `.gitignore`，历史提交中仍可能留有全文。发布敏感内容前先确认 `git ls-files`。
7. **不要手动单独运行 `Publish GitHub Pages` 工作流**：其 `save_data_in_github_cache` 默认 `false`，不恢复跑步数据 Cache 会让统计回退到旧快照。只用 `pnpm publish:notes` 或由它触发的 `Run Data Sync`。
8. 脚本只做 `git add → diff --cached --quiet → commit → push`，**不会 `git pull` / `rebase` / `force push`**。若两个仓库有未推送的分叉，先自行处理好再发布。

---

## 10. 附：完整命令速查（可整段复制）

```bash
# ---------- 一次性首发（仅首次，见 §2）----------
cd /Users/lission/data/code/lission.github.io
git -c core.quotepath=false status --short
git add index.html package.json tsconfig.json tailwind.config.js \
  src/main.tsx src/components src/hooks src/styles src/static \
  blog/ docs/
git diff --cached --stat
git commit -m "feat(blog): 阅读笔记 / 随笔 / 书单页面与一条命令发布脚本"
git push origin master
open https://github.com/lission/lission.github.io/actions/workflows/run_data_sync.yml

# ---------- 之后每次笔记变动 ----------
cd /Users/lission/data/code/lission.github.io
pnpm publish:notes --dry-run          # 预览
pnpm publish:notes                    # 发布
git -C /Users/lission/data/code/lission.github.io --no-pager log -1 --oneline
open https://github.com/lission/lission.github.io/actions/workflows/run_data_sync.yml
open https://lission.github.io/reading
```

**记住一句话**：代码首发一次，之后内容更新永远是 `cd` 到站点仓库 + `pnpm publish:notes`。
