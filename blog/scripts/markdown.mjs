/**
 * 构建期 Markdown → HTML 渲染器（零依赖，仅在本机发布脚本中使用）。
 *
 * 覆盖笔记中实际出现的语法：ATX 标题、围栏代码块、引用、嵌套列表、
 * 表格、分隔线、[TOC]、[text](#锚点)、强调、行内代码、链接/图片以及
 * <ruby>/<rb>/<rt> 注音标签。原始 HTML 走白名单过滤，避免把本机
 * 笔记里的任意标签直接带到公开站点。
 */

const ALLOWED_TAGS = new Set([
  'ruby', 'rb', 'rt', 'rp', 'br', 'sup', 'sub', 'span', 'em', 'strong',
  'b', 'i', 'u', 's', 'del', 'mark', 'small', 'code', 'kbd', 'img',
]);
const ALLOWED_ATTRS = new Set([
  'class', 'title', 'alt', 'src', 'href', 'lang', 'dir', 'width', 'height',
  'loading', 'colspan', 'rowspan',
]);
const PLACEHOLDER = '\u0001';

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const plainText = (value) =>
  String(value)
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<\/?[A-Za-z][^>]*>/g, '')
    .replace(/[*_~]/g, '')
    .replace(/\\([\\`*_{}\[\]()#+\-.!>~|])/g, '$1')
    .trim();

/** 手写锚点与标题 id 共用同一套归一化：只保留 Unicode 字母与数字。 */
export const normalizeAnchor = (value) =>
  plainText(value).replace(/[^\p{L}\p{N}]/gu, '');

const isSafeUrl = (url) => {
  const target = String(url).trim();
  if (!target) return false;
  if (/^(javascript|vbscript|data|file):/i.test(target)) return false;
  if (/^(\/Users\/|\/home\/|[A-Za-z]:[\\/])/.test(target)) return false;
  return true;
};

const sanitizeTag = (raw) => {
  const match = raw.match(/^<(\/?)([A-Za-z][A-Za-z0-9-]*)([^>]*)>$/);
  if (!match) return '';
  const [, slash, rawName, rawAttrs] = match;
  const name = rawName.toLowerCase();
  if (!ALLOWED_TAGS.has(name)) return '';

  let attrs = '';
  if (!slash) {
    const attrPattern = /([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
    for (const found of rawAttrs.matchAll(attrPattern)) {
      const key = found[1].toLowerCase();
      const value = found[2] ?? found[3] ?? found[4] ?? '';
      if (!ALLOWED_ATTRS.has(key)) continue;
      if ((key === 'href' || key === 'src') && !isSafeUrl(value)) continue;
      attrs += ` ${key}="${escapeHtml(value)}"`;
    }
  }
  return `<${slash}${name}${attrs}>`;
};

const restoreTokens = (text, tokens) => {
  let result = text;
  const pattern = new RegExp(`${PLACEHOLDER}(\\d+)${PLACEHOLDER}`, 'g');
  for (let round = 0; round < 5 && result.includes(PLACEHOLDER); round += 1) {
    result = result.replace(pattern, (_all, index) => tokens[Number(index)] ?? '');
  }
  return result;
};

/** 行内渲染：先保护不可再解析的片段，再转义，最后处理强调。 */
export const renderInline = (text) => {
  const tokens = [];
  const protect = (html) => {
    tokens.push(html);
    return `${PLACEHOLDER}${tokens.length - 1}${PLACEHOLDER}`;
  };

  let source = String(text ?? '');

  source = source.replace(/\\([\\`*_{}\[\]()#+\-.!>~|])/g, (_all, char) =>
    protect(escapeHtml(char))
  );

  source = source.replace(/(`+)([\s\S]*?)\1/g, (_all, _ticks, code) =>
    protect(`<code>${escapeHtml(code.trim())}</code>`)
  );

  source = source.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_all, alt, url, title) => {
      if (!isSafeUrl(url)) return protect(escapeHtml(alt));
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      return protect(
        `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}"${titleAttr} loading="lazy" />`
      );
    }
  );

  source = source.replace(
    /\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_all, label, url, title) => {
      if (!isSafeUrl(url)) return protect(renderInline(label));
      const href = url.startsWith('#')
        ? `#${normalizeAnchor(url.slice(1)) || 'section'}`
        : url;
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      return protect(
        `<a href="${escapeHtml(href)}"${titleAttr}>${renderInline(label)}</a>`
      );
    }
  );

  source = source.replace(/<\/?[A-Za-z][^>]*>/g, (tag) => {
    const safe = sanitizeTag(tag);
    return safe ? protect(safe) : '';
  });

  let html = escapeHtml(source);
  html = html.replace(/\*\*\*([^\n]+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*([^\n]+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^\n]+?)__/g, '<strong>$1</strong>');
  html = html.replace(/~~([^\n]+?)~~/g, '<del>$1</del>');
  html = html.replace(/(^|[^\w*])\*([^\s*][^\n]*?)\*(?![\w*])/g, '$1<em>$2</em>');
  html = html.replace(/(^|[^\w_])_([^\s_][^\n]*?)_(?![\w_])/g, '$1<em>$2</em>');

  return restoreTokens(html, tokens);
};

