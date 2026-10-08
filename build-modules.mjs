/**
 * 模块详情页生成器
 *
 * 从 modules-data.mjs 读取内容，生成：
 *   - modules/index.html        全部模块总览页
 *   - modules/{slug}.html       21 个模块详情页
 *
 * 用法（在 website 目录下执行）：
 *   node build-modules.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GROUPS, MODULES } from './modules-data.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, 'modules')

const groupOf = (id) => GROUPS.find((g) => g.id === id)
const moduleOf = (slug) => MODULES.find((m) => m.slug === slug)

/** 中文数字（用于标题文案，如 21 → 二十一） */
const CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
function cnNum(n) {
  if (n === 10) return '十'
  if (n < 10) return CN_DIGITS[n]
  if (n < 20) return `十${CN_DIGITS[n - 10]}`
  return `二十${n > 20 ? CN_DIGITS[n - 20] : ''}`
}

/* ------------------------------------------------------------
   页面片段
   ------------------------------------------------------------ */

function head(title, desc) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta name="theme-color" content="#f5f5f7">
  <link rel="icon" href="../favicon.ico" type="image/x-icon">
  <link rel="stylesheet" href="../assets/styles.css">
</head>
<body>`
}

function header(activeAll) {
  return `
  <!-- ==================== 顶部导航 ==================== -->
  <header class="site-header" id="siteHeader">
    <div class="container nav-row">
      <a class="nav-brand" href="../index.html">
        <img class="nav-logo" src="../assets/img/logo.png" alt="无界指纹浏览器 Logo">
        <span class="nav-brand-text">
          <strong>无界指纹浏览器</strong>
          <em>Unbound Browser</em>
        </span>
      </a>
      <nav class="nav-links" aria-label="主导航">
        <a href="../index.html#features">功能特色</a>
        <a href="../index.html#scenarios">使用场景</a>
        <a href="../index.html#gallery">界面巡览</a>
        <a href="../index.html#automation">自动化</a>
        <a href="index.html"${activeAll ? ' class="active"' : ''}>全部模块</a>
        <a href="../manual.html">使用手册</a>
        <a href="../download.html">下载</a>
      </nav>
      <a class="btn btn-primary btn-sm nav-cta" href="../download.html">下载 Windows 版</a>
    </div>
  </header>`
}

function footer() {
  return `
  <!-- ==================== 页脚 ==================== -->
  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <img src="../assets/img/logo.png" alt="无界指纹浏览器">
        <div>
          <strong>无界指纹浏览器</strong>
          <p>无限环境，无界运营。多账号管理的一站式本地解决方案。</p>
        </div>
      </div>
      <nav class="footer-links" aria-label="页脚导航">
        <a href="../index.html#features">功能特色</a>
        <a href="../index.html#scenarios">使用场景</a>
        <a href="../index.html#gallery">界面巡览</a>
        <a href="../index.html#automation">自动化</a>
        <a href="index.html">全部模块</a>
        <a href="../manual.html">使用手册</a>
        <a href="../download.html">下载</a>
      </nav>
    </div>
    <div class="container footer-bottom">
      <p>© <span id="year">2026</span> 无界指纹浏览器 · Unbound Browser</p>
      <p class="footer-disclaimer">请遵守目标网站的服务条款与当地法律法规，将本软件用于合法的账号管理与自动化场景。</p>
    </div>
  </footer>

  <script src="../assets/app.js"></script>
