import { createComputed, createEffect, createMemo, createRoot, createSignal, on, onCleanup, useContext, type Component, type JSX } from 'solid-js'
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

const createEditor = (Comp: Component<any>, extra?, isSelector?): Editor => (
  ({ eventKey, value, col, ok, cancel, props }) => createRoot(destroy => {
    const [v, setV] = createSignal(eventKey || value)
    let el!: HTMLElement
    ;(<Comp
      ref={e => el = e}
      class='relative block px-2 size-full z-9 box-border resize-none outline-0'
      value={v()}
      onInput={e => setV(e instanceof Event ? e.target.value : e)}
      onChange={e => (setV(e instanceof Event ? e.target.value : e), isSelector && ok())}
      on:pointerdown={e => e.stopPropagation()}
      on:keydown={e => {
        e.stopPropagation()
        e.key == 'Enter' && ok()
        e.key == 'Escape' && cancel()
      }}
      options={col.enum ? resolveOptions(col.enum ?? []) : undefined}
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

const Input = o => <input {...o} />

const text = createEditor(Input)
const number = createEditor(Input, { type: 'number' })
const range = createEditor(Input, { type: 'range' })
const color = createEditor(Input, { type: 'color' })
const tel = createEditor(Input, { type: 'tel' })
const password = createEditor(Input, { type: 'password' })
const date = createEditor(Input, { type: 'date' }, true)
const time = createEditor(Input, { type: 'time' }, true)
const datetime = createEditor(Input, { type: 'datetime-local' }, true)
const select = createEditor(o => <select {...o}>{o.options?.map(e => <option value={e.value}>{e.label}</option>)}</select>, {}, true)

const file = createEditor(o => {
  const onAdd = () => chooseFile({ multiple: true }).then(files => o.onChange([...o.value || [], ...files.map(e => ({ name: e.name, size: e.size }))]))
  return <Files {...o} class='relative z-9 outline-(2 blue) min-h-a! h-a! p-1 bg-#fff' onAdd={onAdd} />
})

const checkbox = createEditor(o => (
  <label ref={o.ref} class='h-full flex items-center'>
    <Checkbox {...o} ref={() => {}} onInput={() => {}} class='mx-3!' />
  </label>
))

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