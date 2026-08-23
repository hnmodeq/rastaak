import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const codeExtensions = new Set(['.css', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.html', '.svg']);
const ignored = new Set([
  // The canonical source and its generated token outputs are valid value owners.
  'tokens/design-tokens.ts',
  'tokens/generated.css',
  'public/_astro/scene-tokens.js',
  // Scene controller files saved dynamically by 3D Studio
  'components/canvas/scene/sceneConfig.ts',
  'components/canvas/scene/lightingConfig.ts',
  'components/canvas/scene/SceneStudioGUI.ts',
  'components/canvas/scene/LightGizmos.ts',
  'components/canvas/scene/StoryTimelinePanel.ts',
  'components/canvas/scene/shadowTint.ts',
  'components/canvas/scene/storyConfig.ts',
  'components/canvas/scene/storyRuntime.ts',
  'components/canvas/scene/lookConfig.ts',
  'components/home/flowConfig.ts',
  'components/home/heroCopy.ts',
  'components/home/typeChrome.ts',
  'components/home/siteContent.ts',
  'components/admin/admin.css',
  'components/admin/AdminApp.tsx',
  'app/admin/page.tsx',
  'app/api/save-studio-config/route.ts',
  // Third-party runtime bundles
  'public/_astro/vendor.BgqcyBjU.js',
  'public/_astro/vendor-BYisihw-.js',
  'public/draco/draco_decoder.js',
  'public/draco/draco_encoder.js',
  'public/draco/draco_wasm_wrapper.js',
]);
const ignoredDirectories = new Set(['.git', '.next', 'node_modules', '.arena', '.cache']);

const files = [];
const visit = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(absolute);
    else if (codeExtensions.has(path.extname(entry.name))) files.push(absolute);
  }
};
visit(root);

const literalColor = /(?<![\w-])#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\([^)]*\)|\b0x[0-9a-f]{3,8}\b/gi;
const paletteUtility = /(?<![\w-])(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|caret|accent|shadow)-(?:black|white|transparent|[a-z]+-\d{2,3})(?![\w-])/gi;
const issues = [];

for (const absolute of files) {
  const relative = path.relative(root, absolute).split(path.sep).join('/');
  if (ignored.has(relative) || relative.startsWith('scripts/')) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  for (const pattern of [literalColor, paletteUtility]) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      const line = source.slice(0, match.index).split('\n').length;
      issues.push(`${relative}:${line}: ${match[0]}`);
    }
  }
}

if (issues.length) {
  console.error('Found raw or framework-palette colors outside the token source:');
  console.error(issues.join('\n'));
  process.exit(1);
}

console.log('Color token check passed: no raw application colors found outside token source/generated token outputs.');
