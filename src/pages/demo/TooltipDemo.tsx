import { Intable } from '../../../packages/intable/src'

const data = [
  { id: 1, name: 'Alice',   dept: 'Engineering', salary: 120000, note: 'Team lead. Joined 2019. Expert in distributed systems and performance tuning.' },
  { id: 2, name: 'Bob',     dept: 'Design',       salary: 95000,  note: 'UI/UX specialist. Designed the current design system from scratch.' },
  { id: 3, name: 'Charlie', dept: 'Engineering', salary: 105000, note: 'Full-stack engineer. Owns the data pipeline and ETL workflows.' },
  { id: 4, name: 'Diana',   dept: 'Product',      salary: 115000, note: 'Product manager. Runs cross-functional sprints.' },
  { id: 5, name: 'Eve',     dept: 'Engineering', salary: 98000,  note: 'Frontend engineer. Core contributor to the component library.' },
  { id: 6, name: 'Frank',   dept: 'Design',       salary: 88000,  note: 'Motion designer & illustrator. Handles brand identity.' },
]

const columns = [
  // No tooltip
  { id: 'name',   name: 'Name',    width: 110 },
  // Fixed-string tooltip
  { id: 'dept',   name: 'Dept',    width: 120, tooltip: 'The team this person belongs to' },
  // Value-as-tooltip (shows cell raw value)
  { id: 'salary', name: 'Salary',  width: 100, tooltip: true },
  // Computed tooltip — full note on hover, cell shows truncated
  { id: 'note', name: 'Notes', width: 180, class: 'truncate', tooltip: ({ value }) => value },
]

export default () => (
  <div class='flex flex-col gap-3'>
    <div class='text-sm text-gray-500 flex flex-col gap-1'>
      <p><strong>Hover over cells</strong> to see tooltips.</p>
      <ul class='list-disc pl-4 text-xs text-gray-400'>
        <li><strong>Dept</strong> — fixed tooltip string per column</li>
        <li><strong>Salary</strong> — cell value shown as tooltip (<code>tooltip: true</code>)</li>
        <li><strong>Notes</strong> — computed from cell value (full text on hover, truncated in cell)</li>
      </ul>
    </div>

    <Intable
      class='h-300px'
      columns={columns as any}
      data={data}
      rowKey='id'
      index
      border
      stickyHeader
    />
  </div>
)
