// import './index.scss'
import 'virtual:uno.css'

import { createApp, h, ref, shallowRef, toRaw, watchEffect } from 'vue'
// import Intable from '@intable/vue'
import Intable from '../packages/vue/src'

// import './theme/element-plus.scss'
import { log } from 'intable/utils'
import { createMutable } from 'solid-js/store'
import { effect } from 'solid-js/web'
import { batch, createComputed, createEffect, createMemo } from 'solid-js'

const container = document.createElement('div')
document.body.append(container)

const data = ref([{ id: '1', date: '2016-05-03' },{date: 'xxx'}])
setTimeout(() => {
  // data.value = [
  //   { id: 1, date: '2016-05-03', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
  //   { id: 2, date: '2016-05-03', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
  //   { id: 3, date: '2016-05-03', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
  // ]
}, 1000);

const selected = ref([])
watchEffect(() => {
  // console.log(selected.value)
  // console.log(data.value)
})

createApp(() => [
  h(Intable, {
    style: 'width: 600px; margin: 64px',
    class: 'w-100 m-4',
    data: data.value,
    'onUpdate:data': v => data.value = v,
    onDataChange: v => data.value = v,
    border: true,
    index: true,
    size: 'small',
    columns: [
      { name: 'Date', id: 'date', editable: true, enum: { a: 1 }, editor: 'date' },
      { name: 'Name', id: 'name' },
      { name: 'Address', id: 'address', width: 250 },
      // todo re render
      { name: '4', id: '4', render: o => h('div', { class: 'c-red' }, '111'), fixed: 'right' },
    ],
    selected: selected.value,
    'onUpdate:selected': v => selected.value = v,
    rowSelection: { enable: true }
  }),
])
  .mount(container)
