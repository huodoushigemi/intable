import { $PROXY, createComputed, createEffect, createMemo, createRenderEffect, createRoot, createSignal, mergeProps, on, onCleanup, untrack, type Signal } from 'solid-js'
import { createEventListener } from '@solid-primitives/event-listener'
import { createPointerListeners } from '@solid-primitives/pointer'
import { access, type Many, type MaybeAccessor } from '@solid-primitives/utils'
import { makePersisted, storageSync } from '@solid-primitives/storage'
import { createMutationObserver } from '@solid-primitives/mutation-observer'
import { isFunction, isPromise, mapValues } from 'es-toolkit'
import { castArray } from 'es-toolkit/compat'
import { createKeybindingsHandler } from 'tinykeys'
import { log, unFn } from '../utils'
import { $RAW, createMutable } from 'solid-js/store'

interface UseDragOptions {
  start?(
    e: PointerEvent,
    move: (cb: MoveCB) => void,
    end: (cb: EndCb) => void
  ): void,
}

type MoveCB = (e: PointerEvent, o: { sx: number, sy: number, ox: number, oy: number }) => void
type EndCb = (e: PointerEvent) => void

export function usePointerDrag(el: MaybeAccessor<HTMLElement | undefined>, options: UseDragOptions) {
  createPointerListeners({
    target: el,
    passive: false,
    onDown(e) {
      e.preventDefault()
      // e.stopPropagation()
      const [sx, sy] = [e.x, e.y]

      let move: MoveCB | void
      let end: EndCb | void
      options.start?.(e, (cb) => move = cb, (cb) => end = cb)
      
      createRoot(dispose => {
        createPointerListeners({
          target: document,
          onMove(e) {
            const [ox, oy] = [e.x - sx, e.y - sy]
            move?.(e, { sx, sy, ox, oy })
          },
          onUp() {
            end?.(e)
            dispose()
            move = void 0
            end = void 0
          }
        })
      })
    }
  })
}

export function model(el: any, value: () => [() => string, (v: string) => any]) {
  const [field, setField] = value()
  createRenderEffect(() => (el.value = field()))
  el.addEventListener("input", (e) => setField((e.target as HTMLInputElement).value))
}

export function toSignle<T extends Record<string, any>>(state: T, k: keyof T) {
  return [() => state[k], v => state[k] = v]
}

export function useDark() {
  const get = v => v == 'dark' || (prefersDark() && !v), set = v => v ? 'dark' : 'light'
  const prefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches
  const dark = makePersisted(createSignal(prefersDark()), { name: 'color-schema', storage: localStorage, sync: storageSync, serialize: set, deserialize: get })
  createEffect(() => document.documentElement.classList[dark[0]() ? 'add' : 'remove']('dark'))
  createEffect(() =>  window.dispatchEvent(new StorageEvent('storage', { key: 'color-schema', newValue: set(dark[0]()) })))
  return dark
}

export function useMemoAsync<T>(fn: (prev?: T) => Promise<T> | T, init?: Awaited<T>) {
  const REJECT = Symbol()
  const [val, setVal] = createSignal(init)
  createComputed(async () => {
    const ret = fn(untrack(val))
    const v = ret instanceof Promise ? await new Promise((resolve) => {
      ret.then(resolve)
      onCleanup(() => resolve(REJECT))
    }) : ret
    v == REJECT || setVal(() => v)
  })
  return val
}

export function useSignle2<T>(v: T | (() => T), opt?: { before?: (v: T) => Promise<T | void> | T }) {
  const state = createSignal(isFunction(v) ? void 0 : v)
  const before = v => {
    const v2 = opt?.before?.(v)
    return isPromise(v2) ? v2.then(v3 => v3 === void 0 ? v : v3) : v2 ?? v
  }
  
  const val = useMemoAsync(() => before(state[0]() as T))

  if (isFunction(v)) {
    const fned = useMemoAsync(() => before(v()))
    createComputed(() => state[1](fned()))
  }

  return [val, state[1]] as Signal<T>
}

const $MEMO = Symbol()

type Reactive<T extends object> = { [K in keyof T]: T[K] extends () => infer V ? V : T[K] }
export function toReactive<T extends object>(fn: (() => T) | T): Reactive<T> {
  const v = () => unFn(fn)
  const trueFn = () => true
  const get = k => (e => typeof e == 'function' && $MEMO in e ? e() : e)(v()[k])
  return new Proxy(Object.create(null), {
    get: (o, k, r) => k == $PROXY ? r : k == $RAW ? r : (v => typeof v == 'function' && $MEMO in v ? v() : v)(v()[k]),
    set: trueFn,
    defineProperty: (o, k, attributes) => Object.defineProperty(v(), k, attributes),
    deleteProperty: trueFn,
    getPrototypeOf: () => Object.getPrototypeOf(v()),
    has: (o, p) => p == $PROXY || p in v(),
    ownKeys: (o) => Object.keys(v()),
    getOwnPropertyDescriptor: (o, k) => ({ enumerable: true, configurable: true, get() { return get(k) }, set: trueFn }),
  })
}

export function useMemo<T>(fn: () => T) {
  const ret = createMemo(fn)
  ret[$MEMO] = 1
  return ret
}

export function useHover(el: MaybeAccessor<Many<HTMLElement | undefined>>) {
  const [hover, setHover] = createSignal(false)
  createEventListener(el, 'pointerenter', () => setHover(true))
  createEventListener(el, 'pointerleave', () => setHover(false))
  return hover
}

export function useMouseDown(el: MaybeAccessor<Many<HTMLElement | undefined>>) {
  const [down, setDown] = createSignal(false)
  createEventListener(el, 'pointerdown', () => setDown(true))
  createEventListener(document.body, 'pointerup', () => setDown(false))
  return down
}

export function useClicked(el: MaybeAccessor<Many<HTMLElement | undefined>>) {
  const [clicked, setClicked] = createSignal(false)
  const els = () => castArray(access(el))
  createEventListener(() => els().map(e => e?.getRootNode()), 'click', e => setClicked(els().some(el => el?.contains(e.target))))
  return clicked
}

export function useMutation<T>(initial: MaybeAccessor<Node | Node[]>, options: MutationObserverInit, cb: () => T) {
  const ret = createSignal<T>(cb())
  createMutationObserver(initial, options, ms => ret[1](cb() as any))
  return ret[0]
}

export function useTinykeys(el: MaybeAccessor<HTMLElement | undefined>, handlers) {
  createEventListener(el, 'keydown', createKeybindingsHandler({
    ...mapValues(handlers, cb => e => {
      e.preventDefault()
      cb(e)
    })
  }))
}

export function useHistory([val, setVal]) {
  let bool = 1
  const state = createMutable({ index: -1, history: [] as any[] })
  const clear = () => (state.index = 0, state.history = [val()])
  const canUndo = () => state.index > 0
  const canRedo = () => state.index < state.history.length - 1
  const undo = () => canUndo() && ((bool = 0) || setVal(state.history[--state.index]))
  const redo = () => canRedo() && ((bool = 0) || setVal(state.history[++state.index]))
  createRenderEffect(on(val, ret => {
    if (ret == null) return // todo
    if (!bool) return bool = 1
    if (canRedo()) state.history = state.history.slice(0, state.index + 1)
    state.history[++state.index] = ret
  }))
  return { undo, redo, clear, get index() { return state.index }, get history() { return state.history } }
}