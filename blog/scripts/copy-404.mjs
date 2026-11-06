/** 构建收尾：SPA 深链（/reading/xxx 等）在 GitHub Pages 上需要 404 回退。 */
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const builtIndex = path.join(siteRoot, 'dist', 'index.html');

if (!existsSync(builtIndex)) {
  console.error('[404] 未找到 dist/index.html，请先执行 vite build。');
  process.exit(1);
}

copyFileSync(builtIndex, path.join(siteRoot, 'dist', '404.html'));
console.log('[404] dist/404.html 已生成（SPA 深链回退）');
