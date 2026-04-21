import { createSignal } from 'solid-js'
import { Intable } from '../../../packages/intable/src'
import { makeCols, makeData } from './helpers'

const [cols, setCols] = createSignal(makeCols(8))
const [data, setData] = createSignal(makeData(30, 8))

/**
 * CellSelection is auto-loaded.
 * Click a cell then drag or shift+click to select a range.
 * Arrow keys to navigate.
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
  />
)
