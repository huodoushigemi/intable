import { createSignal, mergeProps, runWithOwner } from "solid-js"

type Opt = Partial<{
  value
  onChange
  defaultValue
  initialValue
}>

export const useControlled = <T extends Opt>(opt: T, owner?) => {
  const run = fn => owner ? runWithOwner(owner, fn) : fn()
  
  const [_opt, $setOpt] = run(() => createSignal(opt ?? {}))
  opt = run(() => mergeProps(_opt))

  const [v, setV] = run(() => createSignal(opt.value ?? opt.initialValue ?? opt.defaultValue))
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
