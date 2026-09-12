<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  allowedKitchenTransitions,
  extractDetailMessage,
  extractFieldErrors,
  getKitchenBoard,
  KITCHEN_BOARD_STATUSES,
  setKitchenItemStatus,
  type KitchenBoard,
  type KitchenItem,
  type KitchenStatus,
} from '@/services/restaurantService'
import { canShowModule, parseStoredJson } from '@/utils/moduleVisibility'

const POLL_MS = 8000
const CLOCK_MS = 15000

const router = useRouter()
const { t } = useI18n()

const board = ref<KitchenBoard>({ last_changed_at: null, orders: [] })
const loading = ref(false)
const loaded = ref(false)
const errorMessage = ref('')
const updatingItemId = ref<number | null>(null)

/**
 * The ETag from the LAST response, 200 or 304 alike. Sent as If-None-Match on
 * the next poll. Deliberately not the one from the first load: re-sending a
 * stale ETag would make the server answer 200 with a full body every time,
 * quietly throwing away the point of conditional polling.
 */
const lastEtag = ref<string | null>(null)

/**
 * Set when the ETag response header cannot be read. Cross-origin that means
 * the API is missing CORS_EXPOSE_HEADERS = ["ETag"]. Surfaced rather than
 * worked around: the board keeps polling, but says plainly that it is
 * transferring the full payload every time.
 */
const etagUnavailable = ref(false)

/** Items the board sent with no usable kitchen_status - a backend bug. */
const invalidItemCount = ref(0)

const polling = ref(false)
const lastUpdatedAt = ref<Date | null>(null)

// Ticks on its own so "for 4 min" stays current between polls.
const now = ref(Date.now())

let pollTimer: number | undefined
let clockTimer: number | undefined

const columns = computed(() =>
  KITCHEN_BOARD_STATUSES.map((status) => ({
    status,
    label: columnLabel(status),
    // Grouping is kept per order inside each column, so the table and waiter
    // context travels with the items instead of being lost in a flat list.
    groups: board.value.orders
      .map((order) => ({
        order,
        items: order.items.filter((item) => item.kitchen_status === status),
      }))
      .filter((group) => group.items.length > 0),
  })),
)

const itemsWaiting = computed(() =>
  board.value.orders.reduce((sum, order) => sum + order.items.length, 0),
)

const ordersOpen = computed(
  () => board.value.orders.filter((order) => order.items.length > 0).length,
)

const oldestWaitMs = computed(() => {
  let oldest = 0
  for (const order of board.value.orders) {
    for (const item of order.items) {
      const age = itemAgeMs(item)
      if (age > oldest) oldest = age
    }
  }
  return oldest
})

function columnLabel(status: KitchenStatus) {
  if (status === 'PENDING') return t('kitchenPage.colPending')
  if (status === 'PREPARING') return t('kitchenPage.colPreparing')
  return t('kitchenPage.colReady')
}

function actionLabel(to: KitchenStatus) {
  if (to === 'PREPARING') return t('kitchenPage.actionStart')
  if (to === 'READY') return t('kitchenPage.actionReady')
  if (to === 'SERVED') return t('kitchenPage.actionServed')
  return t('kitchenPage.actionCancel')
}

function itemAgeMs(item: KitchenItem) {
  if (!item.kitchen_status_updated_at) return 0
  const changed = new Date(item.kitchen_status_updated_at).getTime()
  if (Number.isNaN(changed)) return 0
  return Math.max(0, now.value - changed)
}

/**
 * Durations are computed here, from kitchen_status_updated_at. The server
 * never sends an elapsed time - there is no waiting_seconds field.
 */
function formatAge(ms: number) {
  const totalMinutes = Math.floor(ms / 60000)
  if (totalMinutes < 1) return t('kitchenPage.justNow')
  if (totalMinutes < 60) return t('kitchenPage.minutes', { count: totalMinutes })
  return t('kitchenPage.hours', {
    count: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  })
}

function ageClass(ms: number) {
  const minutes = ms / 60000
  if (minutes >= 15) return 'age-late'
  if (minutes >= 7) return 'age-warn'
  return 'age-ok'
}

function formatClock(value: Date | null) {
  if (!value) return '-'
  return value.toLocaleTimeString()
}

async function fetchBoard(useConditional = true) {
  loading.value = true

  try {
    const result = await getKitchenBoard(useConditional ? lastEtag.value : null)

    // Always take the ETag from this response - a 304 carries it too.
    if (result.etag) {
      lastEtag.value = result.etag
      etagUnavailable.value = false
    } else {
      etagUnavailable.value = true
      lastEtag.value = null
    }

    if (result.notModified) {
      // 304 has no body. Keep the board exactly as it is; replacing it would
      // blank the screen on every unchanged poll.
      lastUpdatedAt.value = new Date()
      errorMessage.value = ''
      return
    }

    if (result.board) {
      board.value = result.board
      invalidItemCount.value = result.invalidItems.length
      loaded.value = true
      lastUpdatedAt.value = new Date()
      errorMessage.value = ''
    }
  } catch (error: any) {
    errorMessage.value = extractDetailMessage(error, t('kitchenPage.failedLoad'))
  } finally {
    loading.value = false
  }
}

