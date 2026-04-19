import { createMemo, createSignal } from "solid-js"

type Opt = Partial<{ value, onChange, defaultValue, initialValue }>

export const useControlled = (opt?: Opt) => {
  opt ??= {}
  const [v, setV] = createSignal(opt.value ?? opt.initialValue ?? opt.defaultValue)
  const v2 = createMemo(() => 'value' in opt ? opt.value : v())
  return {
    get value() { return v2() },
    onChange: (v) => {
      v ??= opt.defaultValue
      setV(v)
      opt.onChange?.(v)
    },
  }
}