</body>
</html>
`
}

/* ------------------------------------------------------------
   模块详情页
   ------------------------------------------------------------ */

function renderCapabilities(mod) {
  const cards = mod.capabilities
    .map(
      ([title, desc]) => `
          <div class="cap-card reveal">
            <h3>${title}</h3>
            <p>${desc}</p>
          </div>`
    )
    .join('')
  return `
    <!-- ==================== 能力一览 ==================== -->
    <section class="section">
      <div class="container">
        <div class="section-head reveal">
          <p class="eyebrow">能力一览</p>
          <h2 class="section-title">能为你做什么</h2>
        </div>
        <div class="cap-grid">${cards}
        </div>
      </div>
    </section>`
}

function renderShots(mod) {
  if (mod.shots.length === 0) return ''
  const items = mod.shots
    .map(
      ([file, title, caption]) => `
          <figure class="shot-item reveal">
            <div class="window-frame">
              <div class="window-bar">
                <span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>
                <span class="window-title">${title}</span>
              </div>
              <img src="../assets/img/${file}" alt="${title}" loading="lazy">
            </div>
            <figcaption>${caption}</figcaption>
          </figure>`
    )
    .join('')
  return `
    <!-- ==================== 界面实拍 ==================== -->
    <section class="section section-alt">
      <div class="container">
        <div class="section-head reveal">
          <p class="eyebrow">界面实拍</p>
          <h2 class="section-title">真实界面，所见即所得</h2>
        </div>
        <div class="shot-grid${mod.shots.length > 1 ? ' shot-grid-2' : ''}">${items}
        </div>
      </div>
    </section>`
}

function renderSteps(mod) {
  const steps = mod.steps
    .map(
      (s, i) => `
          <li class="mstep reveal">
            <span class="mstep-num">${i + 1}</span>
            <p>${s}</p>
          </li>`
    )
    .join('')
  return `
    <!-- ==================== 上手方式 ==================== -->
    <section class="section">
      <div class="container">
        <div class="section-head reveal">
          <p class="eyebrow">上手方式</p>
          <h2 class="section-title">几步就能用起来</h2>
        </div>
        <ol class="mstep-list">${steps}
        </ol>
      </div>
    </section>`
}

function renderManualRef(mod) {
  const [anchor, label] = mod.manual
  return `
        <div class="manual-ref reveal">
          <div class="manual-ref-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M20 18v3H6.5A2.5 2.5 0 0 1 4 18.5"/>
            </svg>
          </div>
          <div class="manual-ref-main">
            <strong>在手册中继续深入</strong>
            <p>「${mod.name}」的完整操作指南，见使用手册 ${label} 章节。</p>
          </div>
          <a class="btn btn-ghost btn-sm" href="../manual.html#${anchor}">打开手册 →</a>
        </div>`
}

function renderRelated(mod) {
  const cards = mod.related
    .map((slug) => {
      const r = moduleOf(slug)
      return `
          <a class="related-card reveal" href="${slug}.html">
            <strong>${r.name}</strong>
            <span>${r.tagline}</span>
            <em>查看详情 →</em>
          </a>`
    })
    .join('')
  return `
        <div class="related-block">
          <div class="section-head reveal">
            <p class="eyebrow">协同模块</p>
            <h2 class="section-title">与其他模块配合使用</h2>
          </div>
          <div class="related-grid">${cards}
          </div>
        </div>`
}

function renderPager(index) {
  const prev = MODULES[(index - 1 + MODULES.length) % MODULES.length]
  const next = MODULES[(index + 1) % MODULES.length]
  return `
    <!-- ==================== 模块导航 ==================== -->
    <section class="section module-tail">
      <div class="container">
        <div class="module-cta reveal">
          <div class="module-cta-copy">
            <h3>准备好上手了吗？</h3>
            <p>下载安装包，几分钟内运行第一个隔离环境。</p>
          </div>
          <div class="module-cta-actions">
            <a class="btn btn-primary btn-lg" href="../download.html">下载 Windows 版</a>
            <a class="btn btn-ghost btn-lg" href="../manual.html">阅读使用手册</a>
          </div>
        </div>
        <nav class="module-pager reveal" aria-label="模块导航">
          <a class="pager-link" href="${prev.slug}.html"><em>上一个</em><strong>${prev.name}</strong></a>
          <a class="pager-link pager-all" href="index.html"><em>索引</em><strong>全部模块</strong></a>
          <a class="pager-link pager-next" href="${next.slug}.html"><em>下一个</em><strong>${next.name}</strong></a>
        </nav>
      </div>
    </section>`
}

function renderModulePage(mod, index) {
  const group = groupOf(mod.group)
  const desc = `${mod.tagline}：${mod.intro.slice(0, 56)}…`
  return `${head(`${mod.name} — 无界指纹浏览器`, desc)}
