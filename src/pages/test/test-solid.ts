import { Dynamic } from "solid-js/web"
const h = (tag, props, children?) => <Dynamic component={tag} {...props}>{children}</Dynamic>
import { cols, data } from './data'

export default () => {
  return h('table', { style: { border: '1px solid black', borderCollapse: 'collapse' } }, [
    h('thead', {}, [
      h('tr', {}, cols.map(col => h('th', {}, col.name)))
    ]),
    h('tbody', {}, data.map((row, rowIndex) => h('tr', { y: rowIndex, data: row }, cols.map((col, colIndex) => (
      h('td', { x: colIndex, y: rowIndex, data: row }, row[col.id]))
    ))))
  ])
}