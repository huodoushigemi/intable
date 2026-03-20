/**
 * Plugin test demo index — renders a list of demo sections,
 * one per plugin, to visually verify each feature.
 */
import { createSignal, createEffect, onCleanup, For, Show } from 'solid-js'

import { BasicDemo } from './BasicDemo'
import { VirtualScrollDemo } from './VirtualScrollDemo'
import { HeaderGroupDemo } from './HeaderGroupDemo'
import { CellSelectionDemo } from './CellSelectionDemo'
import { EditableDemo } from './EditableDemo'
import { ExpandDemo } from './ExpandDemo'
import { RowSelectionDemo } from './RowSelectionDemo'
import { ResizeDemo } from './ResizeDemo'
import { DragDemo } from './DragDemo'
import { RowGroupDemo } from './RowGroupDemo'
import { CellMergeDemo } from './CellMergeDemo'
import { HistoryDemo } from './HistoryDemo'
import { DiffDemo } from './DiffDemo'
import { TreeDemo } from './TreeDemo'
import { CopyPasteDemo } from './CopyPasteDemo'
import { CompositeDemo } from './CompositeDemo'
import { ReactDemo } from './ReactDemo'

// ── Theme CSS (equivalent to: import 'intable/theme/*') ──────────────────────
import antdCss         from '../../../packages/intable/src/theme/antd.scss?inline'
import elementPlusCss  from '../../../packages/intable/src/theme/element-plus.scss?inline'
import darkCss         from '../../../packages/intable/src/theme/dark.scss?inline'
import shadcnCss       from '../../../packages/intable/src/theme/shadcn.scss?inline'
import stripeCss       from '../../../packages/intable/src/theme/stripe.scss?inline'
import materialCss     from '../../../packages/intable/src/theme/material.scss?inline'
import githubCss       from '../../../packages/intable/src/theme/github.scss?inline'

const THEMES = [
  { name: 'Default',      css: '',            color: '#e5e7eb' },
  { name: 'Antd',         css: antdCss,       color: '#1677ff' },
  { name: 'Element Plus', css: elementPlusCss,color: '#409eff' },
  { name: 'Dark',         css: darkCss,       color: '#0d1117' },
  { name: 'GitHub',       css: githubCss,     color: '#1f2328' },
  { name: 'Shadcn',       css: shadcnCss,     color: '#18181b' },
  { name: 'Stripe',       css: stripeCss,     color: '#635bff' },
  { name: 'Material',     css: materialCss,   color: '#6750a4' },
]

const STYLE_ID = 'intable-theme-override'

function applyTheme(css: string) {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = css
}

