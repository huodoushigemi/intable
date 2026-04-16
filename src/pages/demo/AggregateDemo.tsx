import { createMutable } from 'solid-js/store'
import { Intable, type TableColumn } from '../../../packages/intable/src'

const columns: TableColumn[] = [
  { id: 'name',    name: 'Name',       width: 140 },
  { id: 'dept',    name: 'Dept',       width: 110 },
  { id: 'age',     name: 'Age',        width: 70,  aggregate: 'avg'   },
  { id: 'salary',  name: 'Salary',     width: 100, aggregate: 'sum'   },
  { id: 'bonus',   name: 'Bonus',      width: 90,  aggregate: 'avg'   },
  { id: 'sales',   name: 'Sales',      width: 90,  aggregate: 'max'   },
  { id: 'score',   name: 'Score',      width: 80,  aggregate: 'min'   },
  { id: 'active',  name: 'Active',     width: 70,  aggregate: 'count' },
  { id: 'joined',  name: 'Joined',     width: 110 },
]

const data = createMutable([
  { id: 1, name: 'Alice',  dept: 'Eng',     age: 28, salary: 90000, bonus: 9000,  sales: 420000, score: 92, active: true,  joined: '2021-03-15' },
  { id: 2, name: 'Bob',    dept: 'Mkt',     age: 34, salary: 72000, bonus: 5400,  sales: 310000, score: 78, active: true,  joined: '2019-07-01' },
  { id: 3, name: 'Carol',  dept: 'Eng',     age: 31, salary: 105000,bonus: 15750, sales: 580000, score: 95, active: true,  joined: '2020-11-22' },
  { id: 4, name: 'Dave',   dept: 'Sales',   age: 40, salary: 68000, bonus: 6800,  sales: 890000, score: 88, active: false, joined: '2018-02-14' },
  { id: 5, name: 'Eve',    dept: 'HR',      age: 37, salary: 79000, bonus: 4740,  sales: 0,      score: 81, active: true,  joined: '2022-06-30' },
  { id: 6, name: 'Frank',  dept: 'Finance', age: 29, salary: 83000, bonus: 8300,  sales: 120000, score: 74, active: true,  joined: '2023-01-10' },
  { id: 7, name: 'Grace',  dept: 'Eng',     age: 26, salary: 95000, bonus: 9500,  sales: 0,      score: 90, active: true,  joined: '2024-02-28' },
  { id: 8, name: 'Heidi',  dept: 'Sales',   age: 44, salary: 74000, bonus: 11100, sales: 740000, score: 86, active: true,  joined: '2017-08-05' },
] as any[])

export default () => (
  <div class='flex flex-col gap-3'>
    <p class='text-sm text-gray-500'>
      Columns with <code class='px-1 bg-gray-100 rd text-xs'>aggregate</code> show a computed
      summary in the <strong>tfoot</strong> row: avg, sum, max, min, count.
    </p>

    <Intable
      class='h-300px'
      columns={columns}
      data={data}
      rowKey='id'
      index
      border
      stickyHeader
      aggregate={{
        label: 'Σ',
        formatter: (val, type) =>
          type === 'sum'
            ? `$${Number(val).toLocaleString()}`
            : type === 'avg'
              ? Number(val).toFixed(1)
              : val,
      }}
    />
  </div>
)
