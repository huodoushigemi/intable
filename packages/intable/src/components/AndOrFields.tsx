import { Match, Switch, createMemo } from 'solid-js'
import { AndOr } from './AndOr'
import type { AndOrNode, RuleNode } from './AndOr'
import { resolveOptions } from '../utils'
import { component } from 'undestructure-macros'

export type RuleOp =
  | 'contains'
  | 'eq'
  | 'ne'
  | 'in'
  | 'not_in'
  | 'startwith'
  | 'endwith'
  | 'blank'
  | 'noblank'
  | 'lt'
  | 'gt'
  | 'lte'
  | 'gte'
  | 'between'
  | 'not_between'
  | 'true'
  | 'false'

export type Field = {
  id: string
  name?: string
  type?: string
  enum?: Record<string, any> | { label?: string; value: any }[]
}

type Props = {
  fields: Field[]
  value?: AndOrNode
  onChange?: (value: AndOrNode) => void
  class?: any
  hideFields?: boolean
  newRule?: (current: RuleNode) => RuleNode
}

// const VALUE_FREE_RULES = ['blank', 'noblank', 'true', 'false', '']
const VALUE_FREE_RULES = ['blank', 'noblank']

export function isValueFreeOp(op?: string) {
  return VALUE_FREE_RULES.includes(op as RuleOp)
}

export const RULES_BY_TYPE: Record<string, Array<{ label: string; value: RuleOp }>> = {
  text: [
    { label: '包含', value: 'contains' },
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'ne' },
    { label: '在列表中', value: 'in' },
    { label: '不在列表中', value: 'not_in' },
    { label: '开头是', value: 'startwith' },
    { label: '结尾是', value: 'endwith' },
    { label: '为空', value: 'blank' },
    { label: '不为空', value: 'noblank' },
  ],
  number: [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'ne' },
    { label: '小于', value: 'lt' },
    { label: '大于', value: 'gt' },
    { label: '小于等于', value: 'lte' },
    { label: '大于等于', value: 'gte' },
    { label: '介于', value: 'between' },
    { label: '不介于', value: 'not_between' },
    { label: '在列表中', value: 'in' },
    { label: '不在列表中', value: 'not_in' },
    { label: '为空', value: 'blank' },
    { label: '不为空', value: 'noblank' },
  ],
  date: [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'ne' },
    { label: '早于', value: 'lt' },
    { label: '晚于', value: 'gt' },
    { label: '不晚于', value: 'lte' },
    { label: '不早于', value: 'gte' },
    { label: '介于', value: 'between' },
    { label: '不介于', value: 'not_between' },
    { label: '在列表中', value: 'in' },
    { label: '不在列表中', value: 'not_in' },
    { label: '为空', value: 'blank' },
    { label: '不为空', value: 'noblank' },
  ],
  enum: [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'ne' },
    { label: '在列表中', value: 'in' },
    { label: '不在列表中', value: 'not_in' },
    { label: '为空', value: 'blank' },
    { label: '不为空', value: 'noblank' },
  ],
  checkbox: [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'ne' },
    { label: '在列表中', value: 'in' },
    { label: '不在列表中', value: 'not_in' },
    { label: '为空', value: 'blank' },
    { label: '不为空', value: 'noblank' },
  ],
}

function isBetweenOp(op?: string) {
  return op === 'between' || op === 'not_between'
}

function isListOp(op?: string) {
  return op === 'in' || op === 'not_in'
}

function toPair(v: any): [any, any] {
  if (Array.isArray(v)) return [v[0] ?? '', v[1] ?? '']
  if (v == null || v === '') return ['', '']
  return [v, '']
}

