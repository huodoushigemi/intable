import { component } from 'undestructure-macros'
import { Intable, type Plugin, type TableColumn, type TableProps } from '..'
import { editors, type Editor } from './EditablePlugin'
import { log, toArr } from '../utils'
import { Tags } from './RenderPlugin/components'
import { createComputed, createResource, createRoot, createSignal, mergeProps, untrack, type Component } from 'solid-js'
import { Dialog } from '../components/Dialog'
import { renders, type Render } from './RenderPlugin'
import { get, set } from 'es-toolkit/compat'
import { createMutable } from 'solid-js/store'

declare module '../index' {
  interface TableProps {

  }
  interface TableColumn {
    /**
     * 外键对象的属性。
     * 会自动将外键对象 组装到当前行数据中，便于在表格中显示外键对象中的其他属性。
     */
    foreignField?: string
  }
  interface TableStore {

  }
}


export const OrmPlugin: Plugin = {
  name: 'orm',
  priority: -Infinity,
  store: (store) => ({
    // 
  }),
  rewriteProps: {
    Table: ({ Table }, { store }) => o => {
      const state = createMutable({})
      createComputed(() => {
        const cols = store.props.columns?.filter(e => (e.type == 'fk' || e.type == 'fks') && e.foreignField)
        if (!cols.length) return
        for (const col of cols) {
          for (const row of store.props.data) {
            if (col.foreignField! in row) continue
            Object.defineProperty(row, col.foreignField!, {
              get: () => get(state, [col.id, row[store.props.rowKey]]),
              set: (v) => untrack(() => set(state, [col.id, row[store.props.rowKey]], v)),
              enumerable: true,
              configurable: true
            })
          }
        }
      })
      return <Table {...o} />
    },
  },
}

const createDialogEditor = (Comp: Component<any>, extra?): Editor => (
  (aaa) => createRoot(destroy => {
    const { eventKey, value, col, ok, cancel, props, onChange } = aaa
    const out = extra?.out ?? (v => v)
    const [v, setV] = createSignal(eventKey || value)
    const El = (<Comp
      value={v()}
      onChange={e => (setV(out(e)), onChange?.(v()), ok())}
      {...extra}
      {...props}
      aaa={aaa}
    />)

    return {
      el: (
        <Dialog title={`选择 ${col.name}`} onCancel={cancel} onOk={ok} class='min-w-[40vw]'>
          {El}
        </Dialog>
      ),
      getValue: v,
      // focus: () => el.focus(),
      destroy,
      dialog: true
    }
  })
)

const ObjTags = component(({ col, data, value, onChange, multiple, ...props }) => {
  const label = () => col.table?.columns?.[0].id
  const key = () => col.table?.rowKey ?? 'id'
  return <Tags value={toArr(value).map(e => ({ label: e[label()], value: e[key()] }))} onChange={v => onChange?.(multiple ? v : v[0])} {...props} />
})

const FKTags: Render = component(({ col, data, value, onChange, multiple, ...props }) => {
  const label = () => col.table?.columns?.[0].id
  const key = () => col.table?.rowKey ?? 'id'
  const [rows] = createResource(() => value, () => fetchDataByKeys(toArr(value).map(e => e && typeof e != 'object' ? e : e[key()]), col.table!), { initialValue: [] })

  // 回填外键对象到当前行中
  createComputed(() => {
    rows()
    untrack(() => set(data, col.foreignField!, multiple ? rows() : rows()[0]))
  })
  return <Tags value={rows().map(e => ({ label: e[label()], value: e[key()] }))} onChange={v => onChange?.(multiple ? v : v[0])} {...props} />
})

const ObjEditor = createDialogEditor(o => {
  const col = mergeProps(() => o.aaa.col) as TableColumn
  const key = () => col.table?.rowKey ?? 'id'
  const multiple = () => col.type == 'objs' || col.type == 'fks'
  const isfk = () => col.type == 'fk' || col.type == 'fks'
  const selected = () => isfk() ? toArr(o.value).map(e => ({ [key()]: e })) : toArr(o.value)
  const change = (e) => o.onChange(isfk() ? multiple() ? e.map(i => i[key()]) : e?.[key()] ?? null : e)

  return (
    <div class=''>
      <div class='flex items-center p-3'>
        <div class='flex items-center gap-2'>
          <span class='text-sm text-gray-500'>已选择 {selected().length} 项</span>
          <button type='button' class='text-xs text-gray-400 hover:text-red-500 transition-colors' onClick={() => o.onChange?.(multiple() ? [] : null)}>清空</button>
        </div>
        
        {
          isfk()
            ? <FKTags {...o} class='ml-2' col={col} value={selected()} onChange={change} multiple={multiple()} />
            : <ObjTags {...o} class='ml-2' col={col} value={selected()} onChange={change} multiple={multiple()} />
        }
      </div>

      <div class='border-t border-gray/20 p-3'>
        <Intable
          {...o.aaa.col.table}
          rowSelection={{ ...o.aaa.col.table?.rowSelection, enable: true, multiple: multiple(), value: o.value, onChange: change }}
        />
      </div>
    </div>
  )
})

editors.obj = ObjEditor
editors.objs = ObjEditor
editors.fk = ObjEditor
editors.fks = ObjEditor
renders.fk = o => <FKTags {...o} disabled />
renders.fks = o => <FKTags {...o} disabled multiple />
renders.obj = o => <ObjTags {...o} disabled />
renders.objs = o => <ObjTags {...o} disabled multiple />

const fetchDataByKeys = (() => {
  const wk = new WeakMap()
  const getCache = (table: TableProps) => {
    const cache = wk.get(table.request) || wk.set(table.request, {}).get(table.request)
    return cache[table.rowKey] ??= [{},{}]
  }
  return async (keys: any[], table: TableProps) => {
    const [cache, pending] = getCache(table)
    const nocacheKeys = keys.filter(e => !cache[e])
    if (nocacheKeys.length) {
      const ks = nocacheKeys.filter(e => !pending[e])
      const prom = table.request?.({
        filters: [{ field: table.rowKey, op: 'in', value: ks }],
      })
      ks.forEach((k, i) => {
        pending[k] = prom
          .then(e => cache[k] = e.data[i])
          .finally(() => delete pending[k])
      })

      await Promise.all(nocacheKeys.map(e => pending[e]))
    }
    return keys.map(e => cache[e])
  }
})()