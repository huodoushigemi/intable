import { createSignal } from "solid-js";
import { Intable, type TableStore } from "../../../packages/intable/src";

const VACATION = "休假";

const PROJECTS = ['Project 1', 'Project 2', VACATION]

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
  { id: "domain", name: "所属领域", width: 110 },
  { id: "taskType", name: "任务类型", width: 150, editable: ({ data }) => !isVacation(data), enum: TASK_TYPES, required: true },
  { id: "hours", name: "实际工时", width: 110, editable: true, type: "number", required: true, render: (o) => (o.value != null ? `${o.value}小时` : "") },
  { id: "detail", name: "任务详情", width: 300, class: 'whitespace-pre-wrap', editor: 'textarea', editable: ({ data }) => !isVacation(data), required: true },
  { id: "领域代表/CQE审批", name: "领域代表/CQE审批", editable: false },
  { id: "项目经理", name: "项目经理", editable: false },
  { id: "项目类型", name: "项目类型", editable: false },
];

const initialData: any[] = [
  { id: 1, date: "2026-05-01", project: "Project 1", domain: "software", taskType: "code", hours: 8, detail: "" },
  { id: 2, date: "2026-05-02", project: VACATION, domain: "", taskType: VACATION, hours: 8, detail: VACATION },
  { id: 3, date: "2026-05-03", project: VACATION, domain: "", taskType: VACATION, hours: 8, detail: VACATION },
  { id: 4, date: "2026-05-04", project: 'Project 2', domain: "software", taskType: 'code', hours: 8, detail: '' },
  { id: 5, date: "2026-05-05", project: 'Project 2', domain: "software", taskType: 'code', hours: 8, detail: '' },
];

export default function WorkHoursDemo() {
  const [data, setData] = createSignal<any[]>(initialData);

  const isWeekend = (dateText?: string) => {
    if (!dateText) return false;
    const d = new Date(dateText);
    if (Number.isNaN(d.getTime())) return false;
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  function handleDataChange(next: any[]) {
    const fixed = next.map((row) => {
      row.domain ||= 'software'
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
  }

  function addRow() {
    setData((prev) => [...prev, { id: Symbol(), date: "", project: "", domain: "", taskType: "", hours: 8, detail: "" }]);
  }

  function setWeekendVacation() {
    setData((prev) =>
      prev.map((row) => {
        if (!isWeekend(row.date)) return row;
        return {
          ...row,
          domain: "",
          project: VACATION,
          taskType: VACATION,
          detail: VACATION,
        };
      }),
    );
  }

  let store: TableStore

  return (
    <div class="flex flex-col gap-2 h-60vh p-2">
      <div class="flex gap-2">
        <button class="px-3 py-1 text-sm rd-1 bg-blue-500 c-white cursor-pointer" onClick={addRow}>
          新增工时
        </button>
        <button class="px-3 py-1 text-sm rd-1 bg-amber-500 c-white cursor-pointer" onClick={setWeekendVacation}>
          周末休假
        </button>
        <button class='px-3 py-1 text-sm rd-1 bg-gray-500 c-white cursor-pointer' onClick={() => import('./WorkHours.md?raw').then(e => { navigator.clipboard.writeText(e.default); alert('已复制') })}>
          填报提示词
        </button>
      </div>
      <Intable
        store={e => store = e}
        class="flex-1"
        columns={columns}
        data={data()}
        onDataChange={handleDataChange}
        rowKey="id"
        // rowSelection={{ enable: true, multiple: true }}
        index
        border
        stickyHeader
        autoFill
        cellStyle={(o) => o.data && !store.props.editable(o) && !o.col[store.internal] ? 'background: repeat; background-image: linear-gradient(135deg,#6b728020 10%,#0000 0,#0000 50%,#6b728020 0,#6b728020 60%,#0000 0,#0000); background-size: 7.07px 7.07px' : ''}
      />
    </div>
  );
}
