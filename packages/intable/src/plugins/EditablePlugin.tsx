import { createEffect, createMemo, createRoot, createSignal, mergeProps, on, onCleanup, useContext, type Component, type JSX } from 'solid-js'
import { createAsyncMemo } from '@solid-primitives/memo'
import { delay } from 'es-toolkit'
import { createMutable } from 'solid-js/store'
import { Ctx, type Plugin, type TableColumn } from '..'
import { Checkbox, Files } from './RenderPlugin/components'
import { chooseFile, resolveOptions, unFn } from '../utils'
import Textarea from '../components/Textarea'

declare module '../index' {
  interface TableProps {
    editable?: boolean | ((props: TDProps) => boolean)
  }
  interface TableColumn {
    editable?: boolean | ((props: TDProps) => boolean)
    editor?: string | Editor
    editorProps?: any
    editorPopup?: boolean // todo
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
  onChange?: (value: any) => void
  ok: () => void
  cancel: () => void
  props?: any
}

export const EditablePlugin: Plugin = {
  name: 'editable',
  store: () => ({
    editors: { ...editors }
  }),
  rewriteProps: {
    editable: ({ editable }, { store }) => o => {
      const arr = [o.col.editable, editable].filter(e => e != null)
      return !!arr.length && arr.every(e => unFn(e, o)) && !o.data[store.internal] && !o.col[store.internal]
    },
    Td: ({ Td }, { store }) => o => {
      let el!: HTMLElement
      const { props } = useContext(Ctx)
      const [editing, setEditing] = createSignal(false)
      let eventKey = ''

      const editable = () => unFn(props.editable, o)
      const selected = () => (([x, y]) => o.x == x && o.y == y)(store.selected.start || [])
      const preEdit = () => selected() && editable() && !editing()

      const [validating, setValidating] = createSignal(false)

      const editorState = createAsyncMemo(() => {
        if (editing()) {
          const sss = createMemo(() => JSON.stringify(store.selected ?? '{}'))
          createEffect(on(sss, () => setEditing(false), { defer: true }))

          size.w = el.getBoundingClientRect().width
          size.h = el.getBoundingClientRect().height

          let canceled = false, initialValue = o.data[o.col.id]
          const editor = (e => typeof e == 'string' ? store.editors[e] : e)(o.col.editor ?? o.col.type ?? (o.col.enum ? 'select' : 'text'))
          const opt: EditorOpt = {
            props: o.col.editorProps,
            col: o.col,
            eventKey,
            data: o.data,
            value: initialValue,
            ok: async () => {
              await validate(ret.getValue())
              setEditing(false)
            },
            cancel: () => (canceled = true, setEditing(false)),
            onChange: v => editing() && validate(v).catch(() => {}) // Validate on each change but ignore errors until final submission
          }
          const ret = editor(opt)

          queueMicrotask(() => ret.focus?.())
          
          onCleanup(() => {
            if (!canceled && ret.getValue() !== initialValue) {
              store.commands.rowChange({ ...props.data[o.y], [o.col.id]: ret.getValue() })
            }
            if (!canceled) {
              validate(ret.getValue()).catch(() => {})
            }
            eventKey = ''
            ret.destroy()
          })
          return [opt, ret] as const
        }
      })

      async function validate(value) {
        try {
          setValidating(true)
          await store.validateCell(value, o.data, o.col)
        } finally {
          setValidating(false)
        }
      }

      let input: HTMLInputElement
      const size = createMutable({ w: 0, h: 0 })
      
      // mergeProps combineProps 10M -> 20M, so manually merge props here to save memory
      const mo = mergeProps(o, {
        ref: v => (el = v, o.ref?.(v)),
        get class() { return [editing() ? 'is-editing' : '', o.class].filter(Boolean).join(' ') },
        get style() { return [editing() ? `width: ${size.w}px; height: ${size.h}px; padding: 0; ` : '', o.style].filter(Boolean).join(' ') },
        onClick: e => (input?.focus?.(), o.onClick?.(e)),
        onDblClick: e => (setEditing(editable()), o.onDblClick?.(e)),
        onKeyDown: e => (e.key == 'Escape' && editorState()?.[0].cancel(), o.onKeyDown?.(e))
      } as JSX.HTMLAttributes<any>)
      
      return (
        <Td {...mo}>
          {editorState()?.[1]?.el
            ? <div
                class='in-cell-edit-wrapper'
                tabindex={-1}
                on:pointerdown={e => e.stopPropagation()}
                on:keydown={(e: KeyboardEvent) => {
                  e.stopPropagation()
                  e.key == 'Enter' && !e.shiftKey && (editorState()?.[0].ok(), e.preventDefault())
                  e.key == 'Escape' && editorState()?.[0].cancel()
                }}
              >
                {editorState()?.[1]?.el}
                {validating() && <span class='cell-validating' />}
              </div>
            : o.children
          }
          {preEdit() &&
            <input
              style='position: absolute; margin-top: 1em; width: 0; height: 0; pointer-events: none; opacity: 0'
              // todo
              ref={e => { input = e; delay(0).then(() => e.focus({ preventScroll: true })) }}
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
        </Td>
      )
    }
  }
}

const createEditor = (Comp: Component<any>, extra?, isSelector?): Editor => (
  ({ eventKey, value, col, ok, cancel, props, onChange }) => createRoot(destroy => {
    const [v, setV] = createSignal(eventKey || value)
    let el!: HTMLElement
    ;(<Comp
      ref={e => el = e}
      class='relative block px-2 size-full z-9 box-border resize-none outline-0'
      value={v()}
      onInput={e => (setV(e instanceof Event ? e.target.value : e), onChange?.(v()))}
      onChange={e => (setV(e instanceof Event ? e.target.value : e), onChange?.(v()), isSelector && ok())}
      options={col.enum ? resolveOptions(col.enum ?? []) : undefined}
      {...extra}
      {...props}
    />)

    setTimeout(() => {
      isSelector && el?.showPicker?.()
    }, 0);
    
    return {
      el,
      getValue: v,
      focus: () => el.focus(),
      destroy,
    }
  })
)

const Input = o => <input {...o} />

export const editors = {
  text: createEditor(Input),
  textarea: createEditor(o => <Textarea autosize={{ minRows: 2, maxRows: 3 }} {...o} class={`${o.class} bg-[--table-bg] outline-(1.5px solid [--c-primary])`} />),
  number: createEditor(Input, { type: 'number' }),
  range: createEditor(Input, { type: 'range' }),
  date: createEditor(Input, { type: 'date' }, true),
  time: createEditor(Input, { type: 'time' }, true),
  datetime: createEditor(Input, { type: 'datetime-local' }, true),
  color: createEditor(Input, { type: 'color' }),
  tel: createEditor(Input, { type: 'tel' }),
  password: createEditor(Input, { type: 'password' }),
  file: createEditor(o => {
    const onAdd = () => chooseFile({ multiple: true }).then(files => o.onChange([...o.value || [], ...files.map(e => ({ name: e.name, size: e.size }))]))
    return <Files {...o} class='relative z-9 outline-(2 blue) min-h-a! h-a! p-1 bg-#fff' onAdd={onAdd} />
  }),
  checkbox: createEditor(o => (
    <label ref={o.ref} class='h-full flex items-center'>
      <Checkbox {...o} ref={() => {}} onInput={() => {}} class='mx-3!' />
    </label>
  )),
  select: createEditor(o => (
    <select {...o}>
      {!o.multiple && <option value=''>-</option>}
      {o.options?.map(e => <option value={e.value} selected={e.value === o.value}>{e.label}</option>)}
    </select>
  ), {}, true),
}