async function changeStatus(item: KitchenItem, to: KitchenStatus) {
  updatingItemId.value = item.id
  errorMessage.value = ''

  try {
    await setKitchenItemStatus(item.id, to)
    // Re-read rather than patching locally: SERVED and CANCELLED items drop
    // off the board entirely, and another device may have moved something
    // else in the meantime. The ETag will differ, so this comes back 200.
    await fetchBoard(false)
  } catch (error: any) {
    const fields = extractFieldErrors(error)
    errorMessage.value =
      fields.kitchen_status || extractDetailMessage(error, t('kitchenPage.failedUpdate'))
  } finally {
    updatingItemId.value = null
  }
}

function startPolling() {
  if (pollTimer !== undefined) return
  polling.value = true
  pollTimer = window.setInterval(() => fetchBoard(true), POLL_MS)
}

function stopPolling() {
  if (pollTimer !== undefined) {
    window.clearInterval(pollTimer)
    pollTimer = undefined
  }
  polling.value = false
}

/**
 * A kitchen board is left open all day. Polling every few seconds against a
 * tab nobody is looking at is pure load, so it stops while hidden and picks
 * up with an immediate read when the tab comes back - the board would
 * otherwise show stale food for up to one interval.
 */
function handleVisibility() {
  if (document.hidden) {
    stopPolling()
    return
  }

  void fetchBoard(true)
  startPolling()
}

onMounted(() => {
  const user = parseStoredJson<Record<string, any> | null>('user', null)
  if (!canShowModule('kitchen_display', user)) {
    sessionStorage.setItem(
      'module_access_message',
      'This module is not available for your business type, plan, or role.',
    )
    router.replace('/dashboard')
    return
  }

  void fetchBoard(false)
  startPolling()

  clockTimer = window.setInterval(() => {
    now.value = Date.now()
  }, CLOCK_MS)

  document.addEventListener('visibilitychange', handleVisibility)
})

onUnmounted(() => {
  stopPolling()
  if (clockTimer !== undefined) window.clearInterval(clockTimer)
  document.removeEventListener('visibilitychange', handleVisibility)
})
</script>

