import { For } from "solid-js"

export const TestTable = (props) => {
  return <table>
    <thead>
      <tr>
        <For each={props.columns}>{o => (
          <th>{o.name}</th>
        )}</For>
      </tr>
    </thead>
    <thead>
      <For each={props.data}>{(row, rowi) => (
        <tr y={rowi()} data={row}>
          <For each={props.columns}>{(col, coli) => (
            <td x={coli()} y={rowi()} data={row}>{row[col.id]}</td>
          )}</For>
        </tr>
      )}</For>
    </thead>
  </table>
}