import { Match, Switch, createMemo, Show } from 'solid-js'
import { AndOr } from './AndOr'
import type { AndOrNode, RuleNode } from './AndOr'
import { resolveOptions } from '../utils'
import { component } from 'undestructure-macros'

export type RuleOp =
  | 'contains'
  | 'eq'
  | 'neq'
  | 'startwith'
  | 'endwith'
  | 'blank'
  | 'noblank'
  | 'lt'
  | 'gt'
  | 'lte'
  | 'gte'
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
    { label: '不等于', value: 'neq' },
    { label: '开头是', value: 'startwith' },
    { label: '结尾是', value: 'endwith' },
    { label: '为空', value: 'blank' },
    { label: '不为空', value: 'noblank' },
  ],
  number: [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'neq' },
    { label: '小于', value: 'lt' },
    { label: '大于', value: 'gt' },
    { label: '小于等于', value: 'lte' },
    { label: '大于等于', value: 'gte' },
    { label: '为空', value: 'blank' },
    { label: '不为空', value: 'noblank' },
  ],
  date: [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'neq' },
    { label: '早于', value: 'lt' },
    { label: '晚于', value: 'gt' },
    { label: '不晚于', value: 'lte' },
    { label: '不早于', value: 'gte' },
    { label: '为空', value: 'blank' },
    { label: '不为空', value: 'noblank' },
  ],
  enum: [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'neq' },
    { label: '为空', value: 'blank' },
    { label: '不为空', value: 'noblank' },
  ],
  checkbox: [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'neq' },
    { label: '为空', value: 'blank' },
    { label: '不为空', value: 'noblank' },
  ],
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
        <select
          class={props.class ?? 'flex-1 px-2 py-1 rounded-md border'}
          value={props.value ?? ''}
          onInput={e => props.onChange((e.target as HTMLSelectElement).value)}
        >
          <option value=''></option>
          {options().map(e => <option value={String(e.value)}>{String(e.label)}</option>)}
        </select>
      </Match>

      <Match when={['checkbox', 'switch', 'boolean'].includes(type())}>
        <select
          class={props.class ?? 'flex-1 px-2 py-1 rounded-md border'}
          value={props.value ?? ''}
          onInput={e => props.onChange((e.target as HTMLSelectElement).value)}
        >
          <option value=''></option>
          {[true, false].map(e => <option value={String(e)}>{String(e)}</option>)}
        </select>
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
            <select
              class={`px-2 py-1 rounded-md border ${props.hideFields ? 'hidden' : ''}`}
              value={node.field}
              onInput={e => {
                const fieldId = (e.target as HTMLSelectElement).value
                const f = props.fields.find(v => v.id === fieldId)
                update(newRule(f!, { field: fieldId }))
              }}
            >
              <option value='' disabled>选择字段</option>
              {props.fields.map(f => <option value={f.id}>{f.name}</option>)}
            </select>

            <select
              class='px-2 py-1 rounded-md border'
              value={node.op || defaultOp(type())}
              onInput={e => {
                const op = (e.target as HTMLSelectElement).value as RuleOp
                update({ op, value: VALUE_FREE_RULES.includes(op) ? null : (node.value ?? '') })
              }}
            >
              {ruleOptions().map(r => <option value={r.value}>{r.label}</option>)}
            </select>

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