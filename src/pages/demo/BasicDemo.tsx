import { createSignal } from 'solid-js'
import { Intable } from '../../../packages/intable/src'
import { makeCols, makeData, replaceArray } from './helpers'
import { DiffPlugin } from '../../../packages/intable/src/plugins/DiffPlugin'

const cols = makeCols(6)
const data = makeData(20, 6)

const [xx, setXx] = createSignal([])
setTimeout(() => {
  setXx([])
}, 2000);

export default () => (
  <Intable
    class='w-full h-60vh'
    columns={cols}
    onColumnsChange={v => replaceArray(cols, v)}
    data={data}
    onDataChange={v => replaceArray(data, v)}
    index
    border
    stickyHeader
    size='small'
    plugins={xx()}
    diff={{
      enable: true,
      data: []
    }}
  />
)
