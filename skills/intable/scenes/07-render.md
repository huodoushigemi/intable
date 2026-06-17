# 自定义渲染 / Tooltip / 单元格合并

## 自定义单元格渲染（内置）

通过列的 `render` / `type` / `enum` 控制，无需额外配置。

```tsx
const columns = [
  // render 函数：完全自定义 JSX
  {
    id: 'status', name: '状态', width: 100,
    render: ({ value, data }) => (
      <span class={value === 'active' ? 'c-green-600 font-bold' : 'c-gray-400'}>
        {value === 'active' ? '在职' : '离职'}
      </span>
    ),
  },
  // render 函数也可以是字符串模板（使用 store.renders 中注册的渲染器）
  // enum：自动渲染为 <Tags /> 组件，颜色会根据文本自动生成
  { id: 'dept', name: '部门', width: 120, enum: { eng: '工程', design: '设计', pm: '产品' } },
  // type: 'checkbox'：渲染为勾选图标
  { id: 'active', name: '在职', width: 80, type: 'checkbox' },
  // type: 'date' / 'datetime'：渲染为本地化日期
  { id: 'joined', name: '入职', width: 140, type: 'date' },
]

// 枚举列自动渲染为标签，且支持设置颜色
const DeptEnum = {
  eng: { label: '工程', color: '#1890ff' },
  design: { label: '设计', color: '#13c2c2' },
  pm: { label: '产品', color: '#eb2f96' },
}

<Intable columns={columns} data={data} />
```

---

## Tooltip（内置）

鼠标悬停时显示浮层，无需额外配置。`tooltip` 支持三种形式：

```tsx
const columns = [
  { id: 'desc', name: '描述', width: 200, tooltip: true }, // 显示单元格值
  { id: 'code', name: '代码', width: 100, tooltip: '点击可复制' }, // 固定字符串
  { id: 'score', name: '评分', width: 80, tooltip: ({ value, data }) => `${data.name} 的评分：${value}` }, // 动态函数
]
```

---

## 单元格合并（内置）

**方式一：列级自动合并（相邻行同值）**

```tsx
const columns = [
  { id: 'dept', name: '部门', width: 120, mergeRow: true },  // 相邻行 dept 相同时自动合并
  { id: 'name', name: '姓名', width: 120 },
  { id: 'age',  name: '年龄', width: 80  },
]

<Intable columns={columns} data={data} />
```

**方式二：表格级自定义合并（精确控制 rowspan/colspan）**

```tsx
<Intable
  columns={columns}
  data={data}
  merge={(row, col, y, x) => {
    // 返回 null = 该格被合并（隐藏）
    // 返回 { rowspan, colspan } = 该格作为锚点，向下/右延伸
    if (col.id === 'dept') {
      if (y > 0 && data[y].dept === data[y - 1].dept) return null
      const span = data.slice(y).findIndex((r, i) => i > 0 && r.dept !== data[y].dept)
      return { rowspan: span === -1 ? data.length - y : span }
    }
  }}
/>
```
