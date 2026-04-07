import { AndOrFields, isValueFreeOp, newRule, RuleValueEditor, type Field } from './AndOrFields'
import type { AndOrNode, RuleNode } from './AndOr'
import { Popover } from './Popover'
import { autoPlacement, offset } from 'floating-ui-solid'
import { Show } from 'solid-js'
import { isEqual } from 'es-toolkit'

export type FilterRule =
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

type FilterProps = {
  col: Field
  tree: AndOrNode | undefined
  setTree: (tree?: AndOrNode) => void
}

function isRuleNode(node?: AndOrNode): node is RuleNode {
  if (!node) return false
  return 'field' in node
}

function firstRule(node?: AndOrNode): RuleNode | undefined {
  if (!node) return
  if (isRuleNode(node)) return node
  for (const child of node.children ?? []) {
    const hit = firstRule(child)
    if (hit) return hit
  }
}

export const Filter = (props: FilterProps) => {
  let filterBtn!: HTMLButtonElement

  const tree = () => props.tree
  const rule = () => firstRule(tree())
  const isValueFree = () => isValueFreeOp(rule()?.op)

  const updateQuickValue = (value: string) => {
    if (isEqual({ ...tree(), value }, newRule(props.col))) {
      props.setTree()
      return
    }
    if (!tree()) {
      props.setTree(newRule(props.col, { value }))
      return
    }
    const r = firstRule(tree())
    if (!r) return
    r.value = value
    props.setTree(tree())
  }

  return (
    <div
      class='mt-1 flex gap-1.5'
      on:keydown={e => e.stopPropagation()}
      on:pointerdown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <Show when={!isValueFree()} fallback={<div class='filter-input min-w-24 op-60 select-none'></div>}>
        <RuleValueEditor
          field={props.col}
          op={rule()?.op}
          class='filter-input h-6'
          value={rule()?.value ?? ''}
          enum={props.col.enum}
          onChange={value => updateQuickValue(String(value ?? ''))}
        />
      </Show>
      <button ref={filterBtn} class={`filter-input w-a! flex items-center justify-center ${tree() && 'bg-blue/20! c-blue b-#00000000!'}`} aria-label='筛选' title='筛选'>
        <ILucideFilter class='size-3.5 op-75' />
      </button>
      <Popover
        trigger='click'
        strategy='fixed'
        placement='bottom'
        middleware={[offset({ mainAxis: 6 }), autoPlacement({ boundary: document.body, alignment: 'start' })]}
        reference={filterBtn}
        floating={(
          <div class='tt-menu p-4! z-2'>
            <AndOrFields
              fields={[props.col]}
              value={tree() ?? newRule(props.col)}
              onChange={value => props.setTree(isEqual(value, newRule(props.col)) ? undefined : value)}
              newRule={() => newRule(props.col)}
              hideFields
            />
          </div>
        )}
      />
    </div>
  )
}