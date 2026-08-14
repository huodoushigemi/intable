import { createResource, runWithOwner, untrack, type Setter } from 'solid-js'
import { createAsyncMemo, createDebouncedMemo } from '@solid-primitives/memo'
import { type Plugin } from '..'
import type { AndOrNode } from '../components/AndOr'
import type { SortKey } from './SortPlugin'

declare module '..' {
  interface TableProps {
    request?: (params: {
      page?: number
      pageSize?: number
      filters?: AndOrNode[]
      sorts?: SortKey[]
    }) => Promise<{ data: any[]; total: number }>
  }
  interface TableColumn {}
  interface TableStore {
    request?: {
      data: { data: any[]; total: number }
      loading: boolean
      error: any
      mutate: Setter<any>
      refresh: () => void
    }
  }
}

export const RequestPlugin: Plugin = {
  name: 'request',
  priority: -Infinity,
  store: (store) => ({
    
  }),
  rewriteProps: {
    request: ({ request }, { store }) => {
      if (!request) {
        untrack(() => store.request = undefined)
        return request
      }
      untrack(() => {
        const request = runWithOwner(store.owner, () => createResource(
          createDebouncedMemo(createAsyncMemo(async () => JSON.stringify({ filters: store.props.filter?.value, sorts: store.props.sort?.value, page: store.props.pagination?.value, pageSize: store.props.pagination?.pageSize })), 300),
          (params) => store.props.request!(JSON.parse(params)),
          { initialValue: { data: [], total: 0 } }
        ))!
        store.request = {
          get data() { return request[0]() },
          get loading() { return request[0].loading ?? false },
          get error() { return request[0].error },
          get mutate() { return request[1].mutate },
          get refresh() { return request[1].refetch },
        }
      })
      return request
    },
    data: ({ data = [] }, { store }) => (
      store.request
        ? store.request.data?.data ?? []
        : data
    ),
    loading: ({ loading }, { store }) => (
      store.request
        ? loading || store.request.loading
        : loading
    ),
    pagination: ({ pagination }, { store }) => {
      return {
        ...pagination,
        total: store.request ? store.request.data.total : pagination?.total,
      }
    },
  }
}