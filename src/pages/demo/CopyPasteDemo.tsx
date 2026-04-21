import { createSignal } from 'solid-js'
import { Intable } from '../../../packages/intable/src'
import { makeCols, makeData } from './helpers'

const [cols, setCols] = createSignal(makeCols(6, { editable: true }))
const [data, setData] = createSignal(makeData(20, 6))

/**
 * Select a cell range then Ctrl+C to copy, Ctrl+V to paste.
 * CopyPaste (ClipboardPlugin) is auto-loaded.
 */
export default () => (
  <div>
    <p class='text-sm c-gray mb-2'>Select cells → Ctrl+C to copy → click target cell → Ctrl+V to paste.</p>
    <Intable
      class='h-50vh'
      columns={cols()}
      onColumnsChange={setCols}
      data={data()}
      onDataChange={setData}
      index
      border
      stickyHeader
      size='small'
    />
  </div>
)
