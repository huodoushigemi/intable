import { createSignal, createMemo, createSelector } from 'solid-js'
import { log, toArr } from '../utils'

interface UseSelectorOpt<T> {
  value?: T
  onChange?: (v: T) => void
  multiple?: boolean
  selectable?: (v) => boolean
}

class SingleSet implements Set<any> {
  #value: any
  constructor(value) { this.#value = Array.from(value || [])[0] }
  add(value) { this.#value = value; return this }
  clear() { this.#value = undefined }
  delete(value) { if (this.#value === value) { this.#value = undefined; return true } return false }
  forEach(callbackfn) { if (this.#value !== undefined) callbackfn.call(this, this.#value, this.#value, this) }
  has(value) { return this.#value === value }
  get size() { return this.#value !== undefined ? 1 : 0 }
  entries() { return this.values() }
  keys() { return this.values() }
  values() { return this.#value !== undefined ? [[this.#value, this.#value]].entries() : [].entries() }
  [Symbol.iterator]() { return this.values()[Symbol.iterator]() }
  [Symbol.toStringTag] = 'SingleSet'
}

export function useSelector<T = any>(opt: UseSelectorOpt<T>) {
  const { value: initialValue, onChange, multiple = false, selectable } = opt

  const Set2 = (multiple ? Set : SingleSet) as SetConstructor
  
  const [selected, setSelected] = createSignal(new Set2(toArr(initialValue)))

  // 检查是否包含某个值
  const has = createSelector<Set<any>, any>(selected, (a, b) => b.has(a as T))

  // 检查值是否可选择
  const isSelectable = (v: T): boolean => {
    return selectable ? selectable(v) : true
  }

  // 清空选择
  const clear = () => {
    setSelected(new Set2())
    onChange?.(value())
  }

  // 设置选择
  const set = (v: T) => {
    if (!isSelectable(v)) return
    setSelected(new Set2(toArr(v)))
    onChange?.(value())
  }

  // 添加选择
  const add = (v: T) => {
    if (!isSelectable(v)) return
    const newSet = new Set2(selected())
    newSet.add(v)
    setSelected(newSet)
    onChange?.(value())
  }

  // 删除选择
  const del = (v: T) => {
    const newSet = new Set2(selected())
    newSet.delete(v)
    setSelected(newSet)
    onChange?.(value())
  }

  // 切换选择状态
  const toggle = (v: T) => {
    has(v) ? del(v) : add(v)
  }

  // 使用 createMemo 优化 selected 的计算
  const value = createMemo(() => {
    return (multiple ? Array.from(selected()) : Array.from(selected())[0]) as T
  })

  return {
    clear,
    set,
    has,
    add,
    del,
    toggle,
    get value() { return value() }
  }
}