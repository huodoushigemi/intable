import { createSignal } from 'solid-js'
import { createMutable } from 'solid-js/store'
import { Intable } from '../../../packages/intable/src'
import { type SortKey } from '../../../packages/intable/src/plugins/SortPlugin'
import type { TableColumn } from '../../../packages/intable/src'

const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales']
const NAMES = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy']

const cols: TableColumn[] = [
  { id: 'name',       name: 'Name',       width: 130, sortable: true },
  { id: 'department', name: 'Department', width: 130, sortable: true },
  { id: 'age',        name: 'Age',        width: 80,  sortable: true },
  { id: 'salary',     name: 'Salary',     width: 100, sortable: true },
  { id: 'joinDate',   name: 'Join Date',  width: 120, sortable: true },
  { id: 'active',     name: 'Active',     width: 80,  sortable: false },
]

const data = createMutable(
  Array.from({ length: 20 }, (_, i) => ({
    id: i,
    name:       NAMES[i % NAMES.length],
    department: DEPARTMENTS[i % DEPARTMENTS.length],
    age:        22 + (i * 3) % 30,
    salary:     60000 + (i * 7777) % 80000,
    joinDate:   new Date(2018 + (i % 6), (i * 3) % 12, (i % 28) + 1).toISOString().slice(0, 10),
    active:     i % 3 !== 0,
  }))
)

export default () => {
  const [sorts, setSorts] = createSignal<SortKey[]>([])
  const [multiple, setMultiple] = createSignal(false)

  return (
    <div class='flex flex-col gap-3'>
      {/* Controls */}
      <div class='flex items-center gap-4 text-sm'>
        <label class='flex items-center gap-1.5 cursor-pointer select-none'>
          <input
            type='checkbox'
            checked={multiple()}
            onChange={e => setMultiple((e.target as HTMLInputElement).checked)}
          />
          Multi-column sort
        </label>

        {sorts().length > 0 && (
          <span class='text-xs text-gray-500 font-mono'>
            Sorted by: {sorts().map(s => `${s.field} ${s.order}`).join(' → ')}
          </span>
        )}
      </div>

      <Intable
        class='h-60vh'
        columns={cols}
        data={data}
        index
        border
        stickyHeader
        size='small'
        sort={{
          multiple: multiple(),
          onChange: setSorts,
        }}
      />
    </div>
  )
}
