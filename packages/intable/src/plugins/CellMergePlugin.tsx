import { Ctx, type Plugin, type TableColumn, type THProps } from "../index"

declare module '../index' {
  interface TableProps {
    colDrag: boolean
    rowDrag: boolean
  }
  interface TableColumn {

  }
  interface TableStore {

  }
  interface Commands {
    
  }
}

export const CellMergePlugin: Plugin = {
  rewriteProps: {
    
  },
}
