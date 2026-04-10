/**
 * intable — Official Website
 * Design: OLED Dark + Glassmorphism + Developer/Technical aesthetic
 * Stack: SolidJS + UnoCSS (Wind4)
 * Responsive: 375px · 768px · 1024px · 1440px
 */
import { createSignal, onMount, onCleanup, For, Show, batch } from 'solid-js'
import { createMutable } from 'solid-js/store'
import { A } from '@solidjs/router'
import 'virtual:uno.css'
import './website.scss'
import { Intable } from '../../packages/intable/src'
import { CellSelectionPlugin } from '../../packages/intable/src/plugins/CellSelectionPlugin'
import { HistoryPlugin } from '../../packages/intable/src/plugins/HistoryPlugin'
import { ClipboardPlugin } from '../../packages/intable/src/plugins/CopyPastePlugin'

// ─── Data ───────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    title: '插件架构',
    desc: '责任链插件体系，每个功能独立可拔插。按需组合，零冗余。',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm6.75-9.75A1.125 1.125 0 0110.875 2.25h2.25c.621 0 1.125.504 1.125 1.125V19.875c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V3.375zm6.75 4.5A1.125 1.125 0 0117.625 6.75h2.25c.621 0 1.125.504 1.125 1.125v12c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-12z" />
      </svg>
    ),
    title: '虚拟滚动',
    desc: '自定义 Fenwick Tree 虚拟化引擎，百万行顺滑渲染。', 
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
    title: '单元格编辑',
    desc: '内置 10+ 编辑器，支持 Zod 数据校验，自定义编辑器无缝集成。',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
    title: '复制粘贴',
    desc: '完整 Excel 式复制粘贴，支持区域平铺、CRLF 规范化、内部列过滤。',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    title: '撤销重做',
    desc: '完整历史记录，⌘Z / ⌘Y，命令式 API。支持与 DiffPlugin 联动。',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: '多框架支持',
    desc: 'SolidJS 核心 + React / Vue 包装器，Antd / Element Plus 编辑器适配。',
  },
]

const PLUGINS = [
  { name: 'VirtualScrollPlugin', desc: '百万行虚拟化', badge: 'performance' },
  { name: 'EditablePlugin',      desc: '单元格编辑 + 10+ 编辑器', badge: 'core' },
  { name: 'ZodValidatorPlugin',  desc: 'Zod schema 数据校验', badge: 'validation' },
  { name: 'CellSelectionPlugin', desc: '矩形区域多选', badge: 'core' },
  { name: 'ClipboardPlugin',    desc: 'Excel 式复制粘贴', badge: 'core' },
  { name: 'HistoryPlugin',      desc: '撤销 / 重做', badge: 'core' },
  { name: 'FilterPlugin',       desc: '列筛选 / 条件过滤', badge: 'data' },
  { name: 'RowSelectionPlugin', desc: '行勾选 / 批量操作', badge: 'ux' },
  { name: 'DragPlugin',         desc: '列 / 行拖拽排序', badge: 'ux' },
  { name: 'ResizePlugin',       desc: '列宽 / 行高拖拽', badge: 'ux' },
  { name: 'ExpandPlugin',       desc: '行展开自定义内容', badge: 'ux' },
  { name: 'LoadMorePlugin',     desc: '滚动加载更多（无限加载）', badge: 'performance' },
  { name: 'RowGroupPlugin',     desc: '多字段行分组', badge: 'data' },
  { name: 'TreePlugin',         desc: '树形嵌套数据', badge: 'data' },
  { name: 'CellMergePlugin',    desc: '单元格合并', badge: 'data' },
  { name: 'DiffPlugin',         desc: '数据差异对比高亮', badge: 'data' },
  { name: 'HeaderGroupPlugin',  desc: '多级分组表头', badge: 'ux' },
]

const BADGE_COLORS: Record<string, string> = {
  performance: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  core:        'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  validation:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ux:          'bg-sky-500/20 text-sky-400 border-sky-500/30',
  data:        'bg-violet-500/20 text-violet-400 border-violet-500/30',
}

