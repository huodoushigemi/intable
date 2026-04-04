import { For, Match, Show, Switch, createEffect, mergeProps, type JSX } from 'solid-js'
import { createMutable } from 'solid-js/store'

export type AndOrNode = GroupNode | RuleNode

type GroupNode = {
  op?: 'and' | 'or'
  children?: AndOrNode[]
}

export type RuleNode = {
  field: string
  op: string
  value: any
}

export type AndOrProps = {
  value?: AndOrNode
  onChange?: (value: AndOrNode) => void
  renderRule: (ctx: { node: RuleNode; update: (patch: Partial<RuleNode>) => void }) => JSX.Element
  renderGroup?: (ctx: { node: GroupNode; update: (patch: Partial<GroupNode>) => void }) => JSX.Element
  class?: string
  style?: string
  newRule?: (current: RuleNode) => RuleNode
}

function isRuleNode(node: AndOrNode): node is RuleNode {
  return 'field' in node
}

function isGroupNode(node: AndOrNode): node is GroupNode {
  return !isRuleNode(node)
}

function createRule(field = '', op = 'eq', value: any = null): RuleNode {
  return { field, op, value }
}

function createGroup(op: 'and' | 'or' = 'and', children: AndOrNode[] = []): GroupNode {
  return { op, children }
}

function defaultTree(): AndOrNode {
  // return createGroup('and', [
  //   createRule(''),
  //   createRule(''),
  //   createGroup('or', [createRule(''), createRule('')]),
  // ])
  return createRule('name', 'contains', '')
}

function updateNode(target: AndOrNode, fn: (node: AndOrNode) => AndOrNode): AndOrNode {
  const next = fn(target)
  if (next !== target) Object.assign(target, next)
  return target
}

function removeNode(root: AndOrNode, target: AndOrNode): boolean {
  if (!isGroupNode(root) || !root.children?.length) return false
  for (let i = 0; i < root.children.length; i++) {
    const child = root.children[i]
    if (child === target) {
      root.children.splice(i, 1)
      return true
    }
    if (isGroupNode(child) && removeNode(child, target)) return true
  }
  return false
}

function normalizeNode(node: AndOrNode): AndOrNode {
  if (!isGroupNode(node)) return node
  const children = node.children ?? []
  node.children = children
  for (let i = 0; i < children.length; i++) {
    children[i] = normalizeNode(children[i])
  }
  if (children.length === 1) return children[0]
  return node
}

function normalizeTree(root: AndOrNode): AndOrNode {
  return normalizeNode(root)
}

function addByCurrentGroup(root: AndOrNode, target: AndOrNode, op: 'and' | 'or', next: RuleNode): { next: AndOrNode; found: boolean } {
  if (root === target) {
    if (!isGroupNode(root)) return { next: createGroup(op, [root, next]), found: true }
    const children = root.children ?? (root.children = [])
    if (root.op === op) {
      children.push(next)
      return { next: root, found: true }
    }
    return { next: createGroup(op, [root, next]), found: true }
  }
  if (!isGroupNode(root)) return { next: root, found: false }
  if (!root.children?.length) return { next: root, found: false }

  const children = root.children
  for (let idx = 0; idx < children.length; idx++) {
    const child = children[idx]
    if (child === target) {
      if (root.op !== op) {
        children[idx] = createGroup(op, [child, next])
      } else {
        children.splice(idx + 1, 0, next)
      }
      return { next: root, found: true }
    }

    if (isGroupNode(child)) {
      const ret = addByCurrentGroup(child, target, op, next)
      if (ret.found) {
        if (ret.next !== child) children[idx] = ret.next
        return { next: root, found: true }
      }
    }
  }
  return { next: root, found: false }
}

