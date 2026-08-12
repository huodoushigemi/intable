import { component } from 'undestructure-macros'
import { Intable, Ctx, type Plugin, type TableColumn, type TableProps } from '..'
import { editors, type Editor } from './EditablePlugin'
import { isEmpty, log, toArr, unFn } from '../utils'
import { Tags } from './RenderPlugin/components'
import { createComputed, createResource, createRoot, createSignal, mergeProps, untrack, useContext, type Component } from 'solid-js'
import { Dialog } from '../components/Dialog'
import { renders, type Render } from './RenderPlugin'
import { get, set } from 'es-toolkit/compat'
import { createMutable } from 'solid-js/store'
import { Select } from '../components/Select'
import type { AndOrNode } from '../components/AndOr'
import { solidComponent } from '../components/utils'

declare module '../index' {
  interface TableProps {

  }
  interface TableColumn {
    table?: TableProps | ((p: { data: any }) => TableProps)
    /**
     * 外键对象的属性。
     * 会自动将外键对象 组装到当前行数据中，便于在表格中显示外键对象中的其他属性。
     */
    foreignField?: string
    dialog?: boolean
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

const createEditor = (Comp: Component<any>): Editor => (
  (aaa) => createRoot(destroy => {
    const { eventKey, value, col, ok, cancel, props, onChange } = aaa
    const [v, setV] = createSignal(value)
    let el

    setTimeout(() => {
      el?.showPicker?.()
    }, 0);
    
    return {
      el: (<Comp
        ref={e => (el = e)}
        value={v()}
        onChange={e => (setV(e), onChange?.(v()), !Array.isArray(v()) && ok())}
        {...props}
        aaa={aaa}
      />),
      getValue: v,
      destroy,
      dialog: col.dialog
    }
  })
)

const ObjTags = component(({ col, data, value, onChange, multiple, ...props }) => {
  const table = () => unFn(col.table, { data })
  const label = () => table()?.columns?.[0].id
  const key = () => table()?.rowKey ?? 'id'
  return <Tags value={toArr(value).map(e => ({ label: e[label()], value: e[key()] }))} onChange={v => onChange?.(multiple ? v : v[0])} color='' {...props} />
})

const FKTags: Render = component(({ col, data, value, onChange, multiple, ...props }) => {
  const table = () => unFn(col.table, { data })
  const label = () => table()?.columns?.[0].id
  const key = () => table()?.rowKey ?? 'id'
  const [rows] = createResource(() => value, () => fetchDataByKeys(toArr(value).map(e => e && typeof e != 'object' ? e : e[key()]), table()!), { initialValue: [] })

  // 回填外键对象到当前行中
  createComputed(() => {
    rows()
    untrack(() => set(data, col.foreignField!, multiple ? rows() : rows()[0]))
  })
  return <Tags value={rows().map(e => ({ label: e[label()], value: e[key()] }))} onChange={v => onChange?.(multiple ? v : v[0])} color='' {...props} />
})

const ObjEditor = createEditor(o => {
  const col = mergeProps(() => o.aaa.col) as TableColumn
  const table = () => unFn(col.table, { data: o.aaa.data })
  const key = () => table()?.rowKey ?? 'id'
  const multiple = () => col.type == 'objs' || col.type == 'fks'
  const isfk = () => col.type == 'fk' || col.type == 'fks'
  const selected = () => isfk() ? toArr(o.value).map(e => ({ [key()]: e })) : toArr(o.value)
  const change = (e) => o.onChange(isfk() ? multiple() ? e.map(i => i[key()]) : e?.[key()] ?? null : e)

  return (
    <>{
      col.dialog ? 
        <Dialog title={`选择 ${col.name}`} onCancel={o.aaa.cancel} onOk={o.aaa.ok} class='min-w-[40vw]'>
          <div class=''>
            <div class='flex items-center p-3'>
              <div class='flex items-center gap-2'>
                <span class='text-sm text-gray-500'>已选择 {selected().length} 项</span>
                <button type='button' class='text-xs text-gray-400 hover:text-red-500 transition-colors' onClick={() => o.onChange?.(multiple() ? [] : null)}>清空</button>
              </div>
              
              {
                isfk()
                  ? <FKTags {...o} class='ml-2' col={col} data={o.aaa.data} value={selected()} onChange={change} multiple={multiple()} />
                  : <ObjTags {...o} class='ml-2' col={col} data={o.aaa.data} value={selected()} onChange={change} multiple={multiple()} />
              }
            </div>

            <div class='border-t border-gray/20 p-3'>
              <Intable
                renderer={useContext(Ctx).props.renderer}
                {...table()}
                class='max-h-[65vh]'
                rowSelection={{ ...table()?.rowSelection, enable: true, multiple: multiple(), value: selected(), onChange: change }}
              />
            </div>
          </div>
        </Dialog>
      : <TableSelect
          {...o}
          table={table()}
          valueObject={!isfk()}
          class='min-h-full outline-1.5 outline-offset--1.5 outline-[--c-primary] bg-[--table-bg] py-1'
          border={false}
          multiple={multiple()}
        />
    }</>
  )
})

export const TableSelect = (o: { value: any, valueObject?, onChange?: (value: any) => void, table: TableProps, [key: string]: any }) => {
  const key = () => o.table?.rowKey ?? 'id'
  const multiple = () => o.multiple
  const isfk = () => !o.valueObject
  const ks = () => isfk() ? toArr(o.value) : toArr(o.value).map(e => e[key()])
  const [rows] = createResource(ks, () => fetchDataByKeys(ks(), o.table!), { initialValue: [] })
  return (
    <Select
      {...o}
      searchable
      options={rows().map(e => ({ label: e[o.table?.columns?.[0].id], value: isfk() ? e[key()] : e }))}
      request={async ({ keyword }) => {
        const filters = [] as AndOrNode[]
        if (keyword) filters.push({ field: o.table?.columns?.[0].id, op: 'like', value: keyword })
        if (o.table?.filter) filters.push(...o.table.filter.value ?? o.table.filter.initialValue ?? o.table.filter.defaultValue ?? [])
        return o.table?.request?.({ filters })
          .then(e => e.data.map(e => ({ label: e[o.table?.columns?.[0].id], value: isfk() ? e[key()] : e }))) ?? []
      }}
      valueKey={isfk() ? undefined : key()}
      value={o.value}
      onChange={(e) => o.onChange?.(e)}
      multiple={multiple()}
    />
  )
}

editors.obj = ObjEditor
editors.objs = ObjEditor
editors.fk = ObjEditor
editors.fks = ObjEditor
renders.fk = solidComponent(o => <FKTags {...o} disabled />)
renders.fks = solidComponent(o => <FKTags {...o} disabled multiple />)
renders.obj = solidComponent(o => <ObjTags {...o} disabled />)
renders.objs = solidComponent(o => <ObjTags {...o} disabled multiple />)

export const fetchDataByKeys = (() => {
  const wk = new WeakMap()
  const getCache = (table: TableProps) => {
    const cache = wk.get(table.request!) || wk.set(table.request!, {}).get(table.request!)
    return cache[table.rowKey] ??= [{},{}]
  }
  return async (keys: any[], table: TableProps) => {
    if (!table.request) return []
    keys = keys.filter(e => !isEmpty(e))
    if (!keys.length) return []
    const [cache, pending] = getCache(table)
    const nocacheKeys = keys.filter(e => !cache[e])
    const nopendingKs = nocacheKeys.filter(e => !pending[e])
    if (nopendingKs.length) {
      const prom = table.request({
        filters: [{ field: table.rowKey, op: 'in', value: nopendingKs }],
      })
      nopendingKs.forEach((k, i) => {
        pending[k] = prom
          .then(e => cache[k] = e.data[i])
          .finally(() => delete pending[k])
      })
    }
    await Promise.all(keys.map(e => pending[e]))
    return keys.map(e => cache[e])
  }
})()