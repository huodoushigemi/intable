import { createMemo, createSignal } from 'solid-js'
import { createMutable } from 'solid-js/store'
import { Intable } from '../../../packages/intable/src'
import type { TableColumn } from '../../../packages/intable/src'
import { LoadMorePlugin } from '../../../packages/intable/src/plugins/LoadMorePlugin'
import { replaceArray } from './helpers'

const cols = createMutable<TableColumn[]>([
  { id: 'col_0', name: 'Name', width: 140 },
  { id: 'col_1', name: 'Team', width: 120 },
  { id: 'col_2', name: 'Role', width: 140 },
  { id: 'col_3', name: 'City', width: 120 },
  { id: 'col_4', name: 'Level', width: 100 },
])

const NAMES = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi']
const TEAMS = ['Core', 'Infra', 'Design', 'QA', 'Data']
const ROLES = ['Engineer', 'Manager', 'Analyst', 'Designer']
const CITIES = ['Beijing', 'Shanghai', 'Shenzhen', 'Hangzhou', 'Remote']

function buildRow(i: number) {
  return {
    id: i,
    col_0: `${NAMES[i % NAMES.length]} #${i + 1}`,
    col_1: TEAMS[i % TEAMS.length],
    col_2: ROLES[i % ROLES.length],
    col_3: CITIES[i % CITIES.length],
    col_4: `L${1 + (i % 6)}`,
  }
}

const total = 120
const pageSize = 20

const data = createMutable(Array.from({ length: pageSize }, (_, i) => buildRow(i)))

export default () => {
  const [loading, setLoading] = createSignal(false)
  const hasMore = createMemo(() => data.length < total)

  const loadMore = async () => {
    if (loading() || !hasMore()) return
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 400))
    const start = data.length
    const end = Math.min(start + pageSize, total)
    data.push(...Array.from({ length: end - start }, (_, i) => buildRow(start + i)))
    setLoading(false)
  }

  return (
    <div class='space-y-2'>
      <div class='text-sm c-gray'>
        Rows: {data.length} / {total} {loading() ? '(loading...)' : ''}
      </div>
      <Intable
        class='w-full h-60vh'
        columns={cols}
        onColumnsChange={v => replaceArray(cols, v)}
        data={data}
        index
        border
        stickyHeader
        size='small'
        loadMore={{
          enable: true,
          threshold: 32,
          loading: loading(),
          hasMore: hasMore(),
          loadingText: 'loading...',
          noMoreText: '无更多数据',
          onLoadMore: loadMore,
        }}
        plugins={[LoadMorePlugin]}
      />
    </div>
  )
}
