import { createSignal } from 'solid-js'
import { Intable } from '../../../packages/intable/src'
import { VirtualScrollPlugin } from '../../../packages/intable/src/plugins/VirtualScrollPlugin'
import { makeCols, makeData } from '../demo/helpers'
import { createMutable } from 'solid-js/store'
import { unFn } from 'intable/utils'

const [cols, setCols] = createSignal(makeCols(10, { width: 80 }))
// const [data, setData] = createSignal(makeData(300, 10))
const data = createMutable(makeData(300, 10))
const setData = () => {}

export default () => {
  const [store, setStore] = createSignal<any>()
  const [row, setRow] = createSignal(0)
  const [col, setCol] = createSignal(0)

  return (
    <div class='flex flex-col gap-3'>
      {/* scrollToCell controls */}
      <Intable
        store={setStore}
        class='h-60vh'
        columns={cols()}
        onColumnsChange={setCols}
        data={unFn(data)}
        onDataChange={setData}
        index
        border
        stickyHeader
        size='small'
        // plugins={[VirtualScrollPlugin]}
      />
    </div>
  )
}
