import { createSignal } from 'solid-js'
import { Intable } from '../../../packages/intable/src'

const columns = [
  { id: 'id',     name: '#',        width: 55,  editable: false },
  { id: 'name',   name: 'Name',     width: 120, editable: true  },
  { id: 'score',  name: 'Score',    width: 80,  editable: true  },
  { id: 'rank',   name: 'Rank',     width: 70,  editable: true  },
  { id: 'date',   name: 'Date',     width: 120, editable: true  },
  { id: 'notes',  name: 'Notes',    width: 160, editable: true  },
]

const baseData = [
  { id: 1, name: 'Alice',   score: 10, rank: 1,  date: '2024-01-01', notes: 'first' },
  { id: 2, name: 'Bob',     score: 20, rank: 2,  date: '2024-01-08', notes: 'second' },
  { id: 3, name: '',        score: 0,  rank: 0,  date: '',           notes: '' },
  { id: 4, name: '',        score: 0,  rank: 0,  date: '',           notes: '' },
  { id: 5, name: '',        score: 0,  rank: 0,  date: '',           notes: '' },
  { id: 6, name: '',        score: 0,  rank: 0,  date: '',           notes: '' },
  { id: 7, name: '',        score: 0,  rank: 0,  date: '',           notes: '' },
  { id: 8, name: '',        score: 0,  rank: 0,  date: '',           notes: '' },
] as any[]

export default () => {
  const [data, setData] = createSignal([...baseData.map(r => ({ ...r }))])

  return (
    <div class='flex flex-col gap-3'>
      <div class='text-sm text-gray-500 flex flex-col gap-1'>
        <p>
          <strong>How to use:</strong> select cells in row 1–2 (e.g. Score or Date), then drag the
          <span class='inline-flex items-center justify-center w-3 h-3 mx-1 rounded-sm border border-indigo-300 bg-indigo-500 relative top-px' />
          fill handle at the bottom-right corner of the blue selection downward to fill cells.
        </p>
        <ul class='list-disc pl-4 text-xs text-gray-400'>
          <li>Numeric cells: continues arithmetic series (10, 20 → 30, 40, 50…)</li>
          <li>Date cells: continues date increments (Jan 1, Jan 8 → Jan 15, Jan 22…)</li>
          <li>Text cells: cycles through source values</li>
        </ul>
      </div>

      <div class='flex gap-2'>
        <button
          class='text-xs px-2 py-1 rd b-(1 solid #d1d5db) bg-white hover:bg-gray-50 cursor-pointer'
          onClick={() => setData([...baseData.map(r => ({ ...r }))])}
        >
          Reset
        </button>
      </div>

      <Intable
        class='h-300px'
        columns={columns}
        data={data()}
        onDataChange={setData}
        autoFill={true}
        rowKey='id'
        index
        border
        stickyHeader
      />
    </div>
  )
}
