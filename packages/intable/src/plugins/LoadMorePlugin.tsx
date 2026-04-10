import { createEffect, Show, type Component } from 'solid-js'
import { createEventListener } from '@solid-primitives/event-listener'
import { delay } from 'es-toolkit'
import type { Plugin, TableProps } from '..'
import { combineProps } from '@solid-primitives/props'

declare module '../index' {
  interface TableProps {
    loadMore?: {
      enable?: boolean
      threshold?: number
      debounce?: number
      loading?: boolean
      hasMore?: boolean
      loadingText?: string
      noMoreText?: string
      onLoadMore?: () => void | Promise<void>
    }
    LoadMore?: Component<TableProps['loadMore']>
  }
  interface TableStore {
    loadMore: {
      pending: boolean
      lastTriggerAt: number
    }
  }
}

function isPromiseLike(v: any): v is Promise<unknown> {
  return !!v && typeof v.then === 'function'
}

const LoadMoreLayer: Component<TableProps['loadMore']> = (props) => {
  const visible = () => !!props.enable && (props.loading || props.hasMore === false)
  const text = () => props.loading
    ? (props.loadingText ?? 'loading...')
    : (props.noMoreText ?? '无更多数据')

  return (
    <Show when={visible()}>
      <div class='data-table__load-more sticky left-0'>{text()}</div>
    </Show>
  )
}

export const LoadMorePlugin: Plugin = {
  name: 'loadMore',
  store: () => ({
    loadMore: {
      pending: false,
      lastTriggerAt: 0,
    },
  }),
  rewriteProps: {
    loadMore: ({ loadMore }, { store }) => ({
      enable: false,
      threshold: 100,
      debounce: 200,
      ...loadMore,
    }),
    LoadMore: ({ LoadMore = LoadMoreLayer }, { store }) => () => {
      return <LoadMore {...store.props.loadMore} />
    },
    Footer: ({ Footer }, { store }) => o => (
      <Footer {...combineProps({ class: 'contents' }, o)}>
        {o.children}
        <store.props.LoadMore />
      </Footer>
    )
  },
  onMount: (store) => {
    const maybeLoadMore = () => {
      const cfg = store.props.loadMore!
      if (!cfg.enable || !cfg.onLoadMore) return
      if (cfg.hasMore === false) return
      if (cfg.loading || store.loadMore.pending) return

      const el = store.scroll_el
      if (!el) return

      const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      const threshold = cfg.threshold!
      if (distanceToBottom > threshold) return

      const now = Date.now()
      const debounce = cfg.debounce!
      if (now - store.loadMore.lastTriggerAt < debounce) return
      store.loadMore.lastTriggerAt = now

      const ret = cfg.onLoadMore()
      if (!isPromiseLike(ret)) return

      store.loadMore.pending = true
      ret.finally(() => {
        store.loadMore.pending = false
        delay(0).then(maybeLoadMore) // In case more content needs to be loaded.
      })
    }

    createEffect(() => {
      const el = store.scroll_el
      const cfg = store.props.loadMore!
      if (!el || !cfg.enable) return

      createEventListener(() => store.scroll_el, 'scroll', maybeLoadMore, { passive: true })

      // Try once when mounted or config changes to handle near-empty content.
      queueMicrotask(maybeLoadMore)
    })
  },
}