import "../../../packages/intable/src"
import { Select } from "../../../packages/intable/src/components/Select"

export default () => {
  return (
    <div class='p-4'>
      <Select
        class='w-300px'
        options={[{ label: 'Option 1', value: '1' }, { label: 'Option 2', value: '2' }]}
        searchable
        multiple
        border={false}
        onChange={(e) => console.log('Selected:', e)}
        />
    </div>
  )
}