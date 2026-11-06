/**
 * 一条命令发布笔记：扫描本机笔记仓库 → 生成 blog/content/** → 提交两个仓库。
 *
 * 用法（站点仓库根目录）：
 *   pnpm publish:notes                  # 默认：生成 + 提交/推送两个仓库
 *   pnpm publish:notes --dry-run        # 只预览（仍执行 preflight）
 *   pnpm publish:notes --site-only      # 只提交站点仓库产物
 *   pnpm publish:notes -m "说明"        # 覆盖自动 commit message
 *   node blog/scripts/publish-notes.mjs --content-only  # 仅本地生成，不碰 git
 *
 * 隐私红线：只扫描 01-readnotes/、04-note/ 和 00-notes/01-阅读清单.md，
 * 05-local/ 与 00-notes/ 下其它文件永不进入扫描与 git 暂存。
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdown } from './markdown.mjs';

const SITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const NOTES_ROOT = path.resolve(
  process.env.NOTES_REPO || path.resolve(SITE_ROOT, '../../github/markDownNote')
);
const CONTENT_DIR = path.join(SITE_ROOT, 'blog', 'content');
const PAGES_DIR = path.join(CONTENT_DIR, 'pages');
const CONFIG_DIR = path.join(SITE_ROOT, 'blog', 'config');

const READING_DIR = '01-readnotes';
const NOTES_DIR = '04-note';
const BOOK_SOURCE = '00-notes/01-阅读清单.md';
const NEVER_SCAN = new Set(['05-local', '.workbuddy', '.git', 'node_modules', 'dist']);

const COLUMN_ALIASES = {
  序号: 'seq',
  书名: 'titleRaw',
  作者: 'author',
  类型: 'category',
  完成时间: 'dateRaw',
  阅读时间: 'dateRaw',
  书质: 'medium',
  备注: 'note',
};

const warnings = [];
const warn = (message) => warnings.push(message);
const log = (message = '') => console.log(message);

// ---------------------------------------------------------------- 参数与工具

const parseArgs = (argv) => {
  const options = { dryRun: false, siteOnly: false, contentOnly: false, message: '', help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--site-only') options.siteOnly = true;
    else if (arg === '--content-only') options.contentOnly = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '-m' || arg === '--message') {
      options.message = argv[index + 1] ?? '';
      index += 1;
    } else if (arg.startsWith('--message=')) options.message = arg.slice('--message='.length);
    else {
      console.error(`未知参数：${arg}`);
      process.exit(2);
    }
  }
  return options;
};

const USAGE = `用法：pnpm publish:notes [选项]
  --dry-run       只打印变更，不写文件、不提交（仍执行 preflight）
  --site-only     只发布站点仓库产物
  --content-only  仅本地生成 blog/content/**，不执行 preflight 与任何 git 操作
  -m "说明"       覆盖自动生成的 commit message
  --help          显示本帮助`;

const git = (cwd, args) =>
  spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });

const gitOrThrow = (cwd, args, label) => {
  const result = git(cwd, args);
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`${label || `git ${args.join(' ')}`} 失败：${detail || `exit ${result.status}`}`);
  }
  return (result.stdout || '').trim();
};

const readJson = (file, fallback) => {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    warn(`已有产物解析失败，将按空数据处理：${path.relative(SITE_ROOT, file)}（${error.message}）`);
    return fallback;
  }
};

const readText = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null);

const walk = (root, relative) => {
  const target = path.join(root, relative);
  if (!fs.existsSync(target)) return [];
  const result = [];
  const visit = (dir, segments) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (NEVER_SCAN.has(entry.name) || entry.name.startsWith('.')) continue;
      const current = [...segments, entry.name];
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full, current);
      else if (entry.isFile() && /\.md$/i.test(entry.name)) {
        result.push({
          rel: [relative, ...current].join('/'),
          full,
          segments: current,
        });
      }
    }
  };
  visit(target, []);
  return result.sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
};

const isLocalPath = (url) => /^(file:\/\/|\/Users\/|\/home\/|[A-Za-z]:[\\/])/i.test(url.trim());

const cleanMarkdown = (raw, rel) => {
  let text = String(raw).replace(/[\u200B-\u200D\uFEFF\u2060]/g, '');

  // <ruby> 注音被原文用反引号包住，先去掉，避免渲染成一片 code。
  text = text.replace(/<ruby[\s\S]*?<\/ruby>/g, (block) => block.replace(/`/g, ''));
  text = text.replace(/`(?=<ruby)/g, '').replace(/(<\/ruby>)`/g, '$1');

  // 本机绝对路径图片在公开站点上必然 404，直接移除并告警。
  text = text.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, (all, alt, url) => {
    if (isLocalPath(url)) {
      warn(`${rel}：已移除本机绝对路径图片 ${alt || url}`);
      return '';
    }
    return all;
  });
  text = text.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = tag.match(/src\s*=\s*["']([^"']*)["']/i)?.[1] ?? '';
    if (isLocalPath(src)) {
      warn(`${rel}：已移除本机绝对路径图片标签`);
      return '';
    }
    return tag;
  });

  // 部分随笔用「零宽空格 + Tab」做段首缩进，会被误判为代码块。
  return text
    .split('\n')
    .map((line) => line.replace(/^[ \t]*\t[ \t]*/, ''))
    .join('\n');
};

