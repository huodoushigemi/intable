import { Intable } from '../../../packages/intable/src'
import { makeCols, makeData, replaceArray } from './helpers'

const cols = makeCols(6)
const data = makeData(20, 6)

/**
 * Checkbox column on the left. Click to select, header checkbox for select-all.
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
    rowSelection={{
      enable: true,
      multiple: true,
      onChange: (selected, unselected) => console.log('selected:', selected, 'unselected:', unselected),
    }}
  />
)
