import { createSignal, createMemo, createSelector } from 'solid-js'
import { log } from '../utils'

interface UseSelectorOpt<T> {
  value?: T
  onChange?: (v: T) => void
  multiple?: boolean
  selectable?: (v) => boolean
}

export function useSelector<T = any>(opt: UseSelectorOpt<T>) {
  const { value: initialValue, onChange, multiple = false, selectable } = opt
  
  // 对于多选，使用 Set 存储选中值；对于单选，直接存储值
  const [selected, setSelected] = createSignal<Set<T> | T>((() => {
    if (multiple) {
      return initialValue ? new Set(Array.isArray(initialValue) ? initialValue : [initialValue]) : new Set()
    }
    return initialValue as T
  })())

  // 检查值是否可选择
  const isSelectable = (v: T): boolean => {
    return selectable ? selectable(v) : true
  }

  // 清空选择
  const clear = () => {
    if (multiple) {
      setSelected(new Set())
      onChange?.([] as unknown as T)
    } else {
      setSelected(undefined as unknown as T)
      onChange?.(undefined as unknown as T)
    }
  }

  // 设置选择
  const set = (v: T) => {
    if (!isSelectable(v)) return
    
    if (multiple) {
      const newSet = new Set(Array.isArray(v) ? v : [v])
      setSelected(newSet)
      onChange?.(Array.from(newSet) as unknown as T)
    } else {
      setSelected(v)
      onChange?.(v)
    }
  }

  // 检查是否包含某个值
  const has = createSelector(selected, (a, b) => {
    if (multiple) {
      return (b as Set<T>).has(a as T)
    }
    return a === b
  })

  // 添加选择
  const add = (v: T) => {
    if (!isSelectable(v)) return
    
    if (multiple) {
      const newSet = new Set(selected() as Set<T>)
      newSet.add(v)
      setSelected(newSet)
      onChange?.(Array.from(newSet) as unknown as T)
    } else {
      setSelected(v)
      onChange?.(v)
    }
  }

  // 删除选择
  const del = (v: T) => {
    if (multiple) {
      const newSet = new Set(selected() as Set<T>)
      newSet.delete(v)
      setSelected(newSet)
      onChange?.(Array.from(newSet) as unknown as T)
    } else if (selected() === v) {
      setSelected(undefined as unknown as T)
      onChange?.(undefined as unknown as T)
    }
  }

  // 切换选择状态
  const toggle = (v: T) => {
    has(v) ? del(v) : add(v)
  }

  // 使用 createMemo 优化 selected 的计算
  const selectedValue = createMemo(() => {
    return multiple ? Array.from(selected() as Set<T>) : selected() as any
  })

  return {
    clear,
    set,
    has,
    add,
    del,
    toggle,
    get value() { return selectedValue() }
  }
}