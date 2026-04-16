import { For, Show, type Component } from 'solid-js'
import { offset } from '@floating-ui/dom'
import { type Plugin, type TableStore } from '..'
import { Popover } from '../components/Popover'

// ─── Module augmentation ─────────────────────────────────────────────────────

declare module '../index' {
  interface TableProps {
    columnVisibility?: {
      /** Column IDs (string or number) to hide on initial render. */
      defaultHidden?: (string | number)[]
      /** Called whenever the hidden column list changes. */
      onChange?: (hiddenIds: string[]) => void
    }
  }
  interface TableStore {
    /** O(1) set of currently hidden column IDs (as strings). Mutate directly. */
    hiddenCols: Record<string, true | undefined>
  }
}

// ─── Layer UI ────────────────────────────────────────────────────────────────

const ColumnVisibilityLayer: Component<TableStore> = (props) => {
  // Use rawProps so hidden columns still appear in the panel
  const allUserCols = () => (props.rawProps.columns ?? []).filter(c => !c[props.internal])
  const isHidden = (id: string) => !!props.hiddenCols[id]
  const notify = () => props.rawProps.columnVisibility?.onChange?.(
    Object.keys(props.hiddenCols).filter(k => !!props.hiddenCols[k])
  )
  const toggle = (id: string) => {
    isHidden(id) ? delete props.hiddenCols[id] : (props.hiddenCols[id] = true)
    notify()
  }
  const allHidden = () => allUserCols().every(c => isHidden(String(c.id)))
  const toggleAll = () => {
    allHidden()
      ? allUserCols().forEach(c => delete props.hiddenCols[String(c.id)])
      : allUserCols().forEach(c => { props.hiddenCols[String(c.id)] = true })
    notify()
  }

  return (
    <div style='position:absolute;top:4px;right:4px;z-index:100;pointer-events:auto'>
      <Popover
        trigger='click'
        placement='bottom-end'
        middleware={[offset({ mainAxis: 4 })]}
        reference={(
          <button
            class='flex items-center justify-center w-6.5 h-6.5 rd-1 shadow-sm b-(1 solid var(--table-b-c)) cursor-pointer bg-[--table-header-bg]'
            title='Column Visibility'
          >
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' class='w-3.5 h-3.5'>
              <path stroke-linecap='round' stroke-linejoin='round' d='M4 6h16M4 12h16M4 18h7' />
            </svg>
          </button>
        )}
        floating={
          <div
            class='rd-1.5 shadow-xl py-1 min-w-44 bg-[--table-header-bg]'
            style='border:1px solid var(--table-b-c);z-index:101'
          >
            {/* Header */}
            <div class='flex items-center justify-between px-3 py-1.5' style='border-bottom:1px solid var(--table-b-c)'>
              <span class='text-xs font-semibold uppercase tracking-wide' style='color:var(--table-c)'>
                Columns
              </span>
              <button class='text-xs cursor-pointer hover:underline c-[--c-primary]' onClick={toggleAll}>
                {allHidden() ? 'Show all' : 'Hide all'}
              </button>
            </div>

            {/* Column list */}
            <div class='max-h-60 of-y-auto'>
              <For each={allUserCols()}>
                {(col) => {
                  return (
                    <label class='flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer select-none hover:bg-[--li-hover-bg]'>
                      <input type='checkbox' class='w-3.5 h-3.5 cursor-pointer' checked={!isHidden(col.id)} onChange={() => toggle(col.id)} />
                      <span class='truncate flex-1'>{col.name ?? col.id}</span>
                      <Show when={isHidden(col.id)}>
                        <span class='text-xs' style='opacity:0.6'>hidden</span>
                      </Show>
                    </label>
                  )
                }}
              </For>
            </div>
          </div>
        }
      />
    </div>
  )
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export const ColumnVisibilityPlugin: Plugin = {
  name: 'column-visibility',

  store: (store) => {
    const hidden: Record<string, true | undefined> = {}
    ;(store.rawProps.columnVisibility?.defaultHidden ?? []).forEach((id) => {
      hidden[String(id)] = true
    })
    return { hiddenCols: hidden }
  },

  rewriteProps: {
    columns: ({ columns }, { store }) =>
      (columns ?? []).filter((col) => !store.hiddenCols[String(col.id)]),
  },

  layers: [ColumnVisibilityLayer as any],
}
