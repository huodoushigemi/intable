import { createMutable } from 'solid-js/store'

;(() => {
  const a = createMutable({})
  a.a
  for (const symbol of Object.getOwnPropertySymbols(a)) {
    Symbol[symbol.toString()] = symbol
  }
})()
