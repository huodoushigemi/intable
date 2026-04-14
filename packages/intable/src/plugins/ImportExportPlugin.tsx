import type { Plugin } from ".."
import { chooseFile } from "../utils"

declare module '../index' {
  interface Commands {
    createExcel(data?: any[]): Promise<Blob>
    exportExcel(data?: any[]): Promise<void>
    readExcel(file?: File): Promise<any[]>
    // importExcel(file?: File): Promise<void>
  }
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const ImportExportPlugin: Plugin = {
  name: 'ImportExportPlugin',
  // menus: (store) => [
  //   { label: 'Export Excel', cb: () => store.commands.exportExcel() },
  //   { label: 'Import Excel', cb: () => store.commands.importExcel() },
  // ],
  commands: (store) => ({
    createExcel: async (data = store.props!.data) => {
      const XLSX = await import("xlsx")
      const allCols = store.props!.columns.filter(col => !col[store.internal])
      const rows = data.map(row => Object.fromEntries(allCols.map((e) => [e.name, row[e.id]])))
      
      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      return new Blob([excelBuffer], { type: 'application/octet-stream' })
    },
    exportExcel: async (data = store.props!.data) => {
      const blob = await store.commands.createExcel(data)
      downloadBlob(blob, 'data.xlsx')
    },
    readExcel: async (file) => {
      file ??= await chooseFile({ accept: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel' })
      const buffer = await readFileAsArrayBuffer(file)
      const XLSX = await import("xlsx")
      const workbook = XLSX.read(buffer, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]
      
      if (jsonData.length < 1) return
      
      const allCols = store.props!.columns.filter(col => !col[store.internal])
      
      return jsonData.slice(1).map(row => (
        Object.fromEntries(allCols.map(e => [e.id, row[e.name!]]))
      ))
    },
  })
}
