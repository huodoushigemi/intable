import { batch, createMemo } from 'solid-js'
import { render } from 'solid-js/web'
import { createMutable, createStore, produce, reconcile } from 'solid-js/store'
import { range } from 'es-toolkit'

import Intable from 'intable'
import { log } from 'intable/utils'
import { VirtualScrollPlugin } from 'intable/plugins/VirtualScrollPlugin'

// import { Intable } from '../packages/intable/src'
// import { log } from '../packages/intable/src/utils'
// import { VirtualScrollPlugin } from '../packages/intable/src/plugins/VirtualScrollPlugin'

const root = document.getElementById('root')!

const state = createMutable({ bool: true })

const cols = createMutable(range(5).map(e => ({ name: 'col_' + e, id: 'col_' + e, width: 80 })))
let data = createMutable(range(100).map((e, i) => Object.fromEntries(cols.map(e => [e.id, i + 1]))))
render(() => <input type='checkbox' checked={state.bool} onChange={(e) => state.bool = e.currentTarget.checked} />, root)
render(() => <button onClick={() => data[0].col_1 = 'xxx'}>xxx</button>, root)

// cols[2].fixed = 'left'
// cols[0].editable = true
cols[0].editor = 'select'
cols[0].enum = { 1: 1, 2: 2, 3: 3 }
// cols[0].render = 'file'
cols.forEach(e => (e.editable = true))

cols.at(-3)!.width = undefined
cols.at(-1)!.width = undefined

data.forEach(e => e.g = e.col_0 % 10)
data.forEach(e => e.n = e.col_0 % 3)

// render(() => (
//   <Menu items={[
//     { label: 'xx' }
//   ]} />
// ), root)

render(() => <Intable
  // class='w-50vw! h-40vh of-auto'
  style='width: 50vw; height: 40vh;'
  index={state.bool}
  stickyHeader={state.bool}
  columns={cols}
  onColumnsChange={o => reconcile(o)(cols)}
  data={data}
  border
  plugins={[
    VirtualScrollPlugin,
    // RowGroupPlugin,
    // HistoryPlugin,
    // DiffPlugin,
  ]}
  onDataChange={v => batch(() => (data.length = 0, data.push(...v)))}
  expand={{ render: ({ data }) => <div class='p-6'>{JSON.stringify(data)}</div> }}
  // rowGroup={{ fields: ['g', 'n'] }}
  // rowGroup={{ fields: ['g'] }}
  diff={{
    onCommit: (...arg) => log(arg)
  }}
  virtual={{
    // x: { enable: false },
    // y: { enable: false },
  }}
  rowSelection={{
    // enable: true,
    // multiple: true,
    // onChange: (selected, unselected) => log(selected, unselected)
  }}
/>, root)