const RuleEditor = (props: {
  node: RuleNode
  content: JSX.Element
  onAdd: (op: 'and' | 'or') => void
  onRemove: () => void
}) => (
  <div class='group flex items-center gap-2 min-w-52'>
    {props.content}
    <div class='flex items-center gap-1 transition-opacity op-0 group-hover:op-100'>
      <button class='text-3 px-1.5 py-1 rounded-md hover:bg-black/8' onClick={() => props.onAdd('and')}>+与</button>
      <button class='text-3 px-1.5 py-1 rounded-md hover:bg-black/8' onClick={() => props.onAdd('or')}>+或</button>
      <button class='text-3 px-2 py-1 rounded-md hover:bg-black/8' onClick={props.onRemove}>x</button>
    </div>
  </div>
)

const GroupNode = (props: {
  class?: string
  node: GroupNode
  content: JSX.Element
  onAdd: (op: 'and' | 'or') => void
  onRemove: () => void
}) => (
  <div class={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl shadow-sm ${
    props.node.op === 'or'
      ? 'b-(1 solid #f59e0b) bg-#fff3d6/85 c-#7c2d12'
      : 'b-(1 solid #4f7ff0) bg-#dbe6ff/75 c-#1e3a8a'
  } ${props.class ?? ''}`}>
    {props.content}
  </div>
)

export const AndOr = (_props: AndOrProps) => {
  const props = mergeProps({ value: defaultTree() }, _props)
  const state = createMutable({ tree: props.value! as AndOrNode })

  const emit = (v: AndOrNode) => {
    const next = normalizeTree(v)
    state.tree = next 
    props.onChange?.(next)
  }

  const patchNode = (target: AndOrNode, fn: (node: AndOrNode) => AndOrNode) => {
    updateNode(target, fn)
    emit(state.tree)
  }
  const addNodeBelow = (target: AndOrNode, op: 'and' | 'or') => {
    const current = state.tree
    if (isRuleNode(current)) {
      emit(createGroup(op, [current, props.newRule?.(current) ?? createRule('')]))
      return
    }
    const ret = addByCurrentGroup(current, target, op, props.newRule?.(target) ?? createRule(''))
    emit(ret.next)
  }
  const dropNode = (target: AndOrNode) => {
    if (target === state.tree) return
    if (removeNode(state.tree, target)) emit(state.tree)
  }

  createEffect(() => {
    if (props.value) state.tree = props.value
  })

  const NodeView = (o: { node: AndOrNode }): JSX.Element => {
    return (
      <Switch>
        <Match when={isRuleNode(o.node)}>
          <RuleEditor
            node={o.node as RuleNode}
            content={<props.renderRule node={o.node as RuleNode} update={patch => patchNode(o.node, n => ({ ...(n as RuleNode), ...patch }))} />}
            onAdd={op => addNodeBelow(o.node, op)}
            onRemove={() => dropNode(o.node)}
          />
        </Match>

        <Match when={isGroupNode(o.node)}>
          <div class='relative min-h-16 flex pl-4'>
            <div class={`relative b-r-0 w-10 rd-l-4 ${o.node.op === 'or' ? 'b-(1 dashed #f59e0b)' : 'b-(1 dashed #4f7ff0)'}`}>
              <GroupNode
                class='absolute left--0 top-1/2 translate-y--1/2 translate-x--1/2 z-1'
                node={o.node as GroupNode}
                content={(
                  <select
                    class='bg-transparent text-4 leading-5 font-medium outline-none'
                    style={{ appearance: 'none' }}
                    value={o.node.op ?? 'and'}
                    onInput={e => patchNode(o.node, n => ({ ...(n as GroupNode), op: (e.target as HTMLSelectElement).value as 'and' | 'or' }))}
                  >
                    <option value='and'>与</option>
                    <option value='or'>或</option>
                  </select>
                )}
                onAdd={op => addNodeBelow(o.node, op)}
                onRemove={() => dropNode(o.node)}
              />
            </div>
            <Show when={o.node.children?.length}>
              <div class='flex flex-col items-start space-y-5'>
                <For each={o.node.children}>{child => (
                  <NodeView node={child} />
                )}</For>
              </div>
            </Show>
          </div>
        </Match>
      </Switch>
    )
  }

  return (
    <div class={`and-or-builder ${props.class ?? ''}`}>
      <NodeView node={state.tree} />
    </div>
  )
}
