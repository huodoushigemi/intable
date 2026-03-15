import { batch, createComputed, createMemo } from 'solid-js'
import { render } from 'solid-js/web'
import { createMutable, createStore, produce, reconcile } from 'solid-js/store'
import { range } from 'es-toolkit'

// import Intable from 'intable'
// import { log } from 'intable/utils'
// import { VirtualScrollPlugin } from 'intable/plugins/VirtualScrollPlugin'

import { Intable } from '../packages/intable/src'
// import '../packages/intable/src/theme/element-plus.scss'
import { log } from '../packages/intable/src/utils'
import { VirtualScrollPlugin } from '../packages/intable/src/plugins/VirtualScrollPlugin'
import { HistoryPlugin } from '../packages/intable/src/plugins/HistoryPlugin'
import { DiffPlugin } from '../packages/intable/src/plugins/DiffPlugin'
// import 'intable/theme/element-plus.scss'
// import 'intable/dist/theme/element-plus.scss'

const root = document.body.appendChild(document.createElement('div'))

const state = createMutable({ bool: true })

const cols = createMutable([
  { name: '基本信息', children: [
    { id: 'col_0', name: 'col_0', width: 80, editable: true },
    { id: 'col_1', name: 'col_1', width: 80, editable: true },
    { name: '333', width: 80, editable: true },
  ]},
  { name: 'xxx' },
  { name: '详细数据', children: [
    { id: 'col_2', name: 'col_2', width: 80, editable: true },
    { id: 'col_3', name: 'col_3', width: 80, editable: true },
    { id: 'col_4', name: 'col_4', width: 80, editable: true },
  ]},
  ...range(20).map(e => ({ name: 'col_' + (e + 5), id: 'col_' + (e + 5), width: 80, editable: true })),
] as any[])
const leafColIds = range(20).map(e => 'col_' + e)
let data = createMutable(range(500).map((e, i) => Object.fromEntries(leafColIds.map(id => [id, id + '_' + i + 1]))))

// render(() => <input type='checkbox' checked={state.bool} onChange={(e) => state.bool = e.currentTarget.checked} />, root)
// render(() => <button onClick={() => data[0].col_1 = 'xxx'}>xxx</button>, root)

// const cols = [{name:'asd'},{}]
// const data = [{},{},{}]
// const data = [{},{},{}]

// cols[2].fixed = 'left'
// cols[0].editable = true
// cols[0].editor = 'select'
// cols[0].enum = { 1: 1, 2: 2, 3: 3 }
// cols[0].render = 'file'
// cols.forEach(e => (e.editable = true))

// cols.at(-3)!.width = undefined
// cols.at(-1)!.width = undefined

cols.unshift({ name: 'qwe' })

cols[0].fixed = 'left'
cols.at(-2)!.fixed = 'right'
cols.at(-1)!.fixed = 'right'

data.forEach(e => e.g = e.col_0 % 10)
data.forEach(e => e.n = e.col_0 % 3)

// render(() => (
//   <Menu items={[
//     { label: 'xx' }
//   ]} />
// ), root)

render(() => <Intable
  class='w-50vw! h-40vh m-10'
  // class='m-10'
  // style='width: 50vw; height: 40vh;'
  rowDrag
  colDrag
  size='small'
  index={state.bool}
  stickyHeader={state.bool}
  columns={cols}
  onColumnsChange={v => batch(() => (cols.length = 0, cols.push(...v)))}
  data={data}
  onDataChange={v => batch(() => (data.length = 0, data.push(...v)))}
  border
  resizable={{ row: { enable: true } }}
  plugins={[
    VirtualScrollPlugin,
    // HistoryPlugin,
    // DiffPlugin,
  ]}
  expand={{ enable: true, render: ({ data }) => <div class='p-2 c-red'>{JSON.stringify(data)}</div> }}
  // rowGroup={{ fields: ['g', 'n'] }}
  // rowGroup={{ fields: ['g'] }}
  diff={{
    onCommit: (...arg) => log(arg)
  }}
  virtual={{
    // x: { enable: true, overscan: 0 },
    // y: { enable: false },
  }}
  rowSelection={{
    // enable: true,
    // multiple: true,
    // onChange: (selected, unselected) => log(selected, unselected)
  }}
/>, root)
