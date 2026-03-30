import { Intable } from '../../../packages/intable/src'
import { DiffPlugin } from '../../../packages/intable/src/plugins/DiffPlugin'
import { makeCols, makeData, replaceArray } from './helpers'

const cols = makeCols(5, { editable: true })
const data = makeData(15, 5)

const diffData = [...data]
diffData.splice(1, 1, { col_0: 'xxx', col_1: '123' })

/**
 * Edit cells — changed cells are highlighted.
 * Right-click → add/delete rows shows added/removed highlights.
 * Press Ctrl+S to commit & clear highlights.
 */
export default () => (
  <div>
    <p class='text-sm c-gray mb-2'>Edit cells to see change highlights. Ctrl+S to commit.</p>
    <Intable
      class='w-full h-50vh'
      columns={cols}
      onColumnsChange={v => replaceArray(cols, v)}
      data={data}
      onDataChange={v => replaceArray(data, v)}
      index
      border
      stickyHeader
      size='small'
      plugins={[DiffPlugin]}
      diff={{
        enable: true,
        data: diffData
      }}
    />
  </div>
)