function toList(v: any): any[] {
  if (Array.isArray(v)) return v
  if (v == null || v === '') return []
  return String(v)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

type RuleValueEditorProps = {
  field?: Field
  op?: string
  value: any
  enum?: Field['enum']
  class?: string
  placeholder?: string
  onChange: (value: any) => void
}

export const RuleValueEditor = (props: RuleValueEditorProps) => {
  const type = () => normalizeType(props.field)
  const options = () => resolveOptions(props.enum ?? [])
  const op = () => props.op || defaultOp(type())

  return (
    <Switch
      fallback={(
        <input
          class={props.class ?? 'flex-1 px-2 py-1 rounded-md border'}
          value={props.value ?? ''}
          placeholder={props.placeholder}
          onInput={e => props.onChange((e.target as HTMLInputElement).value)}
        />
      )}
    >
      <Match when={isValueFreeOp(props.op || defaultOp(type()))}>
        <></>
      </Match>

      <Match when={isBetweenOp(op())}>
        {(() => {
          const [start, end] = toPair(props.value)
          const inputType = type() === 'number' ? 'number' : (type() === 'date' ? 'date' : 'text')
          return (
            <div class='flex-1 flex items-center gap-1'>
              <input
                class={props.class ?? 'flex-1 px-2 py-1 rounded-md border'}
                type={inputType}
                value={start ?? ''}
                placeholder='开始'
                onInput={e => props.onChange([((e.target as HTMLInputElement).value), end ?? ''])}
              />
              <span class='text-xs c-gray/70'>~</span>
              <input
                class={props.class ?? 'flex-1 px-2 py-1 rounded-md border'}
                type={inputType}
                value={end ?? ''}
                placeholder='结束'
                onInput={e => props.onChange([start ?? '', ((e.target as HTMLInputElement).value)])}
              />
            </div>
          )
        })()}
      </Match>

      <Match when={isListOp(op()) && type() === 'enum'}>
        <Select
          class={props.class ?? 'flex-1 px-2 py-1 rounded-md border'}
          multiple
          value={toList(props.value).map(v => String(v))}
          onChange={v => props.onChange(v)}
          options={options()}
        />
      </Match>

      <Match when={isListOp(op())}>
        <input
          class={props.class ?? 'flex-1 px-2 py-1 rounded-md border'}
          value={toList(props.value).join(', ')}
          placeholder={props.placeholder ?? '多个值用逗号分隔'}
          onInput={e => props.onChange(toList((e.target as HTMLInputElement).value))}
        />
      </Match>

      <Match when={type() === 'number'}>
        <input
          class={props.class ?? 'flex-1 px-2 py-1 rounded-md border'}
          type='number'
          value={props.value ?? ''}
          placeholder={props.placeholder}
          onInput={e => props.onChange((e.target as HTMLInputElement).value)}
        />
      </Match>

      <Match when={type() === 'date'}>
        <input
          class={props.class ?? 'flex-1 px-2 py-1 rounded-md border'}
          type='date'
          value={props.value ?? ''}
          onInput={e => props.onChange((e.target as HTMLInputElement).value)}
        />
      </Match>

      <Match when={type() === 'enum'}>
        <Select
          class={props.class ?? 'flex-1 px-2 py-1 rounded-md border'}
          value={props.value ?? ''}
          onChange={v => props.onChange(v)}
          options={options()}
          clearable
        />
      </Match>

      <Match when={['checkbox', 'switch', 'boolean'].includes(type())}>
        <Select
          class={props.class ?? 'flex-1 px-2 py-1 rounded-md border'}
          value={props.value ?? ''}
          onChange={v => props.onChange(v)}
          options={[{ label: 'true', value: 'true' }, { label: 'false', value: 'false' }]}
          clearable
        />
      </Match>
    </Switch>
  )
}

export function normalizeType(field?: Field) {
  if (field?.enum) return 'enum'
  return field?.type ?? 'text'
}

function defaultOp(type: string): RuleOp {
  return RULES_BY_TYPE[type]?.[0]?.value
}

export function newRule(field: Field, current?: Partial<RuleNode>): RuleNode {
  const type = normalizeType(field)
  const op = defaultOp(type)
  return { field: field.id, op, value: VALUE_FREE_RULES.includes(op) ? null : '', ...current }
}

function normalizeValueByOp(op: RuleOp, value: any) {
  if (VALUE_FREE_RULES.includes(op)) return null
  if (isBetweenOp(op)) return toPair(value)
  if (isListOp(op)) return toList(value)
  return value ?? ''
}

export const AndOrFields = (props: Props) => {
  return (
    <AndOr
      {...props}
      renderRule={component(({ node, update }) => {
        const field = createMemo(() => props.fields.find(f => f.id === node.field))
        const type = createMemo(() => normalizeType(field()))
        const ruleOptions = createMemo(() => RULES_BY_TYPE[type()])

        return (
          <div class='flex items-center gap-2'>
            <Select
              class={`px-2 py-1 rounded-md border ${props.hideFields ? 'hidden' : ''}`}
              value={node.field}
              onChange={v => {
                const f = props.fields.find(e => e.id === v)
                update(newRule(f!, { field: v }))
              }}
              options={props.fields.map(f => ({ label: f.name ?? f.id, value: f.id }))}
              placeholder='选择字段'
            />

            <Select
              class='px-2 py-1 rounded-md border'
              value={node.op || defaultOp(type())}
              onChange={op => {
                update({ op, value: normalizeValueByOp(op, node.value) })
              }}
              options={ruleOptions()}
            />

            

            <RuleValueEditor
              field={field()}
              op={node.op}
              value={node.value}
              enum={field()?.enum}
              class='flex-1 px-2 py-1 rounded-md border'
              onChange={value => update({ value })}
            />
          </div>
        )
      })}
    />
  )
}

const Select = props => (
  <select
    {...props}
    options={null}
    clearable={null}
    
    class={props.class ?? 'flex-1 px-2 py-1 rounded-md border'}
    // @ts-ignore
    prop:value={props.value}
    onChange={e => {
      const sel = e.target as HTMLSelectElement
      props.onChange?.(sel.multiple ? [...sel.selectedOptions].map(opt => opt.value) : sel.value)
    }}
  >
    {(props.clearable || props.placeholder) && <option value='' disabled={!props.clearable}>{props.placeholder}</option>}
    {props.options?.map(e => <option value={e.value}>{e.label}</option>)}
  </select>
)