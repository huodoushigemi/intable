import { Intable } from '../../../packages/intable/src'
import { makeCols, makeData, replaceArray } from './helpers'

const cols = makeCols(6)
const data = makeData(20, 6)

/**
 * Click the chevron on the left to expand a row.
 * The expand render shows JSON of the row data.
 */
export default () => (
  <Intable
    class='h-60vh'
    columns={cols}
    onColumnsChange={v => replaceArray(cols, v)}
    data={data}
    onDataChange={v => replaceArray(data, v)}
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
