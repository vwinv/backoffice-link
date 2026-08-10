<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import type { ActivitySeries } from '~/composables/useAdminDashboard'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
)

const props = defineProps<{
  series: ActivitySeries
}>()

const DO_BLUE = '#0a6bff'
const DO_GOLD = '#ffc400'
const DO_INK = '#0c0d10'
const DO_MUTED = '#5b616e'

function formatLabel(isoDay: string) {
  const [, month, day] = isoDay.split('-')
  return `${day}/${month}`
}

const chartData = computed(() => ({
  labels: props.series.labels.map(formatLabel),
  datasets: [
    {
      label: 'Vues',
      data: props.series.views,
      borderColor: DO_BLUE,
      backgroundColor: 'rgba(10, 107, 255, 0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2.5,
    },
    {
      label: 'Partages',
      data: props.series.shares,
      borderColor: DO_GOLD,
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2.5,
    },
    {
      label: 'Nouveaux users',
      data: props.series.users,
      borderColor: DO_INK,
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2,
      borderDash: [5, 4],
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        boxWidth: 10,
        boxHeight: 10,
        usePointStyle: true,
        pointStyle: 'circle' as const,
        color: DO_MUTED,
        font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 },
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: DO_INK,
      titleFont: { family: 'Plus Jakarta Sans', weight: 700 },
      bodyFont: { family: 'Plus Jakarta Sans' },
      padding: 12,
      cornerRadius: 10,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: DO_MUTED,
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 8,
        font: { family: 'Plus Jakarta Sans', size: 11 },
      },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(229, 229, 234, 0.9)' },
      ticks: {
        color: DO_MUTED,
        precision: 0,
        font: { family: 'Plus Jakarta Sans', size: 11 },
      },
      border: { display: false },
    },
  },
}
</script>

<template>
  <div class="chart-wrap">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-wrap {
  height: 280px;
  width: 100%;
}
</style>
