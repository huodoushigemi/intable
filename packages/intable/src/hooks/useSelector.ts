import { createSignal, createMemo, createSelector } from 'solid-js'
import { log, toArr } from '../utils'
import { useControlled } from './useControlled'

interface UseSelectorOpt<T> {
  /**
   * The controlled value of the selector.
   */
  value?: T
  initialValue?: T
  onChange?: (v: T) => void
  multiple?: boolean
  selectable?: (v) => boolean
  key?: any
}

class KeyedSet extends Set {
  #key
  #map = new Map()
  constructor(value = [] as any[], key?) {
    super()
    this.#key = key
    for (const v of value) this.add(v)
  }
  has(value) {
    return this.#key ? this.#map.has(value[this.#key]) : super.has(value)
  }
  add(value) {
    if (this.#key) {
      const k = value[this.#key]
      const old = this.#map.get(k)
      old && super.delete(old)
      this.#map.set(k, value)
    }
    return super.add(value)
  }
  delete(value) {
    if (this.#key) {
      const k = value[this.#key]
      value = this.#map.get(k) ?? value
      this.#map.delete(k)
    }
    return super.delete(value)
  }
  clear() {
    this.#map.clear()
    return super.clear()
  }
}

class SingleSet extends KeyedSet {
  constructor(value, key?) {
    super([], key)
    for (const v of toArr(value)) this.add(v)
  }
  add(value: any) {
    this.clear()
    return super.add(value)
  }
}

export function useSelector<T = any>(opt: UseSelectorOpt<T>) {
  opt = useControlled(opt)
  const { onChange, multiple = false, selectable } = opt

  const Set2 = (v?) => multiple ? new KeyedSet(v, opt.key) : new SingleSet(v, opt.key)
  
  // const [selected, setSelected] = createSignal(Set2(toArr(initialValue)))
  const selected = createMemo(() => Set2(toArr(opt.value)))

  // 检查是否包含某个值
  const has = createSelector<Set<any>, any>(selected, (a, b) => b.has(a as T))

  // 检查值是否可选择
  const isSelectable = (v: T): boolean => {
    return selectable ? selectable(v) : true
  }

  // 清空选择
  const clear = () => {
    onChange?.(multiple ? [] : undefined as any)
  }

  // 设置选择
  const set = (v: T) => {
    if (!isSelectable(v)) return
    onChange?.(multiple ? [v] : v as any)
  }

  // 添加选择
  const add = (v: T) => {
    if (!isSelectable(v)) return
    const newSet = Set2([...selected()])
    newSet.add(v)
    onChange?.(multiple ? [...newSet] : [...newSet][0])
  }

  // 删除选择
  const del = (v: T) => {
    const newSet = Set2([...selected()])
    newSet.delete(v)
    onChange?.(multiple ? [...newSet] : [...newSet][0])
  }

  // 切换选择状态
  const toggle = (v: T) => {
    has(v) ? del(v) : add(v)
  }

  const isAll = (data: T[]) => !!data.length && data.every(d => has(d))

  const selectAll = (data: T[]) => {
    const val = data.filter(e => isSelectable(e))
    onChange?.(multiple ? val : val[0] as any)
  }

  return {
    clear,
    set,
    has,
    add,
    del,
    toggle,
    isAll,
    selectAll,
    get value() { return opt.value }
  }
}