import { createSignal } from 'solid-js'
import { createMutable } from 'solid-js/store'
import { Intable } from '../../../packages/intable/src'
import { ColumnVisibilityPlugin } from '../../../packages/intable/src/plugins/ColumnVisibilityPlugin'

const columns = [
  { id: 'name',       name: 'Name',       width: 130 },
  { id: 'department', name: 'Department', width: 130 },
  { id: 'role',       name: 'Role',       width: 140 },
  { id: 'age',        name: 'Age',        width: 70  },
  { id: 'salary',     name: 'Salary',     width: 100 },
  { id: 'city',       name: 'City',       width: 110 },
  { id: 'email',      name: 'Email',      width: 200 },
  { id: 'joinDate',   name: 'Join Date',  width: 110 },
]

const data = createMutable([
  { id: 1, name: 'Alice',   department: 'Engineering', role: 'Frontend Dev',  age: 28, salary: 90000,  city: 'New York',    email: 'alice@example.com',  joinDate: '2021-03-15' },
  { id: 2, name: 'Bob',     department: 'Marketing',   role: 'SEO Specialist',age: 34, salary: 72000,  city: 'Chicago',     email: 'bob@example.com',    joinDate: '2019-07-01' },
  { id: 3, name: 'Carol',   department: 'Engineering', role: 'Backend Dev',   age: 31, salary: 105000, city: 'San Francisco',email: 'carol@example.com', joinDate: '2020-11-22' },
  { id: 4, name: 'Dave',    department: 'Sales',       role: 'Account Manager',age:40, salary: 68000,  city: 'Houston',     email: 'dave@example.com',   joinDate: '2018-02-14' },
  { id: 5, name: 'Eve',     department: 'HR',          role: 'HR Manager',    age: 37, salary: 79000,  city: 'Boston',      email: 'eve@example.com',    joinDate: '2022-06-30' },
  { id: 6, name: 'Frank',   department: 'Finance',     role: 'Accountant',    age: 29, salary: 83000,  city: 'Seattle',     email: 'frank@example.com',  joinDate: '2023-01-10' },
])

export default () => {
  const [hidden, setHidden] = createSignal<string[]>([])

  return (
    <div class='flex flex-col gap-3'>
      <p class='text-sm text-gray-500'>
        Click the <kbd class='px-1 py-0.5 rd-1 bg-gray-100 b-(1 solid #d1d5db) text-xs font-mono'>☰</kbd> icon in the top-right
        corner of the table to toggle column visibility.
      </p>

      <div class='text-xs text-gray-400 min-h-5'>
        {hidden().length > 0
          ? `Hidden: ${hidden().map(id => columns.find(c => String(c.id) === id)?.name ?? id).join(', ')}`
          : 'All columns visible'}
      </div>

      <Intable
        class='h-280px'
        columns={columns}
        data={data}
        rowKey='id'
        index
        border
        stickyHeader
        plugins={[ColumnVisibilityPlugin]}
        columnVisibility={{
          defaultHidden: ['email'],
          onChange: setHidden,
        }}
      />
    </div>
  )
}
