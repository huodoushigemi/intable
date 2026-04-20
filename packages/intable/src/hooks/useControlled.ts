import { createLazyMemo } from "@solid-primitives/memo"
import { createMemo, createSignal, mergeProps } from "solid-js"

type Opt = Partial<{ value, onChange, defaultValue, initialValue }>

export const useControlled = <T extends Opt>(opt: T) => {
  opt ??= {} as T
  const [v, setV] = createSignal(opt.value ?? opt.initialValue ?? opt.defaultValue)
  const v2 = createMemo(() => 'value' in opt ? opt.value : v())
  
  return mergeProps(opt, {
    get value() { return v2() },
    onChange: (v) => {
      v ??= opt.defaultValue
      setV(v)
      opt.onChange?.(v)
    },
  })
}
