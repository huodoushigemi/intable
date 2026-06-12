import { TestTable } from '../../../packages/intable/src/test'
import { cols, data } from './data'

export default () => {
  return (
    <div class='flex flex-col gap-3'>
      <TestTable columns={cols} data={data} />
    </div>
  )
}
