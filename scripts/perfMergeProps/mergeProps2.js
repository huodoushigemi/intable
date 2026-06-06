import { $PROXY, createMemo } from "solid-js";

var SUPPORTS_PROXY = typeof Proxy === "function";

function trueFn() {
	return true;
}
var propTraps = {
	get(_, property, receiver) {
		if (property === $PROXY) return receiver;
		return _.get(property);
	},
	has(_, property) {
		if (property === $PROXY) return true;
		return _.has(property);
	},
	set: trueFn,
	deleteProperty: trueFn,
	getOwnPropertyDescriptor(_, property) {
		return {
			configurable: true,
			enumerable: true,
			get() {
				return _.get(property);
			},
			set: trueFn,
			deleteProperty: trueFn
		};
	},
	ownKeys(_) {
		return _.keys();
	}
};
function resolveSource(s) {
	return !(s = typeof s === "function" ? s() : s) ? {} : s;
}
function resolveSources() {
	for (let i = 0, length = this.length; i < length; ++i) {
		const v = this[i]();
		if (v !== void 0) return v;
	}
}
function mergeProps(...sources) {
	let proxy = false;
	for (let i = 0; i < sources.length; i++) {
		const s = sources[i];
		proxy = proxy || !!s && $PROXY in s;
		sources[i] = typeof s === "function" ? (proxy = true, createMemo(s)) : s;
	}
	if (SUPPORTS_PROXY && proxy) return new Proxy({
		get(property) {
			for (let i = sources.length - 1; i >= 0; i--) {
				const v = resolveSource(sources[i])[property];
				if (v !== void 0) return v;
			}
		},
		has(property) {
			for (let i = sources.length - 1; i >= 0; i--) if (property in resolveSource(sources[i])) return true;
			return false;
		},
		keys() {
			const keys = [];
			for (let i = 0; i < sources.length; i++) keys.push(...Object.keys(resolveSource(sources[i])));
			return [...new Set(keys)];
		}
	}, propTraps);
	const defined = Object.create(null);
	for (let i = sources.length - 1; i >= 0; i--) {
		const source = sources[i];
		if (!source) continue;
		// 
		const descs = Object.getOwnPropertyDescriptors(source)
    for (const key in descs) {
      const desc = descs[key];
      if (!defined[key]) defined[key] = desc
    }
	}
	const target = {};
	const definedKeys = Object.keys(defined);
	for (let i = definedKeys.length - 1; i >= 0; i--) {
		const key = definedKeys[i], desc = defined[key];
		if (desc && desc.get) Object.defineProperty(target, key, desc);
		else target[key] = desc ? desc.value : void 0;
	}
	return target;
}
export { mergeProps as mergeProps2 };
