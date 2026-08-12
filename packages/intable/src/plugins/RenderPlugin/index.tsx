import { createMemo, mergeProps, type JSX } from 'solid-js'
import { component } from 'undestructure-macros'
import dayjs from 'dayjs'
import { type Plugin, type TDProps } from '../..'
import { Checkbox, Files, Tags, Rate, Progress } from './components'
import { getOpt, toArr } from '../../utils'
import { renderComponent, solidComponent } from '../../components/utils'

declare module '../../index' {
  interface TableProps {
    cpu?: boolean
  }
  interface TableColumn {
    type?: string
    render?: string | Render
    enum?: Record<string, any> | { label?: string; value: any }[]
    max?: number
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
          {/*@once*/ createMemo(() => {
            let Comp = (e => typeof e == 'string' ? store.renders[e] : e)(o.col.render ?? (o.col.enum && text) ?? o.col.type) ?? text
            return Comp == text ? text(o) : renderComponent(Comp, o, store)
          })}
        </Td>
      )
    }
  }
}

export { text2colorMap } from './components'

const text: Render = component(({ value, col }) => {
  return col.enum ? <Tags disabled value={toArr(value).map(v => getOpt(col.enum, v) ?? v)} /> : value
})


const checkbox: Render = component(({ value, onChange }) => (
  <div class='flex items-center h-full'>
    <Checkbox class='' value={value} onChange={onChange} />
  </div>
))

const file: Render = component(({ value, onChange }) => (
  <Files value={value} onChange={onChange} disabled />
))

const rate: Render = component(({ value, onChange, col }) => (
  <Rate value={value} max={col.max ?? 5} onChange={onChange} disabled />
))

const progress: Render = component(({ value, onChange }) => (
  <Progress value={value} onChange={onChange} />
))

export const renders: Record<string, Render> = {
  text,
  switch: checkbox,
  checkbox,
  file,
  rate,
  progress,
  date: ({ value }) => value ? dayjs(value).format('YYYY-MM-DD') : '',
  datetime: ({ value }) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '',
  time: text,
}

for (const k in renders) {
  renders[k] = solidComponent(renders[k])
}