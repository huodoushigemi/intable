package querybuilder

import (
	"fmt"
	"reflect"
	"strings"

	"gorm.io/gorm"
)

// Condition 筛选条件
type Condition struct {
	Field    string      `json:"field"`
	Op       string      `json:"op"`
	Value    interface{} `json:"value"`
	Children []Condition `json:"children"`
}

// Conditions 条件数组
type Conditions []Condition

// Sort 排序条件
type Sort struct {
	Field string `json:"field"`
	Order string `json:"order"` // asc 或 desc
}

// ApplyFilters 将筛选条件应用到 GORM 查询
func ApplyFilters(db *gorm.DB, conditions []Condition, fieldMap map[string]string) (*gorm.DB, error) {
	for _, c := range conditions {
		sql, args, err := buildSQL(c, fieldMap)
		if err != nil {
			return nil, err
		}
		db = db.Where(sql, args...)
	}
	return db, nil
}

// ApplySorts 将排序条件应用到 GORM 查询
func ApplySorts(db *gorm.DB, sorts []Sort, fieldMap map[string]string) (*gorm.DB, error) {
	for _, s := range sorts {
		column, ok := fieldMap[s.Field]
		if !ok || column == "" {
			continue // 跳过不支持的字段
		}
		order := "ASC"
		if strings.ToLower(s.Order) == "desc" {
			order = "DESC"
		}
		db = db.Order(column + " " + order)
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

// BuildModelFields 通过反射从 model struct 生成查询字段。
// key 为 json tag 名，value 为 gorm column 名；嵌套匿名 struct 递归处理
func BuildModelFields(v interface{}) map[string]string {
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
