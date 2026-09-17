import { createSignal, mergeProps } from "solid-js"

type Opt = Partial<{
  value
  onChange
  defaultValue
  initialValue
}>

export const useControlled = <T extends Opt>(opt: T) => {
  const [_opt, $setOpt] = createSignal(opt ?? {})
  opt = mergeProps(_opt) as T

  const [v, setV] = createSignal(opt.value ?? opt.initialValue ?? opt.defaultValue)
  const val = () => 'value' in opt ? opt.value : v()
  
  return mergeProps(opt, {
    get value() { return val() },
    onChange: (v) => {
      v ??= opt.defaultValue
      setV(v)
      opt.onChange?.(v)
    },
    $setOpt
  })
}
