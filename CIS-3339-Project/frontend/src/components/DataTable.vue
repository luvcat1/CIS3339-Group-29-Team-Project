<!--
  Reusable table with client-side sorting and pagination.

  Props
    columns  Array of { label, field, render?, sortValue?, width? }
               label      header text
               field      key on the row object; dotted paths like "address.city" work
               render     optional (row) => string|number shown in the cell instead of the raw field
               sortValue  optional (row) => value to sort by (use when render shows a computed value)
               width      optional CSS width for the column, e.g. "25%"
    rows     Array of row objects. null/undefined means "not loaded yet" (header only, no
             "No results" row); an empty array means "loaded, nothing found".
    pageSize (optional) rows per page, default 10
    rowKey   (optional) unique key on each row, default "_id"

  Events
    row-click(row)   emitted when a row is clicked, or Enter is pressed on a focused row

  Sorting cycles ascending -> descending -> unsorted (original order) per header click.
  Sorting and paging only touch the rows already passed in; nothing is mutated.
-->
<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: null },
  pageSize: { type: Number, default: 10 },
  rowKey: { type: String, default: '_id' }
})

const emit = defineEmits(['row-click'])

// ---- helpers ----------------------------------------------------------------

// read "a.b.c" from an object without throwing when something in the path is missing
function getByPath(obj, path) {
  return String(path)
    .split('.')
    .reduce((value, key) => (value == null ? undefined : value[key]), obj)
}

function sortValueFor(column, row) {
  return column.sortValue ? column.sortValue(row) : getByPath(row, column.field)
}

function cellText(column, row) {
  return column.render ? column.render(row) : getByPath(row, column.field)
}

// Empty values always sort last, whichever direction is active.
function compare(a, b, direction) {
  const aEmpty = a == null || a === ''
  const bEmpty = b == null || b === ''
  if (aEmpty && bEmpty) return 0
  if (aEmpty) return 1
  if (bEmpty) return -1
  if (a instanceof Date) a = a.getTime()
  if (b instanceof Date) b = b.getTime()
  if (typeof a === 'number' && typeof b === 'number') return (a - b) * direction
  return (
    String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }) *
    direction
  )
}

// ---- sorting ----------------------------------------------------------------

const sortIndex = ref(null) // index of the sorted column, or null
const sortDirection = ref(null) // 'asc' | 'desc' | null

function toggleSort(index) {
  if (sortIndex.value !== index) {
    sortIndex.value = index
    sortDirection.value = 'asc'
  } else if (sortDirection.value === 'asc') {
    sortDirection.value = 'desc'
  } else {
    sortIndex.value = null
    sortDirection.value = null
  }
  page.value = 1
}

function ariaSort(index) {
  if (sortIndex.value !== index) return 'none'
  return sortDirection.value === 'asc' ? 'ascending' : 'descending'
}

const loaded = computed(() => Array.isArray(props.rows))
const allRows = computed(() => (loaded.value ? props.rows : []))

const sortedRows = computed(() => {
  const column = props.columns[sortIndex.value]
  if (!column || !sortDirection.value) return allRows.value
  const direction = sortDirection.value === 'asc' ? 1 : -1
  // copy first: Array.sort mutates, and props must not be mutated
  return [...allRows.value].sort((a, b) =>
    compare(sortValueFor(column, a), sortValueFor(column, b), direction)
  )
})

// ---- pagination -------------------------------------------------------------

const page = ref(1)

const total = computed(() => sortedRows.value.length)
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / props.pageSize)))
// Clamped so the visible page can never point past the end of the current data.
const currentPage = computed(() => Math.min(Math.max(page.value, 1), pageCount.value))
const startIndex = computed(() => (currentPage.value - 1) * props.pageSize)
const pageRows = computed(() =>
  sortedRows.value.slice(startIndex.value, startIndex.value + props.pageSize)
)
const showingFrom = computed(() => (total.value === 0 ? 0 : startIndex.value + 1))
const showingTo = computed(() => startIndex.value + pageRows.value.length)

// A new rows array (a search, a clear, a reload) always starts back on page 1.
watch(
  () => props.rows,
  () => {
    page.value = 1
  }
)

function goTo(n) {
  page.value = Math.min(Math.max(n, 1), pageCount.value)
}

// 1 … 4 5 6 … 12   (numbers or '…' placeholders)
const pageButtons = computed(() => {
  const last = pageCount.value
  const current = currentPage.value
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  const pages = new Set([1, last, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
})

// ---- rows -------------------------------------------------------------------

function keyFor(row, index) {
  const key = getByPath(row, props.rowKey)
  return key == null ? `row-${startIndex.value + index}` : key
}

const hoverKey = ref(null)
</script>

<template>
  <div class="w-full">
    <table class="min-w-full shadow-md rounded">
      <thead class="bg-gray-50 text-xl">
        <tr>
          <th
            v-for="(column, index) in columns"
            :key="column.field + index"
            scope="col"
            class="p-4 text-left"
            :style="column.width ? { width: column.width } : null"
            :aria-sort="ariaSort(index)">
            <button
              type="button"
              class="flex items-center gap-2 p-0 text-left font-bold hover:text-red-700 focus:outline-none focus-visible:ring focus-visible:ring-red-300 rounded"
              @click="toggleSort(index)">
              <span>{{ column.label }}</span>
              <span aria-hidden="true" class="text-sm" :class="sortIndex === index ? 'text-red-700' : 'text-gray-400'">
                {{ sortIndex !== index ? '↕' : sortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </button>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-300">
        <tr v-if="loaded && total === 0">
          <td :colspan="columns.length" class="p-6 text-center italic text-gray-500">No results</td>
        </tr>
        <tr
          v-for="(row, index) in pageRows"
          :key="keyFor(row, index)"
          class="cursor-pointer"
          :class="{ hoverRow: hoverKey === keyFor(row, index) }"
          tabindex="0"
          @click="emit('row-click', row)"
          @keydown.enter="emit('row-click', row)"
          @mouseenter="hoverKey = keyFor(row, index)"
          @mouseleave="hoverKey = null">
          <td v-for="(column, c) in columns" :key="column.field + c" class="p-3 text-left">
            {{ cellText(column, row) }}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- pagination footer: only when there is something to page through -->
    <div v-if="total > 0" class="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
      <p aria-live="polite">Showing {{ showingFrom }}-{{ showingTo }} of {{ total }}</p>
      <nav aria-label="Pagination" class="flex items-center gap-1">
        <button
          type="button"
          class="px-3 py-1 rounded border border-gray-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="currentPage === 1"
          @click="goTo(currentPage - 1)">
          Previous
        </button>
        <template v-for="(p, i) in pageButtons" :key="`${p}-${i}`">
          <span v-if="p === '…'" class="px-1 text-gray-500">…</span>
          <button
            v-else
            type="button"
            class="px-3 py-1 rounded border"
            :class="p === currentPage ? 'bg-red-700 text-white border-red-700' : 'bg-white border-gray-300'"
            :aria-current="p === currentPage ? 'page' : null"
            @click="goTo(p)">
            {{ p }}
          </button>
        </template>
        <button
          type="button"
          class="px-3 py-1 rounded border border-gray-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="currentPage === pageCount"
          @click="goTo(currentPage + 1)">
          Next
        </button>
      </nav>
    </div>
  </div>
</template>
