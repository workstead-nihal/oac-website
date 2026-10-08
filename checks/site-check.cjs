// Purpose: dependency-free CI checks for readable source, syntax, local/optional public links and basic accessibility.
'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');

// Reads a project-relative text path; returns UTF-8 source without contacting the network.
function readFile(file) {
  return fs.readFile(path.join(root, file), 'utf8');
}

// Lists files in a known source directory recursively; takes its relative path and returns file paths.
async function sourceFiles(directory) {
  const files = [];
  for (const entry of await fs.readdir(path.join(root, directory), { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await sourceFiles(file));
    } else {
      files.push(file);
    }
  }
  return files;
}

// Checks lightweight formatting rules for a source file; inputs: path/text, output: throws on inconsistency.
function checkFormatting(file, text) {
  assert(text.endsWith('\n'), file + ': add a final newline');
  for (const [index, line] of text.split('\n').entries()) {
    const clean = line.replace(/\r$/, '');
    assert(!clean.includes('\t'), file + ':' + (index + 1) + ': use spaces, not tabs');
    assert(!/[ \t]+$/.test(clean), file + ':' + (index + 1) + ': remove trailing whitespace');
    assert((clean.match(/^ */)[0].length % 2) === 0, file + ':' + (index + 1) + ': use two-space indentation');
  }
}

// Computes WCAG luminance contrast for two six-digit hex colours; returns their contrast ratio.
function contrastRatio(first, second) {
  // Converts one hex colour to relative luminance; input: hex string, output: a number from zero to one.
  function luminance(hex) {
    const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  }
  const firstLight = luminance(first);
  const secondLight = luminance(second);
  return (Math.max(firstLight, secondLight) + .05) / (Math.min(firstLight, secondLight) + .05);
}

