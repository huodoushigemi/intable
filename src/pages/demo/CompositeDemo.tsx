import { z } from 'zod'
import { createSignal } from 'solid-js'
import { range } from 'es-toolkit'
import { Intable, type TableStore } from '../../../packages/intable/src'
import { VirtualScrollPlugin } from '../../../packages/intable/src/plugins/VirtualScrollPlugin'
import { HistoryPlugin } from '../../../packages/intable/src/plugins/HistoryPlugin'
import { DiffPlugin } from '../../../packages/intable/src/plugins/DiffPlugin'
import { ZodValidatorPlugin } from '../../../packages/intable/src/plugins/ZodValidatorPlugin'

const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations']
const positions = {
  Engineering: ['Frontend Dev', 'Backend Dev', 'Fullstack Dev', 'DevOps', 'Tech Lead'],
  Marketing: ['Content Writer', 'SEO Specialist', 'Marketing Manager', 'Designer'],
  Sales: ['Sales Rep', 'Account Manager', 'Sales Director'],
  HR: ['HR Specialist', 'Recruiter', 'HR Manager'],
  Finance: ['Accountant', 'Financial Analyst', 'CFO'],
  Operations: ['Operations Manager', 'Project Manager', 'Coordinator'],
}
const statuses = { active: 'Active', inactive: 'Inactive', on_leave: 'On Leave', terminated: 'Terminated' }
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego']
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen']
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin']

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString().split('T')[0]
}

function randomSalary(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min)
}

const [cols, setCols] = createSignal([
  { id: 'name', name: 'Name', width: 120, editable: true, filterable: true, required: true, zodSchema: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters') },
  { id: 'age', name: 'Age', width: 60, editable: true, type: 'number', filterable: true, required: true, zodSchema: z.coerce.number().min(18, 'Must be at least 18').max(100, 'Must be at most 100') },
  { id: 'department', name: 'Department', width: 120, editable: true, type: 'select', enum: departments, filterable: true, required: true },
  { id: 'position', name: 'Position', width: 130, editable: true, type: 'select', enum: Object.values(positions).flat(), filterable: true, required: true },
  { id: 'status', name: 'Status', width: 100, editable: true, type: 'select', enum: statuses, filterable: true, required: true },
  { id: 'hireDate', name: 'Hire Date', width: 110, editable: true, type: 'date', filterable: true, required: true },
  { id: 'salary', name: 'Salary', width: 100, editable: true, type: 'number', filterable: true, required: true, zodSchema: z.coerce.number().min(30000, 'Must be at least 30,000').max(500000, 'Must be at most 500,000') },
  { id: 'city', name: 'City', width: 110, editable: true, filterable: true, required: true },
  { id: 'email', name: 'Email', width: 180, editable: true, required: true, zodSchema: z.string().email('Invalid email format') },
  { id: 'phone', name: 'Phone', width: 130, editable: true, type: 'tel', required: true, zodSchema: z.string().min(10, 'Phone must be at least 10 characters') },
  { id: 'birthday', name: 'Birthday', width: 110, editable: true, type: 'date' },
  { id: 'rating', name: 'Rating', width: 100, editable: true, type: 'range', editorProps: { min: 1, max: 5, step: 0.5 }, zodSchema: z.coerce.number().min(1, 'Must be at least 1').max(5, 'Must be at most 5') },
  { id: 'active', name: 'Active', width: 70, editable: true, type: 'checkbox', filterable: true },
  { id: 'notes', name: 'Notes', width: 200, editable: true, type: 'textarea', zodSchema: z.string().max(500, 'Notes must be at most 500 characters') },
  { id: 'avatar', name: 'Avatar', width: 80, editable: true, type: 'color' },
  { id: 'file', name: 'File', width: 80, editable: true, type: 'file' },
] as any[])

function generateEmployee(i: number) {
  const dept = randomItem(departments)
  const firstName = randomItem(firstNames)
  const lastName = randomItem(lastNames)
  return {
    id: i,
    name: `${firstName} ${lastName}`,
    age: 22 + Math.floor(Math.random() * 40),
    department: dept,
    position: randomItem(positions[dept]),
    status: randomItem(['active', 'active', 'active', 'inactive', 'on_leave'] as const),
    hireDate: randomDate(new Date(2015, 0, 1), new Date(2024, 11, 31)),
    salary: randomSalary(45000, 180000),
    city: randomItem(cities),
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
    phone: `+1-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    birthday: randomDate(new Date(1970, 0, 1), new Date(2002, 11, 31)),
    rating: Math.round((Math.random() * 4 + 1) * 2) / 2,
    active: Math.random() > 0.2,
    notes: Math.random() > 0.7 ? 'Performance review scheduled' : '',
    avatar: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
  }
}

const [data, setData] = createSignal(range(200).map((_, i) => generateEmployee(i)))

cols()[cols().length - 1].fixed = 'right'

export default () => {
  const rawData = data()
  let store: TableStore
  
  const handleValidate = async () => {
    if (store) {
      try {
        await store.validate()
        alert('Validation passed!')
      } catch (error) {
        console.error('Validation failed:', error)
      }
    }
  }
  
  const handleExportExcel = async () => {
    await store.commands.exportExcel()
  }
  
  const handleImportExcel = async () => {
    const importedData = await store.commands.readExcel()
    if (importedData && importedData.length > 0) {
      console.log('Imported data:', importedData)
      setData(importedData)
    }
  }
  
  return (
    <div class=''>
      <p class='text-sm c-gray mt-4'>All features enabled: header groups, virtual scroll, editable, expand, row selection, resize, drag, history, diff, index, border, filters.</p>
      
      <div class='flex flex-wrap justify-end gap-2 mb-3'>
        <button class='px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5 text-sm' onClick={handleExportExcel}>
          Export Excel
        </button>
        <button class='px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5 text-sm' onClick={handleImportExcel}>
          Import Excel
        </button>
        <button  class='px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5 text-sm' onClick={handleValidate}>
          Validate All
        </button>
      </div>
    
      <Intable
        class='h-[60vh]'
        store={s => store = s}
        columns={cols()}
        onColumnsChange={setCols}
        data={data()}
        onDataChange={setData}
        newRow={i => generateEmployee(data().length)}
        index
        border
        stickyHeader
        size='small'
        colDrag
        rowDrag
        autoFill
        resizable={{ col: { enable: true }, row: { enable: true } }}
        expand={{ enable: true, render: ({ data }) => <div class='p-3 bg-blue-50 rounded'>{JSON.stringify(data)}</div> }}
        rowSelection={{ enable: true, multiple: true }}
        plugins={[VirtualScrollPlugin, HistoryPlugin, DiffPlugin, ZodValidatorPlugin]}
        diff={{ data: rawData, onCommit: (d) => console.log('commit', d) }}
        filter={{ autoMatch: true }}
        validator={(value) => {
          if (String(value ?? '').toLowerCase().includes('invalid')) throw Error('Value must not contain "invalid"')
        }}
      />
    </div>
  )
}
