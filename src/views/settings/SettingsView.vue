<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import { allAdminMenuItems } from '@/utils/adminMenu'
import {
  isModuleAllowedForBusinessType,
  isModuleInPlan,
  normalizeBusinessType,
  normalizePlan,
} from '@/utils/moduleVisibility'

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

function persistProfile() {
  const user = parseStorage<Record<string, any> | null>('user', null)
  const shop = parseStorage<Record<string, any> | null>('shop', null)
  const effectiveModules = allAdminMenuItems
    .filter((item) => {
      const businessAllowed =
        item.businessTypes?.includes(form.businessType as any) &&
        isModuleAllowedForBusinessType(item.key, form.businessType)

      return item.implemented !== false && item.route && businessAllowed && isModuleInPlan(item.key, form.plan)
    })
    .map((item) => item.key)

  if (user) {
    localStorage.setItem(
      'user',
      JSON.stringify({
        ...user,
        businessType: form.businessType,
        plan: form.plan,
        shop_business_type: form.businessType,
        shop_plan: form.plan,
        effectiveModules,
        effective_modules: effectiveModules,
      }),
    )
  }

  localStorage.setItem('effective_modules', JSON.stringify(effectiveModules))

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
    persistProfile()
  } catch {
    loadStoredShop()
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

onMounted(() => {
  loadStoredShop()
  fetchShop()
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