const plainHeading = (value) =>
  String(value)
    .replace(/[*_~`]/g, '')
    .replace(/<\/?[A-Za-z][^>]*>/g, '')
    .trim();

const firstHeading = (markdown) => {
  const match = String(markdown).match(/^ {0,3}#{1,2}\s+(.+)$/m);
  return match ? plainHeading(match[1]) : '';
};

const slugify = (title) => {
  const slug = String(title)
    .replace(/[《》「」『』【】"'*`]/g, '')
    .replace(/[\s、，。！？：；·,.!?;:()（）\[\]—~_]+/g, '-')
    .replace(/[^0-9A-Za-z\u3400-\u9FFF-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return slug || 'post';
};

const uniqueSlug = (base, used) => {
  let candidate = base;
  let serial = 2;
  while (used.has(candidate)) candidate = `${base}-${serial++}`;
  used.add(candidate);
  return candidate;
};

const filenameTitle = (basename) => {
  const stem = basename.replace(/\.md$/i, '');
  const standard = stem.match(/^(.*?)-(\d{8})$/);
  if (standard) return { title: standard[1].trim(), date: standard[2] };
  const pureDate = stem.match(/^(\d{8})$/);
  if (pureDate) return { title: '', date: pureDate[1] };
  const looseDate = stem.match(/(\d{8})/);
  return { title: stem.trim(), date: looseDate ? looseDate[1] : '' };
};

const toIsoDate = (digits) => {
  if (!/^\d{8}$/.test(digits)) return null;
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${digits.slice(0, 4)}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const loadExclusions = () => {
  const file = path.join(CONFIG_DIR, 'exclude.txt');
  if (!fs.existsSync(file)) return new Set();
  return new Set(
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => line.replace(/^\.\//, '').replace(/\\/g, '/'))
  );
};

// ---------------------------------------------------------------- preflight

const preflight = () => {
  log('⓪ preflight：校验远端 master 的 workflow 白名单…');
  const fetched = git(SITE_ROOT, ['fetch', 'origin', 'master', '--quiet']);
  if (fetched.status !== 0) {
    throw new Error(`preflight：git fetch origin master 失败（${(fetched.stderr || '').trim()}）`);
  }
  const workflow = gitOrThrow(
    SITE_ROOT,
    ['show', 'origin/master:.github/workflows/run_data_sync.yml'],
    '读取远端 workflow'
  );
  if (!workflow.includes('blog/**')) {
    throw new Error(
      'preflight 失败：origin/master 的 run_data_sync.yml 未包含 blog/**。' +
        '首次发布将静默不触发部署，请先按设计文档 §4.0 提交并推送 P0.5 配置。'
    );
  }
  const pending = gitOrThrow(
    SITE_ROOT,
    [
      'status',
      '--porcelain',
      '--',
      '.github/workflows/run_data_sync.yml',
      'tsconfig.json',
      'tailwind.config.js',
      '.gitignore',
    ],
    '检查工作区配置改动'
  );
  if (pending.trim()) {
    warn('工作区仍残留 P0.5 配置改动未提交，请确认后再发布。');
  }
  log('   ✓ 远端 workflow 已含 blog/**');
};

// ---------------------------------------------------------------- 阅读笔记

const buildReading = ({ files, excluded, postsMap, usedSlugs }) => {
  const posts = [];
  const pages = [];
  const groupsSeen = [];

  for (const file of files) {
    if (excluded.has(file.rel)) {
      log(`   · 已排除 ${file.rel}`);
      continue;
    }
    const raw = fs.readFileSync(file.full, 'utf8');
    const cleaned = cleanMarkdown(raw, file.rel);
    const basename = path.basename(file.rel);
    const parsed = filenameTitle(basename);
    const title = parsed.title || firstHeading(cleaned) || basename.replace(/\.md$/i, '');
    const group = file.segments.length > 1 ? file.segments[0] : '未分组';
    if (!groupsSeen.includes(group)) groupsSeen.push(group);

    const key = `reading::${title}`;
    const config = postsMap.posts[key] ?? {};
    const slug = uniqueSlug(config.slug || slugify(title), usedSlugs);
    const tags = Array.isArray(config.tags) ? config.tags : [];
    const displayTitle = config.title || title;
    const configDate =
      typeof config.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(config.date)
        ? config.date
        : null;
    const configAuthor =
      typeof config.author === 'string' && config.author.trim() ? config.author.trim() : null;

    postsMap.posts[key] = {
      title: displayTitle,
      tags,
      slug,
      ...(configDate ? { date: configDate } : {}),
      ...(configAuthor ? { author: configAuthor } : {}),
    };

    const post = {
      type: 'reading',
      slug,
      title: displayTitle,
      group,
      tags,
      date: configDate,
      author: configAuthor,
      source: file.rel,
    };
    posts.push(post);
    const { html, toc } = renderMarkdown(cleaned);
    pages.push({ ...post, html, toc });
  }

  const configured = Array.isArray(postsMap.groupOrder) ? postsMap.groupOrder : [];
  const labels = postsMap.groupLabels ?? {};
  const groups = groupsSeen
    .map((id, index) => {
      const configuredIndex = configured.indexOf(id);
      return {
        id,
        label: labels[id] || id,
        count: posts.filter((post) => post.group === id).length,
        order: configuredIndex >= 0 ? configuredIndex + 1 : index + 1 + 1000 * (configured.length > 0 ? 1 : 0),
      };
    })
    .filter((group) => group.count > 0)
    .sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : 1));

  return { posts, pages, groups };
};

// ---------------------------------------------------------------- 随笔

const buildNotes = ({ files, excluded, postsMap, usedSlugs }) => {
  const posts = [];
  const pages = [];

  for (const file of files) {
    if (excluded.has(file.rel)) {
      log(`   · 已排除 ${file.rel}`);
      continue;
    }
    const raw = fs.readFileSync(file.full, 'utf8');
    const cleaned = cleanMarkdown(raw, file.rel);
    const basename = path.basename(file.rel);
    const parsed = filenameTitle(basename);
    const title = parsed.title || firstHeading(cleaned) || basename.replace(/\.md$/i, '');
    const iso = parsed.date ? toIsoDate(parsed.date) : null;
    if (parsed.date && !iso) warn(`${file.rel}：文件名日期 ${parsed.date} 不是合法日期`);

    const parts = file.rel.split('/').slice(1);
    const year = parts.length > 1 && /^\d{4}$/.test(parts[0]) ? parts[0] : '未标年份';
    if (year === '未标年份') warn(`${file.rel}：不在年份目录下，归入「未标年份」`);
    if (iso && year !== '未标年份' && iso.slice(0, 4) !== year) {
      warn(`${file.rel}：文件名年份 ${iso.slice(0, 4)} 与目录年份 ${year} 不一致，仍按目录年份分组`);
    }

    const key = `note::${iso ?? 'undated'}::${title}`;
    const config = postsMap.posts[key] ?? {};
    const fallbackSlug = `${iso ? iso.replace(/-/g, '') : 'undated'}-${slugify(title)}`;
    const slug = uniqueSlug(config.slug || fallbackSlug, usedSlugs);
    const displayTitle = config.title || title;
    postsMap.posts[key] = { title: displayTitle, tags: config.tags ?? [], slug };

    const post = {
      type: 'note',
      year,
      date: iso,
      slug,
      title: displayTitle,
      source: file.rel,
    };
    posts.push(post);
    const { html, toc } = renderMarkdown(cleaned);
    pages.push({ ...post, tags: [], html, toc });
  }

  posts.sort((a, b) => {
    if (a.year !== b.year) return a.year < b.year ? 1 : -1;
    if (!a.date) return 1;
    if (!b.date) return -1;
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
  });

  const counts = new Map();
  for (const post of posts) counts.set(post.year, (counts.get(post.year) ?? 0) + 1);
  const years = [...counts.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => (a.year === '未标年份' ? 1 : b.year === '未标年份' ? -1 : b.year.localeCompare(a.year)));

  return { posts, pages, years };
};

// ---------------------------------------------------------------- 书单

const cleanBookTitle = (value) =>
  String(value)
    .replace(/\*\*/g, '')
    .replace(/^《/, '')
    .replace(/》$/, '')
    .trim();

const parseDateCell = (value, sectionYear, rel) => {
  const raw = String(value).trim();
  const empty = { startDate: null, endDate: null, paused: false, invalid: false };

  if (!raw || /^(——|—{2,}|-{2,}|暂停|未完成|待读)$/.test(raw)) {
    return { ...empty, paused: true };
  }
  if (/[xX*？?]/.test(raw)) {
    warn(`${rel}：${sectionYear} 段日期「${raw}」含占位符，保留原值不解析`);
    return { ...empty, invalid: true };
  }

  const hasRange = /[~\-–—]/.test(raw.replace(/^\d{8}/, ''));
  const pieces = hasRange ? raw.split(/\s*[~\-–—]\s*/) : [raw];
  const convert = (token) => {
    if (/^\d{8}$/.test(token)) return toIsoDate(token);
    if (/^\d{6}$/.test(token)) return toIsoDate(`${token}01`);
    if (!token) return null;
    warn(`${rel}：${sectionYear} 段日期「${token}」格式无法识别，保留原值`);
    return null;
  };

  const startDate = pieces[0] ? convert(pieces[0]) : null;
  const endDate = hasRange ? (pieces[1] ? convert(pieces[1]) : null) : startDate;

  const suspicious = [startDate, endDate].some(
    (date) => date && Math.abs(Number(date.slice(0, 4)) - Number(sectionYear)) > 1
  );
  if (suspicious) {
    warn(`${rel}：${sectionYear} 段出现「${raw}」，日期年份疑似笔误，保留原值`);
  }
  return { startDate, endDate, paused: false, invalid: false };
};

const parseBooks = ({ raw, rel, readingPosts, postsMap }) => {
  const cleaned = cleanMarkdown(raw, rel);
  const lines = cleaned.replace(/\r\n?/g, '\n').split('\n');
  const sectionStarts = [];
  lines.forEach((line, index) => {
    const match = line.match(/^##\s+(?:\[|\*\*)?(\d{4})阅读清单/);
    if (match) sectionStarts.push({ year: match[1], index });
  });

  if (!sectionStarts.length) {
    warn(`${rel}：未找到任何「## YYYY阅读清单」段落`);
  }

  const readingByTitle = new Map();
  for (const post of readingPosts) {
    readingByTitle.set(cleanBookTitle(post.title), post.slug);
  }
  const bookLinks = postsMap.bookLinks ?? {};

  const years = [];
  let sourceRowCount = 0;
  const seenHeaders = new Set();

  sectionStarts.forEach((section, sectionIndex) => {
    const end = sectionStarts[sectionIndex + 1]?.index ?? lines.length;
    const body = lines.slice(section.index + 1, end);
    const headerIndex = body.findIndex(
      (line) => /^\s*\|/.test(line) && line.includes('序号') && line.includes('书名')
    );

    const note = headerIndex > 0
      ? body.slice(0, headerIndex).map((line) => plainHeading(line)).filter(Boolean).join(' ')
      : '';

    if (headerIndex < 0) {
      warn(`${rel}：${section.year} 段未找到书单表头，跳过该年`);
      return;
    }

    const splitRow = (line) =>
      line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
    const header = splitRow(body[headerIndex]);
    const columnMap = header.map((name) => COLUMN_ALIASES[name] ?? null);
    header.forEach((name, index) => {
      if (!COLUMN_ALIASES[name]) {
        const key = `${section.year}:${name}`;
        if (!seenHeaders.has(key)) {
          warn(`${rel}：${section.year} 段未知列「${name}」，已忽略`);
          seenHeaders.add(key);
        }
      }
    });

    const items = [];
    for (let rowIndex = headerIndex + 1; rowIndex < body.length; rowIndex += 1) {
      const line = body[rowIndex];
      if (!/^\s*\|/.test(line)) {
        if (line.trim()) break;
        continue;
      }
      const cells = splitRow(line);
      if (cells.every((cell) => !cell)) continue;
      if (cells.every((cell) => /^:?-{2,}:?$/.test(cell.replace(/\s/g, '')))) continue;

      const row = {};
      columnMap.forEach((key, index) => {
        if (key) row[key] = cells[index] ?? '';
      });
      if (!String(row.seq ?? '').trim()) continue;
      sourceRowCount += 1;

      const dateRaw = String(row.dateRaw ?? '').trim();
      const dateInfo = parseDateCell(dateRaw, section.year, rel);
      const titleRaw = String(row.titleRaw ?? '').trim().replace(/^\*+|\*+$/g, '').trim();
      const title = cleanBookTitle(titleRaw);
      if (!title) {
        warn(`${rel}：${section.year} 段第 ${row.seq} 行书名为空，已跳过`);
        continue;
      }
      const noteCell = String(row.note ?? '').trim();
      const paused = dateInfo.paused || /暂停|未完成/.test(dateRaw) || /暂停/.test(noteCell);
      const status = paused ? '暂停' : dateInfo.startDate && !dateInfo.endDate ? '在读' : '已完成';

      items.push({
        seq: Number(String(row.seq).replace(/[^\d]/g, '')) || items.length + 1,
        title,
        titleRaw,
        author: String(row.author ?? '').trim(),
        category: String(row.category ?? '').trim() || '未分类',
        dateRaw,
        startDate: dateInfo.startDate,
        endDate: dateInfo.endDate,
        medium: String(row.medium ?? '').trim(),
        note: noteCell,
        status,
        relatedSlug: bookLinks[title] ?? readingByTitle.get(title) ?? null,
      });
    }

    years.push({ year: section.year, note, count: items.length, items });
  });

  years.sort((a, b) => b.year.localeCompare(a.year));
  const items = years.flatMap((year) => year.items);
  const stats = {
    finished: items.filter((item) => item.status === '已完成').length,
    reading: items.filter((item) => item.status === '在读').length,
    paused: items.filter((item) => item.status === '暂停').length,
    thisYear: items.filter((item) => {
      const owner = years.find((year) => year.items.includes(item));
      return owner?.year === String(new Date().getFullYear());
    }).length,
    byCategory: {},
  };
  for (const item of items) {
    const primary = item.category.split(/[、,，]/)[0].trim() || '未分类';
    stats.byCategory[primary] = (stats.byCategory[primary] ?? 0) + 1;
  }

  const { html: fallbackHtml } = renderMarkdown(cleaned);
  return {
    source: rel,
    available: true,
    total: items.length,
    stats,
    years,
    fallbackHtml,
    sourceRowCount,
    parsedCount: items.length,
    warnings: warnings.filter((line) => line.includes(rel)),
  };
};

const emptyBooks = () => ({
  source: BOOK_SOURCE,
  available: false,
  total: 0,
  stats: { finished: 0, reading: 0, paused: 0, thisYear: 0, byCategory: {} },
  years: [],
  fallbackHtml: '',
  sourceRowCount: 0,
  parsedCount: 0,
  warnings: [],
});

// ---------------------------------------------------------------- 产物写入

const applyOutputs = (outputs, removed, dryRun) => {
  const summary = { added: [], modified: [], unchanged: 0, removed };
  if (!dryRun) fs.mkdirSync(PAGES_DIR, { recursive: true });

  for (const output of outputs) {
    const target = path.join(SITE_ROOT, output.rel);
    const previous = readText(target);
    if (previous === output.text) {
      summary.unchanged += 1;
      continue;
    }
    summary[previous === null ? 'added' : 'modified'].push(output.rel);
    if (!dryRun) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, output.text, 'utf8');
    }
  }

  if (!dryRun) {
    for (const rel of removed) {
      fs.rmSync(path.join(SITE_ROOT, rel), { force: true });
    }
  }
  return summary;
};

