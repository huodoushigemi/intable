import { createMemo, type JSX, onCleanup, For, getOwner, runWithOwner, children, Show, createRoot } from 'solid-js'
import { createMutable } from 'solid-js/store'
import { log } from '../utils'

/**
 * RecycleList — a keyed list component with DOM recycling.
 *
 * Works like SolidJS `<For>` (keyed by reference identity) but instead of
 * destroying DOM when items leave the list, it hides and pools those DOM
 * nodes. When new items enter, a pooled slot is reused by swapping the
 * reactive signals, avoiding the cost of creating & hydrating fresh DOM.
 *
 * Each slot gets its own `createRoot` so that its inner reactive tree
 * (memos, effects) is NOT owned by the reconciliation memo — preventing
 * SolidJS from disposing child computations when the outer memo re-runs.
 *
 * Ideal for virtual-scroll scenarios where items constantly enter/leave
 * the viewport but the DOM structure per item is identical.
 *
 * ```tsx
 * <RecycleList each={visibleItems()}>
 *   {(item, index) => <div>{item().name} at {index()}</div>}
 * </RecycleList>
 * ```
 */
export function RecycleList<T>(props: {
  each: T[]
  children: (item: () => T, index: () => number) => JSX.Element
}): JSX.Element {
  interface Val {
    v: any
    i: number
    active: boolean
    el?: any
  }
  
  // Active slots keyed by identity reference
  const active = new Map<T, Val>()
  // Pool of inactive (hidden) slots ready for reuse
  const pool: Val[] = []
  const owner = getOwner()

  function state<T extends Object>(initial: T): T {
    return runWithOwner(owner, () => createMutable(initial))!
  }

  const list = createMemo(() => {
    const items = props.each || []
    const nextKeys = new Set(items)

    // 1. Deactivate slots whose keys left the list → move to pool
    for (const [key, val] of active) {
      if (!nextKeys.has(key)) {
        pool.push(val)
        active.delete(key)
        // val.v = null
        // val.i = -1
        val.active = false
      }
    }
 
    // 2. For each item: reuse existing active slot, recycle from pool, or create new
    const list = [] as Val[]
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (active.has(item)) {
        const slot = active.get(item)!
        slot.i = i
        slot.v = item
      } else if (pool.length > 0) {
        const slot = pool.pop()!
        slot.i = i
        slot.v = item
        slot.active = true
        active.set(item, slot)
      } else {
        active.set(item, state({ v: item, i, active: true }))
      }
      list.push(active.get(item)!)
    }

    return list.concat(...pool)
  })

  onCleanup(() => {
    active.clear()
    pool.length = 0
  })

  return (
    <For each={list()}>{(val) => {
      return <>
        {val.active && runWithOwner(owner, () => (
          val.el ??= props.children(() => val.v, () => val.i)
        ))}
      </>
    }}</For>
  )
}
