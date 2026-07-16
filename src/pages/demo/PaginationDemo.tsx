import { createSignal } from 'solid-js'
import { Intable } from '../../../packages/intable/src'
import { makeCols, makeData } from './helpers'

const [cols, setCols] = createSignal(makeCols(6))
const [data, setData] = createSignal(makeData(100, 6))

cols()[0].filterable = true

export default () => (
  <Intable
    class='h-70vh'
    columns={cols()}
    onColumnsChange={setCols}
    data={data()}
    onDataChange={setData}
    pagination={{ enable: true, pageSize: 20 }}
    rowSelection={{ enable: true }}
    index
    border
    stickyHeader
    size='small'
  />
)