const isFence = (line) => /^ {0,3}(```|~~~)/.test(line);
const headingMatch = (line) => line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
const hrMatch = (line) => /^ {0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(line);
const quoteMatch = (line) => line.match(/^ {0,3}>\s?(.*)$/);
const listMatch = (line) => line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
const isTableLine = (line) => /^\s*\|.*\|\s*$/.test(line);

const splitRow = (line) =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());

const collectHeadings = (lines) => {
  const headings = [];
  const used = new Map();
  let inFence = false;
  for (const line of lines) {
    if (isFence(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = headingMatch(line);
    if (!match) continue;
    const text = plainText(match[2]);
    const base = normalizeAnchor(text) || 'section';
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    headings.push({
      level: match[1].length,
      text,
      id: count === 1 ? base : `${base}-${count}`,
    });
  }
  return headings;
};

const tocHtml = (headings) => {
  if (!headings.length) return '';
  const items = headings
    .map(
      (heading) =>
        `<li class="post-toc-level-${heading.level}"><a href="#${escapeHtml(heading.id)}">${escapeHtml(heading.text)}</a></li>`
    )
    .join('');
  return `<nav class="post-toc-inline"><p class="post-toc-title">本文目录</p><ul>${items}</ul></nav>`;
};

const renderTable = (lines, start) => {
  const header = splitRow(lines[start]);
  const separator = splitRow(lines[start + 1]);
  const isSeparator =
    separator.length > 0 &&
    separator.every((cell) => /^:?-{2,}:?$/.test(cell.replace(/\s/g, '')));
  if (!isSeparator) return null;

  let end = start + 2;
  while (end < lines.length && isTableLine(lines[end])) end += 1;

  const thead = `<thead><tr>${header
    .map((cell) => `<th>${renderInline(cell)}</th>`)
    .join('')}</tr></thead>`;
  const rows = lines.slice(start + 2, end).map((line) => {
    const cells = splitRow(line);
    return `<tr>${header
      .map((_cell, index) => `<td>${renderInline(cells[index] ?? '')}</td>`)
      .join('')}</tr>`;
  });
  return {
    html: `<div class="post-table-wrap"><table>${thead}<tbody>${rows.join('')}</tbody></table></div>`,
    next: end,
  };
};

const renderList = (lines, start) => {
  const indentOf = (line) => line.replace(/\t/g, '    ').match(/^\s*/)[0].length;
  const base = indentOf(lines[start]);
  const roots = [];
  const stack = [];
  let cursor = start;

  while (cursor < lines.length) {
    const line = lines[cursor];
    const match = listMatch(line);
    const indent = match ? indentOf(line) : 0;

    if (match && indent >= base) {
      const item = {
        indent,
        ordered: /^\d/.test(match[2]),
        content: match[3],
        children: [],
      };
      while (stack.length && item.indent <= stack[stack.length - 1].indent) stack.pop();
      if (stack.length) stack[stack.length - 1].children.push(item);
      else roots.push(item);
      stack.push(item);
      cursor += 1;
      continue;
    }
    if (line.trim() === '') {
      const next = lines[cursor + 1];
      const nextMatch = next ? listMatch(next) : null;
      const nextIndent = next ? indentOf(next) : 0;
      if ((nextMatch && nextIndent >= base) || (!nextMatch && nextIndent > base && next?.trim())) {
        cursor += 1;
        continue;
      }
      break;
    }
    const lineIndent = indentOf(line);
    if (stack.length && lineIndent > base && !isFence(line) && !headingMatch(line)) {
      stack[stack.length - 1].content += `\u0002${line.trim()}`;
      cursor += 1;
      continue;
    }
    break;
  }

  // 子列表必须放在父级 <li> 内部，否则结构不合法、缩进样式也会失效。
  const renderItems = (items) => {
    let html = '';
    let currentType = null;
    for (const item of items) {
      if (currentType !== item.ordered) {
        if (currentType !== null) html += `</${currentType ? 'ol' : 'ul'}>`;
        html += `<${item.ordered ? 'ol' : 'ul'}>`;
        currentType = item.ordered;
      }
      const children = item.children.length ? renderItems(item.children) : '';
      const content = item.content
        .split('\u0002')
        .map((part) => renderInline(part))
        .join('<br />');
      html += `<li>${content}${children}</li>`;
    }
    if (currentType !== null) html += `</${currentType ? 'ol' : 'ul'}>`;
    return html;
  };
  return { html: renderItems(roots), next: cursor };
};

const isBlockStart = (line, nextLine) => {
  if (!line.trim()) return true;
  if (isFence(line) || headingMatch(line) || hrMatch(line) || quoteMatch(line)) return true;
  if (listMatch(line)) return true;
  if (isTableLine(line) && nextLine && isTableLine(nextLine)) return true;
  return false;
};

/**
 * @param {string} markdown 已清洗的 Markdown 原文
 * @returns {{ html: string, toc: { level: number, text: string, id: string }[] }}
 */
export const renderMarkdown = (markdown) => {
  const lines = String(markdown ?? '').replace(/\r\n?/g, '\n').split('\n');
  const toc = collectHeadings(lines);
  const generatedToc = tocHtml(toc);
  const chunks = [];
  let headingIndex = 0;
  let cursor = 0;

  while (cursor < lines.length) {
    const line = lines[cursor];
    const next = lines[cursor + 1] ?? '';

    if (!line.trim()) {
      cursor += 1;
      continue;
    }

    if (/^\s*\[TOC\]\s*$/i.test(line)) {
      if (generatedToc) chunks.push(generatedToc);
      cursor += 1;
      continue;
    }

    if (hrMatch(line)) {
      chunks.push('<hr />');
      cursor += 1;
      continue;
    }

    if (isFence(line)) {
      const marker = line.trim()[0];
      const language = line.trim().replace(/^`{3}|^~{3}/, '').trim();
      const body = [];
      cursor += 1;
      while (cursor < lines.length && !new RegExp(`^ {0,3}${marker === '`' ? '`' : '~'}{3,}\\s*$`).test(lines[cursor])) {
        body.push(lines[cursor]);
        cursor += 1;
      }
      cursor += 1;
      const className = language ? ` class="language-${escapeHtml(language.replace(/[^\w-]/g, ''))}"` : '';
      chunks.push(`<pre><code${className}>${escapeHtml(body.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = headingMatch(line);
    if (heading) {
      const info = toc[headingIndex] ?? {
        level: heading[1].length,
        text: plainText(heading[2]),
        id: normalizeAnchor(heading[2]) || 'section',
      };
      headingIndex += 1;
      chunks.push(`<h${info.level} id="${escapeHtml(info.id)}">${renderInline(heading[2])}</h${info.level}>`);
      cursor += 1;
      continue;
    }

    if (isTableLine(line) && isTableLine(next)) {
      const table = renderTable(lines, cursor);
      if (table) {
        chunks.push(table.html);
        cursor = table.next;
        continue;
      }
    }

    if (quoteMatch(line)) {
      const quoted = [];
      while (cursor < lines.length && quoteMatch(lines[cursor])) {
        quoted.push(quoteMatch(lines[cursor])[1]);
        cursor += 1;
      }
      chunks.push(`<blockquote>${quoted.map((part) => renderInline(part)).join('<br />')}</blockquote>`);
      continue;
    }

    if (listMatch(line)) {
      const list = renderList(lines, cursor);
      chunks.push(list.html);
      cursor = list.next;
      continue;
    }

    const paragraph = [];
    while (cursor < lines.length && !isBlockStart(lines[cursor], lines[cursor + 1] ?? '')) {
      paragraph.push(lines[cursor].trim());
      cursor += 1;
    }
    if (paragraph.length) {
      chunks.push(`<p>${paragraph.map((part) => renderInline(part)).join('<br />')}</p>`);
    } else {
      cursor += 1;
    }
  }

  return { html: chunks.join('\n'), toc };
};
