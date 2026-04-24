# 虚拟滚动 / 加载更多

## 虚拟滚动（可选插件）

大数据量场景（万级行数）。**容器必须有固定高度。**

```tsx
import { VirtualScrollPlugin } from 'intable/plugins/VirtualScrollPlugin'

const data = Array.from({ length: 50_000 }, (_, i) => ({
  id: i,
  name: `用户 ${i}`,
  age: 20 + (i % 50),
}))

<Intable
  class='h-600px'           // 必须固定高度
  columns={columns}
  data={data}
  rowKey='id'
  plugins={[VirtualScrollPlugin]}
  border stickyHeader
/>
```

编程式滚动到指定单元格：

```tsx
let store
store.commands.scrollToCell(colIndex, rowIndex)
store.commands.scrollCellIfNeeded(colIndex, rowIndex)
```

虚拟滚动配置（可选）：

```tsx
<Intable
  columns={columns}
  data={data}
  plugins={[VirtualScrollPlugin]}
  virtual={{
    y: { overscan: 10 },   // 垂直方向预渲染行数
  }}
/>
```

---

## 加载更多 / 无限滚动（可选插件）

滚动到底部自动触发加载。

```tsx
import { LoadMorePlugin } from 'intable/plugins/LoadMorePlugin'

const [data, setData] = useState(initialData)
const [isLoading, setLoading] = useState(false)
const [hasMore, setHasMore] = useState(true)

const loadMore = async () => {
  setLoading(true)
  const next = await fetchNextPage()
  setData(prev => [...prev, ...next.items])
  setHasMore(next.hasNext)
  setLoading(false)
}

<Intable
  class='h-500px'
  columns={columns}
  data={data}
  plugins={[LoadMorePlugin]}
  loadMore={{
    loading: isLoading,
    hasMore,
    onLoadMore: loadMore,
    threshold: 100,          // 距底部多少 px 触发，默认 100
    loadingText: '加载中…',
    noMoreText: '没有更多数据了',
  }}
/>
```

> 加载更多与虚拟滚动可以同时使用：`plugins={[VirtualScrollPlugin, LoadMorePlugin]}`