const FRAMEWORKS = [
  { name: 'SolidJS',  color: '#4F83CC', label: 'Core' },
  { name: 'React',    color: '#61DAFB', label: 'Wrapper' },
  { name: 'Vue',      color: '#42D392', label: 'Wrapper' },
  { name: 'Antd',     color: '#1677FF', label: 'UI Kit' },
  { name: 'Element+', color: '#409EFF', label: 'UI Kit' },
]

const CODE_SNIPPET = `import Intable from 'intable'
import { VirtualScrollPlugin } from 'intable/plugins/VirtualScrollPlugin'

const columns = [
  { id: 'name', name: '姓名', editable: true },
  { id: 'age',  name: '年龄', editable: true, editor: 'number' },
]

export default () => (
  <Intable
    data={rows}
    columns={columns}
    plugins={[VirtualScrollPlugin]}
    index border stickyHeader
    onDataChange={setRows}
  />
)`

// ─── Typed code animation ────────────────────────────────────────────────────

function useTypingEffect(text: string, speed = 18) {
  const [displayed, setDisplayed] = createSignal('')
  const [done, setDone] = createSignal(false)
  onMount(() => {
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(id); setDone(true) }
    }, speed)
    onCleanup(() => clearInterval(id))
  })
  return { displayed, done }
}

// ─── Syntax highlight (minimal token colorizer) ─────────────────────────────

// Use inline styles so this is independent of UnoCSS class generation.
// Apply each pass only to the *text* content, not to already-emitted HTML tags,
// by using a placeholder strategy: collect spans and replace them at the end.
function highlight(code: string) {
  const S = (color: string, text: string) => `<span style="color:${color}">${text}</span>`
  return code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // strings  (do before keywords so 'from' inside import path stays green)
    .replace(/('[^']*')/g, (_, s) => S('#6ee7b7', s))
    // numbers  (do BEFORE adding any spans, avoiding matches inside class attrs)
    .replace(/\b(\d+)\b/g, (_, n) => S('#fb923c', n))
    // comments (full rest-of-line, escape first)
    .replace(/(\/\/.*)/, (_, c) => S('#475569', c))
    // keywords
    .replace(/\b(import|from|export|default|const|return)\b/g, (_, k) => S('#c4b5fd', k))
    // JSX component names
    .replace(/(&lt;\/?)(Intable)(\s|&gt;)/g, (_, a, t, b) => a + S('#7dd3fc', t) + b)
    // prop names (word before ={)
    .replace(/\b(\w+)(?==\s*\{)/g, (_, p) => S('#fde68a', p))
    // boolean props (standalone identifiers on their own "line")
    .replace(/\b(index|border|stickyHeader)\b/g, (_, p) => S('#fde68a', p))
}

// ─── Components ─────────────────────────────────────────────────────────────

function Navbar(props: { isDark: () => boolean; toggleDark: () => void }) {
  const [open, setOpen] = createSignal(false)
  const [scrolled, setScrolled] = createSignal(false)
  onMount(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    onCleanup(() => window.removeEventListener('scroll', handler))
  })
  return (
    <header
      class={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled() ? 'backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/30' : 'bg-transparent'
      }`}
      style={scrolled() ? 'background:var(--wt-nav-bg)' : ''}
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" class="flex items-center gap-2 group cursor-pointer">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow duration-200">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" class="w-4 h-4">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <span class="font-mono font-bold text-white text-lg tracking-tight">intable</span>
          </a>
          {/* Desktop nav */}
          <nav class="hidden md:flex items-center gap-1">
            {(['功能', '插件', '快速开始'] as const).map(item => (
              <a
                href={`#${item}`}
                class="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors duration-150 cursor-pointer"
              >
                {item}
              </a>
            ))}
            <A
              href="/demo"
              class="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors duration-150 cursor-pointer"
            >
              Demo
            </A>
          </nav>
          {/* Actions */}
          <div class="hidden md:flex items-center gap-3">
            <button
              onClick={props.toggleDark}
              class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              title={props.isDark() ? '切换浅色模式' : '切换深色模式'}
              aria-label="切换主题"
            >
              <Show
                when={props.isDark()}
                fallback={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                }
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              </Show>
            </button>
            <a
              href="https://github.com/huodoushigemi/intable"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all duration-150 cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </a>
            <a
              href="#快速开始"
              class="px-4 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors duration-150 cursor-pointer"
            >
              开始使用
            </a>
          </div>
          {/* Mobile menu toggle */}
          <button
            class="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
            onClick={() => setOpen(o => !o)}
            aria-label="菜单"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
              <Show when={open()} fallback={<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />}>
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </Show>
            </svg>
          </button>
        </div>
      </div>
      {/* Mobile menu */}
      <Show when={open()}>
          <div class="md:hidden border-b border-white/5 px-4 pb-4 backdrop-blur-xl" style="background:var(--wt-mobile-menu-bg)">
          {(['功能', '插件', '快速开始'] as const).map(item => (
            <a
              href={`#${item}`}
              class="block px-3 py-3 text-sm text-slate-400 hover:text-white border-b border-white/5 last:border-0 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              {item}
            </a>
          ))}
          <A
            href="/demo"
            class="block px-3 py-3 text-sm text-slate-400 hover:text-white border-b border-white/5 cursor-pointer"
            onClick={() => setOpen(false)}
          >
            Demo
          </A>
          <div class="flex gap-3 mt-3">
            <a href="https://github.com/huodoushigemi/intable" class="flex-1 py-2 text-center text-sm text-slate-400 border border-white/10 rounded-lg cursor-pointer">GitHub</a>
            <button onClick={props.toggleDark} class="flex-1 py-2 text-center text-sm text-slate-400 border border-white/10 rounded-lg cursor-pointer">
              {props.isDark() ? '☀ 浅色' : '🌙 深色'}
            </button>
            <a href="#快速开始" class="flex-1 py-2 text-center text-sm text-white bg-indigo-600 rounded-lg cursor-pointer">开始使用</a>
          </div>
        </div>
      </Show>
    </header>
  )
}

