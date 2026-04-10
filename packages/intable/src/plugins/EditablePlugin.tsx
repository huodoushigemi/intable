import { createComputed, createEffect, createMemo, createRoot, createSignal, on, onCleanup, useContext, type Component, type JSX } from 'solid-js'
import { combineProps } from '@solid-primitives/props'
import { createAsyncMemo } from '@solid-primitives/memo'
import { delay } from 'es-toolkit'
import { createMutable } from 'solid-js/store'
import { Ctx, type Plugin, type TableColumn } from '..'
import { Checkbox, Files } from './RenderPlugin/components'
import { chooseFile, resolveOptions, unFn } from '../utils'

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
      const editable = createMemo(() => unFn(props.editable, o))
      const [editing, setEditing] = createSignal(false)
      let eventKey = ''

      const selected = createMemo(() => (([x, y]) => o.x == x && o.y == y)(store.selected.start || []))

      const preEdit = createMemo(() => selected() && editable() && !editing())

      const [validating, setValidating] = createSignal(false)

      const editorState = createAsyncMemo(() => {
        if (editing()) {
          let canceled = false, initialValue = o.data[o.col.id]
          const editor = (e => typeof e == 'string' ? store.editors[e] : e)(o.col.editor ?? o.col.type ?? 'text')
          const opt = {
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
          {editorState()?.[1]?.el
            ? <div class='in-cell-edit-wrapper' tabindex={-1} on:keydown={e => e.stopPropagation()}>
                {editorState()?.[1]?.el}
                {validating() && <span class='cell-validating' />}
              </div>
            : o.children
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
      on:pointerdown={e => e.stopPropagation()}
      on:keydown={(e: KeyboardEvent) => {
        e.stopPropagation()
        e.key == 'Enter' && !e.shiftKey && ok()
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

export const editors = {
  text: createEditor(Input),
  textarea: createEditor(o => <textarea {...o} />),
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
  select: createEditor(o => <select {...o}>{o.options?.map(e => <option value={e.value}>{e.label}</option>)}</select>, {}, true),
}