// ---------------------------------------------------------------- git 发布

const commitAndPush = ({ cwd, paths, pushArgs, message, label }) => {
  gitOrThrow(cwd, ['add', '--', ...paths], `${label}：git add`);
  const diff = git(cwd, ['diff', '--cached', '--quiet']);
  if (diff.status === 0) {
    log(`   ${label}：无更新，跳过 commit/push`);
    return false;
  }
  if (diff.status !== 1) {
    throw new Error(`${label}：git diff --cached 异常（exit ${diff.status}）`);
  }
  gitOrThrow(cwd, ['commit', '-m', message], `${label}：git commit`);
  gitOrThrow(cwd, pushArgs, `${label}：git push`);
  log(`   ${label}：已提交并推送`);
  return true;
};

const actionsUrl = () => {
  const remote = git(SITE_ROOT, ['remote', 'get-url', 'origin']);
  const value = (remote.stdout || '').trim();
  const match = value.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/);
  return match
    ? `https://github.com/${match[1]}/${match[2]}/actions/workflows/run_data_sync.yml`
    : 'https://github.com/lission/lission.github.io/actions/workflows/run_data_sync.yml';
};

// ---------------------------------------------------------------- 主流程

const main = () => {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    log(USAGE);
    return;
  }

  log('笔记同步 · 一条命令发布');
  log(`  站点仓库：${SITE_ROOT}`);
  log(`  笔记仓库：${NOTES_ROOT}`);
  if (options.dryRun) log('  模式：--dry-run（不写文件、不提交）');
  if (options.contentOnly) log('  模式：--content-only（仅本地生成，不执行 git 操作）');
  if (options.siteOnly) log('  模式：--site-only（跳过笔记仓库提交）');

  if (!fs.existsSync(NOTES_ROOT)) {
    throw new Error(`笔记仓库不存在：${NOTES_ROOT}（可用 NOTES_REPO 覆盖）`);
  }

  if (!options.contentOnly) preflight();

  const excluded = loadExclusions();
  const postsMap = readJson(path.join(CONFIG_DIR, 'posts-map.json'), {
    groupOrder: [],
    groupLabels: {},
    posts: {},
    bookLinks: {},
  });
  postsMap.posts = postsMap.posts ?? {};
  postsMap.groupOrder = postsMap.groupOrder ?? [];
  postsMap.groupLabels = postsMap.groupLabels ?? {};
  postsMap.bookLinks = postsMap.bookLinks ?? {};

  const previousGroups = readJson(path.join(CONTENT_DIR, 'groups.json'), []);
  const previousNotes = readJson(path.join(CONTENT_DIR, 'notes.json'), { years: [], posts: [] });
  const previousBooks = readJson(path.join(CONTENT_DIR, 'books.json'), emptyBooks());

  log('① 扫描三个来源（01-readnotes / 04-note / 00-notes/01-阅读清单.md）…');
  const readingFiles = walk(NOTES_ROOT, READING_DIR);
  const noteFiles = walk(NOTES_ROOT, NOTES_DIR);
  log(`   阅读笔记 ${readingFiles.length} 篇 · 随笔 ${noteFiles.length} 篇`);

  log('② 解析、清洗、构建期转 HTML…');
  const usedSlugs = new Set();
  const reading = buildReading({ files: readingFiles, excluded, postsMap, usedSlugs });
  const notes = buildNotes({ files: noteFiles, excluded, postsMap, usedSlugs });

  const bookFile = path.join(NOTES_ROOT, BOOK_SOURCE);
  let books = emptyBooks();
  let keepPreviousBooks = false;
  if (excluded.has(BOOK_SOURCE)) {
    warn(`${BOOK_SOURCE} 已在 exclude.txt 中，/books 将显示「暂无书单」`);
  } else if (!fs.existsSync(bookFile)) {
    warn(`${BOOK_SOURCE} 不存在，保留上一次的 books.json（不静默删菜单）`);
    books = previousBooks;
    keepPreviousBooks = true;
  } else {
    books = parseBooks({
      raw: fs.readFileSync(bookFile, 'utf8'),
      rel: BOOK_SOURCE,
      readingPosts: reading.posts,
      postsMap,
    });
    if (books.sourceRowCount !== books.parsedCount) {
      warn(
        `${BOOK_SOURCE}：表格数据行 ${books.sourceRowCount} 行，成功解析 ${books.parsedCount} 条，` +
          '请查看「原始清单」兜底视图'
      );
      books.warnings = warnings.filter((line) => line.includes(BOOK_SOURCE));
    }
    log(
      `   书单 ${books.parsedCount} 条 / ${books.years.length} 个年份` +
        `（源数据行 ${books.sourceRowCount}）`
    );
  }

  // 阅读笔记的「日期 / 作者」取书单中同一本书的记录；posts-map 手工配置优先。
  const readingDates = new Map();
  const readingAuthors = new Map();
  for (const item of books.years.flatMap((year) => year.items)) {
    if (!item.relatedSlug) continue;
    const date = item.endDate ?? item.startDate ?? null;
    if (date && (!readingDates.has(item.relatedSlug) || date > readingDates.get(item.relatedSlug))) {
      readingDates.set(item.relatedSlug, date);
    }
    const author = typeof item.author === 'string' ? item.author.trim() : '';
    if (author && !readingAuthors.has(item.relatedSlug)) {
      readingAuthors.set(item.relatedSlug, author);
    }
  }
  for (const post of reading.posts) {
    if (!post.date) post.date = readingDates.get(post.slug) ?? null;
    if (!post.author) post.author = readingAuthors.get(post.slug) ?? null;
  }
  const readingBySlug = new Map(reading.posts.map((post) => [post.slug, post]));
  for (const page of reading.pages) {
    const post = readingBySlug.get(page.slug);
    page.date = post?.date ?? null;
    page.author = post?.author ?? null;
  }
  log(
    `   阅读笔记关联：${reading.posts.filter((post) => post.date).length}/${reading.posts.length} 篇日期、` +
      `${reading.posts.filter((post) => post.author).length}/${reading.posts.length} 篇作者`
  );

  const pages = [...reading.pages, ...notes.pages];
  const pageSlugs = new Set(pages.map((page) => page.slug));
  const existingPages = fs.existsSync(PAGES_DIR)
    ? fs.readdirSync(PAGES_DIR).filter((name) => name.endsWith('.json'))
    : [];
  const stale = existingPages
    .filter((name) => !pageSlugs.has(name.replace(/\.json$/, '')))
    .map((name) => `blog/content/pages/${name}`);

  const json = (data) => `${JSON.stringify(data, null, 2)}\n`;
  const outputs = [
    { rel: 'blog/content/groups.json', text: json(reading.groups) },
    { rel: 'blog/content/reading.json', text: json(reading.posts) },
    { rel: 'blog/content/notes.json', text: json({ years: notes.years, posts: notes.posts }) },
    ...(keepPreviousBooks ? [] : [{ rel: 'blog/content/books.json', text: json(books) }]),
    { rel: 'blog/config/posts-map.json', text: json(postsMap) },
    ...pages.map((page) => ({ rel: `blog/content/pages/${page.slug}.json`, text: json(page) })),
  ];

  log('③ 写入 blog/content/** …');
  const summary = applyOutputs(outputs, stale, options.dryRun);

  const newGroups = reading.groups
    .map((group) => group.id)
    .filter((id) => !(previousGroups ?? []).some((group) => group.id === id));
  const newYears = notes.years
    .map((entry) => entry.year)
    .filter((year) => !(previousNotes.years ?? []).some((entry) => entry.year === year));

  log('④ 变更清单：');
  for (const rel of summary.added) log(`   + ${rel}`);
  for (const rel of summary.modified) log(`   ~ ${rel}`);
  for (const rel of summary.removed) log(`   - ${rel}`);
  if (!summary.added.length && !summary.modified.length && !summary.removed.length) {
    log('   无变更');
  }
  log(
    `   统计：阅读 ${reading.posts.length} 篇（${reading.groups.length} 分组）· ` +
      `随笔 ${notes.posts.length} 篇（${notes.years.length} 年份）· ` +
      `书单 ${books.total} 条`
  );
  if (newGroups.length) log(`   新分组：${newGroups.join('、')}`);
  if (newYears.length) log(`   新年份：${newYears.join('、')}`);
  if (warnings.length) {
    log(`   WARN（${warnings.length}）：`);
    for (const line of warnings) log(`     · ${line}`);
  }

  if (options.dryRun || options.contentOnly) {
    log(options.dryRun ? '⑤ --dry-run 结束，未写入文件、未提交。' : '⑤ --content-only 结束，未执行 git 操作。');
    return;
  }

  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const booksDelta = books.total - (previousBooks.total ?? 0);
  const message =
    options.message ||
    `notes: 同步 ${stamp} (+${summary.added.length} ~${summary.modified.length} -${summary.removed.length}` +
      `${newGroups.length ? `, 新分组 ${newGroups.length}` : ''}` +
      `${newYears.length ? `, 新年份 ${newYears.length}` : ''}` +
      `, 书单 ${booksDelta >= 0 ? '+' : ''}${booksDelta})`;

  log('⑤ 提交并推送…');
  if (!options.siteOnly) {
    commitAndPush({
      cwd: NOTES_ROOT,
      paths: [READING_DIR, NOTES_DIR, BOOK_SOURCE],
      pushArgs: ['push'],
      message,
      label: '笔记仓库',
    });
  } else {
    log('   笔记仓库：--site-only 已跳过');
  }
  commitAndPush({
    cwd: SITE_ROOT,
    paths: ['blog/content/', 'blog/config/'],
    pushArgs: ['push', 'origin', 'master'],
    message,
    label: '站点仓库',
  });

  log('');
  log(`完成。请确认 Run Data Sync 已被触发：${actionsUrl()}`);
};

try {
  main();
} catch (error) {
  console.error(`\n[publish:notes] ${error.message}`);
  process.exit(1);
}
