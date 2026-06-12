import { makeCols, makeData } from "../demo/helpers"

export const cols = makeCols(20, { })
export const data = makeData(300, cols.length)

cols[0].width = 120