import { createEffect, createMemo, createRoot, createSignal, on, onCleanup, useContext, type JSX } from 'solid-js'
import { combineProps } from '@solid-primitives/props'
import { createAsyncMemo } from '@solid-primitives/memo'
import { delay } from 'es-toolkit'
import { chooseFile, log, resolveOptions } from '@/utils'
import { Ctx, type Plugin, type TableColumn } from '../xxx'
import { Checkbox, Files } from './RenderPlugin/components'

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

export type Editor = (props: EditorProps) => {
  el: JSX.Element
  getValue: () => any
  destroy: () => void
  focus?: () => void
  blur?: () => void
}

export interface EditorProps extends Record<any, any> {
  col: TableColumn
  data: any
  value: any
  eventKey?: string
  stopEditing: () => void
}

export const EditablePlugin: Plugin = {
  store: () => ({
    editors: {
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
  }),
  processProps: {
    Td: ({ Td }, { store }) => o => {
      const { props } = useContext(Ctx)
      const editable = createMemo(() => !!o.col.editable && !o.data[store.internal] && !o.col[store.internal])
      const [editing, setEditing] = createSignal(false)
      let eventKey = ''

      const selected = createAsyncMemo(() => (([x, y]) => o.x == x && o.y == y)(store.selected.start || []))

      const editorState = createAsyncMemo(async () => {
        if (editing()) {
          const editor = (editor => typeof editor == 'string' ? store.editors[editor] : editor)(o.col.editor || 'text')
          const ret = editor({ ...o.col.editorProps, col: o.col, eventKey, data: o.data, value: props.data![o.y][o.col.id], stopEditing: () => setEditing(false) })
          onCleanup(() => {
            if (o.data[o.col.id] != ret.getValue()) {
              const arr = [...props.data!]
              arr[o.y] = { ...arr[o.y], [o.col.id]: ret.getValue() }
              props.onDataChange?.(arr)
            }
            ret.destroy()
          })
          return ret
        }
      })

      createEffect(() => {
        editorState()?.focus?.()
      })
      
      createEffect(() => {
        if (editing()) {
          const sss = createMemo(() => JSON.stringify(store.selected))
          createEffect(on(sss, () => setEditing(false), { defer: true }))
        }
      })

      let input: HTMLInputElement
      
      o = combineProps({
        get style() { return editing() ? `padding: 0; height: ${store.trSizes[o.y]?.height}px` : '' },
        onClick: () => input.focus?.(),
        onDblClick: () => setEditing(editable())
      } as JSX.HTMLAttributes<any>, o)
      
      return (
        <Td {...o}>
          {selected() && editable() && !editing() && o.col.editOnInput &&
            <input
              style='position: absolute; margin-top: 1em; width: 0; height: 0; pointer-events; none; opacity: 0'
              ref={e => { input = e; delay(0).then(() => e.focus()) }}
              onInput={e => {
                eventKey = e.target.value
                setEditing(!e.isComposing)
              }}
              onCompositionEnd={() => {
                setEditing(true)
              }}
            />
          }
          {editorState()?.el
            ? <div style={`height: 100%; box-sizing: border-box; padding: 0;`}>{editorState()?.el}</div>
            : o.children
          }
        </Td>
      )
    }
  }
}

const BaseInput: Editor = ({ stopEditing, eventKey, value, col, type }) => createRoot(destroy => {
  const [v, setV] = createSignal(eventKey || value)
  const el: HTMLElement = <input
    class='relative block px-2 size-full z-9 box-border resize-none'
    value={v() || ''}
    type={type}
    onInput={e => setV(e.target.value)}
    on:pointerdown={e => e.stopPropagation()}
    on:keydown={e => {
      e.stopPropagation()
      e.key == 'Enter' ? stopEditing() : e.key == 'Escape' ? (setV(value), stopEditing()) : void 0
    }}
  />
  
  return {
    el,
    getValue: () => v(),
    focus: () => el.focus(),
    destroy,
  }
})

const text = BaseInput

const number: Editor = (props) => BaseInput({ ...props, type: 'number' })
const range: Editor = (props) => BaseInput({ ...props, type: 'range'  })
const date: Editor = (props) => BaseInput({ ...props, type: 'date'  })
const time: Editor = (props) => BaseInput({ ...props, type: 'time'  })
const datetime: Editor = (props) => BaseInput({ ...props, type: 'datetime-local'  })
const color: Editor = (props) => BaseInput({ ...props, type: 'color'  })
const tel: Editor = (props) => BaseInput({ ...props, type: 'tel'  })
const password: Editor = (props) => BaseInput({ ...props, type: 'password'  })

const select: Editor = ({ stopEditing, value, col }) => createRoot(destroy => {
  const [v, setV] = createSignal(value)
  return {
    el: (
      <select class='size-full' value={v()} onChange={e => { setV(e.target.value); stopEditing() }} on:pointerdown={e => e.stopPropagation()}>
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

const checkbox: Editor = ({ stopEditing, eventKey, value, col, data, ...attrs }) => createRoot(destroy => {
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
            e.key == 'Enter' ? stopEditing() : e.key == 'Escape' ? (setV(value), stopEditing()) : void 0
          }}
          {...attrs}
        />
      </div>
    ),
    getValue: v,
    focus: () => el.focus(),
    destroy,
  }
})