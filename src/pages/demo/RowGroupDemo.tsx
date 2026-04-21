import { createSignal } from 'solid-js'
import { range } from 'es-toolkit'
import { Intable } from '../../../packages/intable/src'

const [cols, setCols] = createSignal([
  { id: 'name',     name: 'Name',     width: 120 },
  { id: 'category', name: 'Category', width: 120 },
  { id: 'region',   name: 'Region',   width: 120 },
  { id: 'value',    name: 'Value',    width: 100 },
])

const categories = ['Electronics', 'Clothing', 'Food']
const regions = ['East', 'West', 'North', 'South']

const [data, setData] = createSignal(
  range(40).map(i => ({
    id: i,
    name: 'Item ' + i,
    category: categories[i % 3],
    region: regions[i % 4],
    value: Math.round(Math.random() * 1000),
  }))
)

/**
 * Rows are grouped by `category` then `region`.
 * Click group headers to expand/collapse.
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
    rowGroup={{ fields: ['category', 'region'] }}
  />
)
