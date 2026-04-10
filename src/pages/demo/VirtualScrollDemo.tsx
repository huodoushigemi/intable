import { createSignal } from 'solid-js'
import { Intable } from '../../../packages/intable/src'
import { VirtualScrollPlugin } from '../../../packages/intable/src/plugins/VirtualScrollPlugin'
import { makeCols, makeData, replaceArray } from './helpers'

const cols = makeCols(100, { width: 80 })
const data = makeData(1000, 100)

export default () => {
  const [store, setStore] = createSignal<any>()
  const [row, setRow] = createSignal(0)
  const [col, setCol] = createSignal(0)

  return (
    <div class='flex flex-col gap-3'>
      {/* scrollToCell controls */}
      <div class='flex items-center gap-2 flex-wrap'>
        <label class='text-sm'>行</label>
        <input
          type='number' min={0} max={data.length - 1}
          value={row()}
          onInput={e => setRow(Number((e.target as HTMLInputElement).value))}
          class='w-20 border rounded px-2 py-1 text-sm'
        />
        <label class='text-sm'>列</label>
        <input
          type='number' min={0} max={cols.length - 1}
          value={col()}
          onInput={e => setCol(Number((e.target as HTMLInputElement).value))}
          class='w-20 border rounded px-2 py-1 text-sm'
        />
        <button
          class='px-3 py-1 text-sm bg-indigo-600 text-white rounded cursor-pointer hover:bg-indigo-500 transition-colors'
          onClick={() => store()?.scrollToCell(col(), row())}
        >
          scrollToCell
        </button>
      </div>

      <Intable
        store={setStore}
        class='h-60vh'
        columns={cols}
        onColumnsChange={v => replaceArray(cols, v)}
        data={data}
        onDataChange={v => replaceArray(data, v)}
        index
        border
        stickyHeader
        size='small'
        plugins={[VirtualScrollPlugin]}
      />
    </div>
  )
}