function Hero() {
  return (
    <section class="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
      {/* Ambient background */}
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div class="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[100px]" />
        <div class="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-sky-600/6 rounded-full blur-[80px]" />
        {/* Grid lines */}
        <div class="absolute inset-0 opacity-[0.03]" style="background-image: linear-gradient(rgba(99,102,241,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.4) 1px,transparent 1px); background-size: 60px 60px" />
      </div>

      <div class="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <div class="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Plugin-based · Virtual Scroll · Multi-Framework
        </div>

        {/* Title */}
        <h1 class="text-5xl sm:text-6xl lg:text-7xl font-mono font-bold text-white leading-[1.1] tracking-tight mb-6">
          类 Excel 表格
          <br />
          <span class="bg-gradient-to-r from-indigo-400 via-violet-400 to-sky-400 bg-clip-text text-transparent">
            组件库
          </span>
        </h1>

        <p class="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          基于 SolidJS 的高性能表格组件，插件化架构，虚拟滚动，单元格编辑，
          多选复制粘贴，支持 React / Vue。
        </p>

        {/* CTA */}
        <div class="flex flex-wrap items-center justify-center gap-4 mb-16">
          <a
            href="#快速开始"
            class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 cursor-pointer"
          >
            快速开始
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
          <a
            href="#功能"
            class="inline-flex items-center gap-2 px-6 py-3 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200 cursor-pointer hover:bg-white/5"
          >
            查看功能
          </a>
        </div>

        {/* Stats */}
        <div class="flex flex-wrap justify-center gap-8 sm:gap-16 text-center">
          {[
            { val: '17+', label: '插件' },
            { val: '1M+', label: '行虚拟化' },
            { val: '3',   label: '框架支持' },
            { val: '0',   label: '外部依赖*' },
          ].map(s => (
            <div>
              <div class="text-2xl sm:text-3xl font-mono font-bold text-white">{s.val}</div>
              <div class="text-sm text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-600 animate-bounce">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="功能" class="py-24 sm:py-32">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <p class="text-sm font-mono text-indigo-400 mb-3 tracking-widest uppercase">Core Features</p>
          <h2 class="text-3xl sm:text-4xl font-mono font-bold text-white mb-4">一切你需要的功能</h2>
          <p class="text-slate-400 max-w-xl mx-auto">每个特性都是独立插件，按需引入，无额外体积负担。</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <For each={FEATURES}>{(f, _i) => (
            <div class="relative p-6 rounded-2xl border" style="background:var(--wt-card-bg)"
            >
              {/* Glow on hover */}
              <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 to-violet-500/0 group-hover:from-indigo-500/5 group-hover:to-violet-500/5 transition-all duration-300" />
              <div class="relative">
                <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors duration-200">
                  {f.icon}
                </div>
                <h3 class="font-mono font-semibold text-white mb-2">{f.title}</h3>
                <p class="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          )}</For>
        </div>
      </div>
    </section>
  )
}

function PluginsSection() {
  return (
    <section id="插件" class="py-24 sm:py-32 relative overflow-hidden">
      {/* Background */}
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div class="absolute top-1/2 right-0 w-[500px] h-[500px] bg-violet-600/6 rounded-full blur-[100px]" />
      </div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-start">
          {/* Left */}
          <div class="mb-12 lg:mb-0 lg:sticky lg:top-24">
            <p class="text-sm font-mono text-violet-400 mb-3 tracking-widest uppercase">Plugin System</p>
            <h2 class="text-3xl sm:text-4xl font-mono font-bold text-white mb-6">责任链插件体系</h2>
            <p class="text-slate-400 leading-relaxed mb-6">
              所有功能通过 <code class="font-mono text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded text-sm">rewriteProps</code> 管道链式变换。
              每个插件接收上一个的输出，完全可组合、可替换。
            </p>
            <pre class="wt-code text-xs font-mono text-slate-400 border border-white/5 rounded-xl p-4 overflow-x-auto leading-relaxed" style="background:#0f0f1a">
{`<Intable
  plugins={[
    VirtualScrollPlugin,
    EditablePlugin,
    HistoryPlugin,
    ClipboardPlugin,
  ]}
/>`}
            </pre>
            {/* Framework badges */}
            <div class="mt-8">
              <p class="text-xs text-slate-500 mb-3">多框架支持</p>
              <div class="flex flex-wrap gap-2">
                <For each={FRAMEWORKS}>{(fw) => (
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 text-xs text-slate-300" style="background:var(--wt-card-bg)">
                    <span class="w-2 h-2 rounded-full" style={`background:${fw.color}`} />
                    {fw.name}
                    <span class="text-slate-600">·</span>
                    <span class="text-slate-500">{fw.label}</span>
                  </div>
                )}</For>
              </div>
            </div>
          </div>

          {/* Right: plugin grid */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <For each={PLUGINS}>{(p) => (
              <div
                class="flex items-start gap-3 p-4 rounded-xl border border-white/5 hover:border-violet-500/20 transition-all duration-200 group cursor-default"
                style="background:var(--wt-card-bg)"
              >
                <div class="mt-0.5 w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-violet-400 transition-colors flex-shrink-0" />
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-0.5">
                    <span class="font-mono text-xs text-white truncate">{p.name}</span>
                    <span class={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${BADGE_COLORS[p.badge]}`}>
                      {p.badge}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500">{p.desc}</p>
                </div>
              </div>
            )}</For>
          </div>
        </div>
      </div>
    </section>
  )
}

function CodeSection() {
  const { displayed, done } = useTypingEffect(CODE_SNIPPET, 16)
  return (
    <section id="快速开始" class="py-24 sm:py-32 relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div class="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/6 rounded-full blur-[100px]" />
      </div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <p class="text-sm font-mono text-sky-400 mb-3 tracking-widest uppercase">Quick Start</p>
          <h2 class="text-3xl sm:text-4xl font-mono font-bold text-white mb-4">几行代码，即刻上手</h2>
          <p class="text-slate-400">安装包后，直接引入组件与需要的插件。</p>
        </div>

        <div class="grid lg:grid-cols-2 gap-8 items-start">
          {/* Install steps */}
          <div class="space-y-4">
            {[
              { step: '01', label: '安装', cmd: 'pnpm add intable' },
              { step: '02', label: 'Vue', cmd: 'pnpm add @intable/vue' },
              { step: '03', label: 'React', cmd: 'pnpm add @intable/react' },
            ].map(s => (
              <div class="flex items-center gap-4 p-4 rounded-xl border border-white/5" style="background:var(--wt-card-bg)">
                <span class="font-mono text-xs text-slate-600 w-6 shrink-0">{s.step}</span>
                <div class="min-w-0">
                  <p class="text-xs text-slate-500 mb-1">{s.label}</p>
                  <code class="font-mono text-sm text-slate-200">{s.cmd}</code>
                </div>
              </div>
            ))}

            {/* Key props */}
            <div class="mt-8">
              <p class="text-xs font-mono text-slate-500 mb-3 uppercase tracking-wider">常用 Props</p>
              <div class="space-y-2 text-sm font-mono">
                {[
                  ['data',         'any[]',                'Table rows'],
                  ['columns',      'Column[]',             'Column definitions'],
                  ['plugins',      'Plugin[]',             'Feature plugins'],
                  ['onDataChange', '(data) => void',       'Data mutation callback'],
                  ['index',        'boolean',              'Show row numbers'],
                  ['virtual',      '{ x?, y? }',          'Virtual scroll config'],
                ].map(([prop, type, note]) => (
                  <div class="flex items-baseline gap-3 py-1.5 border-b border-white/3 last:border-0">
                    <span class="text-amber-300 shrink-0">{prop}</span>
                    <span class="text-slate-500 text-xs shrink-0">{type}</span>
                    <span class="text-slate-600 text-xs ml-auto text-right">{note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Code editor */}
          <div class="wt-code rounded-2xl border border-white/8 overflow-hidden shadow-2xl shadow-black/50">
            {/* Title bar */}
            <div class="flex items-center gap-2 px-4 py-3 border-b border-white/5" style="background:#0f0f1a">
              <span class="w-3 h-3 rounded-full bg-red-500/70" />
              <span class="w-3 h-3 rounded-full bg-amber-500/70" />
              <span class="w-3 h-3 rounded-full bg-green-500/70" />
              <span class="ml-3 text-xs font-mono text-slate-500">App.tsx</span>
            </div>
            {/* Code */}
            <div class="relative p-5 overflow-x-auto min-h-[320px]" style="background:#0a0a12">
              <pre class="text-sm font-mono leading-relaxed">
                <code
                  innerHTML={highlight(displayed())}
                />
                <Show when={!done()}>
                  <span class="inline-block w-0.5 h-4 bg-indigo-400 animate-pulse ml-px align-text-bottom" />
                </Show>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TableDemo() {
  const cols = [
    { id: 'sku',      name: 'SKU',       editable: true },
    { id: 'product',  name: '产品名',    editable: true },
    { id: 'category', name: '分类',      editable: true },
    { id: 'stock',    name: '库存',      editable: true },
    { id: 'price',    name: '单价',      editable: true },
  ]
  const data = createMutable([
    { id: 0, sku: 'SKU-001', product: 'MacBook Pro 16"', category: '笔记本', stock: 12, price: '¥18999' },
    { id: 1, sku: 'SKU-002', product: 'iPad Air', category: '平板', stock: 28, price: '¥4599' },
    { id: 2, sku: 'SKU-003', product: 'AirPods Pro', category: '耳机', stock: 45, price: '¥1899' },
    { id: 3, sku: 'SKU-004', product: 'Apple Watch', category: '穿戴设备', stock: 18, price: '¥2999' },
    { id: 4, sku: 'SKU-005', product: 'Magic Mouse', category: '配件', stock: 67, price: '¥799' },
    { id: 5, sku: 'SKU-006', product: 'MacBook Air M3', category: '笔记本', stock: 34, price: '¥11999' },
    { id: 6, sku: 'SKU-007', product: 'iPad Pro 12.9"', category: '平板', stock: 15, price: '¥6899' },
    { id: 7, sku: 'SKU-008', product: 'AirPods Max', category: '耳机', stock: 8, price: '¥3999' },
    { id: 8, sku: 'SKU-009', product: 'Mac Mini M4', category: '台式机', stock: 22, price: '¥4399' },
    { id: 9, sku: 'SKU-010', product: 'Studio Display', category: '显示器', stock: 5, price: '¥11499' },
    { id: 10, sku: 'SKU-011', product: 'iPhone 16 Pro', category: '手机', stock: 56, price: '¥8999' },
    { id: 11, sku: 'SKU-012', product: 'Apple TV 4K', category: '配件', stock: 31, price: '¥1499' },
  ])

  return (
    <section class="py-16 sm:py-24">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10">
          <p class="text-sm font-mono text-emerald-400 mb-3 tracking-widest uppercase">Live Demo</p>
          <h2 class="text-2xl sm:text-3xl font-mono font-bold text-white">它长这样</h2>
          <p class="text-sm text-slate-500 mt-2 font-mono">点击选择 · ⌘C 复制 · ⌘Z 撤销</p>
        </div>

        <div class="wt-live-demo overflow-hidden shadow-2xl shadow-black/20">
          <Intable
            style="max-height:240px"
            data={data}
            onDataChange={v => batch(() => v.forEach((row, i) => Object.assign(data[i], row)))}
            columns={cols}
            index
            border
            stickyHeader
            size="small"
            plugins={[CellSelectionPlugin, HistoryPlugin, ClipboardPlugin]}
          />
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer class="border-t border-white/5 py-12 mt-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" class="w-3 h-3">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <span class="font-mono font-bold text-slate-400">intable</span>
          </div>
          <p class="text-xs text-slate-600 font-mono">MIT License · Built with SolidJS</p>
          <div class="flex items-center gap-4 text-xs text-slate-600 font-mono">
            <a href="#功能" class="hover:text-slate-400 transition-colors cursor-pointer">功能</a>
            <a href="#插件" class="hover:text-slate-400 transition-colors cursor-pointer">插件</a>
            <a href="#快速开始" class="hover:text-slate-400 transition-colors cursor-pointer">快速开始</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Root ────────────────────────────────────────────────────────────────────

export const Website = () => {
  const initDark = typeof window !== 'undefined'
    ? (localStorage.getItem('wt-theme') === 'dark'
        || (localStorage.getItem('wt-theme') === null
            && window.matchMedia('(prefers-color-scheme: dark)').matches))
    : true
  const [isDark, setIsDark] = createSignal(initDark)
  const toggleDark = () => {
    const next = !isDark()
    setIsDark(next)
    localStorage.setItem('wt-theme', next ? 'dark' : 'light')
  }

  // fix: hash 路由 a 标签无法正确滚动到目标元素
  function onClick(e) {
    if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#')) {
      const id = e.target.getAttribute('href')!.slice(1)
      const el = document.getElementById(id)
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY
        window.scrollTo({ top, behavior: 'smooth' })
        e.preventDefault()
      }
    }
  }

  return (
    <div class={`wt-website${isDark() ? ' wt-dark' : ''}`} style="min-height:100vh;font-family:'IBM Plex Sans',system-ui,sans-serif" onClick={onClick}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
        }
        :focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; border-radius: 6px; }
      `}</style>

      {/* Skip to content (a11y) */}
      <a href="#功能" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:text-sm">
        跳到主要内容
      </a>

      <Navbar isDark={isDark} toggleDark={toggleDark} />
      <main>
        <Hero />
        <Features />
        <TableDemo />
        <PluginsSection />
        <CodeSection />
      </main>
      <Footer />
    </div>
  )
}

export default Website
