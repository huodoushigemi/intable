# 分页

## 客户端分页（默认）

数据全量传入，插件自动切片显示。

```tsx
<Intable
  columns={columns}
  data={data} // 全量数据，如 100 条
  pagination={{
    enable: true,
    onChange: (page) => console.log("当前分页参数:", page),
  }}
/>
```

分页栏显示效果：`共 100 条  ‹ 1 2 … 10 ›`

---

## 服务端分页（异步请求）

传入 `request` 函数，翻页时自动调用，带 loading 防重复点击。

```tsx
<Intable
  columns={columns}
  loading={isLoading()}  // 可选：配合外部 loading 状态
  request={async (params) => {
    // 翻页时触发，参数：(页码, 每页条数)
    const res = await fetch(`/api/list?page=${params.page}&size=${params.pageSize}`)
    const json = await res.json()
    return { data: json.data, total: json.total }
  }}
  pagination={{
    enable: true,
    onChange: (page) => console.log('切到第', page, '页'),
  }}
/>
```

---

## pagination 完整属性

| 属性           | 类型                                                   | 默认值  | 说明                                    |
| -------------- | ------------------------------------------------------ | ------- | --------------------------------------- |
| `enable`       | `boolean`                                              | `false` | 启用分页                                |
| `pageSize`     | `number`                                               | `20`    | 每页条数                                |
| `defaultValue` | `number`                                               | `1`     | 默认页码                                |
| `value`        | `number`                                               | —       | 受控模式：当前页码                      |
| `onChange`     | `(page: number) => void`                               | —       | 页码变化回调                            |
