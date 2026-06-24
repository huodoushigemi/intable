import { Portal } from "solid-js/web"
import Intable from "../../../packages/intable/src"
import { editors, type Editor } from "../../../packages/intable/src/plugins/EditablePlugin"
import { renders } from "../../../packages/intable/src/plugins/RenderPlugin"
import { toArr } from "intable/utils"
import { createRoot, createSignal, type Component } from "solid-js"

const tables = {}

tables.user = (props = {}) => {
  return <Intable
    {...props.tableProps}
    columns={[
      { id: 'name', name: '名称', editable: true, filterable: true, },
      { id: 'email', name: '邮件', editable: true, filterable: true, },
      { id: 'roles', name: '角色', type: 'rel:role', filterable: true, editable: true, editorProps: { multiple: true } },
    ]}
    data={[
      { id: 1, name: 'asd', email: 'asd@qq.com', roles: [{ id: 1, name: 'admin' }] },
      { id: 2, name: 'xxx', email: 'xxx@qq.com', roles: [{ id: 2, name: 'plain' }] },
    ]}
    rowKey='id'
  />
}

tables.role = (props = {}) => {
  return <Intable
    {...props.tableProps}
    rowSelection={props.rowSelection}
    filter={props.filter}
    columns={[
      { id: 'name', name: '名称', editable: true, filterable: true, },
      { id: 'desc', name: '描述', editable: true, filterable: true, },
      { id: 'user', name: '用户', type: 'rel:user', filterable: true, editable: true, editorProps: { multiple: true } },
    ]}
    data={[
      { id: 1, name: 'admin' },
      { id: 2, name: 'plain' },
    ]}
    rowKey='id'
  />
}

const createEditor = (Comp: Component<any>, extra?): Editor => (
  ({ eventKey, value, col, ok, cancel, props, onChange }) => createRoot(destroy => {
    const [v, setV] = createSignal(eventKey || value)
    let el!: HTMLElement
    ;(<Comp
      ref={e => el = e}
      value={v()}
      onChange={e => (setV(e instanceof Event ? e.target.value : e), onChange?.(v()), ok())}
      // options={col.enum ? resolveOptions(col.enum ?? []) : undefined}
      cancel={cancel}
      ok={ok}
      {...extra}
      {...props}
    />)

    return {
      el,
      getValue: v,
      focus: () => el.focus(),
      destroy,
    }
  })
)

for (const k in tables) {
  editors[`rel:${k}`] = createEditor(props => {
    const _Table = tables[k]
    return (
      <div ref={props.ref}>
        编辑中
        <Portal mount={document.body}>
          <dialog ref={e => setTimeout(() => e.showModal(), 0)} class='w-1/2 m-a'>
            <_Table
              ref={null}
              rowSelection={{
                enable: true,
                multiple: props.multiple,
                value: props.value,
                onChange: props.value
              }}
            />
            <div class="flex gap-4">
              <button onClick={props.cancel}>取消</button>
              <button onClick={props.ok}>确认</button>
            </div>
          </dialog>
        </Portal>
      </div>
    )
  })
}

for (const k in tables) {
  renders[`rel:${k}`] = o => toArr(o.value).map(e => e.name || e.id).join()
}

export default () => {
  return tables.user()
}