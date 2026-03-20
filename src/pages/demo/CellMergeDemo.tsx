import { createMutable } from 'solid-js/store'
import { range } from 'es-toolkit'
import { Intable } from '../../../packages/intable/src'
import { CellMergePlugin } from '../../../packages/intable/src/plugins/CellMergePlugin'
import { replaceArray } from './helpers'

const cols = createMutable([
  { id: 'group',  name: 'Group',  width: 100, mergeRow: true },
  { id: 'name',   name: 'Name',   width: 120 },
  { id: 'value',  name: 'Value',  width: 100 },
  { id: 'score',  name: 'Score',  width: 100 },
] as any[])

const data = createMutable(
  range(20).map(i => ({
    id: i,
    group: 'G' + Math.floor(i / 4),
    name: 'Item ' + i,
    value: (i * 7) % 100,
    score: (i * 13) % 100,
  })),
)

/**
 * The "Group" column auto-merges consecutive rows with equal values (mergeRow: true).
 * CellMergePlugin is added manually since it's not a default plugin.
 */
export const CellMergeDemo = () => (
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
    plugins={[CellMergePlugin]}
  />
)
