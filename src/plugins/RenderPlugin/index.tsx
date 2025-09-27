import { type JSX } from 'solid-js'
import { combineProps } from '@solid-primitives/props'
import { component } from 'undestructure-macros'
import { type Plugin, type TD } from '../../xxx'
import { Checkbox, Files } from './components'
import { resolveOptions } from '@/utils'

declare module '../../xxx' {
  interface TableProps {

  }
  interface TableColumn {
    render?: string | Render
    enum?: Record<string, any> | { label?: string; value: any }[]
  }
  interface TableStore {
    renders: { [key: string]: Render }
  }
}

export type Render = (props: Parameters<TD>[0] & { onChange?: (v) => void }) => JSX.Element

export const RenderPlugin: Plugin = {
  priority: -Infinity,
  store: () => ({
    renders: {
      text,
      number,
      date,
      checkbox,
      file
    }
  }),
  processProps: {
    Td: ({ Td }, { store }) => o => {
      return (
        <Td {...o}>
          {(() => {
            const Comp = (e => typeof e == 'string' ? store.renders[e] : e)(o.col.render) || text
            return <Comp {...o} />
          })()}
        </Td>
      )
    }
  }
}

const text: Render = component(({ data, col, onChange }) => {
  return <>{
    (v =>
      col.enum ? resolveOptions(col.enum).find(e => e.value == v)?.label ?? v : v
    )(data[col.id])
  }</>
})

const number = text

const date = text

const checkbox: Render = component(({ data, col, onChange }) => {
  return (
    <div class='flex items-center h-full'>
      <Checkbox class='' value={data[col.id]} onChange={onChange} />
    </div>
  )
})

const file: Render = component(({ data, col, onChange }) => {
  return (
    <Files value={data[col.id]} onChange={onChange} disabled />
  )
})
