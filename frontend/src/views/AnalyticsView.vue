<template>
  <Layout>
    <div class="space-y-6">
      <!-- Revenus 12 mois -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            CA des 12 derniers mois
          </h3>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Total: {{ formatCurrency(sum(revenueByMonth.map((x) => x.value))) }}
          </div>
        </div>
        <svg :width="width" :height="height">
          <g :transform="`translate(${m.left},${m.top})`">
            <template v-for="(bar, i) in revenueBars" :key="i">
              <rect
                :x="bar.x"
                :y="bar.y"
                :width="bar.w"
                :height="bar.h"
                fill="#2563EB"
                opacity="0.8"
              />
              <text
                v-if="bar.h > 16"
                :x="bar.x + bar.w / 2"
                :y="bar.y - 4"
                text-anchor="middle"
                font-size="10"
                fill="currentColor"
              >
                {{ formatShort(bar.value) }}
              </text>
              <text
                :x="bar.x + bar.w / 2"
                :y="innerH + 12"
                text-anchor="middle"
                font-size="10"
                fill="currentColor"
              >
                {{ shortMonth(bar.label) }}
              </text>
            </template>
            <line
              x1="0"
              :y1="innerH"
              :x2="innerW"
              :y2="innerH"
              stroke="currentColor"
              stroke-width="1"
              opacity="0.3"
            />
          </g>
        </svg>
      </div>

      <!-- Devis acceptés/envoyés par mois -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Devis par mois
        </h3>
        <svg :width="width" :height="height">
          <g :transform="`translate(${m.left},${m.top})`">
            <polyline
              :points="linePoints(acceptedSeries)"
              fill="none"
              stroke="#16A34A"
              stroke-width="2"
            />
            <polyline
              :points="linePoints(sentSeries)"
              fill="none"
              stroke="#F59E0B"
              stroke-width="2"
            />
            <template v-for="(pt, i) in acceptedSeries" :key="'a' + i">
              <circle :cx="x(i)" :cy="y2(pt.value)" r="2" fill="#16A34A" />
            </template>
            <template v-for="(pt, i) in sentSeries" :key="'s' + i">
              <circle :cx="x(i)" :cy="y2(pt.value)" r="2" fill="#F59E0B" />
            </template>
            <line
              x1="0"
              :y1="innerH"
              :x2="innerW"
              :y2="innerH"
              stroke="currentColor"
              stroke-width="1"
              opacity="0.3"
            />
            <template v-for="(l, i) in labels" :key="'l' + i">
              <text
                :x="x(i)"
                :y="innerH + 12"
                font-size="10"
                text-anchor="middle"
                fill="currentColor"
              >
                {{ shortMonth(l) }}
              </text>
            </template>
          </g>
        </svg>
        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Légende: <span class="text-green-600">● Acceptés</span> ·
          <span class="text-amber-600">● Envoyés</span>
        </div>
      </div>

      <!-- Top clients 90j et Encours (aging) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Top clients (90 jours)
          </h3>
          <div
            v-if="topClients90.length === 0"
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            Aucune donnée
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="c in topClients90"
              :key="c.id"
              class="flex items-center justify-between"
            >
              <div class="text-sm">{{ c.company || c.name }}</div>
              <div class="text-sm font-medium">
                {{ formatCurrency(c.total) }}
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aging encours
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 rounded bg-gray-50 dark:bg-gray-700">
              <div class="text-xs text-gray-500">0–30j retard</div>
              <div class="text-sm font-semibold">
                {{ formatCurrency(aging.o0_30) }}
              </div>
            </div>
            <div class="p-3 rounded bg-gray-50 dark:bg-gray-700">
              <div class="text-xs text-gray-500">31–60j retard</div>
              <div class="text-sm font-semibold">
                {{ formatCurrency(aging.o31_60) }}
              </div>
            </div>
            <div class="p-3 rounded bg-gray-50 dark:bg-gray-700">
              <div class="text-xs text-gray-500">61–90j retard</div>
              <div class="text-sm font-semibold">
                {{ formatCurrency(aging.o61_90) }}
              </div>
            </div>
            <div class="p-3 rounded bg-gray-50 dark:bg-gray-700">
              <div class="text-xs text-gray-500">> 90j retard</div>
              <div class="text-sm font-semibold">
                {{ formatCurrency(aging.o90_plus) }}
              </div>
            </div>
          </div>
          <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Échéances < 30 jours: {{ formatCurrency(aging.dueSoon) }}
          </div>
        </div>
      </div>

      <!-- Pipeline devis envoyés (12 mois) -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Pipeline devis (envoyés)
        </h3>
        <svg :width="width" :height="height">
          <g :transform="`translate(${m.left},${m.top})`">
            <template v-for="(bar, i) in pipelineBars" :key="i">
              <rect
                :x="bar.x"
                :y="bar.y"
                :width="bar.w"
                :height="bar.h"
                fill="#F59E0B"
                opacity="0.8"
              />
              <text
                v-if="bar.h > 16"
                :x="bar.x + bar.w / 2"
                :y="bar.y - 4"
                text-anchor="middle"
                font-size="10"
                fill="currentColor"
              >
                {{ formatShort(bar.value) }}
              </text>
              <text
                :x="bar.x + bar.w / 2"
                :y="innerH + 12"
                text-anchor="middle"
                font-size="10"
                fill="currentColor"
              >
                {{ shortMonth(bar.label) }}
              </text>
            </template>
            <line
              x1="0"
              :y1="innerH"
              :x2="innerW"
              :y2="innerH"
              stroke="currentColor"
              stroke-width="1"
              opacity="0.3"
            />
          </g>
        </svg>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Layout from '@/components/Layout.vue'
