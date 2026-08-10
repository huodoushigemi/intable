import { createSignal, createMemo, createResource, For, Show, type JSX, onMount, onCleanup, createEffect, untrack, mergeProps } from 'solid-js'
import { Floating } from './Popover'
import { Tags, Tag } from '../plugins/RenderPlugin/components'
import { unionBy } from 'es-toolkit'
import { useSelector, type UseSelectorOpt } from '../hooks/useSelector'

export interface SelectOption {
  label: string
  value: any
  disabled?: boolean
}

export interface SelectProps {
  ref?: (el: HTMLDivElement) => void
  value?: any
  onChange?: (value: any) => void
  options?: SelectOption[]
  request?: (params: { keyword?: string }) => Promise<SelectOption[]>
  multiple?: boolean
  searchable?: boolean
  placeholder?: string
  disabled?: boolean
  border?: boolean
  class?: string
  style?: string | JSX.CSSProperties
  valueKey?: string
}

export const Select = (props: SelectProps) => {
  const selector = useSelector(mergeProps<UseSelectorOpt<any>[]>(props, {
    get key() { return props.valueKey },
    onChange: (v) => props.onChange?.(v)
  }))
  const [open, setOpen] = createSignal(false)
  const [search, setSearch] = createSignal('')
  const border = () => props.border !== false
  let searchInput!: HTMLInputElement
  let triggerRef!: HTMLDivElement
  let dropdownRef!: HTMLDivElement

  const toarr = (v: any) => Array.isArray(v) ? v : v != null ? [v] : []

  // 使用 request 获取远程数据
  const [remoteOptions] = createResource(
    () => ({ keyword: search(), open: open() }),
    async ({ keyword, open }) => {
      if (!props.request || !open) return []
      return props.request({ keyword })
    }
  )

  // 合并本地和远程选项
  const allOptions = createMemo(() => {
    // return unionBy(props.options || [], remoteOptions() || [], e => e.value)
    return unionBy(props.options || [], remoteOptions() || [], e => props.valueKey ? e.value?.[props.valueKey] : e.value)
  })

  const filteredOptions = createMemo(() => {
    const s = search().toLowerCase().trim()
    if (!s) return allOptions()
    return allOptions().filter(o =>
      o.label.toLowerCase().includes(s) || String(o.value).toLowerCase().includes(s)
    )
  })

  const handleSelect = (opt: SelectOption) => {
    if (opt.disabled) return
    if (props.multiple) {
      selector.toggle(opt.value)
    } else {
      selector.set(opt.value)
      setOpen(false)
    }
    setSearch('')
  }

  const handleRemove = (val: any) => {
    selector.del(val)
  }

  const getLabel = (val: any) => {
    const k = props.valueKey
    const opt = allOptions().find(o => k ? o.value?.[k] === val[k] : o.value === val)
    return opt?.label ?? (k ? val?.[k] : val)
  }

  // 点击外部关闭
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as Node
    if (!triggerRef?.contains(target) && !dropdownRef?.contains(target)) {
      setOpen(false)
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside)
    onCleanup(() => document.removeEventListener('click', handleClickOutside))
  })

  createEffect(() => {
    if (open()) setTimeout(() => searchInput?.focus(), 0)
  })

  const trigger = (
    <div
      ref={(el: any) => {
        el.showPicker = () => setOpen(true)
        triggerRef = el
        props.ref?.(el)
      }}
      class={`in-select-trigger flex items-center gap-1 min-h-8 px-2 rd-sm cursor-pointer ${border() ? 'bg-white border border-gray/30 hover:border-primary' : ''} ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${props.class || ''}`}
      style={props.style}
      onClick={(e) => {
        e.stopPropagation()
        if (!props.disabled) setOpen(!open())
      }}
    >
      <Show
        when={props.multiple}
        fallback={
          <span class={`flex-1 truncate ${selector.value != null ? '' : 'text-gray-400'}`}>
            {selector.value != null ? getLabel(selector.value) : (props.placeholder || '请选择')}
          </span>
        }
      >
        <div class='flex flex-wrap gap-1 flex-1'>
          <Show when={toarr(selector.value).length > 0} fallback={<span class='text-gray-400'>{props.placeholder || '请选择'}</span>}>
            <For each={toarr(selector.value)}>
              {val => (
                <Tag value={getLabel(val)} onDel={() => handleRemove(val)} />
              )}
            </For>
          </Show>
        </div>
      </Show>
      <span class={`flex-shrink-0 transition-transform`}>
        <ILucideChevronDown class='size-4 text-gray-400' />
      </span>
    </div>
  )

  const floating = (
    <div
      ref={dropdownRef}
      class='in-select-dropdown bg-white border border-gray/20 rd-sm shadow-lg max-h-60 overflow-hidden flex flex-col z-9'
    >
      <Show when={props.searchable}>
        <div class='p-2 border-b border-gray/10'>
          <input
            ref={searchInput}
            type='text'
            class='w-full px-2 py-1 text-sm border border-gray/20 rd-sm outline-none focus:border-primary'
            placeholder='搜索...'
            value={search()}
            onInput={e => setSearch(e.currentTarget.value)}
            onClick={e => e.stopPropagation()}
          />
        </div>
      </Show>
      <div class='overflow-y-auto'>
        <Show when={filteredOptions().length > 0} fallback={<div class='p-3 text-sm text-gray-400 text-center'>无数据</div>}>
          <For each={filteredOptions()}>
            {opt => (
              <div
                class={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors ${selector.has(opt.value) ? 'in-select-option-active' : 'hover:bg-gray/5'} ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => handleSelect(opt)}
              >
                <span class='flex-1 truncate'>{opt.label}</span>
                <Show when={props.multiple}>
                  {selector.has(opt.value) && <ILucideCheck class='size-3' />}
                </Show>
                <Show when={!props.multiple && selector.has(opt.value)}>
                  <ILucideCheck class='size-4 text-primary flex-shrink-0' />
                </Show>
              </div>
            )}
          </For>
        </Show>
      </div>
    </div>
  )

  return (
    <Floating
      reference={trigger}
      floating={open() ? floating : undefined}
      portal={document.body}
      // strategy={'fixed'}
      placement='bottom-start'
    />
  )
}
