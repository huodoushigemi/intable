import { createMutable } from 'solid-js/store'
import { range } from 'es-toolkit'
import { Intable } from '../../../packages/intable/src'
import { replaceArray } from './helpers'

const cols = createMutable([
  { id: 'name',     name: 'Name',     width: 120 },
  { id: 'category', name: 'Category', width: 120 },
  { id: 'region',   name: 'Region',   width: 120 },
  { id: 'value',    name: 'Value',    width: 100 },
])

const categories = ['Electronics', 'Clothing', 'Food']
const regions = ['East', 'West', 'North', 'South']

const data = createMutable(
  range(40).map(i => ({
    id: i,
    name: 'Item ' + i,
    category: categories[i % 3],
    region: regions[i % 4],
    value: Math.round(Math.random() * 1000),
  })),
)

/**
 * Rows are grouped by `category` then `region`.
 * Click group headers to expand/collapse.
 */
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
    rowGroup={{ fields: ['category', 'region'] }}
  />
)
