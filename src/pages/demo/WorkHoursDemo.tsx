import { createSignal } from "solid-js";
import { Intable } from "../../../packages/intable/src";

const VACATION = "休假";

const PROJECTS = ['Project 1', 'Project 2', VACATION]

const DOMAINS = {
  software: "软件",
  hardware: "硬件",
  test: "测试",
  product: "产品",
};

const TASK_TYPES = {
  code: "代码编写与调试",
  review: "代码评审",
  design: "方案设计",
  meeting: "会议",
  [VACATION]: VACATION,
};

const isVacation = (row: any) => row?.project === VACATION;

const columns = [
  { id: "date", name: "工时日期", width: 130, editable: true, type: "date", required: true },
  { id: "project", name: "所属项目", width: 200, editable: true, enum: PROJECTS, required: true },
  { id: "domain", name: "所属领域", width: 110, editable: ({ data }) => !isVacation(data), enum: DOMAINS },
  { id: "taskType", name: "任务类型", width: 150, editable: ({ data }) => !isVacation(data), enum: TASK_TYPES, required: true },
  { id: "hours", name: "实际工时", width: 110, editable: true, type: "number", required: true, render: ({ value }) => (value != null ? `${value}小时` : "") },
  { id: "detail", name: "任务详情", editor: 'textarea', editable: ({ data }) => !isVacation(data), required: true },
  { id: "领域代表/CQE审批", name: "领域代表/CQE审批", editable: false },
  { id: "项目经理", name: "项目经理", editable: false },
  { id: "项目类型", name: "项目类型", editable: false },
];

const initialData: any[] = [
  { id: 1, date: "2026-05-03", project: "Project 1", domain: "software", taskType: "code", hours: 8, detail: "" },
  { id: 2, date: "2026-05-04", project: VACATION, domain: "", taskType: VACATION, hours: 8, detail: VACATION },
];

export default function WorkHoursDemo() {
  const [data, setData] = createSignal<any[]>(initialData);

  function handleDataChange(next: any[]) {
    const fixed = next.map((row) => {
      if (row.project !== VACATION) return row;
      // 项目为休假时强制设置子字段
      return {
        ...row,
        domain: "",
        taskType: VACATION,
        detail: VACATION,
      };
    });
    setData(fixed);
  }†

  function addRow() {
    setData((prev) => [...prev, { id: Symbol(), date: "", project: "", domain: "", taskType: "", hours: 8, detail: "" }]);
  }

  return (
    <div class="flex flex-col gap-2 h-60vh">
      <div class="flex gap-2">
        <button class="px-3 py-1 text-sm rd-1 bg-blue-500 c-white cursor-pointer" onClick={addRow}>
          新增工时
        </button>
      </div>
      <Intable
        class="flex-1"
        columns={columns}
        data={data()}
        onDataChange={handleDataChange}
        rowKey="id"
        rowSelection={{ enable: true, multiple: true }}
        border
        stickyHeader
        size="small"
        autoFill
      />
    </div>
  );
}
