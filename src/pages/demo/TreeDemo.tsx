import { createMutable } from 'solid-js/store'
import { Intable } from '../../../packages/intable/src'
import { replaceArray } from './helpers'

const cols = createMutable([
  { id: 'name',  name: 'Name',  width: 200 },
  { id: 'size',  name: 'Size',  width: 100 },
  { id: 'type',  name: 'Type',  width: 120 },
])

const data = createMutable([
  { id: 1, name: 'src',    size: '-', type: 'folder', children: [
    { id: 2, name: 'index.ts', size: '2KB',  type: 'file' },
    { id: 3, name: 'utils',    size: '-',    type: 'folder', children: [
      { id: 4, name: 'helper.ts', size: '1KB', type: 'file' },
      { id: 5, name: 'math.ts',   size: '3KB', type: 'file' },
    ]},
    { id: 6, name: 'components', size: '-', type: 'folder', children: [
      { id: 7, name: 'App.tsx',    size: '4KB', type: 'file' },
      { id: 8, name: 'Button.tsx', size: '1KB', type: 'file' },
    ]},
  ]},
  { id: 9, name: 'package.json', size: '1KB', type: 'file' },
  { id: 10, name: 'README.md',    size: '2KB', type: 'file' },
])

/**
 * Tree-structured data with expand/collapse.
 * TreePlugin must be added manually.
 */
export const TreeDemo = () => (
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
    tree={{ children: 'children' }}
    rowKey='id'
  />
)
