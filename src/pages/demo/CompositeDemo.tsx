import { batch } from 'solid-js'
import { createMutable } from 'solid-js/store'
import { range } from 'es-toolkit'
import { Intable } from '../../../packages/intable/src'
import { VirtualScrollPlugin } from '../../../packages/intable/src/plugins/VirtualScrollPlugin'
import { HistoryPlugin } from '../../../packages/intable/src/plugins/HistoryPlugin'
import { DiffPlugin } from '../../../packages/intable/src/plugins/DiffPlugin'
import { replaceArray } from './helpers'

const cols = createMutable([
  { name: 'Basic Info', children: [
    { id: 'col_0', name: 'Name', width: 100, editable: true },
    { id: 'col_1', name: 'Age',  width: 80,  editable: true, editor: 'number' },
  ]},
  { id: 'col_2', name: 'Status', width: 100, editable: true, editor: 'select', enum: { active: 'Active', inactive: 'Inactive' } },
  { name: 'Details', children: [
    { id: 'col_3', name: 'City',   width: 100, editable: true },
    { id: 'col_4', name: 'Score',  width: 80,  editable: true, editor: 'number' },
  ]},
  ...range(5).map(i => ({ id: 'col_' + (i + 5), name: 'Extra ' + i, width: 80, editable: true })),
] as any[])

const leafColIds = range(10).map(i => 'col_' + i)
const data = createMutable(
  range(200).map((_, i) => ({
    id: i,
    ...Object.fromEntries(leafColIds.map(id => [id, `${id}_${i + 1}`])),
    g: i % 5,
  })),
)

cols.at(-1)!.fixed = 'right'

/**
 * Everything combined: header groups, virtual scroll, editable,
 * expand, row selection, resize, drag, history, diff, index, border.
 */
export const CompositeDemo = () => (
  <div>
    <p class='text-sm c-gray mb-2'>All features enabled. Edit, drag, resize, select, expand, undo/redo, diff.</p>
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
      colDrag
      rowDrag
      resizable={{ col: { enable: true }, row: { enable: true } }}
      expand={{ enable: true, render: ({ data }) => <div class='p-2 c-blue'>{JSON.stringify(data)}</div> }}
      rowSelection={{ enable: true, multiple: true }}
      plugins={[VirtualScrollPlugin, HistoryPlugin, DiffPlugin]}
      diff={{ onCommit: (d) => console.log('commit', d) }}
    />
  </div>
)
