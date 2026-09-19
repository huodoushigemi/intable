import { Intable } from '../../../packages/intable/src'
import { passesFilters } from '../../../packages/intable/src/plugins/FilterPlugin'

const mockRequest = async (data, params, columns) => {
  const filteredData = data.filter(row => passesFilters(row, params.filters, columns))
  return { data: filteredData, total: filteredData.length }
}

const userTable = {
  columns: [
    { id: 'name', name: 'Name', width: 120, editable: true, filterable: true },
    { id: 'age', name: 'Age', width: 80, editable: true, type: 'number' },
    { id: 'email', name: 'Email', width: 180, editable: true },
    { id: 'city', name: 'City', width: 110, editable: true },
    { id: 'active', name: 'Active', width: 70, editable: true, type: 'checkbox' },
    // 数据是对象或数组时，使用 type: 'obj' 或 type: 'objs'，并提供 table 属性指向对应的表格配置
    { id: 'manager', name: 'Manager', width: 120, editable: true, type: 'obj', dialog: true, get table() { return userTable } },
    { id: 'roles', name: 'Roles', width: 200, editable: true, type: 'objs', get table() { return roleTable } },
    // 数据是外键时，使用 type: 'fk' 或 type: 'fks'，并提供 table 属性指向对应的表格配置。指定 foreignField 会自动将外键对象 组装到当前行数据中，便于在表格中显示外键对象中的其他属性。
    { id: 'dept_id', name: 'Department', width: 120, editable: true, type: 'fk', foreignField: 'dept', get table() { return deptTable } },
    { id: 'dept_address', name: 'Department Address', width: 200, render: ({ data }) => data.dept?.address },
    // { id: 'dept_address', name: 'Department Address', width: 200, render: ({ data }) => (console.log('data',data.dept, data),data.dept) },
    { id: 'post_ids', name: 'Posts', width: 200, editable: true, type: 'fks', relObjKey: 'posts', get table() { return postTable } },
    { id: 'post_author', name: 'Post Author', width: 120, editable: true, render: ({ data }) => data.posts?.map(p => p.author?.name).join(', ') },
  ],
  rowKey: 'id',
  pagination: { enable: true },
  request: async (params) => {
    // await delay(1000)
    console.log(params)
    const data = [
      { id: 1, name: 'Alice', age: 30, email: 'alice@example.com', city: 'Wonderland', active: true, roles: [{ name: 'admin', desc: 'Administrator' }], manager: { id: 4, name: 'David' }, post_ids: [1, 2], dept_id: 1 },
      { id: 2, name: 'Bob', age: 25, email: 'bob@example.com', city: 'Builderland', active: false, roles: [{ name: 'user', desc: 'Regular User' }] },
      { id: 3, name: 'Charlie', age: 28, email: 'charlie@example.com', city: 'Chocolate Factory', active: true, roles: [{ name: 'editor', desc: 'Content Editor' }] },
      { id: 4, name: 'David', age: 35, email: 'david@example.com', city: 'Davidsville', active: true, dept_id: 2 },
    ]
    return mockRequest(data, params, userTable.columns)
  },
}

const roleTable = {
  columns: [
    { id: 'name', name: 'Name', editable: true },
    { id: 'desc', name: 'Desc', editable: true },
  ],
  rowKey: 'name',
  pagination: { enable: true },
  request: async (params) => {
    const data = [
      { name: 'admin', desc: 'Administrator' },
      { name: 'user', desc: 'Regular User' },
      { name: 'editor', desc: 'Content Editor' },
    ]
    return mockRequest(data, params, roleTable.columns)
  }
}

const deptTable = {
  columns: [
    { id: 'name', name: 'Name', editable: true },
    { id: 'address', name: 'Address', editable: true },
  ],
  rowKey: 'id',
  pagination: { enable: true },
  request: async (params) => {
    const data = [
      { id: 1, name: 'IT', address: '123 Tech Street' },
      { id: 2, name: 'Devops', address: '456 Business Avenue' },
      { id: 3, name: 'Test', address: '789 Innovation Drive' },
    ]
    return mockRequest(data, params, deptTable.columns)
  }
}

const postTable = {
  columns: [
    { id: 'title', name: 'Title', width: 200, editable: true },
    { id: 'content', name: 'Content', width: 300, editable: true },
    { id: 'author', name: 'Author', width: 120, editable: true, type: 'obj', get table() { return userTable } },
    { id: 'date', name: 'Date', width: 110, editable: true, type: 'date' },
  ],
  rowKey: 'id',
  pagination: { enable: true },
  filter: { autoMatch: false },
  request: async (params) => {
    const data = [
      { id: 1, title: 'Post 1', content: 'Content 1', author: { id: 1, name: 'Alice' }, date: '2024-01-01' },
      { id: 2, title: 'Post 2', content: 'Content 2', author: { id: 2, name: 'Bob' }, date: '2024-01-02' },
      { id: 3, title: 'Post 3', content: 'Content 3', author: { id: 3, name: 'Charlie' }, date: '2024-01-03' },
    ]
    return mockRequest(data, params, postTable.columns)
  }
}

export default () => (
  <div>
    {/* asd */}
    <Intable
      class='max-h-60vh'
      index
      {...userTable}
    />
  </div>
)
