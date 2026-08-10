# 列排序 / 列筛选

## 列排序（内置）

在列上加 `sortable: true`，点击列头循环切换：升序 → 降序 → 取消。

```tsx
const columns = [
  { id: 'name',   name: '姓名', width: 130, sortable: true },
  { id: 'age',    name: '年龄', width: 80,  sortable: true },
  { id: 'salary', name: '薪资', width: 100, sortable: true,
    sortComparator: (a, b) => a - b },  // 自定义比较函数（可选）
]

// 基础（客户端自动排序）
<Intable columns={columns} data={data} sort={{ multiple: true }} />

// 服务端排序
<Intable
  columns={columns}
  data={data}
  sort={{
    autoSort: false,
    onChange: (sorts) => fetchData(sorts),  // sorts: [{ field, order: 'asc'|'desc' }]
  }}
/>

// 受控排序
const [sort, setSort] = useState([{ field: 'age', order: 'asc' }])
<Intable columns={columns} data={data} sort={{ value: sort, onChange: setSort }} />
```

| `sort` 选项 | 说明 | 默认 |
|---|---|---|
| `multiple` | 允许多列同时排序 | `false` |
| `autoSort` | 客户端自动排序 | `true` |
| `onChange` | 回调 `(sorts: SortKey[]) => void` | — |
| `value` / `defaultValue` / `initialValue` | 受控 / 非受控 / 初始值 | — |

---

## 列筛选（内置）

在列上加 `filterable: true`，并传 `filter` prop。

```tsx
const columns = [
  { id: 'name', name: '姓名',                 width: 140, filterable: true },
  { id: 'dept', name: '部门',                 width: 140, filterable: true, enum: { eng: '工程', design: '设计', pm: '产品' } },
  { id: 'age',  name: '年龄', type: 'number', width: 100, filterable: true },
  { id: 'date', name: '日期', type: 'date',   width: 140, filterable: true },
]

// 客户端实时过滤
<Intable columns={columns} data={data} filter={{ autoMatch: true }} />

// 服务端过滤
<Intable
  columns={columns}
  data={data}
  filter={{
    autoMatch: false,
    onChange: (filters) => fetchData(filters),
  }}
/>
```

各列 `type` 对应可用操作符：

| 操作符 | 说明 | text | number | date | enum | checkbox |
|---|---|---|---|---|---|---|
| `contains` | 包含 | ✅ | — | — | — | — |
| `eq` | 等于 | ✅ | ✅ | ✅ | ✅ | ✅ |
| `ne` | 不等于 | ✅ | ✅ | ✅ | ✅ | ✅ |
| `lt` | 小于 / 早于 | — | ✅ | ✅ | — | — |
| `gt` | 大于 / 晚于 | — | ✅ | ✅ | — | — |
| `lte` | 小于等于 / 不晚于 | — | ✅ | ✅ | — | — |
| `gte` | 大于等于 / 不早于 | — | ✅ | ✅ | — | — |
| `between` | 介于 | — | ✅ | ✅ | — | — |
| `not_between` | 不介于 | — | ✅ | ✅ | — | — |
| `in` | 在列表中 | ✅ | ✅ | ✅ | ✅ | ✅ |
| `not_in` | 不在列表中 | ✅ | ✅ | ✅ | ✅ | ✅ |
| `startwith` | 开头是 | ✅ | — | — | — | — |
| `endwith` | 结尾是 | ✅ | — | — | — | — |
| `blank` | 为空 | ✅ | ✅ | ✅ | ✅ | ✅ |
| `noblank` | 不为空 | ✅ | ✅ | ✅ | ✅ | ✅ |

### `filters` 结构（`onChange` 回调参数）

`onChange` 接收 `AndOrNode[]`，每个元素是 `GroupNode` 或 `RuleNode`：

```ts
type AndOrNode = GroupNode | RuleNode
```

**GroupNode** — 逻辑分组，支持嵌套 AND/OR：

```ts
type GroupNode = {
  op?: 'and' | 'or'         // 逻辑运算符，默认 'and'
  children?: AndOrNode[]    // 子节点（RuleNode 或 嵌套 GroupNode）
}
```

**RuleNode** — 单个筛选条件：

```ts
type RuleNode = {
  field: string  // 列 id
  op: string     // 操作符，见上表
  value: any     // 筛选值
}
```

**示例** — `(姓名包含"张" AND 年龄>25) OR 部门=设计`：

```ts
const filters: AndOrNode[] = [
  {
    op: 'or',
    children: [
      {
        op: 'and',
        children: [
          { field: 'name', op: 'contains', value: '张' },
          { field: 'age',  op: 'gt',       value: 25 },
        ],
      },
      { field: 'dept', op: 'eq', value: 'design' },
    ],
  },
]
```

## 服务端示例

