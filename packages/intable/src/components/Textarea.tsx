import { createEffect, createSignal, mergeProps, splitProps, type JSX } from 'solid-js'

type AutoSize =
	| boolean
	| {
		minRows?: number
		maxRows?: number
	}

export interface TextAreaProps extends Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onInput' | 'onChange'> {
	value?: string
	defaultValue?: string
	autosize?: AutoSize
	onInput?: (value: string) => void
	onChange?: (value: string) => void
}

function getLineHeight(el: HTMLTextAreaElement) {
	const style = getComputedStyle(el)
	const lineHeight = parseFloat(style.lineHeight)
	if (Number.isFinite(lineHeight)) return lineHeight
	const fontSize = parseFloat(style.fontSize)
	return Number.isFinite(fontSize) ? fontSize * 1.2 : 20
}

function normalizeAutoSize(v: AutoSize) {
	if (!v) return null
	if (v === true) return { minRows: undefined, maxRows: undefined }
	return v
}

export const Textarea = (rawProps: TextAreaProps) => {
	const props = mergeProps({ defaultValue: '', autosize: false } as const, rawProps)
	const [local, others] = splitProps(props, ['value', 'defaultValue', 'autosize', 'ref', 'onInput', 'onChange'])

	const [inner, setInner] = createSignal(local.value ?? local.defaultValue ?? '')

	let el!: HTMLTextAreaElement

	const resize = () => {
		if (!el) return
		const auto = normalizeAutoSize(local.autosize)
		if (!auto) return

		const style = getComputedStyle(el)
		const border = parseFloat(style.borderTopWidth || '0') + parseFloat(style.borderBottomWidth || '0')
		const padding = parseFloat(style.paddingTop || '0') + parseFloat(style.paddingBottom || '0')
		const lineHeight = getLineHeight(el)

		el.style.height = ''
		let next = el.scrollHeight

		if (auto.minRows) {
			const minHeight = auto.minRows * lineHeight + padding + border
			next = Math.max(next, minHeight)
		}
		if (auto.maxRows) {
			const maxHeight = auto.maxRows * lineHeight + padding + border
			next = Math.min(next, maxHeight)
			el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
		} else {
			el.style.overflowY = 'hidden'
		}

		el.style.height = `${Math.ceil(next)}px`
	}

	createEffect(() => {
		const v = local.value
		if (v != null) setInner(v)
	})

	createEffect(() => {
		inner()
		local.autosize
		queueMicrotask(resize)
	})

	return (
		<textarea
			{...others}
			ref={v => {
				el = v
				if (typeof local.ref === 'function') local.ref(v)
				queueMicrotask(resize)
			}}
			value={inner()}
			onInput={e => {
				const v = e.currentTarget.value
				if (local.value == null) setInner(v)
				local.onInput?.(v)
				queueMicrotask(resize)
			}}
			onChange={e => {
				local.onChange?.(e.currentTarget.value)
			}}
		/>
	)
}

export default Textarea
