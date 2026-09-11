<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import { loadModuleContract } from '@/services/moduleContract'
import { normalizeBusinessType, normalizePlan } from '@/utils/moduleVisibility'

const warningText =
  'Changing business type or plan will change visible modules. Existing data will not be deleted.'

const businessTypeOptions = [
  { value: 'RETAIL', label: 'Retail' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'RESTAURANT', label: 'Restaurant' },
]

const planOptions = [
  { value: 'BASIC', label: 'Basic' },
  { value: 'PRO', label: 'Pro' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
]

const form = reactive({
  name: '',
  businessType: 'RETAIL',
  plan: 'BASIC',
})

const original = reactive({
  businessType: 'RETAIL',
  plan: 'BASIC',
})

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

/* ------------------------------------------------------------------ *
 * POS settings (backend model POSSettings, nested under /api/shop/me/)
 * ------------------------------------------------------------------ */

type PosSettingsApi = {
  tax_percent?: string | number
  invoice_prefix?: string
  low_stock_threshold?: number
  allow_negative_stock?: boolean
}

const posForm = reactive({
  taxPercent: '0.00',
  invoicePrefix: '',
  lowStockThreshold: 5,
  allowNegativeStock: false,
})

const posOriginal = reactive({
  taxPercent: '0.00',
  invoicePrefix: '',
  lowStockThreshold: 5,
  allowNegativeStock: false,
})

const posLoaded = ref(false)
const posSaving = ref(false)
const posError = ref('')
const posSuccess = ref('')

const confirmOpen = ref(false)
const negativeStockAcknowledged = ref(false)

/**
 * The backend refuses this PATCH for anyone but owner/admin
 * (MyShopAPIView.patch), so the form is read-only for everyone else rather
 * than offering a save that is guaranteed to 403.
 */
const canEditSettings = computed(() => {
  const user = parseStorage<Record<string, any> | null>('user', null)
  const role = String(user?.role || '').toLowerCase().trim()
  return role === 'owner' || role === 'admin' || Boolean(user?.is_shop_owner || user?.is_shop_admin)
})

const invoicePrefixChanged = computed(
  () => posForm.invoicePrefix.trim() !== posOriginal.invoicePrefix.trim(),
)

const enablingNegativeStock = computed(
  () => posForm.allowNegativeStock && !posOriginal.allowNegativeStock,
)

const posDirty = computed(
  () =>
    invoicePrefixChanged.value ||
    posForm.allowNegativeStock !== posOriginal.allowNegativeStock ||
    String(posForm.taxPercent).trim() !== String(posOriginal.taxPercent).trim() ||
    Number(posForm.lowStockThreshold) !== Number(posOriginal.lowStockThreshold),
)

/** Changes serious enough to stop and confirm before sending. */
const riskyChanges = computed(() => {
  const items: string[] = []
  if (invoicePrefixChanged.value) items.push('invoice_prefix')
  if (enablingNegativeStock.value) items.push('allow_negative_stock')
  return items
})

const confirmBlocked = computed(
  () => enablingNegativeStock.value && !negativeStockAcknowledged.value,
)

/* ------------------------------------------------------------------ *
 * Device sessions
 * ------------------------------------------------------------------ */

type DeviceSession = {
  id: number
  device_label: string
  created_at: string
  last_used_at: string
  is_current: boolean
}

const sessions = ref<DeviceSession[]>([])
const sessionsLoading = ref(false)
const sessionsError = ref('')
const revokingId = ref<number | null>(null)

const businessTypeLabel = computed(
  () => businessTypeOptions.find((o) => o.value === form.businessType)?.label || form.businessType,
)
const planLabel = computed(
  () => planOptions.find((o) => o.value === form.plan)?.label || form.plan,
)

// Neither field is editable here any more, so this never fires. Kept so the
// banner still works if a future screen lets a platform admin change them.
const showModuleWarning = computed(
  () => form.businessType !== original.businessType || form.plan !== original.plan,
)

function parseStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function loadStoredShop() {
  const user = parseStorage<Record<string, any> | null>('user', null)
  const shop = parseStorage<Record<string, any> | null>('shop', null)
  const businessType = normalizeBusinessType(
    shop?.businessType || shop?.business_type || user?.businessType || user?.shop_business_type,
  )
  const plan = normalizePlan(shop?.plan || user?.plan || user?.shop_plan)

  form.name = String(shop?.name || user?.shop_name || '')
  form.businessType = businessType
  form.plan = plan
  original.businessType = businessType
  original.plan = plan
}

/**
 * Caches the shop profile this page just read from the server.
 *
 * It deliberately does NOT touch `effective_modules`. It used to recompute
 * that list from the form's own values and write it to localStorage, which
 * made the browser the authority on its own entitlements - merely opening
 * this page overwrote what the backend granted at login. Entitlements come
 * from the login response and `GET /api/modules/`, and from nowhere else.
 */
function persistProfile() {
  const user = parseStorage<Record<string, any> | null>('user', null)
  const shop = parseStorage<Record<string, any> | null>('shop', null)

  if (user) {
    localStorage.setItem(
      'user',
      JSON.stringify({
        ...user,
        businessType: form.businessType,
        plan: form.plan,
        shop_business_type: form.businessType,
        shop_plan: form.plan,
      }),
    )
  }

  localStorage.setItem(
    'shop',
    JSON.stringify({
      ...(shop || {}),
      name: form.name || shop?.name || user?.shop_name || 'Shop',
      businessType: form.businessType,
      business_type: form.businessType,
      plan: form.plan,
    }),
  )
}

async function fetchShop() {
  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await api.get(ENDPOINTS.SHOP_ME)
    form.name = data?.name || form.name
    form.businessType = normalizeBusinessType(data?.businessType || data?.business_type || form.businessType)
    form.plan = normalizePlan(data?.plan || form.plan)
    original.businessType = form.businessType
    original.plan = form.plan
    applyPosSettings(data?.pos_settings)
    persistProfile()
    // The plan shown here and the modules the menu shows must agree, so pull
    // a fresh contract whenever the profile is (re)read.
    void loadModuleContract()
  } catch (error: any) {
    // Falling back to the cached profile is fine, but saying nothing is not:
    // the user would read stale values as current ones.
    loadStoredShop()
    errorMessage.value =
      error?.response?.data?.detail ||
      'Could not load shop settings from the server. Showing the last known values.'
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  // business_type and plan are managed by the platform administrator; the API
  // rejects them with 403, so they are not part of what this page submits.
  const payload = {
    name: form.name.trim(),
  }

  try {
    await api.patch(ENDPOINTS.SHOP_ME, payload)
    persistProfile()
    successMessage.value = 'Shop settings updated.'
  } catch (error: any) {
    // A rejected save must not look like a successful one. The previous branch
    // reported "saved locally", advanced `original`, and ran persistProfile(),
    // which wrote the unsaved plan and its recomputed effective_modules into
    // localStorage - so a refused upgrade still unlocked the menus client-side.
    form.plan = original.plan
    form.businessType = original.businessType
    errorMessage.value =
      error?.response?.data?.detail ||
      'Could not save shop settings. Please try again.'
  } finally {
    saving.value = false
  }
}

function applyPosSettings(data?: PosSettingsApi | null) {
  if (!data) {
    posLoaded.value = false
    return
  }

  posForm.taxPercent = String(data.tax_percent ?? '0.00')
  posForm.invoicePrefix = String(data.invoice_prefix ?? '')
  posForm.lowStockThreshold = Number(data.low_stock_threshold ?? 5)
  posForm.allowNegativeStock = Boolean(data.allow_negative_stock)

  Object.assign(posOriginal, posForm)
  posLoaded.value = true
}

/**
 * Renders whatever the server said, verbatim. The uniqueness check on
 * invoice_prefix runs server-side and its message is the only accurate
 * explanation available, so it must reach the user unaltered rather than
 * being swallowed and replaced with a generic "could not save".
 */
function extractApiError(error: any, fallback: string): string {
  const data = error?.response?.data
  const status = error?.response?.status

  if (typeof data === 'string') {
    const text = data.trim()
    // An unhandled 500 hands back Django's debug page - HTML normally, or a
    // plain-text traceback when the request asked for JSON, as ours does.
    // Either way it is pages of stack trace: useless in an alert box, and it
    // leaks server paths. Report the status and leave the detail in the
    // network log. A short string is a real message and is shown as sent.
    const looksLikeDebugPage =
      !text ||
      text.startsWith('<') ||
      text.includes('Traceback (most recent call last)') ||
      text.includes('Request Method:') ||
      text.length > 300

    if (looksLikeDebugPage) {
      return status ? `${fallback} (server error ${status})` : fallback
    }
    return text
  }

  if (!data || typeof data !== 'object') {
    return status ? `${fallback} (server error ${status})` : fallback
  }

  const parts: string[] = []

  const walk = (value: unknown, path: string) => {
    if (value === null || value === undefined) return
    if (Array.isArray(value)) {
      value.forEach((entry) => walk(entry, path))
      return
    }
    if (typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(([key, entry]) =>
        walk(entry, path ? `${path}.${key}` : key),
      )
      return
    }
    const text = String(value).trim()
    if (!text) return
    parts.push(path && path !== 'detail' ? `${path}: ${text}` : text)
  }

  walk(data, '')

  return parts.length ? parts.join(' | ') : fallback
}

/** Save button: stop for a confirmation when a change carries consequences. */
function requestPosSave() {
  posError.value = ''
  posSuccess.value = ''

  if (riskyChanges.value.length) {
    negativeStockAcknowledged.value = false
    confirmOpen.value = true
    return
  }

  void savePosSettings()
}

async function savePosSettings() {
  confirmOpen.value = false
  posSaving.value = true
  posError.value = ''
  posSuccess.value = ''

  const payload = {
    pos_settings: {
      tax_percent: String(posForm.taxPercent).trim() || '0',
      invoice_prefix: posForm.invoicePrefix.trim(),
      low_stock_threshold: Number(posForm.lowStockThreshold) || 0,
      allow_negative_stock: posForm.allowNegativeStock,
    },
  }

  try {
    const { data } = await api.patch(ENDPOINTS.SHOP_ME, payload)
    // Re-read from the response rather than assuming the payload was accepted
    // as sent - the server normalises the prefix and may clamp values.
    applyPosSettings(data?.pos_settings ?? payload.pos_settings)
    posSuccess.value = 'POS settings updated.'
  } catch (error: any) {
    // Nothing local advances on failure: posForm keeps the rejected input so
    // the user can correct it, and posOriginal still holds what the server has.
    posError.value = extractApiError(error, 'Could not save POS settings. Please try again.')
  } finally {
    posSaving.value = false
  }
}

function cancelPosConfirm() {
  confirmOpen.value = false
  negativeStockAcknowledged.value = false
}

function formatDateTime(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

async function fetchSessions() {
  sessionsLoading.value = true
  sessionsError.value = ''

  try {
    const { data } = await api.get<DeviceSession[]>(ENDPOINTS.AUTH_SESSIONS)
    sessions.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    sessions.value = []
    sessionsError.value = extractApiError(error, 'Could not load your active sessions.')
  } finally {
    sessionsLoading.value = false
  }
}

async function revokeSession(session: DeviceSession) {
  // Revoking your own session is just logging out, and the topbar already
  // does that properly (it clears the cached contract too), so this never
  // offers it.
  if (session.is_current) return

  revokingId.value = session.id
  sessionsError.value = ''

  try {
    await api.post(ENDPOINTS.authSessionRevoke(session.id))
    // Re-read rather than splicing the row out locally, so the list shown is
    // the list the server actually has.
    await fetchSessions()
  } catch (error: any) {
    sessionsError.value = extractApiError(error, 'Could not revoke that session.')
  } finally {
    revokingId.value = null
  }
}

onMounted(() => {
  loadStoredShop()
  fetchShop()
  fetchSessions()
})
</script>

<template>
  <div class="settings-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">Shop Settings</h1>
        <p class="page-subtitle">Manage profile, business type, and subscription plan.</p>
      </div>
      <button class="btn btn-primary" type="button" :disabled="saving || loading" @click="saveSettings">
        {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
    </section>

    <section v-if="showModuleWarning" class="alert-card warning">
      {{ warningText }}
    </section>

    <section v-if="successMessage" class="alert-card success">
      {{ successMessage }}
    </section>

    <section v-if="errorMessage" class="alert-card muted">
      {{ errorMessage }}
    </section>

    <section class="settings-card">
      <div class="form-grid">
        <label class="form-group">
          <span>Shop Name</span>
          <input v-model="form.name" class="form-input" type="text" placeholder="Shop name" />
        </label>

        <div class="form-group">
          <span>Business Type</span>
          <p class="form-readonly">{{ businessTypeLabel }}</p>
        </div>

        <div class="form-group">
          <span>Plan</span>
          <p class="form-readonly">{{ planLabel }}</p>
          <small class="form-hint">
            Business type and plan are set by the platform administrator.
            Contact support to change your subscription.
          </small>
        </div>
      </div>
    </section>

    <!-- POS settings -->
    <section class="settings-card">
      <div class="card-head">
        <div>
          <h2>POS Settings</h2>
          <p>Tax, invoice numbering, and stock rules for this shop.</p>
        </div>
        <button
          v-if="canEditSettings"
          class="btn btn-primary"
          type="button"
          :disabled="posSaving || loading || !posLoaded || !posDirty"
          @click="requestPosSave"
        >
          {{ posSaving ? 'Saving...' : 'Save POS Settings' }}
        </button>
      </div>

      <p v-if="!canEditSettings" class="alert-card muted inline-alert">
        Only the shop owner or an admin can change these. Shown read-only.
      </p>

      <p v-if="posError" class="alert-card error inline-alert">{{ posError }}</p>
      <p v-if="posSuccess" class="alert-card success inline-alert">{{ posSuccess }}</p>

      <div v-if="!posLoaded && !loading" class="alert-card muted inline-alert">
        This shop has no POS settings row yet.
      </div>

      <div v-else class="form-grid">
        <label class="form-group">
          <span>Tax Percent</span>
          <input
            v-model="posForm.taxPercent"
            class="form-input"
            type="number"
            step="0.01"
            min="0"
            :disabled="!canEditSettings || posSaving"
          />
          <small class="form-hint">Shop tax rate, e.g. 11.00 for 11%.</small>
        </label>

        <label class="form-group">
          <span>Invoice Prefix</span>
          <input
            v-model="posForm.invoicePrefix"
            class="form-input"
            type="text"
            maxlength="16"
            placeholder="VALDKER-"
            :disabled="!canEditSettings || posSaving"
          />
          <small v-if="invoicePrefixChanged" class="form-hint danger">
            Changing this affects every invoice issued from now on. Invoices
            already issued keep their current numbers.
          </small>
          <small v-else class="form-hint">
            Prefix for new invoice numbers. It does not have to be unique
            across shops - invoice numbers are unique per shop.
          </small>
        </label>

        <label class="form-group">
          <span>Low Stock Threshold</span>
          <input
            v-model="posForm.lowStockThreshold"
            class="form-input"
            type="number"
            min="0"
            :disabled="!canEditSettings || posSaving"
          />
          <small class="form-hint">Warn when stock falls to this level.</small>
        </label>

        <label class="form-group toggle-group">
          <span>Allow Negative Stock</span>
          <span class="toggle-row">
            <input
              v-model="posForm.allowNegativeStock"
              type="checkbox"
              :disabled="!canEditSettings || posSaving"
            />
            <span>{{ posForm.allowNegativeStock ? 'Allowed' : 'Blocked' }}</span>
          </span>
          <small class="form-hint" :class="{ danger: enablingNegativeStock }">
            When allowed, items can be sold with no stock left and stock goes
            negative. Turning this on asks for a separate confirmation.
          </small>
        </label>
      </div>
    </section>

    <!-- Active device sessions -->
    <section class="settings-card">
      <div class="card-head">
        <div>
          <h2>Active Sessions</h2>
          <p>Devices currently signed in as you. Revoke any you do not recognise.</p>
        </div>
        <button
          class="btn btn-ghost"
          type="button"
          :disabled="sessionsLoading"
          @click="fetchSessions"
        >
          {{ sessionsLoading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>

      <p v-if="sessionsError" class="alert-card error inline-alert">{{ sessionsError }}</p>

      <div v-if="sessionsLoading && !sessions.length" class="alert-card muted inline-alert">
        Loading sessions...
      </div>

      <div v-else-if="!sessions.length" class="alert-card muted inline-alert">
        No active sessions returned.
      </div>

      <div v-else class="session-list">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="session-row"
          :class="{ current: session.is_current }"
        >
          <div class="session-copy">
            <div class="session-title">
              <span v-if="session.device_label">{{ session.device_label }}</span>
              <span v-else class="unlabelled">Unlabelled device</span>
              <span v-if="session.is_current" class="session-badge">This device</span>
            </div>
            <div class="session-meta">
              Last used {{ formatDateTime(session.last_used_at) }}
              &middot; Signed in {{ formatDateTime(session.created_at) }}
            </div>
          </div>

          <!--
            No revoke button for the current session: revoking it is a logout,
            and Logout in the topbar already does that properly.
          -->
          <span v-if="session.is_current" class="session-note">Use Logout to end this one</span>
          <button
            v-else
            class="btn btn-danger"
            type="button"
            :disabled="revokingId === session.id"
            @click="revokeSession(session)"
          >
            {{ revokingId === session.id ? 'Revoking...' : 'Revoke' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Confirmation for consequential POS changes -->
    <div v-if="confirmOpen" class="modal-overlay" @click.self="cancelPosConfirm">
      <div class="modal-card">
        <h2>Confirm these changes</h2>

        <div v-if="invoicePrefixChanged" class="confirm-block">
          <h3>Invoice prefix</h3>
          <p>
            <code>{{ posOriginal.invoicePrefix || '(empty)' }}</code>
            &rarr;
            <code>{{ posForm.invoicePrefix.trim() || '(empty)' }}</code>
          </p>
          <p class="confirm-note">
            Every invoice issued from now on uses the new prefix. Invoices
            already issued are not renumbered, so this shop will have invoice
            numbers in two formats. This cannot be undone for orders created
            after the change.
          </p>
        </div>

        <div v-if="enablingNegativeStock" class="confirm-block danger">
          <h3>Allow negative stock</h3>
          <p class="confirm-note">
            This lets staff sell items the shop has none of. Stock counts will
            go below zero and stop matching what is physically on the shelf.
          </p>
          <label class="confirm-check">
            <input v-model="negativeStockAcknowledged" type="checkbox" />
            <span>I understand and want to allow selling with no stock.</span>
          </label>
        </div>

        <div class="modal-actions">
          <button class="btn btn-ghost" type="button" @click="cancelPosConfirm">Cancel</button>
          <button
            class="btn btn-primary"
            type="button"
            :disabled="confirmBlocked || posSaving"
            @click="savePosSettings"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-readonly {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(127, 127, 127, 0.12);
  font-weight: 600;
}

.form-hint {
  margin-top: 6px;
  opacity: 0.75;
  line-height: 1.4;
}

.settings-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-header,
.settings-card,
.alert-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.page-header {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  color: #0f172a;
}

.page-subtitle {
  margin: 8px 0 0;
  color: #64748b;
}

.settings-card {
  padding: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 700;
  color: #334155;
}

.form-input {
  min-height: 46px;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  padding: 0 14px;
  outline: none;
  color: #0f172a;
}

.form-input:focus {
  border-color: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
}

.alert-card {
  padding: 14px 16px;
  font-weight: 700;
}

.alert-card.warning {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}

.alert-card.success {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.alert-card.muted {
  background: #f8fafc;
  color: #64748b;
}

.alert-card.error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.inline-alert {
  margin: 0 0 16px;
  border-radius: 12px;
  font-weight: 600;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.card-head h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}

.card-head p {
  margin: 6px 0 0;
  color: #64748b;
  font-weight: 500;
}

.form-hint.danger {
  color: #b91c1c;
  font-weight: 700;
  opacity: 1;
}

.toggle-group .toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  font-weight: 600;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.session-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  flex-wrap: wrap;
}

.session-row.current {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.session-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #0f172a;
}

.session-title .unlabelled {
  color: #94a3b8;
  font-style: italic;
  font-weight: 600;
}

.session-badge {
  border-radius: 999px;
  background: #16a34a;
  color: #fff;
  padding: 2px 9px;
  font-size: 0.68rem;
  font-weight: 800;
}

.session-meta {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.82rem;
}

.session-note {
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 600;
}

.btn-ghost {
  background: #fff;
  border: 1px solid #dbe3ef;
  color: #334155;
}

.btn-danger {
  background: #dc2626;
  color: #fff;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 60;
}

.modal-card {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  width: min(560px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.25);
}

.modal-card h2 {
  margin: 0 0 16px;
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
}

.confirm-block {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 14px;
}

.confirm-block.danger {
  border-color: #fecaca;
  background: #fef2f2;
}

.confirm-block h3 {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
}

.confirm-block p {
  margin: 0 0 8px;
  color: #334155;
}

.confirm-block code {
  background: rgba(127, 127, 127, 0.14);
  border-radius: 6px;
  padding: 2px 6px;
  font-weight: 700;
}

.confirm-note {
  font-size: 0.88rem;
  line-height: 1.5;
}

.confirm-check {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  font-weight: 700;
  color: #7f1d1d;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.btn {
  min-height: 44px;
  padding: 0 16px;
  border: none;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

@media (max-width: 992px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
