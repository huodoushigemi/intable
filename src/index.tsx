import { batch, createMemo } from 'solid-js'
import { render } from 'solid-js/web'
import { createMutable, createStore, produce, reconcile } from 'solid-js/store'
import { range } from 'es-toolkit'
import { Table } from './xxx.tsx'

import './index.scss'
import 'virtual:uno.css'
import { log } from './utils.ts'
import { DiffPlugin } from '@/plugins/DiffPlugin.tsx'
import { VirtualScrollPlugin } from './plugins/VirtualScrollPlugin.tsx'

const root = document.getElementById('root')!

const state = createMutable({ bool: true })

const cols = range(30).map(e => ({ name: 'col_' + e, id: 'col_' + e, width: 80 }))
let data = createMutable(range(100).map((e, i) => Object.fromEntries(cols.map(e => [e.id, i + 1]))))
render(() => <input type='checkbox' checked={state.bool} onChange={(e) => state.bool = e.currentTarget.checked} />, root)
render(() => <button onClick={() => data[0].col_1 = 'xxx'}>xxx</button>, root)

// cols[2].fixed = 'left'
// cols[0].editable = true
cols[0].editor = 'select'
cols[0].enum = { 1: 1, 2: 2, 3: 3 }
// cols[0].render = 'file'
cols.forEach(e => (e.editable = true, e.editOnInput = true))

data.forEach(e => e.g = e.col_0 % 10)
data.forEach(e => e.n = e.col_0 % 3)

render(() => <Table
  class='w-50vw! h-80vh of-auto'
  index={state.bool}
  stickyHeader={state.bool}
  columns={cols}
  data={data}
  border
  plugins={[
    DiffPlugin,
    VirtualScrollPlugin,
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
/>, root)
