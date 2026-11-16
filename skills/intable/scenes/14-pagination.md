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

分页栏显示效果：`共 100 条  [20 条/页 ▾]  ‹ 1 2 … 10 ›`

每页条数下拉框默认显示，选项可配置：

```tsx
<Intable
  columns={columns}
  data={data}
  pagination={{
    enable: true,
    pageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
    showPageSize: true, // 设为 false 可隐藏下拉框
    onPageSizeChange: (size) => console.log('每页条数:', size),
  }}
/>
```

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
| `pageSizeOptions` | `number[]`                                          | `[10, 20, 50, 100]` | 每页条数下拉选项             |
| `showPageSize` | `boolean`                                              | `true`  | 是否显示每页条数下拉框                  |
| `defaultValue` | `number`                                               | `1`     | 默认页码                                |
| `value`        | `number`                                               | —       | 受控模式：当前页码                      |
| `onChange`     | `(page: number) => void`                               | —       | 页码变化回调                            |
| `onPageSizeChange` | `(pageSize: number) => void`                       | —       | 每页条数变化回调                        |