import api from '@/utils/api'

const width = 720,
  height = 220
const m = { top: 10, right: 10, bottom: 24, left: 32 }
const innerW = width - m.left - m.right
const innerH = height - m.top - m.bottom

const revenueByMonth = ref([])
const quotesMonthly = ref([])
const pipelineByMonth = ref([])
const topClients90 = ref([])
const aging = ref({ o0_30: 0, o31_60: 0, o61_90: 0, o90_plus: 0, dueSoon: 0 })

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard/analytics')
    revenueByMonth.value = data.revenueByMonth || []
    quotesMonthly.value = data.quotesMonthly || []
    pipelineByMonth.value = data.pipelineSentByMonth || []
    topClients90.value = data.topClients90 || []
    aging.value = data.outstandingAging || aging.value
  } catch (e) {
    /* handled by api */
  }
})

const labels = computed(() => (revenueByMonth.value || []).map((d) => d.label))

function sum(arr) {
  return (arr || []).reduce((a, b) => a + (+b || 0), 0)
}
function formatCurrency(v) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(v || 0))
}
function shortMonth(ym) {
  const [y, m] = (ym || '').split('-')
  const months = [
    '',
    'jan',
    'fév',
    'mar',
    'avr',
    'mai',
    'jui',
    'jui',
    'aoû',
    'sep',
    'oct',
    'nov',
    'déc',
  ]
  return months[Number(m)]
}
function formatShort(v) {
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'k'
  return Math.round(v).toString()
}

// Bars revenue
const revenueMax = computed(() =>
  Math.max(1, ...revenueByMonth.value.map((d) => d.value))
)
const barW = computed(
  () => innerW / Math.max(1, revenueByMonth.value.length) - 6
)
const revenueBars = computed(() =>
  revenueByMonth.value.map((d, i) => {
    const x = i * (innerW / revenueByMonth.value.length) + 3
    const h = (d.value / revenueMax.value) * innerH
    return {
      x,
      y: innerH - h,
      w: barW.value,
      h,
      value: d.value,
      label: d.label,
    }
  })
)

// Lines quotes accepted/sent
const acceptedSeries = computed(() =>
  quotesMonthly.value.map((d) => ({ label: d.label, value: d.accepted }))
)
const sentSeries = computed(() =>
  quotesMonthly.value.map((d) => ({ label: d.label, value: d.sent }))
)
function x(i) {
  return i * (innerW / Math.max(1, labels.value.length - 1))
}
function y2(v) {
  const max = Math.max(
    1,
    ...quotesMonthly.value.map((d) => Math.max(d.accepted, d.sent))
  )
  return innerH - (v / max) * innerH
}
function linePoints(series) {
  const arr = Array.isArray(series) ? series : series?.value || []
  return arr.map((d, i) => `${x(i)},${y2(d.value)}`).join(' ')
}

// Bars pipeline
const pipelineMax = computed(() =>
  Math.max(1, ...pipelineByMonth.value.map((d) => d.value))
)
const pipelineBars = computed(() =>
  pipelineByMonth.value.map((d, i) => {
    const x = i * (innerW / pipelineByMonth.value.length) + 3
    const h = (d.value / pipelineMax.value) * innerH
    return {
      x,
      y: innerH - h,
      w: barW.value,
      h,
      value: d.value,
      label: d.label,
    }
  })
)
</script>

<style scoped>
svg {
  color: #9ca3af;
}
</style>
