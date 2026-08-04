import { For } from 'solid-js'
import { component } from 'undestructure-macros'
import { combineProps } from '@solid-primitives/props'

export const Checkbox = component(({ value, indeterminate, onChange, ...props }) => {
  props = combineProps({ get class() { return `you-checkbox ${value && 'checked'} ${indeterminate && 'indeterminate'}` } }, props)
  return (
    <input checked={value || false} prop:indeterminate={!!indeterminate} onChange={(e) => onChange?.(e.currentTarget.checked)} type="checkbox" {...props} />
  )
})

export const Files = component(({ ...props }) => {
  return (
    <Tags {...props} color='' />
  ) 
})

export const Tags = component(({ value, children, disabled, onChange, onAdd, color, ...props }) => {
  props = combineProps({ class: 'in-tags flex flex-wrap items-center gap-2 h-full' }, props)
  const toarr = v => Array.isArray(v) ? v : (v != null ? [v] : [])
  return (
    <div {...props}>
      <For each={toarr(value)}>{e => (
        <Tag disabled={disabled} value={e?.text ?? e?.label ?? e?.name ?? e} color={color ?? e?.color} onDel={() => onChange(toarr(value).filter(e2 => e2 != e))}>
          {children ? children(e) : (e?.text ?? e?.label ?? e?.name ?? e)}
        </Tag>
      )}</For>
      {!disabled && <Tag disabled onClick={onAdd}><ILucidePlus /></Tag>}
    </div>
  )
})

export const Tag = component(({ disabled, value, children, color, onDel, ...props }) => {
  const c = color === undefined && value != null ? stringToColor(String(value)) : color
  props = combineProps({
    get class() { return `in-tag flex items-center px-2 py-1 rd-sm text-3 lh-[1] ${c ? '' : 'bg-gray/20'}` },
    get style() { return c ? `color: ${c}; background: color-mix(in srgb, ${c} 15%, transparent)` : undefined }
  }, props)
  return (
    <div {...props}>
      {children}
      {!disabled && <ILucideX class='icon-clickable flex-shrink-0 size-4! ml-1 mr--1 op-75' onClick={onDel} />}
    </div>
  )
})

/** Star rating component. max defaults to 5. */
export const Rate = component(({ value, disabled, max = 5, onChange, ...props }) => {
  const val = () => Math.round(Number(value) || 0)
  props = combineProps({
    get class() { return `in-rate inline-flex items-center gap-0.5 ${disabled ? '' : 'cursor-pointer'}` },
  }, props)
  return (
    <div {...props}>
      <For each={Array.from({ length: max }, (_, i) => i + 1)}>
        {star => (
          <span
            class={`lh-none select-none ${disabled ? '' : 'hover:scale-110'} transition-transform`}
            style={{ color: star <= val() ? '#f59e0b' : '#d1d5db', cursor: disabled ? 'default' : 'pointer' }}
            onClick={() => !disabled && onChange?.(star)}
          >
            ★
          </span>
        )}
      </For>
    </div>
  )
})

/** Progress bar component. value is 0–100 or 0–1. */
export const Progress = component(({ value, disabled, onChange, ...props }) => {
  const pct = () => {
    const v = Number(value) || 0
    return v <= 1 ? Math.round(v * 100) : Math.min(100, Math.max(0, Math.round(v)))
  }
  // const color = () => pct() >= 100 ? '#10b981' : pct() >= 60 ? '#3b82f6' : pct() >= 30 ? '#f59e0b' : '#ef4444'
  const color = () => 'var(--c-primary)'
  props = combineProps({
    get class() { return 'in-progress flex items-center h-full w-full' },
  }, props)
  return (
    <div {...props}>
      <div class='flex-1 h-2 rd-full bg-gray-200 overflow-hidden' title={`${pct()}%`}>
        <div
          class='h-full rd-full transition-all duration-300'
          style={{ width: `${pct()}%`, background: color() }}
        />
      </div>
      <span class='ml-1 text-11px c-gray-500 min-w-30px text-right'>{pct()}%</span>
    </div>
  )
})

// 评估公式
export const evaluateFormula = (formula: string, data: any) => {
  try {
    const ctx = { data }
    return (new Function(...Object.keys(ctx), `return ` + formula))(...Object.values(ctx))
  } catch (error) {
    return '公式错误'
  }
}


export const text2colorMap: Record<string, string> = {
  // 成功 / 完成
  启用: '#10b981',
  完成: '#10b981',
  成功: '#10b981',
  success: '#10b981',
  done: '#10b981',
  completed: '#10b981',
  // 错误 / 失败
  错误: '#ef4444',
  失败: '#ef4444',
  异常: '#ef4444',
  拒绝: '#ef4444',
  已拒绝: '#ef4444',
  error: '#ef4444',
  fail: '#ef4444',
  failed: '#ef4444',
  rejected: '#ef4444',
  // 警告
  警告: '#f59e0b',
  warning: '#f59e0b',
  warn: '#f59e0b',
  // 进行中
  进行中: '#3b82f6',
  处理中: '#3b82f6',
  执行中: '#3b82f6',
  pending: '#3b82f6',
  processing: '#3b82f6',
  running: '#3b82f6',
  in_progress: '#3b82f6',
  // 信息
  info: '#6366f1',
  // 暂停
  暂停: '#f59e0b',
  已暂停: '#f59e0b',
  paused: '#f59e0b',
  // 禁用 / 取消 / 关闭
  禁用: '#d1d5db',
  已禁用: '#d1d5db',
  取消: '#d1d5db',
  已取消: '#d1d5db',
  关闭: '#d1d5db',
  已关闭: '#d1d5db',
  disabled: '#d1d5db',
  cancelled: '#d1d5db',
  canceled: '#d1d5db',
  closed: '#d1d5db',
  // 草稿 / 未开始
  草稿: '#9ca3af',
  未开始: '#9ca3af',
  未启用: '#9ca3af',
  draft: '#9ca3af',
  inactive: '#9ca3af',
  // 审核
  审核中: '#8b5cf6',
  审批中: '#8b5cf6',
  待审批: '#8b5cf6',
  review: '#8b5cf6',
  // 已发布 / 已上线
  已发布: '#10b981',
  已上线: '#10b981',
  published: '#10b981',
  online: '#10b981',
  active: '#10b981',
  // 过期 / 超时
  过期: '#d1d5db',
  已过期: '#d1d5db',
  超时: '#ef4444',
  expired: '#d1d5db',
  timeout: '#ef4444',
  // 归档
  归档: '#9ca3af',
  已归档: '#9ca3af',
  archived: '#9ca3af',
}

const stringToColor = (str: string) => {
  str = str.trim().toLowerCase()
  if (text2colorMap[str]) return text2colorMap[str]
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  return `hsl(${Math.abs(hash * 137) % 360} 55% 40%)`
}