querybuilder.go
```golang
package querybuilder

import (
	"encoding/json"
	"fmt"
	"reflect"
	"strings"

	"gorm.io/gorm"
)

type Condition struct {
	Field    string      `json:"field"`
	Op       string      `json:"op"`
	Value    interface{} `json:"value"`
	Children []Condition `json:"children"`
}

type Conditions []Condition

func Apply(db *gorm.DB, conditions []Condition, fieldMap map[string]string) (*gorm.DB, error) {
	for _, c := range conditions {
		sql, args, err := buildSQL(c, fieldMap)
		if err != nil {
			return nil, err
		}
		db = db.Where(sql, args...)
	}
	return db, nil
}

func buildSQL(c Condition, fieldMap map[string]string) (string, []interface{}, error) {
	op := strings.ToLower(strings.TrimSpace(c.Op))
	if op == "and" || op == "or" {
		if len(c.Children) == 0 {
			return "", nil, fmt.Errorf("%s children cannot be empty", op)
		}
		parts := make([]string, 0, len(c.Children))
		args := make([]interface{}, 0)
		joiner := " AND "
		if op == "or" {
			joiner = " OR "
		}
		for _, child := range c.Children {
			s, a, err := buildSQL(child, fieldMap)
			if err != nil {
				return "", nil, err
			}
			parts = append(parts, "("+s+")")
			args = append(args, a...)
		}
		return strings.Join(parts, joiner), args, nil
	}

	column, ok := fieldMap[c.Field]
	if !ok || column == "" {
		return "", nil, fmt.Errorf("unsupported field: %s", c.Field)
	}

	switch op {
	case "eq":
		return column + " = ?", []interface{}{c.Value}, nil
	case "ne":
		return column + " <> ?", []interface{}{c.Value}, nil
	case "startwith", "startswith":
		return column + " LIKE ?", []interface{}{fmt.Sprintf("%v%%", c.Value)}, nil
	case "endwith", "endswith":
		return column + " LIKE ?", []interface{}{fmt.Sprintf("%%%v", c.Value)}, nil
	case "gt":
		return column + " > ?", []interface{}{c.Value}, nil
	case "gte":
		return column + " >= ?", []interface{}{c.Value}, nil
	case "lt":
		return column + " < ?", []interface{}{c.Value}, nil
	case "lte":
		return column + " <= ?", []interface{}{c.Value}, nil
	case "between":
		vals, err := toSlice(c.Value)
		if err != nil || len(vals) != 2 {
			return "", nil, fmt.Errorf("between value must be array with 2 elements")
		}
		return column + " BETWEEN ? AND ?", []interface{}{vals[0], vals[1]}, nil
	case "not_between":
		vals, err := toSlice(c.Value)
		if err != nil || len(vals) != 2 {
			return "", nil, fmt.Errorf("not_between value must be array with 2 elements")
		}
		return column + " NOT BETWEEN ? AND ?", []interface{}{vals[0], vals[1]}, nil
	case "contains":
		return column + " LIKE ?", []interface{}{fmt.Sprintf("%%%v%%", c.Value)}, nil
	case "in":
		vals, err := toSlice(c.Value)
		if err != nil || len(vals) == 0 {
			return "", nil, fmt.Errorf("in value must be non-empty array")
		}
		return column + " IN ?", []interface{}{vals}, nil
	case "not_in":
		vals, err := toSlice(c.Value)
		if err != nil || len(vals) == 0 {
			return "", nil, fmt.Errorf("not_in value must be non-empty array")
		}
		return column + " NOT IN ?", []interface{}{vals}, nil
	case "blank":
		return "(" + column + " IS NULL OR " + column + " = '')", nil, nil
	case "noblank":
		return "(" + column + " IS NOT NULL AND " + column + " <> '')", nil, nil
	default:
		return "", nil, fmt.Errorf("unsupported op: %s", c.Op)
	}
}

func toSlice(v interface{}) ([]interface{}, error) {
	if v == nil {
		return nil, fmt.Errorf("nil value")
	}
	rv := reflect.ValueOf(v)
	if rv.Kind() != reflect.Slice && rv.Kind() != reflect.Array {
		return nil, fmt.Errorf("value is not array")
	}
	out := make([]interface{}, 0, rv.Len())
	for i := 0; i < rv.Len(); i++ {
		out = append(out, rv.Index(i).Interface())
	}
	return out, nil
}

// 通过反射从 model struct 生成查询字段。
// key 为 json tag 名，value 为 gorm column 名；嵌套匿名struct 递归处理
func buildModelFields(v interface{}) map[string]string {
	fields := make(map[string]string)
	collectModelFields(reflect.TypeOf(v), fields)
	return fields
}

func collectModelFields(t reflect.Type, fields map[string]string) {
	for i := 0; i < t.NumField(); i++ {
		f := t.Field(i)
		if f.Anonymous {
			collectModelFields(f.Type, fields)
			continue
		}
		jsonTag := strings.Split(f.Tag.Get("json"), ",")[0]
		if jsonTag == "" || jsonTag == "-" {
			continue
		}
		col := jsonTag
		for _, part := range strings.Split(f.Tag.Get("gorm"), ";") {
			if strings.HasPrefix(part, "column:") {
				col = strings.TrimPrefix(part, "column:")
				break
			}
		}
		fields[jsonTag] = col
	}
}
```

使用

```glang
querybuilder.Apply(db, filters, querybuilder.buildModelFields(User{}))
```