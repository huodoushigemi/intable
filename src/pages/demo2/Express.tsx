import { delay } from "es-toolkit"
import Intable from "../../../packages/intable/src"

export default () => {
  return <Intable
    columns={[
      {  id: 'name', name: 'Name', width: 200, valueGetter: async (o) => delay(1000).then(() => 'xxx'), valueSetter: (o) => o.data.name = o.value },
      {  id: 'age', name: 'Age', width: 100, valueGetter: (o) => o.data.age, valueSetter: (o) => o.data.age = o.value },
      {  id: 'gender', name: 'Gender', width: 100, valueGetter: (o) => o.data.gender, valueSetter: (o) => o.data.gender = o.value },
      {  id: 'age2', name: 'Age2', width: 100, valueGetter: (o) => o.data.age * 2, valueSetter: (o) => o.data.age = o.value / 2, sortable: true },
    ]}
    data={[
      { name: 'Alice', age: 25, gender: 'Female' },
      { name: 'Bob', age: 30, gender: 'Male' },
      { name: 'Charlie', age: 22, gender: 'Male' },
      { name: 'Diana', age: 28, gender: 'Female' },
    ]}
  />
}