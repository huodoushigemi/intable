import { createSignal } from 'solid-js'
import { Intable } from '../../../packages/intable/src'
import { VirtualScrollPlugin } from '../../../packages/intable/src/plugins/VirtualScrollPlugin'
import { makeCols, makeData } from '../demo/helpers'
import { createMutable } from 'solid-js/store'
import { unFn } from 'intable/utils'
import { cols, data } from './data'

export default () => {
  const [store, setStore] = createSignal<any>()

  return (
    <div class='flex flex-col gap-3'>
      {/* scrollToCell controls */}
      <Intable
        store={setStore}
        class='h-60vh'
        columns={cols}
        data={data}
        // index
        border
        stickyHeader
        size='small'
        // cpu
        // plugins={[VirtualScrollPlugin]}
      />
    </div>
  )
}
