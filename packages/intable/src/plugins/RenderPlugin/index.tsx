import { createMemo, mergeProps, type JSX } from 'solid-js'
import { component } from 'undestructure-macros'
import { type Plugin, type TDProps } from '../..'
import { Checkbox, Files } from './components'
import { resolveOptions, toArr } from '../../utils'
import { renderComponent, solidComponent } from '../../components/utils'

declare module '../../index' {
  interface TableProps {
    cpu?: boolean
  }
  interface TableColumn {
    type?: string
    render?: string | Render
    enum?: Record<string, any> | { label?: string; value: any }[]
  }
  interface TableStore {
    renders: { [key: string]: Render }
  }
}

export type Render = (props: TDProps) => JSX.Element | any

export const RenderPlugin: Plugin = {
  name: 'render',
  priority: -Infinity,
  store: () => ({
    renders: { ...renders }
  }),
  rewriteProps: {
    Td: ({ Td }, { store }) => o => {
      if (store.props.cpu) o = mergeProps(() => ({}), o)
      return (
        <Td {...o}>
          {/* @ts-ignore */}
          {createMemo(() => {
            let Comp = (e => typeof e == 'string' ? store.renders[e] : e)(o.col.render ?? o.col.type ?? text)
            return Comp == text ? text(o) : renderComponent(Comp, o, store)
          })}
        </Td>
      )
    }
  }
}

const text: Render = component(({ value, col }) => {
  return col.enum ? toArr(value).map(v => resolveOptions(col.enum!).find(e => e.value == v)?.label ?? v).join(', ') : value
})

const number = text

const date = text

const checkbox: Render = component(({ value, onChange }) => (
  <div class='flex items-center h-full'>
    <Checkbox class='' value={value} onChange={onChange} />
  </div>
))

const file: Render = component(({ value, onChange }) => (
  <Files value={value} onChange={onChange} disabled />
))

export const renders = {
  text,
  number,
  date,
  checkbox,
  file
}

for (const k in renders) {
  renders[k] = solidComponent(renders[k])
}