import { createSignal } from 'solid-js'
import { Intable } from '../../../packages/intable/src'
import { makeCols, makeData } from './helpers'

const [cols, setCols] = createSignal(makeCols(6))
const [data, setData] = createSignal(makeData(20, 6))

/**
 * Checkbox column on the left. Click to select, header checkbox for select-all.
 */
export default () => (
  <Intable
    class='h-60vh'
    columns={cols()}
    onColumnsChange={setCols}
    data={data()}
    onDataChange={setData}
    index
    border
    stickyHeader
    size='small'
    rowSelection={{
      enable: true,
      multiple: true,
      onChange: (selected, unselected) => console.log('selected:', selected, 'unselected:', unselected),
    }}
  />
)
