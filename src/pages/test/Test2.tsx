import { createSignal, For } from 'solid-js'
import { Intable } from '../../../packages/intable/src'
import { VirtualScrollPlugin } from '../../../packages/intable/src/plugins/VirtualScrollPlugin'
import { makeCols, makeData } from '../demo/helpers'
import { createMutable } from 'solid-js/store'
import { TestTable } from '../../../packages/intable/src/test'

const [cols, setCols] = createSignal(makeCols(10, { width: 80 }))
const [data, setData] = createSignal(makeData(300, 10))

createMutable({})

export default () => {
  const [store, setStore] = createSignal<any>()
  const [row, setRow] = createSignal(0)
  const [col, setCol] = createSignal(0)

  return (
    <div class='flex flex-col gap-3'>
      <TestTable columns={cols()} data={data()} />
    </div>
  )
}
