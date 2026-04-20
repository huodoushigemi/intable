import { createEffect, createSignal } from 'solid-js'
import { createMutable } from 'solid-js/store'
import { Intable } from '../../../packages/intable/src'
import { replaceArray } from './helpers'
import type { TableColumn, TableStore } from '../../../packages/intable/src'
import { AndOrFields } from '../../../packages/intable/src/components/AndOrFields'

const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales']
const ROLES = ['Engineer', 'Designer', 'Manager', 'Analyst', 'Lead']
const LOCATIONS = ['Beijing', 'Shanghai', 'Shenzhen', 'Hangzhou', 'Remote']
const STATUSES = ['Active', 'Inactive', 'On Leave']
const NAMES = [
  'Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi',
  'Ivan', 'Judy', 'Karl', 'Laura', 'Mallory', 'Niaj', 'Olivia',
  'Peggy', 'Quinn', 'Rupert', 'Sybil', 'Trent',
]

const cols = createMutable<TableColumn[]>([
  { id: 'name',       name: 'Name',       type: 'text',     width: 140, filterable: true },
  { id: 'department', name: 'Department', type: 'enum',     enum: DEPARTMENTS, width: 140, filterable: true },
  { id: 'role',       name: 'Role',       type: 'text',     width: 140, filterable: true },
  { id: 'location',   name: 'Location',   type: 'enum',     enum: LOCATIONS, width: 140, filterable: true },
  { id: 'status',     name: 'Status',     type: 'enum',     enum: STATUSES, width: 120, filterable: true },
  { id: 'age',        name: 'Age',        type: 'number',   width: 100, filterable: true },
  { id: 'score',      name: 'Score',      type: 'number',   width: 110, filterable: true },
  { id: 'joinDate',   name: 'Join Date',  type: 'date',     width: 140, filterable: true },
  { id: 'active',     name: 'Active',     type: 'checkbox', width: 100, filterable: true },
])

const pick = <T,>(arr: T[], i: number) => arr[i % arr.length]
const dateFrom = (offsetDays: number) => {
  const base = new Date('2024-01-01T00:00:00')
  base.setDate(base.getDate() + offsetDays)
  return base.toISOString().slice(0, 10)
}

const data = createMutable(
  Array.from({ length: 30 }, (_, i) => ({
    id: i,
    name: NAMES[i % NAMES.length],
    department: pick(DEPARTMENTS, i * 3),
    role: pick(ROLES, i * 7),
    location: pick(LOCATIONS, i * 5),
    status: pick(STATUSES, i * 2),
    age: 22 + (i % 19),
    score: 60 + ((i * 7) % 41),
    joinDate: dateFrom(i * 9),
    active: i % 3 !== 0,
  }))
)

export default () => {
  const [store, setStore] = createSignal<TableStore>()

  createEffect(() => {
    if (!store()) return
  })

  return (
    <>
      <Intable
        store={setStore}
        class='h-40vh'
        columns={cols}
        onColumnsChange={v => replaceArray(cols, v)}
        data={data}
        onDataChange={v => replaceArray(data, v)}
        index
        border
        stickyHeader
        size='small'
        filter={{
          initialValue: [
            { op: 'or', children: [
              { field: 'name', op: 'contains', value: 'a' },
              { field: 'name', op: 'contains', value: 'e' },
            ] },
            { field: 'department', op: 'eq', value: 'Design' },
          ],
          onChange: v => console.log('Filters changed:', v),
        }}
      />

      <h2 class='font-bold text-xl mt-8 mb-4'>Filters Graphs</h2>

      <div class='flex'>
        <AndOrFields
          class={'pointer-events-none'}
          fields={cols}
          value={{ op: 'and', children: store()?.filter.value }}
        />
        <pre class='of-auto bg-#f0f0f0 p-2'>{store()?.filter.value.map(e => JSON.stringify(e, null, 2)).join('\n')}</pre>
      </div>
    </>
  )
}