<template>
  <div class="kitchen-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">{{ t('kitchenPage.title') }}</h1>
        <p class="page-subtitle">{{ t('kitchenPage.subtitle') }}</p>
        <div class="breadcrumb">
          <span>{{ t('common.home') }}</span>
          <span>/</span>
          <span>{{ t('kitchenPage.breadcrumbRestaurant') }}</span>
          <span>/</span>
          <span class="active">{{ t('kitchenPage.title') }}</span>
        </div>
      </div>

      <div class="page-actions">
        <span class="live-pill" :class="polling ? 'on' : 'off'">
          {{ polling ? t('kitchenPage.live') : t('kitchenPage.paused') }}
        </span>
        <span class="updated-at">{{ t('kitchenPage.lastUpdated', { time: formatClock(lastUpdatedAt) }) }}</span>
        <button class="btn btn-light" type="button" :disabled="loading" @click="fetchBoard(false)">
          {{ loading ? t('common.loading') : t('kitchenPage.refresh') }}
        </button>
      </div>
    </section>

    <section v-if="errorMessage" class="alert-card error">
      {{ errorMessage }}
    </section>

    <!-- Reported, not worked around: without the ETag header the board cannot
         do a conditional GET and every poll moves the whole payload. -->
    <section v-if="etagUnavailable" class="alert-card warn">
      {{ t('kitchenPage.etagMissing') }}
    </section>

    <!-- kitchen_status must never be null on this board. If one arrives it is
         a backend bug, so it is reported rather than drawn as a state. -->
    <section v-if="invalidItemCount > 0" class="alert-card warn">
      {{ t('kitchenPage.invalidStatus', { count: invalidItemCount }) }}
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <p>{{ t('kitchenPage.itemsWaiting') }}</p>
        <h3>{{ itemsWaiting }}</h3>
      </article>
      <article class="summary-card">
        <p>{{ t('kitchenPage.ordersOpen') }}</p>
        <h3>{{ ordersOpen }}</h3>
      </article>
      <article class="summary-card">
        <p>{{ t('kitchenPage.oldestWait') }}</p>
        <h3 :class="ageClass(oldestWaitMs)">{{ formatAge(oldestWaitMs) }}</h3>
      </article>
    </section>

    <p v-if="!loaded && loading" class="board-message">{{ t('kitchenPage.loading') }}</p>
    <p v-else-if="loaded && itemsWaiting === 0" class="board-message">
      {{ t('kitchenPage.emptyBoard') }}
    </p>

    <section v-else class="board">
      <div v-for="column in columns" :key="column.status" class="column" :class="column.status.toLowerCase()">
        <header class="column-head">
          <h2>{{ column.label }}</h2>
          <span class="column-count">
            {{ column.groups.reduce((sum, group) => sum + group.items.length, 0) }}
          </span>
        </header>

        <p v-if="!column.groups.length" class="column-empty">{{ t('kitchenPage.emptyColumn') }}</p>

        <article v-for="group in column.groups" :key="`${column.status}-${group.order.order_id}`" class="order-card">
          <div class="order-head">
            <span class="order-table">
              {{ group.order.table || t('kitchenPage.noTable') }}
            </span>
            <span class="order-invoice">{{ group.order.invoice_number }}</span>
          </div>
          <p class="order-waiter">
            {{ group.order.waiter || t('kitchenPage.noWaiter') }}
          </p>

          <div v-for="item in group.items" :key="item.id" class="kitchen-item">
            <div class="item-line">
              <span class="item-qty">{{ item.quantity }}&times;</span>
              <span class="item-name">{{ item.product_name }}</span>
            </div>
            <p class="item-age" :class="ageClass(itemAgeMs(item))">
              {{ t('kitchenPage.since', { duration: formatAge(itemAgeMs(item)) }) }}
            </p>

            <!-- Only transitions the contract marks legal are offered. The
                 server rejects anything else with 400, so a button for an
                 illegal jump would be a button that always fails. -->
            <div class="item-actions">
              <button
                v-for="to in allowedKitchenTransitions(item.kitchen_status)"
                :key="to"
                class="btn"
                :class="to === 'CANCELLED' ? 'btn-cancel' : 'btn-advance'"
                type="button"
                :disabled="updatingItemId === item.id"
                @click="changeStatus(item, to)"
              >
                {{ actionLabel(to) }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* A kitchen reads this from several metres away: large type, strong contrast,
   generous hit targets, no dense table. */
.kitchen-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-header,
.summary-card,
.alert-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.page-header {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.page-title {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  color: #0f172a;
}

.page-subtitle {
  margin: 6px 0 0;
  color: #64748b;
}

.breadcrumb,
.page-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.breadcrumb {
  margin-top: 10px;
  font-size: 13px;
  color: #94a3b8;
}

.breadcrumb .active {
  color: #16a34a;
  font-weight: 700;
}

.live-pill {
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 800;
}

.live-pill.on {
  background: #dcfce7;
  color: #166534;
}

.live-pill.off {
  background: #f1f5f9;
  color: #64748b;
}

.updated-at {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.alert-card {
  padding: 14px 16px;
  font-weight: 600;
  line-height: 1.5;
}

.alert-card.error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.alert-card.warn {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.summary-card {
  padding: 16px 20px;
}

.summary-card p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}

.summary-card h3 {
  margin: 6px 0 0;
  font-size: 32px;
  font-weight: 800;
  color: #0f172a;
}

.board-message {
  margin: 0;
  padding: 40px 20px;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: #94a3b8;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
}

.board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  align-items: start;
}

.column {
  background: #f1f5f9;
  border-radius: 18px;
  padding: 14px;
  min-height: 180px;
  border-top: 6px solid #94a3b8;
}

.column.pending {
  border-top-color: #dc2626;
}

.column.preparing {
  border-top-color: #d97706;
}

.column.ready {
  border-top-color: #16a34a;
}

.column-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.column-head h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #0f172a;
}

.column-count {
  min-width: 34px;
  text-align: center;
  border-radius: 999px;
  background: #0f172a;
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  padding: 2px 10px;
}

.column-empty {
  margin: 0;
  padding: 18px 4px;
  color: #94a3b8;
  font-weight: 600;
}

.order-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.order-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.order-table {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
}

.order-invoice {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 700;
}

.order-waiter {
  margin: 2px 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}

.kitchen-item {
  border-top: 1px dashed #e2e8f0;
  padding-top: 10px;
  margin-top: 10px;
}

.kitchen-item:first-of-type {
  border-top: none;
  padding-top: 0;
  margin-top: 0;
}

.item-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.item-qty {
  font-size: 22px;
  font-weight: 800;
  color: #16a34a;
}

.item-name {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.item-age {
  margin: 4px 0 10px;
  font-size: 13px;
  font-weight: 700;
}

.age-ok {
  color: #16a34a;
}

.age-warn {
  color: #d97706;
}

.age-late {
  color: #dc2626;
}

.item-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  min-height: 44px;
  padding: 0 16px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-light {
  background: #fff;
  border: 1px solid #dbe3ef;
  color: #334155;
  min-height: 40px;
  font-size: 13px;
  font-weight: 700;
}

.btn-advance {
  background: #16a34a;
  color: #fff;
}

.btn-cancel {
  background: #fff;
  border: 2px solid #fca5a5;
  color: #b91c1c;
}

@media (max-width: 1100px) {
  .board {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }
}
</style>