// Checks CSS brace pairing, declared variables and known text pairs; takes CSS text and returns nothing.
function checkCss(text) {
  const plain = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/"[^"\n]*"|'[^'\n]*'/g, '');
  let depth = 0;
  for (const character of plain) {
    if (character === '{') {
      depth++;
    } else if (character === '}') {
      depth--;
    }
    assert(depth >= 0, 'CSS has an unmatched closing brace');
  }
  assert.equal(depth, 0, 'CSS has an unclosed rule');
  const variables = new Set([...text.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]));
  for (const match of text.matchAll(/var\((--[\w-]+)/g)) {
    assert(variables.has(match[1]), 'Undefined CSS variable: ' + match[1]);
  }
  const colours = Object.fromEntries([...text.matchAll(/--([\w-]+):\s*(#[a-fA-F0-9]{6});/g)].map(match => [match[1], match[2]]));
  for (const [foreground, background] of [['text', 'background'], ['text', 'surface'], ['muted', 'surface'], ['gold', 'surface'], ['text', 'red'], ['background', 'gold'], ['success-text', 'success-background'], ['red-light', 'error-background']]) {
    assert(contrastRatio(colours[foreground], colours[background]) >= 4.5, foreground + '/' + background + ': text contrast must reach 4.5:1');
  }
  assert(text.includes('prefers-reduced-motion'), 'Keep reduced-motion support');
  assert(text.includes(':focus-visible'), 'Keep visible keyboard focus');
}

// Reads attributes from a simple HTML opening tag; returns a name/value map, including boolean attributes.
function attributes(tag) {
  const values = {};
  const inside = tag.replace(/^<\/?[\w:-]+/, '').replace(/\/?>$/, '');
  for (const match of inside.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    values[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return values;
}

// Extracts root-page tags without parsing comments; returns tag records and their source offsets.
function htmlTags(html) {
  const records = [];
  for (const match of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][^>]*>/g)) {
    if (match[0].startsWith('<!')) {
      continue;
    }
    records.push({ tag: match[0], name: match[0].match(/^<\/?([\w:-]+)/)[1].toLowerCase(), index: match.index, attrs: attributes(match[0]) });
  }
  return records;
}

// Checks a simple hand-authored page's tag pairing and accessibility basics; returns IDs and links.
// ponytail: this is a narrow checker for our static markup, not a full HTML/WCAG validator; browser review remains required.
function checkHtml(file, html) {
  const desktopNav = html.match(/<nav class="desktop-nav"[^>]*>([\s\S]*?)<\/nav>/);
  assert(desktopNav, file + ': desktop navigation missing');
  const navigationLinks = [...desktopNav[1].matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(navigationLinks, ['index.html', 'events.html', 'showcase.html', 'volunteers.html', 'about.html', 'work-with-us.html'], file + ': navigation order must stay consistent when switching pages');
  const tags = htmlTags(html);
  const ids = new Set();
  const stack = [];
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  for (const record of tags) {
    const { tag, name, attrs } = record;
    if (tag.startsWith('</')) {
      assert.equal(stack.pop(), name, file + ': mismatched closing tag ' + tag);
      continue;
    }
    if (!voidTags.has(name) && !tag.endsWith('/>')) {
      stack.push(name);
    }
    if (attrs.id) {
      assert(!ids.has(attrs.id), file + ': duplicate id ' + attrs.id);
      ids.add(attrs.id);
    }
    if (name === 'img') {
      assert('alt' in attrs, file + ': image needs alt text');
      assert(Number(attrs.width) > 0 && Number(attrs.height) > 0, file + ': image needs width/height');
    }
    if (['input', 'select', 'textarea'].includes(name)) {
      const explicit = attrs.id && html.includes('for="' + attrs.id + '"');
      const openingLabel = html.lastIndexOf('<label', record.index);
      const closingLabel = html.lastIndexOf('</label>', record.index);
      assert(explicit || openingLabel > closingLabel, file + ': input needs a label');
    }
  }
  assert.equal(stack.length, 0, file + ': unclosed tags');
  assert.equal(tags.filter(record => record.name === 'h1' && !record.tag.startsWith('</')).length, 1, file + ': use one h1');
  assert.equal(tags.filter(record => record.name === 'main' && !record.tag.startsWith('</')).length, 1, file + ': use one main');
  assert(html.includes('class="skip-link"'), file + ': add a skip link');
  assert(/<html\s+lang="en"/.test(html), file + ': declare page language');
  assert(/name="viewport"/.test(html), file + ': missing mobile viewport');
  assert(/<title>[\s\S]+?<\/title>/.test(html), file + ': missing title');
  for (const property of ['og:title', 'og:description', 'og:image', 'og:url']) {
    assert(html.includes('property="' + property + '"'), file + ': missing ' + property);
  }
  assert(html.includes('name="description"'), file + ': missing description');
  assert(html.includes('rel="canonical"'), file + ': missing canonical');
  if (!['checkin.html', '404.html'].includes(file)) {
    assert(!html.includes('href="checkin.html"'), file + ': keep check-in out of public navigation');
  }
  return { ids, tags };
}

// Checks a relative URL against the actual file/anchor; inputs: source path/link/page records, output: no value.
async function checkLocalLink(file, value, pages) {
  if (!value || /^(https?:|mailto:|tel:)/.test(value)) {
    return;
  }
  const address = new URL(value, 'https://local.invalid/' + file.replaceAll('\\', '/'));
  const target = decodeURIComponent(address.pathname.slice(1)) || 'index.html';
  await fs.access(path.join(root, target));
  if (address.hash) {
    assert(pages[target]?.ids.has(decodeURIComponent(address.hash.slice(1))), file + ': missing anchor ' + value);
  }
}

// Traverses JSON content to find image paths and public URLs; returns nothing, accumulates public links in a Set.
async function checkContent(value, externalLinks) {
  if (!value || typeof value !== 'object') {
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string' && item.startsWith('assets/')) {
      assert(item.startsWith('assets/images/web/'), 'Content images must use compressed web copies');
      assert(!item.includes('..'), 'Content images must not traverse directories');
      const stats = await fs.stat(path.join(root, item));
      assert(stats.size <= 300000, item + ': compress this image below 300 KB');
    }
    if ((key === 'url' || key.endsWith('Url')) && item) {
      assert(new URL(item).protocol === 'https:', 'Public links must use HTTPS');
      externalLinks.add(item);
    }
    if (item && typeof item === 'object') {
      await checkContent(item, externalLinks);
    }
  }
}

// Checks one public link with a bounded GET; returns nothing or throws for a broken/unreachable destination.
async function checkExternalLink(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { redirect: 'follow', signal: controller.signal });
    assert(response.ok, url + ': HTTP ' + response.status);
    if (response.body) {
      await response.body.cancel();
    }
  } finally {
    clearTimeout(timeout);
  }
}

// Runs source, page, content and optional network/release checks; takes options and returns a short result object.
async function checkSite(options = {}) {
  const rootFiles = await fs.readdir(root);
  const pageFiles = rootFiles.filter(file => file.endsWith('.html'));
  const files = [...pageFiles];
  for (const directory of ['js', 'css', 'data', 'checks', 'apps-script', '.github']) {
    files.push(...await sourceFiles(directory));
  }
  const pages = {};
  const externalLinks = new Set();
  for (const file of files) {
    const text = await readFile(file);
    checkFormatting(file, text);
    if (/\.(js|cjs|gs)$/.test(file)) {
      new vm.Script(text, { filename: file });
    }
    if (file.endsWith('.css')) {
      checkCss(text);
    }
    if (file.endsWith('.json')) {
      await checkContent(JSON.parse(text), externalLinks);
    }
    if (file.endsWith('.html')) {
      for (const script of text.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
        new vm.Script(script[1], { filename: file });
      }
    }
    if (pageFiles.includes(file)) {
      pages[file] = checkHtml(file, text);
    }
  }
  for (const [file, page] of Object.entries(pages)) {
    for (const { name, attrs } of page.tags) {
      if (name === 'base') {
        continue;
      }
      for (const key of ['href', 'src']) {
        if (attrs[key]) {
          await checkLocalLink(file, attrs[key], pages);
          if (name === 'a' && attrs[key].startsWith('https://')) {
            externalLinks.add(attrs[key]);
          }
        }
      }
    }
  }
  const sitemap = await readFile('sitemap.xml');
  assert(!sitemap.includes('checkin.html') && !sitemap.includes('404.html'), 'Sitemap must exclude private/error pages');
  assert.equal([...sitemap.matchAll(/<loc>/g)].length, 11, 'Sitemap must include all eleven public pages');
  const provisional = (await readFile('index.html')).includes('https://example.invalid/');
  if (options.release) {
    assert(!provisional, 'Configure the confirmed website URL before release');
    const config = { window: {} };
    vm.runInNewContext(await readFile('js/config.js'), config);
    assert(/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(config.window.OAC_CONFIG.appsScriptUrl), 'Configure the deployed Apps Script URL before release');
  }
  if (options.external) {
    for (const url of externalLinks) {
      await checkExternalLink(url);
    }
  }
  const scriptBytes = (await Promise.all((await sourceFiles('js')).map(file => fs.stat(path.join(root, file))))).reduce((total, stats) => total + stats.size, 0);
  assert(scriptBytes < 100000, 'Keep total client JavaScript under 100 KB');
  const cover = await fs.stat(path.join(root, 'assets/og-cover.jpg'));
  assert(cover.size < 150000, 'Compress the social preview image under 150 KB');
  return { pages: pageFiles.length, sourceFiles: files.length, externalLinks: externalLinks.size, scriptBytes, provisionalDomain: provisional };
}

module.exports = { checkSite };
if (require.main === module) {
  // Prints the check result; input: CLI switches, output: exit code for GitHub Actions.
  checkSite({ external: process.argv.includes('--external'), release: process.argv.includes('--release') }).then(function reportSuccess(result) {
    console.log('Website checks passed:', result);
    if (result.provisionalDomain) {
      console.log('Setup pending: replace the reserved example.invalid URL before release.');
    }
  }).catch(function reportFailure(error) {
    console.error(error.message);
    process.exitCode = 1;
  });
}
