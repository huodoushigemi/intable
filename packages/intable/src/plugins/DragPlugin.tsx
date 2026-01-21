import { delay } from "es-toolkit"
import { isMatch } from "es-toolkit/compat"
import { Ctx, type Plugin, type TableColumn, type THProps } from "../index"
import { useSort } from '../hooks/useSort'

declare module '../index' {
  interface TableProps {
    colDrag?: boolean
    rowDrag?: boolean
  }
  interface TableColumn {

  }
  interface TableStore {

  }
  interface Commands {
    
  }
}

export const DragPlugin: Plugin = {
  rewriteProps: {
    colDrag: ({ colDrag = false }) => colDrag,
    rowDrag: ({ rowDrag = false }) => rowDrag,
  },
  onMount(store) {
    const colDrag = useSort(() => store.scroll_el, {
      get enable() { return store.props?.colDrag },
      guideLine: { class: 'col__guide-line' },
      draggable: el => ((x, y) => el.tagName == 'TH' && isMatch(store.selected, { start: [x, 0] }) && !store.props?.columns[x][store.internal] && store.thead.contains(el) && delay(300).then(() => true))(+el.getAttribute('x')!, +el.getAttribute('y')!),
      dragover: el => el.tagName == 'THEAD',
      children: el => [...colDrag.drag.parentElement.children].filter(e => !store.props?.columns[e.getAttribute('x')][store.internal]),
      dragend: onColDragend
    })

    const rowDrag = useSort(() => store.scroll_el, {
      get enable() { return store.props?.rowDrag },
      guideLine: { class: 'row__guide-line' },
      draggable: el => ((x, y) => el.tagName == 'TD' && isMatch(store.selected, { start: [0, y] }) && x == 0 && !store.props?.data[y][store.internal] && store.tbody.contains(el) && delay(300).then(() => true))(+el.getAttribute('x')!, +el.getAttribute('y')!),
      dragover: el => el.tagName == 'TBODY',
      children: el => [...rowDrag.over.children].filter(e => !store.props!.data[e.getAttribute('y')][store.internal]),
      dragend: onRowDragend
    })

    async function onColDragend() {
      if (colDrag.drag == colDrag.rel) return
      const [cols, rawCols] = [store.props!.columns, [...store.rawProps.columns || []]]
      const col1 = (col => col[store.raw] ?? col)(cols[colDrag.drag.getAttribute('x')])
      const col2 = (col => col[store.raw] ?? col)(cols[colDrag.rel.getAttribute('x')])
      const i1 = rawCols.indexOf(col1)
      const i2 = rawCols.indexOf(col2)
      if (i1 < 0 || i2 < 0) return
      rawCols[i1].fixed = rawCols[i2].fixed
      rawCols.splice(i2 - (i1 > i2 ? 0 : 1) + (colDrag.type == 'before' ? 0 : 1), 0, rawCols.splice(i1, 1)[0])
      store.props!.onColumnsChange?.(rawCols)
      // select area
      await Promise.resolve()
      const i = store.props!.columns.findIndex(e => e == col1 || e[store.raw] == col1)
      if (i < 0) return
      store.selected.start[0] = store.selected.end[0] = i
    }

    async function onRowDragend() {
      if (rowDrag.drag == rowDrag.rel) return
      const [data, rawData] = [store.props!.data, [...store.rawProps.data || []]]
      const data1 = (row => row[store.raw] ?? row)(data[rowDrag.drag.getAttribute('y')])
      const data2 = (row => row[store.raw] ?? row)(data[rowDrag.rel.getAttribute('y')])
      const i1 = rawData.indexOf(data1)
      const i2 = rawData.indexOf(data2)
      if (i1 < 0 || i2 < 0) return
      rawData.splice(i2 - (i1 > i2 ? 0 : 1) + (rowDrag.type == 'before' ? 0 : 1), 0, rawData.splice(i1, 1)[0])
      store.props!.onDataChange?.(rawData)
      // select area
      await Promise.resolve()
      const i = store.props!.data.findIndex(e => e == data1 || e[store.raw] == data1)
      if (i < 0) return
      store.selected.start[1] = store.selected.end[1] = i
    }
  },
}
