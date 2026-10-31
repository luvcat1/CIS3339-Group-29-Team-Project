<template>
  <div class="w-1/2">
    <canvas class="p-10" ref="zipChart"></canvas>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

const props = defineProps({
  label: { type: Array, required: true },
  chartData: { type: Array, required: true }
})

const zipChart = ref(null)
let chart

// Keep the existing Chart.js instance in sync with reactive props instead of recreating it.
function updateChart() {
  if (!chart) return
  chart.data.labels = props.label
  chart.data.datasets[0].data = props.chartData
  chart.update()
}

onMounted(() => {
  chart = new Chart(zipChart.value, {
    type: 'doughnut',
    data: {
      labels: props.label,
      datasets: [{ borderWidth: 1, data: props.chartData }]
    },
    options: {
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Clients by Zip Code' }
      },
      responsive: true,
      maintainAspectRatio: true
    }
  })
})

watch(() => [props.label, props.chartData], updateChart, { deep: true })
// Release Chart.js canvas listeners when Vue removes this component.
onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>
