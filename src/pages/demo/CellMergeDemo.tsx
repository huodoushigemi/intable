import { createSignal } from 'solid-js'
import { range } from 'es-toolkit'
import { Intable } from '../../../packages/intable/src'
import { CellMergePlugin } from '../../../packages/intable/src/plugins/CellMergePlugin'

const [cols, setCols] = createSignal([
  { id: 'group',  name: 'Group',  width: 100, mergeRow: true },
  { id: 'name',   name: 'Name',   width: 120 },
  { id: 'value',  name: 'Value',  width: 100 },
  { id: 'score',  name: 'Score',  width: 100 },
] as any[])

const [data, setData] = createSignal(
  range(20).map(i => ({
    id: i,
    group: 'G' + Math.floor(i / 4),
    name: 'Item ' + i,
    value: (i * 7) % 100,
    score: (i * 13) % 100,
  }))
)

/**
 * The "Group" column auto-merges consecutive rows with equal values (mergeRow: true).
 * CellMergePlugin is added manually since it's not a default plugin.
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
    plugins={[CellMergePlugin]}
  />
)
