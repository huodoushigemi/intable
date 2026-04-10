import { createEffect } from 'solid-js'
import { type Plugin } from '..'
import { unFn } from '../utils'

/** Encode a single TSV cell per RFC 4180: quote it if it contains tabs,
 *  newlines, or double-quotes; escape inner double-quotes as "". */
function formatTSVCell(val: string): string {
  if (/[\t\r\n"]/.test(val)) return '"' + val.replace(/"/g, '""') + '"'
  return val
}

/** Parse TSV text following RFC 4180 (tab-separated). Handles quoted fields
 *  that may contain embedded newlines, tabs, and escaped double-quotes (""). */
function parseTSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let i = 0
  while (i < text.length) {
    const ch = text[i]
    if (ch === '"') {
      // Quoted field
      i++
      while (i < text.length) {
        if (text[i] === '"') {
          if (text[i + 1] === '"') { cell += '"'; i += 2 } // escaped quote
          else { i++; break } // end of quoted field
        } else {
          // Normalise CRLF inside quoted fields
          if (text[i] === '\r' && text[i + 1] === '\n') { cell += '\n'; i += 2 }
          else if (text[i] === '\r') { cell += '\n'; i++ }
          else { cell += text[i++] }
        }
      }
    } else if (ch === '\t') {
      row.push(cell); cell = ''; i++
    } else if (ch === '\r' && text[i + 1] === '\n') {
      row.push(cell); rows.push(row); row = []; cell = ''; i += 2
    } else if (ch === '\r' || ch === '\n') {
      row.push(cell); rows.push(row); row = []; cell = ''; i++
    } else {
      cell += ch; i++
    }
  }
  // Handle last cell / row (ignore trailing empty row from trailing newline)
  if (cell || row.length) { row.push(cell); rows.push(row) }
  if (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') rows.pop()
  return rows
}

declare module '../index' {
  interface TableProps {
    
  }
  interface TableStore {
    
  }
  interface Plugin {
    
  }
  interface Commands {
    copy: () => void
    paste: () => void
  }
}

export const ClipboardPlugin: Plugin = {
  name: 'clipboard',
  keybindings: (store) => ({
    '$mod+c': () => { store.commands.copy(); store.scroll_el?.classList.add('copied') },
    '$mod+v': () => store.commands.paste(),
  }),
  onMount: (store) => {
    // Remove the 'copied' CSS indicator whenever the selection changes
    createEffect(() => {
      JSON.stringify(store.selected)
      store.scroll_el?.classList.remove('copied')
    })
  },
  menus: (store) => [
    // { label: '复制', onClick: () => store.commands.copy() },
    // { label: '粘贴', onClick: () => store.commands.paste() },
  ],
  commands: store => ({
    copy: () => {
      const { start, end } = store.selected
      if (!start?.length) return
      const [x1, x2] = [start[0], end[0]].sort((a, b) => a - b)
      const [y1, y2] = [start[1], end[1]].sort((a, b) => a - b)
      // Skip internal columns (index, row-selection, etc.)
      const cols = store.props.columns!.slice(x1, x2 + 1).filter(col => !col[store.internal])
      const rows = store.props.data!.slice(y1, y2 + 1)
      const text = rows.map(row =>
        cols.map(col => formatTSVCell(String(row[col.id as string] ?? ''))).join('\t')
      ).join('\r\n')
      navigator.clipboard.writeText(text)
    },
    paste: async () => {
      const { start, end } = store.selected
      if (!start?.length) return
      const text = await navigator.clipboard.readText()
      const arr2 = parseTSV(text)
      const clipH = arr2.length
      const clipW = arr2[0].length

      const [x1, x2] = [start[0], end[0]].sort((a, b) => a - b)
      const [y1, y2] = [start[1], end[1]].sort((a, b) => a - b)
      const selH = y2 - y1 + 1
      const selW = x2 - x1 + 1
      // Tile clipboard to fill the selection when it is an exact multiple
      const pasteH = selH > clipH && selH % clipH === 0 ? selH : clipH
      const pasteW = selW > clipW && selW % clipW === 0 ? selW : clipW

      // Collect target user columns starting from x1 (skip internals), up to pasteW
      const allCols = store.props.columns!
      const targetCols: typeof allCols = []
      for (let i = x1; i < allCols.length && targetCols.length < pasteW; i++) {
        if (!allCols[i][store.internal]) targetCols.push(allCols[i])
      }

      const data = store.props.data!.slice()
      const requiredRows = y1 + pasteH
      // Create new rows if needed
      if (requiredRows > data.length) {
        for (let i = data.length; i < requiredRows; i++) {
          const newRow = store.props.newRow?.(i) || {}
          data.push(newRow)
        }
      }
      const maxY = y1 + pasteH - 1
      for (let dy = 0; dy <= maxY - y1; dy++) {
        const patch = {}
        targetCols.forEach((col, dx) => {
          const rowData = data[y1 + dy]
          const isEditable = unFn(store.props.editable, { col, data: rowData, x: allCols.indexOf(col), y: y1 + dy })
          if (!isEditable) return
          patch[col.id] = arr2[dy % clipH][dx % clipW]
        })
        data[y1 + dy] = { ...data[y1 + dy], ...patch }
      }

      // Expand selection to cover the pasted region
      let endX = x1
      let userCount = 0
      for (let i = x1; i < allCols.length && userCount < targetCols.length; i++) {
        if (!allCols[i][store.internal]) { endX = i; userCount++ }
      }
      store.selected.end = [endX, maxY]
      store.commands.rowsChange?.(data)
    },
  })
}
