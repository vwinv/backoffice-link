<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import type { ChartSeries } from '~/composables/useAdminDashboard'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps<{
  series: ChartSeries
}>()

const DO_BLUE = '#0a6bff'
const DO_MUTED = '#5b616e'
const DO_INK = '#0c0d10'

const chartData = computed(() => ({
  labels: props.series.labels,
  datasets: [
    {
      label: 'CA (FCFA)',
      data: props.series.values,
      backgroundColor: DO_BLUE,
      borderRadius: 10,
      maxBarThickness: 42,
    },
  ],
}))

const chartOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: DO_INK,
      titleFont: { family: 'Plus Jakarta Sans', weight: 700 },
      bodyFont: { family: 'Plus Jakarta Sans' },
      padding: 12,
      cornerRadius: 10,
      callbacks: {
        label(context: { parsed: { x: number | null } }) {
          const value = context.parsed.x ?? 0
          return `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`
        },
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: 'rgba(229, 229, 234, 0.9)' },
      ticks: {
        color: DO_MUTED,
        font: { family: 'Plus Jakarta Sans', size: 11 },
        callback(value: string | number) {
          return new Intl.NumberFormat('fr-FR', {
            notation: 'compact',
            compactDisplay: 'short',
          }).format(Number(value))
        },
      },
      border: { display: false },
    },
    y: {
      grid: { display: false },
      ticks: {
        color: DO_INK,
        font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 },
      },
      border: { display: false },
    },
  },
}
</script>

<template>
  <div class="chart-wrap">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-wrap {
  height: 280px;
  width: 100%;
}
</style>
