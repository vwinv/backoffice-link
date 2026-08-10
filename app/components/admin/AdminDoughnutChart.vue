<script setup lang="ts">
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut } from 'vue-chartjs'
import type { ChartSeries } from '~/composables/useAdminDashboard'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = withDefaults(defineProps<{
  series: ChartSeries
  colors?: string[]
}>(), {
  colors: () => ['#0a6bff', '#ffc400', '#0c0d10', '#5b616e', '#85aeff'],
})

const DO_MUTED = '#5b616e'
const DO_INK = '#0c0d10'

const total = computed(() =>
  props.series.values.reduce((sum, value) => sum + value, 0),
)

const chartData = computed(() => ({
  labels: props.series.labels,
  datasets: [
    {
      data: props.series.values,
      backgroundColor: props.colors.slice(0, props.series.labels.length),
      borderWidth: 0,
      hoverOffset: 6,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
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
        padding: 14,
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
}
</script>

<template>
  <div class="chart-wrap">
    <Doughnut :data="chartData" :options="chartOptions" />
    <div class="center">
      <p class="center-value">
        {{ total }}
      </p>
      <p class="center-label">
        Total
      </p>
    </div>
  </div>
</template>

<style scoped>
.chart-wrap {
  position: relative;
  height: 280px;
  width: 100%;
  margin-top: auto;
}

.center {
  position: absolute;
  inset: 0 0 56px;
  display: grid;
  place-content: center;
  pointer-events: none;
  text-align: center;
}

.center-value {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--do-ink);
  line-height: 1;
}

.center-label {
  margin: 4px 0 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--do-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
