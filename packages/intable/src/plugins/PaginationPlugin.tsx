import { createMemo, For, Show, useContext, runWithOwner, mergeProps, untrack } from 'solid-js'
import type { Plugin, TableProps } from '..'
import { Ctx } from '..'
import { useControlled } from '../hooks/useControlled'

declare module '..' {
  interface TableProps {
    pagination?: {
      enable?: boolean
      pageSize?: number
      defaultValue?: number
      value?: number
      onChange?: (page: number) => void
      total?: number
    }
  }
  interface TableStore {
    
  }
}


export const PaginationPlugin: Plugin = {
  name: 'pagination',

  rewriteProps: {
    pagination: ({ pagination }, { store }) => {
      pagination = mergeProps({
        enable: false,
        pageSize: 20,
        defaultValue: 1,
        total: store.props.data.length,
      } as TableProps['pagination'], pagination)

      const ret = untrack(() => store._pgn ??= runWithOwner(store.owner, () => useControlled(pagination!)))
      store._pgn.$setOpt(pagination)

      return ret
    },
    EachRows: ({ EachRows }, { store }) => !store.props.pagination?.enable ? EachRows : (o) => {
      const p = mergeProps(() => store.props.pagination!)
      // Server-side request mode: parent already sliced data
      if (store.props.request) return <EachRows {...o} />
      // Client-side: slice at row level
      const start = () => (p.value! - 1) * p.pageSize!
      const sliced = () => o.each.slice(start(), start() + p.pageSize!)
      return <EachRows each={sliced()}>{(e, i) => o.children(e, () => start() + i())}</EachRows>
    },
    Footer: ({ Footer }, { store }) => (o) => (
      <Footer {...o}>
        {o.children}
        <Show when={store.props.pagination?.enable}>
          <PaginationFooter />
        </Show>
      </Footer>
    ),
  },
}

function PaginationFooter() {
  const { store } = useContext(Ctx)
  const p = mergeProps(() => store.props.pagination as Exclude<TableProps['pagination'], undefined>)
  const page = () => p.value!
  const pageSize = () => p.pageSize!
  const totalPage = () => Math.ceil(p.total! / pageSize())
  const pages = createMemo(() => pageNumbers(page(), totalPage()))

  const setPage = (v: number) => {
    if (v < 1 || v > totalPage()) return
    store.props.pagination?.onChange?.(v)
  }

  return (
    <div class='data-table__pagination flex items-center justify-end gap-1 py-2 text-sm'>
      <span class='mr-2'>
        共 {p.total} 条
      </span>
      <button
        class='data-table__pagination-btn disabled:op-30'
        disabled={page() <= 1 || store.props.loading}
        onClick={() => setPage(page() - 1)}
      >
        ‹
      </button>
      <For each={pages()}>
        {item => {
          const isActive = () => item === page()
          if (item === '...') return <span class='px-1 select-none'>…</span>
          return (
            <button
              class={`data-table__pagination-btn ${isActive() ? 'is-active' : ''}`}
              disabled={store.props.loading}
              onClick={() => setPage(item)}
            >
              {item}
            </button>
          )
        }}
      </For>
      <button
        class='data-table__pagination-btn disabled:op-30'
        disabled={page() >= totalPage() || store.props.loading}
        onClick={() => setPage(page() + 1)}
      >
        ›
      </button>
    </div>
  )
}

/** Generate page number list with ellipsis. */
function pageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 1) return []
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const ret: (number | '...')[] = [1]
  if (current > 4) ret.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) ret.push(i)
  if (current < total - 3) ret.push('...')
  ret.push(total)
  return ret
}
