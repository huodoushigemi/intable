import { createSignal } from 'solid-js'
import { Intable } from '../../../packages/intable/src'

/**
 * Branch graph demo using real project data (git-style, newest-first).
 *
 * Display order is reverse chronological — newest commits at the top, parents
 * below. The bidirectional lane layout handles this naturally: a child claims
 * a lane first, and its parent inherits that lane later in the row order.
 */
const initial = [
    {
        "id": 365,
        "created_at": "2026-07-13T23:31:35+08:00",
        "created_by": "bo.song",
        "main_version": "5.7.5.2",
        "parent_id": 364
    },
    {
        "id": 364,
        "created_at": "2026-07-13T23:31:00+08:00",
        "created_by": "bo.song",
        "main_version": "5.7.5.1",
        "parent_id": 140
    },
    {
        "id": 363,
        "created_at": "2026-07-13T23:30:09+08:00",
        "created_by": "bo.song",
        "main_version": "5.7.9.1",
        "parent_id": 142
    },
    {
        "id": 348,
        "created_at": "2026-07-13T16:55:23+08:00",
        "created_by": "hao.jiang",
        "main_version": "5.9.1",
        "parent_id": 347
    },
    {
        "id": 347,
        "created_at": "2026-07-13T16:03:24+08:00",
        "created_by": "hao.jiang",
        "main_version": "5.9.0",
        "parent_id": 143
    },
    {
        "id": 143,
        "created_at": "2026-06-26T19:10:03+08:00",
        "created_by": "linjun.tang",
        "main_version": "5.7.12",
        "parent_id": 142
    },
    {
        "id": 142,
        "created_at": "2026-06-23T21:20:34+08:00",
        "created_by": "linjun.tang",
        "main_version": "5.7.9",
        "parent_id": 141
    },
    {
        "id": 141,
        "created_at": "2026-06-23T20:32:59+08:00",
        "created_by": "linjun.tang",
        "main_version": "5.7.8",
        "parent_id": 140
    },
    {
        "id": 360,
        "created_at": "2026-06-22T23:02:38+08:00",
        "created_by": "bo.song",
        "main_version": "5.6.8.11",
        "parent_id": 350
    },
    {
        "id": 359,
        "created_at": "2026-06-22T23:02:07+08:00",
        "created_by": "bo.song",
        "main_version": "5.6.8.10",
        "parent_id": 350
    },
    {
        "id": 358,
        "created_at": "2026-06-22T23:00:34+08:00",
        "created_by": "bo.song",
        "main_version": "5.6.8.9",
        "parent_id": 356
    },
    {
        "id": 357,
        "created_at": "2026-06-22T23:00:13+08:00",
        "created_by": "bo.song",
        "main_version": "5.6.8.8",
        "parent_id": 356
    },
    {
        "id": 140,
        "created_at": "2026-06-22T22:06:40+08:00",
        "created_by": "linjun.tang",
        "main_version": "5.7.5",
        "parent_id": 139
    },
    {
        "id": 139,
        "created_at": "2026-06-22T21:46:30+08:00",
        "created_by": "linjun.tang",
        "main_version": "5.7.2",
        "parent_id": 138
    },
    {
        "id": 362,
        "created_at": "2026-06-18T23:27:21+08:00",
        "created_by": "bo.song",
        "main_version": "5.6.22.2",
        "parent_id": 361
    },
    {
        "id": 361,
        "created_at": "2026-06-18T23:17:24+08:00",
        "created_by": "bo.song",
        "main_version": "5.6.22.1",
        "parent_id": 133
    },
    {
        "id": 138,
        "created_at": "2026-06-18T19:07:34+08:00",
        "created_by": "hao.jiang",
        "main_version": "5.6.26",
        "parent_id": 137
    },
    {
        "id": 137,
        "created_at": "2026-06-18T19:03:20+08:00",
        "created_by": "hao.jiang",
        "main_version": "5.6.26",
        "parent_id": 136
    },
    {
        "id": 356,
        "created_at": "2026-06-17T22:57:14+08:00",
        "created_by": "bo.song",
        "main_version": "5.6.8.7",
        "parent_id": 355
    },
    {
        "id": 355,
        "created_at": "2026-06-17T22:56:30+08:00",
        "created_by": "bo.song",
        "main_version": "5.6.8.6",
        "parent_id": 351
    },
    {
        "id": 354,
        "created_at": "2026-06-17T22:55:45+08:00",
        "created_by": "bo.song",
        "main_version": "5.6.8.5",
        "parent_id": 350
    },
    {
        "id": 353,
        "created_at": "2026-06-17T22:54:43+08:00",
        "created_by": "bo.song",
        "main_version": "5.6.8.4",
        "parent_id": 352
    },
    {
        "id": 352,
        "created_at": "2026-06-17T22:54:04+08:00",
        "created_by": "bo.song",
        "main_version": "5.6.8.3",
        "parent_id": 351
    },
    {
        "id": 351,
        "created_at": "2026-06-17T22:45:35+08:00",
        "created_by": "bo.song",
        "main_version": "5.6.8.2",
        "parent_id": 126
    },
    {
        "id": 350,
        "created_at": "2026-06-17T22:40:56+08:00",
        "created_by": "bo.song",
        "main_version": "5.6.8.1",
        "parent_id": 126
    },
    {
        "id": 136,
        "created_at": "2026-06-17T17:42:01+08:00",
        "created_by": "extern.ke.xu",
        "main_version": "5.6.25",
        "parent_id": 135
    },
    {
        "id": 135,
        "created_at": "2026-06-17T15:39:48+08:00",
        "created_by": "lei.cao",
        "main_version": "5.6.24",
        "parent_id": 134
    },
    {
        "id": 134,
        "created_at": "2026-06-17T15:07:25+08:00",
        "created_by": "lei.cao",
        "main_version": "5.6.23",
        "parent_id": 133
    },
    {
        "id": 133,
        "created_at": "2026-06-17T14:38:46+08:00",
        "created_by": "lei.cao",
        "main_version": "5.6.22",
        "parent_id": 132
    },
    {
        "id": 132,
        "created_at": "2026-06-17T10:39:56+08:00",
        "created_by": "lei.cao",
        "main_version": "5.6.21",
        "parent_id": 131
    },
    {
        "id": 131,
        "created_at": "2026-06-17T10:28:33+08:00",
        "created_by": "lei.cao",
        "main_version": "5.6.20",
        "parent_id": 130
    },
    {
        "id": 130,
        "created_at": "2026-06-16T21:00:15+08:00",
        "created_by": "linjun.tang",
        "main_version": "5.6.18",
        "parent_id": 129
    },
    {
        "id": 129,
        "created_at": "2026-06-16T20:56:54+08:00",
        "created_by": "linjun.tang",
        "main_version": "5.6.15",
        "parent_id": 128
    },
    {
        "id": 128,
        "created_at": "2026-06-16T20:54:14+08:00",
        "created_by": "linjun.tang",
        "main_version": "5.6.13",
        "parent_id": 127
    },
    {
        "id": 127,
        "created_at": "2026-06-16T20:47:21+08:00",
        "created_by": "linjun.tang",
        "main_version": "5.6.10",
        "parent_id": 126
    },
    {
        "id": 126,
        "created_at": "2026-06-16T20:44:50+08:00",
        "created_by": "linjun.tang",
        "main_version": "5.6.8",
        "parent_id": 125
    },
    {
        "id": 125,
        "created_at": "2026-06-16T20:29:37+08:00",
        "created_by": "lei.cao",
        "main_version": "5.6.5",
        "parent_id": 124
    },
    {
        "id": 124,
        "created_at": "2026-06-16T20:24:56+08:00",
        "created_by": "lei.cao",
        "main_version": "5.6.5",
        "parent_id": 123
    },
    {
        "id": 123,
        "created_at": "2026-06-16T20:02:41+08:00",
        "created_by": "linjun.tang",
        "main_version": "5.6.4",
        "parent_id": 122
    },
    {
        "id": 122,
        "created_at": "2026-06-16T13:41:26+08:00",
        "created_by": "hao.jiang",
        "main_version": "5.6.1",
        "parent_id": 121
    },
    {
        "id": 121,
        "created_at": "2026-06-15T11:45:03+08:00",
        "created_by": "extern.lianshuai.ding",
        "main_version": "5.6.0",
        "parent_id": 120
    },
    {
        "id": 120,
        "created_at": "2026-06-12T10:27:01+08:00",
        "created_by": "linjun.tang",
        "main_version": "5.5.147",
        "parent_id": 119
    },
    {
        "id": 119,
        "created_at": "2026-06-12T10:18:53+08:00",
        "created_by": "linjun.tang",
        "main_version": "5.5.146",
        "parent_id": 118
    },
    {
        "id": 118,
        "created_at": "2026-06-12T10:09:38+08:00",
        "created_by": "linjun.tang",
        "main_version": "5.5.145",
        "parent_id": 117
    },
    {
        "id": 117,
        "created_at": "2026-06-12T09:58:23+08:00",
        "created_by": "linjun.tang",
        "main_version": "5.5.144",
        "parent_id": 116
    },
    {
        "id": 116,
        "created_at": "2026-06-12T02:18:24+08:00",
        "created_by": "extern.lianshuai.ding",
        "main_version": "5.5.143",
        "parent_id": 115
    },
    {
        "id": 115,
        "created_at": "2026-06-12T00:02:46+08:00",
        "created_by": "extern.lianshuai.ding",
        "main_version": "5.5.142",
        "parent_id": 114
    },
    {
        "id": 114,
        "created_at": "2026-06-11T21:25:03+08:00",
        "created_by": "linjun.tang",
        "main_version": "5.5.141",
        "parent_id": 113
    },
    {
        "id": 113,
        "created_at": "2026-06-11T21:21:38+08:00",
        "created_by": "linjun.tang",
        "main_version": "5.5.137",
        "parent_id": 112
    },
    {
        "id": 112,
        "created_at": "2026-06-11T21:19:40+08:00",
        "created_by": "linjun.tang",
        "main_version": "5.5.133",
        "parent_id": 111
    }
]

const [cols, setCols] = createSignal([
  { id: 'main_version', name: 'Version', width: 140 },
  { id: 'created_by', name: 'Author', width: 210 },
  { id: 'created_at', name: 'Date', width: 220 },
  { id: 'parent_id', name: 'Parent', width: 110 },
])

const [data, setData] = createSignal(initial)

export default () => (
  <Intable
    columns={cols()}
    onColumnsChange={setCols}
    data={data()}
    onDataChange={setData}
    border
    stickyHeader
    size='small'
    rowKey='id'
    branchGraph={{ parentField: 'parent_id', width: 140, laneGap: 18 }}
  />
)
