import { createSignal } from 'solid-js'
import { Intable } from '../../../packages/intable/src'
import { makeCols, makeData } from './helpers'

const [cols, setCols] = createSignal(makeCols(6))
const [data, setData] = createSignal(makeData(20, 6))

/**
 * Drag column header borders to resize columns.
 * Row resize is also enabled — drag row bottom borders.
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
    resizable={{ col: { enable: true }, row: { enable: true } }}
  />
)