${header(false)}

  <main>
    <!-- ==================== 模块头部 ==================== -->
    <section class="module-hero">
      <div class="container">
        <nav class="breadcrumb reveal" aria-label="面包屑">
          <a href="../index.html">首页</a><span class="breadcrumb-sep">/</span><a href="index.html">全部模块</a><span class="breadcrumb-sep">/</span><span class="breadcrumb-current">${mod.name}</span>
        </nav>
        <div class="module-hero-body reveal">
          <span class="module-chip">${group.title}</span>
          <h1 class="module-hero-title">${mod.name}</h1>
          <p class="module-hero-sub">${mod.tagline}</p>
          <p class="module-hero-intro">${mod.intro}</p>
        </div>
      </div>
    </section>
${renderCapabilities(mod)}
${renderShots(mod)}
${renderSteps(mod)}

    <!-- ==================== 手册与协同 ==================== -->
    <section class="section section-alt">
      <div class="container">${renderManualRef(mod)}
${renderRelated(mod)}
      </div>
    </section>
${renderPager(index)}
  </main>
${footer()}`
}

/* ------------------------------------------------------------
   总览页
   ------------------------------------------------------------ */

function renderIndexPage() {
  const groupsHtml = GROUPS.map((g) => {
    const items = MODULES.filter((m) => m.group === g.id)
      .map(
        (m) => `
            <a class="module-item" href="${m.slug}.html">
              <strong>${m.name}</strong>
              <span>${m.tagline}</span>
            </a>`
      )
      .join('')
    return `
        <div class="module-group">
          <p class="module-group-title">${g.title}</p>
          <p class="module-group-desc">${g.desc}</p>
          <div class="module-grid">${items}
          </div>
        </div>`
  }).join('')

  return `${head('全部模块 — 无界指纹浏览器', `无界指纹浏览器${cnNum(MODULES.length)}个功能模块总览：环境与自动化、资源管理、数据与监控与系统能力，点击任意模块查看详细介绍。`)}
${header(true)}

  <main>
    <!-- ==================== 总览头部 ==================== -->
    <section class="modules-hero">
      <div class="container">
        <p class="eyebrow reveal">全景功能</p>
        <h1 class="modules-hero-title reveal">一个软件，${cnNum(MODULES.length)}个模块</h1>
        <p class="modules-hero-sub reveal">从环境创建、批量运维到团队协作，全部内置、无需拼装。<br>点击任意模块，查看它能为你做什么。</p>
        <div class="modules-hero-actions reveal">
          <a class="btn btn-primary" href="../download.html">下载 Windows 版</a>
          <a class="btn btn-ghost" href="../manual.html">阅读使用手册</a>
        </div>
      </div>
    </section>

    <!-- ==================== 全部模块 ==================== -->
    <section class="section">
      <div class="container">${groupsHtml}
      </div>
    </section>
  </main>
${footer()}`
}

/* ------------------------------------------------------------
   输出
   ------------------------------------------------------------ */

mkdirSync(OUT_DIR, { recursive: true })

writeFileSync(join(OUT_DIR, 'index.html'), renderIndexPage(), 'utf8')
for (let i = 0; i < MODULES.length; i++) {
  const mod = MODULES[i]
  writeFileSync(join(OUT_DIR, `${mod.slug}.html`), renderModulePage(mod, i), 'utf8')
}

console.log(`✓ 已生成 modules/index.html 与 ${MODULES.length} 个模块详情页`)
