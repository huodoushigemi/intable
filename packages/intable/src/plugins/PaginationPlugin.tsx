import { createEffect, createMemo, createSignal, For, Show, useContext, runWithOwner, mergeProps, untrack } from 'solid-js'
import type { Accessor, Setter } from 'solid-js'
import type { Plugin, TableProps } from '..'
import { Ctx } from '..'
import { useControlled } from '../hooks/useControlled'

declare module '..' {
  interface TableProps {
    pagination?: {
      enable?: boolean
      pageSize?: number
      /** 每页条数下拉选项，默认 [10, 20, 50, 100]。 */
      pageSizeOptions?: number[]
      /** 是否显示每页条数下拉框，默认 true。 */
      showPageSize?: boolean
      defaultValue?: number
      value?: number
      onChange?: (page: number) => void
      /** 用户切换每页条数时触发。 */
      onPageSizeChange?: (pageSize: number) => void
      total?: number
    }
  }
  interface TableStore {
    /** 当前每页条数（未手动切换时为 undefined，回退到 pagination.pageSize）。 */
    _pgnSize?: Accessor<number | undefined>
    _pgnSetSize?: Setter<number | undefined>
  }
}


export const PaginationPlugin: Plugin = {
  name: 'pagination',

  store: (store) => {
    const [size, setSize] = createSignal<number>()
    // 外部 pageSize 变化时同步到内部状态（读取 rawProps，避免和下面的 getter 互相依赖）
    createEffect(() => {
      const v = store.rawProps.pagination?.pageSize
      if (v != null) setSize(prev => prev === v ? prev : v)
    })
    return { _pgnSize: size, _pgnSetSize: setSize }
  },

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

      return mergeProps(ret, {
        get pageSize() { return store._pgnSize?.() ?? pagination!.pageSize! },
        onPageSizeChange(v: number) {
          store._pgnSetSize?.(v)
          pagination!.onPageSizeChange?.(v)
        },
      })
    },
    // todo createMemo()()
    EachRows: ({ EachRows }, { store }) => createMemo(() => !store.props.pagination?.enable)() ? EachRows : (o) => {
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

  const sizeOptions = createMemo(() => {
    const list = p.pageSizeOptions ?? [10, 20, 50, 100]
    const cur = pageSize()
    return list.includes(cur) ? list : [...list, cur].sort((a, b) => a - b)
  })

  const setPage = (v: number) => {
    if (v < 1 || v > totalPage()) return
    store.props.pagination?.onChange?.(v)
  }

  const setPageSize = (v: number) => {
    if (v === pageSize()) return
    p.onPageSizeChange?.(v)
    // 每页条数变化后回到第一页
    if (page() !== 1) store.props.pagination?.onChange?.(1)
  }

  return (
    <div class='data-table__pagination flex items-center justify-end gap-1 py-2 text-sm'>
      <span class='mr-2'>
        共 {p.total} 条
      </span>
      <Show when={p.showPageSize !== false}>
        <select
          class='data-table__pagination-select'
          value={pageSize()}
          disabled={store.props.loading}
          onChange={e => setPageSize(+e.currentTarget.value)}
          aria-label='每页条数'
        >
          <For each={sizeOptions()}>
            {s => <option value={s} selected={s === pageSize()}>{s} 条/页</option>}
          </For>
        </select>
      </Show>
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
