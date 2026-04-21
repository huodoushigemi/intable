import { createSignal } from 'solid-js'
import { Intable } from '../../../packages/intable/src'
import { makeCols, makeData } from './helpers'

const [cols, setCols] = createSignal(makeCols(6))
const [data, setData] = createSignal(makeData(20, 6))

/**
 * Click the chevron on the left to expand a row.
 * The expand render shows JSON of the row data.
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
    expand={{
      enable: true,
      render: ({ data }) => (
        <div class='p-3 bg-gray-50 text-sm'>
          <b>Row Detail:</b>
          <pre class='mt-1'>{JSON.stringify(data, null, 2)}</pre>
        </div>
      ),
    }}
  />
)