// ── Custom theme dropdown ─────────────────────────────────────────────────────
function ThemeSelect(props: { themes: typeof THEMES; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = createSignal(false)
  let ref!: HTMLDivElement

  const current = () => props.themes.find(t => t.name === props.value)!

  const handleOutside = (e: MouseEvent) => {
    if (!ref.contains(e.target as Node)) setOpen(false)
  }
  createEffect(() => {
    if (open()) document.addEventListener('mousedown', handleOutside)
    else document.removeEventListener('mousedown', handleOutside)
  })
  onCleanup(() => document.removeEventListener('mousedown', handleOutside))

  return (
    <div ref={ref} class='relative w-full'>
      <button
        type='button'
        class='flex items-center gap-1.5 w-full text-xs px-2 py-1.5 rd-1 b-(1 solid #d1d5db) bg-white c-#374151 cursor-pointer text-left'
        onClick={() => setOpen(o => !o)}
      >
        <span class='inline-block w-2.5 h-2.5 rd-full shrink-0 b-(1 solid #0002)' style={{ background: current().color }} />
        <span class='flex-1'>{current().name}</span>
        <svg class='w-3 h-3 c-gray shrink-0' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5'>
          <path stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' />
        </svg>
      </button>
      <Show when={open()}>
        <div class='absolute top-full left-0 right-0 mt-0.5 bg-white b-(1 solid #d1d5db) rd-1 shadow-md z-50 py-0.5'>
          <For each={props.themes}>{t => (
            <button
              type='button'
              class={`flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-left cursor-pointer transition-colors ${
                props.value === t.name ? 'bg-blue-50 c-blue-600 font-medium' : 'hover:bg-gray-50 c-#374151'
              }`}
              onClick={() => { props.onChange(t.name); setOpen(false) }}
            >
              <span class='inline-block w-2.5 h-2.5 rd-full shrink-0 b-(1 solid #0002)' style={{ background: t.color }} />
              {t.name}
            </button>
          )}</For>
        </div>
      </Show>
    </div>
  )
}

// ── Demo list ─────────────────────────────────────────────────────────────────
const demos = [
  { name: 'Basic',           comp: BasicDemo,          desc: 'Minimal table with index, border, sticky header' },
  { name: 'VirtualScroll',   comp: VirtualScrollDemo,  desc: 'Virtual scroll (X+Y) with 10k rows × 50 cols' },
  { name: 'HeaderGroup',     comp: HeaderGroupDemo,     desc: 'Nested column header groups with colspan/rowspan' },
  { name: 'CellSelection',   comp: CellSelectionDemo,   desc: 'Click and drag to select cell ranges' },
  { name: 'Editable',        comp: EditableDemo,        desc: 'Double-click cells to edit (text, number, select, date…)' },
  { name: 'Expand',          comp: ExpandDemo,          desc: 'Expandable rows with custom detail render' },
  { name: 'RowSelection',    comp: RowSelectionDemo,    desc: 'Checkbox row selection (single & multiple)' },
  { name: 'Resize',          comp: ResizeDemo,          desc: 'Drag column/row borders to resize' },
  { name: 'Drag',            comp: DragDemo,            desc: 'Drag-and-drop column & row reordering' },
  { name: 'RowGroup',        comp: RowGroupDemo,        desc: 'Group rows by field values with collapsible headers' },
  { name: 'CellMerge',       comp: CellMergeDemo,       desc: 'Merge cells (rowspan/colspan)' },
  { name: 'CopyPaste',       comp: CopyPasteDemo,       desc: 'Copy / paste cell ranges (Ctrl+C / Ctrl+V)' },
  { name: 'Tree',            comp: TreeDemo,            desc: 'Tree-structured data with expand/collapse' },
  { name: 'History',         comp: HistoryDemo,         desc: 'Undo / Redo (Ctrl+Z / Ctrl+Y)' },
  { name: 'Diff',            comp: DiffDemo,            desc: 'Track changes & commit (Ctrl+S)' },
  { name: 'Composite',       comp: CompositeDemo,       desc: 'All features combined' },
  { name: 'React',           comp: ReactDemo,           desc: 'React integration demo' }
]

export const DemoApp = () => {
  const [active, setActive] = createSignal(demos[0].name)
  const [theme, setTheme] = createSignal(THEMES[0].name)

  createEffect(() => {
    const t = THEMES.find(t => t.name === theme())
    applyTheme(t?.css ?? '')
  })

  onCleanup(() => document.getElementById(STYLE_ID)?.remove())

  return (
    <div class='flex h-100vh'>
      {/* sidebar */}
      <nav class='w-52 shrink-0 of-y-auto b-r-(1 solid #e5e7eb) p-2 bg-#fafafa flex flex-col gap-1'>
        <h2 class='font-bold text-lg px-2 py-1'>Plugin Demos</h2>

        {/* Theme switcher — custom dropdown for proper color rendering */}
        <div class='px-2 pb-2 b-b-(1 solid #e5e7eb) mb-1 relative'>
          <label class='text-xs c-gray font-medium tracking-wide uppercase block mb-1'>Theme</label>
          <ThemeSelect themes={THEMES} value={theme()} onChange={setTheme} />
        </div>

        {/* Demo list */}
        <For each={demos}>{d => (
          <button
            class={`block w-full text-left px-3 py-1.5 rd-1 text-sm truncate cursor-pointer ${active() === d.name ? 'bg-blue-500 c-white' : 'hover:bg-gray/10'}`}
            onClick={() => setActive(d.name)}
          >
            {d.name}
          </button>
        )}</For>
      </nav>

      {/* main */}
      <main class='flex-1 w-0 p-4 of-auto'>
        <For each={demos}>{d => (
          <Show when={active() === d.name}>
            <div class='flex items-baseline gap-3 mb-1'>
              <h2 class='font-bold text-xl'>{d.name}</h2>
              <span class='text-xs c-gray font-mono'>Theme: {theme()}</span>
            </div>
            <p class='c-gray text-sm mb-3'>{d.desc}</p>
            <d.comp />
          </Show>
        )}</For>
      </main>
    </div>
  )
}

export default DemoApp

