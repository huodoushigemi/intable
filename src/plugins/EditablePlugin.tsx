import { createComputed, createEffect, createMemo, createRoot, createSignal, on, onCleanup, useContext, type JSX } from 'solid-js'
import { combineProps } from '@solid-primitives/props'
import { createAsyncMemo } from '@solid-primitives/memo'
import { delay, merge } from 'es-toolkit'
import { chooseFile, log, resolveOptions } from '@/utils'
import { Ctx, type Plugin, type TableColumn } from '../xxx'
import { Checkbox, Files } from './RenderPlugin/components'
import { createMutable } from 'solid-js/store'

declare module '../xxx' {
  interface TableProps {

  }
  interface TableColumn {
    editable?: boolean
    editor?: string | Editor
    editorProps?: any
    editorPopup?: boolean // todo
    editOnInput?: boolean
  }
  interface TableStore {
    editors: { [key: string]: Editor }
  }
}

export type Editor = (props: EditorOpt) => {
  el: JSX.Element
  getValue: () => any
  destroy: () => void
  focus?: () => void
  blur?: () => void
}

export interface EditorOpt {
  col: TableColumn
  data: any
  value: any
  eventKey?: string
  ok: () => void
  cancel: () => void
  props?: any
}

export const EditablePlugin: Plugin = {
  store: () => ({
    editors: { ...editors }
  }),
  rewriteProps: {
    Td: ({ Td }, { store }) => o => {
      let el!: HTMLElement
      const { props } = useContext(Ctx)
      const editable = createMemo(() => !!o.col.editable && !o.data[store.internal] && !o.col[store.internal])
      const [editing, setEditing] = createSignal(false)
      let eventKey = ''

      const selected = createMemo(() => (([x, y]) => o.x == x && o.y == y)(store.selected.start || []))

      const preEdit = createMemo(() => selected() && editable() && !editing() && o.col.editOnInput)

      const editorState = createAsyncMemo(async () => {
        if (editing()) {
          let canceled = false
          const editor = (editor => typeof editor == 'string' ? store.editors[editor] : editor)(o.col.editor || 'text')
          const opt = {
            props: o.col.editorProps,
            col: o.col,
            eventKey,
            data: o.data,
            value: o.data[o.col.id],
            ok: () => setEditing(false),
            cancel: () => (canceled = true, setEditing(false))
          }
          const ret = editor(opt)
          onCleanup(() => {
            if (!canceled && ret.getValue() !== o.data[o.col.id]) {
              const arr = [...props.data!]
              arr[o.y] = { ...arr[o.y], [o.col.id]: ret.getValue() }
              props.onDataChange?.(arr)
            }
            ret.destroy()
          })
          return [opt, ret] as const
        }
      })

      createEffect(() => {
        editorState()?.[1]?.focus?.()
      })
      
      createEffect(() => {
        if (editing()) {
          const sss = createMemo(() => JSON.stringify(store.selected))
          createEffect(on(sss, () => setEditing(false), { defer: true }))
        }
      })

      let input: HTMLInputElement
      const size = createMutable({ w: 0, h: 0 })
      createComputed(() => editing() && (size.w = el.getBoundingClientRect().width, size.h = el.getBoundingClientRect().height))
      
      o = combineProps(o, {
        ref: v => el = v,
        get class() { return editing() ? 'is-editing' : '' },
        get style() { return editing() ? `width: ${size.w}px; height: ${size.h}px; padding: 0; ` : '' },
        onClick: () => input?.focus?.(),
        onDblClick: () => setEditing(editable()),
        onKeyDown: e => e.key == 'Escape' && editorState()?.[0].cancel()
      } as JSX.HTMLAttributes<any>)
      
      return (
        <Td {...o}>
          {preEdit() &&
            <input
              style='position: absolute; margin-top: 1em; width: 0; height: 0; pointer-events: none; opacity: 0'
              ref={e => { input = e; delay(0).then(() => e.focus()) }}
              onKeyDown={e => {
                e.key == ' ' && e.preventDefault()
              }}
              onInput={e => {
                eventKey = e.target.value
                setEditing(!e.isComposing)
              }}
              onCompositionEnd={() => {
                setEditing(true)
              }}
            />
          }
          {editorState()?.[1]?.el
            ? <div class='in-cell-edit-wrapper'>{editorState()?.[1]?.el}</div>
            : o.children
          }
        </Td>
      )
    }
  }
}

const BaseInput: Editor = ({ eventKey, value, ok, cancel, props }) => createRoot(destroy => {
  const [v, setV] = createSignal(eventKey || value)
  const el: HTMLElement = <input
    class='relative block px-2 size-full z-9 box-border resize-none outline-0'
    value={v() || ''}
    type={props.type}
    onInput={e => setV(e.target.value)}
    on:pointerdown={e => e.stopPropagation()}
    on:keydown={e => {
      e.stopPropagation()
      e.key == 'Enter' ? ok() : e.key == 'Escape' ? cancel() : void 0
    }}
  />
  
  return {
    el,
    getValue: v,
    focus: () => el.focus(),
    destroy,
  }
})

const text = BaseInput

const number: Editor = (opt) => BaseInput(merge(opt, { props: { type: 'number' } }))
const range: Editor = (opt) => BaseInput(merge(opt, { props: { type: 'range' } }))
const date: Editor = (opt) => BaseInput(merge(opt, { props: { type: 'date' } }))
const time: Editor = (opt) => BaseInput(merge(opt, { props: { type: 'time' } }))
const datetime: Editor = (opt) => BaseInput(merge(opt, { props: { type: 'datetime-local' } }))
const color: Editor = (opt) => BaseInput(merge(opt, { props: { type: 'color' } }))
const tel: Editor = (opt) => BaseInput(merge(opt, { props: { type: 'tel' } }))
const password: Editor = (opt) => BaseInput(merge(opt, { props: { type: 'password' } }))

const select: Editor = ({ value, col, ok }) => createRoot(destroy => {
  const [v, setV] = createSignal(value)
  return {
    el: (
      <select class='size-full' value={v()} onChange={e => setV(e.target.value)} on:pointerdown={e => e.stopPropagation()}>
        {resolveOptions(col.enum ?? []).map(e => (
          <option value={e.value}>{e.label}</option>
        ))}
      </select>
    ),
    getValue: v,
    destroy
  }
})

const file: Editor = (props) => createRoot(destroy => {
  const [v, setV] = createSignal(props.value)
  const onAdd = () => chooseFile({ multiple: true }).then(files => setV(v => [...v, ...files.map(e => ({ name: e.name, size: e.size }))]))
  return {
    el: <Files class='relative z-9 outline-(2 blue) min-h-a! h-a! p-1 bg-#fff' value={v()} onChange={setV} onAdd={onAdd} />,
    getValue: v,
    destroy
  }
})

const checkbox: Editor = ({ value, ok, cancel, props }) => createRoot(destroy => {
  const [v, setV] = createSignal(value)
  let el: HTMLElement
  
  return {
    el: (
      <div class='h-full flex items-center' onPointerDown={() => el.focus()}>
        <Checkbox
          ref={el}
          class='mx-3!'
          value={v()}
          onChange={setV}
          on:pointerdown={e => e.stopPropagation()}
          on:keydown={e => {
            e.key == 'Enter' ? ok() : e.key == 'Escape' ? cancel() : void 0
          }}
          {...props}
        />
      </div>
    ),
    getValue: v,
    focus: () => el.focus(),
    destroy,
  }
})

export const editors = {
  text,
  number,
  range,
  date,
  time,
  datetime,
  color,
  tel,
  password,
  file,
  checkbox,
  select,
}