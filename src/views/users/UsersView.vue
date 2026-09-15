<template>
  <div class="dashboard-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">{{ t('usersPage.title') }}</h1>
        <p class="page-subtitle">
          {{ t('usersPage.subtitle') }}
        </p>

        <div class="breadcrumb">
          <span>{{ t('common.home') }}</span>
          <span>/</span>
          <span>{{ t('usersPage.title') }}</span>
          <span>/</span>
          <span class="active">{{ t('usersPage.title') }}</span>
        </div>
      </div>

      <button class="add-btn" @click="openAddModal" :disabled="saving">
        <span>+</span>
        {{ t('usersPage.addUser') }}
      </button>
    </section>

    <section v-if="errorMessage" class="alert-card alert-error">
      <div>
        <strong>{{ t('usersPage.requestFailed') }}</strong>
        <p>{{ errorMessage }}</p>
      </div>
      <button class="alert-close" @click="errorMessage = ''">×</button>
    </section>

    <section v-if="successMessage" class="alert-card alert-success">
      <div>
        <strong>{{ t('usersPage.success') }}</strong>
        <p>{{ successMessage }}</p>
      </div>
      <button class="alert-close" @click="successMessage = ''">×</button>
    </section>

    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">{{ t('usersPage.visibleUsers') }}</div>
        <div class="stat-value">{{ filteredUsers.length }}</div>
        <div class="stat-note">{{ t('usersPage.visibleUsersNote') }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">{{ t('usersPage.activeUsers') }}</div>
        <div class="stat-value">{{ activeCount }}</div>
        <div class="stat-note">{{ t('usersPage.activeUsersNote') }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">{{ t('usersPage.managersOwners') }}</div>
        <div class="stat-value">{{ adminCount }}</div>
        <div class="stat-note">{{ t('usersPage.managersOwnersNote') }}</div>
      </div>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-grid toolbar-grid-4">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            :placeholder="t('usersPage.searchPlaceholder')"
          />
        </div>

        <select v-model="roleFilter" class="filter-select">
          <option value="">{{ t('usersPage.allRoles') }}</option>
          <option value="owner">{{ t('usersPage.owner') }}</option>
          <option value="admin">{{ t('usersPage.admin') }}</option>
          <option value="manager">{{ t('usersPage.manager') }}</option>
          <option value="cashier">{{ t('usersPage.cashier') }}</option>
          <option value="inventory_staff">{{ t('usersPage.inventoryStaff') }}</option>
          <option value="finance">{{ t('usersPage.finance') }}</option>
        </select>

        <select v-model="activeFilter" class="filter-select">
          <option value="">{{ t('usersPage.allStatus') }}</option>
          <option value="true">{{ t('usersPage.active') }}</option>
          <option value="false">{{ t('usersPage.inactive') }}</option>
        </select>

        <div class="toolbar-actions">
          <button class="reset-btn" @click="resetFilters">{{ t('common.reset') }}</button>
          <button class="refresh-btn" @click="fetchUsers" :disabled="loading">
            {{ loading ? t('common.loading') : t('usersPage.refresh') }}
          </button>
        </div>
      </div>
    </section>

    <section class="table-card">
      <div class="table-header">
        <div>
          <h2>{{ t('usersPage.userList') }}</h2>
          <p v-if="loading">{{ t('usersPage.loadingUsers') }}</p>
          <p v-else>{{ t('usersPage.usersFound', { count: filteredUsers.length }) }}</p>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loader"></div>
        <p>{{ t('usersPage.loadingUsersFromApi') }}</p>
      </div>

      <div v-else-if="filteredUsers.length" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('usersPage.username') }}</th>
              <th>{{ t('usersPage.firstName') }}</th>
              <th>{{ t('usersPage.lastName') }}</th>
              <th>{{ t('usersPage.emailAddress') }}</th>
              <th>{{ t('usersPage.role') }}</th>
              <th>{{ t('common.status') }}</th>
              <th>{{ t('usersPage.dateJoined') }}</th>
              <th>{{ t('common.action') }}</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <div class="user-cell">
                  <div class="user-avatar">
                    {{ getInitials(user.firstName, user.lastName, user.username) }}
                  </div>
                  <div>
                    <div class="title-main">{{ user.username }}</div>
                    <div class="sub-text">
                      {{ user.fullName || `@${String(user.username || '').toLowerCase()}` }}
                    </div>
                  </div>
                </div>
              </td>

              <td>{{ user.firstName || '-' }}</td>
              <td>{{ user.lastName || '-' }}</td>
              <td>{{ user.email || '-' }}</td>

              <td>
                <span class="status-badge" :class="roleClass(user.role)">
                  {{ user.roleLabel }}
                </span>
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="user.isActive ? 'paid' : 'cancelled'"
                >
                  {{ user.isActive ? t('usersPage.active') : t('usersPage.inactive') }}
                </span>
              </td>

              <td>{{ formatDate(user.dateJoined) }}</td>

              <td>
                <div class="action-buttons">
                  <button class="btn-view" @click="openViewModal(user)">{{ t('common.view') }}</button>
                  <button class="btn-edit" @click="openEditModal(user)">{{ t('common.edit') }}</button>
                  <button
                    class="btn-delete"
                    @click="deleteUser(user)"
                    :disabled="deletingId === user.id"
                  >
                    {{ deletingId === user.id ? t('usersPage.deleting') : t('common.delete') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <h3>{{ t('usersPage.noUsersFound') }}</h3>
        <p>{{ t('usersPage.noUsersSubtitle') }}</p>
      </div>
    </section>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card modal-card-wide">
        <div class="modal-header">
          <div>
            <h2>
              {{
                viewOnly
                  ? t('usersPage.userDetails')
                  : isEditMode
                    ? t('usersPage.editUser')
                    : t('usersPage.addUserTitle')
              }}
            </h2>
            <p>
              {{
                viewOnly
                  ? t('usersPage.userDetailsSubtitle')
                  : t('usersPage.userFormSubtitle')
              }}
            </p>
          </div>
          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-grid two-col">
            <div class="form-group">
              <label>{{ t('usersPage.username') }}</label>
              <input
                v-model="form.username"
                type="text"
                class="form-input"
                :placeholder="t('usersPage.usernamePlaceholder')"
                :disabled="viewOnly || saving"
              />
            </div>

            <div class="form-group">
              <label>{{ t('usersPage.emailAddress') }}</label>
              <input
                v-model="form.email"
                type="email"
                class="form-input"
                :placeholder="t('usersPage.emailAddressPlaceholder')"
                :disabled="viewOnly || saving"
              />
            </div>

            <div class="form-group">
              <label>{{ t('usersPage.firstName') }}</label>
              <input
                v-model="form.firstName"
                type="text"
                class="form-input"
                :placeholder="t('usersPage.firstNamePlaceholder')"
                :disabled="viewOnly || saving"
              />
            </div>

            <div class="form-group">
              <label>{{ t('usersPage.lastName') }}</label>
              <input
                v-model="form.lastName"
                type="text"
                class="form-input"
                :placeholder="t('usersPage.lastNamePlaceholder')"
                :disabled="viewOnly || saving"
              />
            </div>

            <div class="form-group">
              <label>{{ t('usersPage.role') }}</label>
              <select
                v-model="form.role"
                class="form-input"
                :disabled="viewOnly || saving"
              >
                <option value="owner">{{ t('usersPage.owner') }}</option>
                <option value="admin">{{ t('usersPage.admin') }}</option>
                <option value="manager">{{ t('usersPage.manager') }}</option>
                <option value="cashier">{{ t('usersPage.cashier') }}</option>
                <option value="inventory_staff">{{ t('usersPage.inventoryStaff') }}</option>
                <option value="finance">{{ t('usersPage.finance') }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ t('common.status') }}</label>
              <select
                v-model="form.isActive"
                class="form-input"
                :disabled="viewOnly || saving"
              >
                <option :value="true">{{ t('usersPage.active') }}</option>
                <option :value="false">{{ t('usersPage.inactive') }}</option>
              </select>
            </div>

            <div class="form-group" v-if="!viewOnly">
              <label>{{ isEditMode ? t('usersPage.newPasswordOptional') : t('usersPage.password') }}</label>
              <input
                v-model="form.password"
                type="password"
                class="form-input"
                :placeholder="isEditMode ? t('usersPage.newPasswordPlaceholder') : t('usersPage.passwordPlaceholder')"
                :disabled="saving"
              />
            </div>

            <div class="form-group" v-if="!viewOnly">
              <label>
                {{ isEditMode ? t('usersPage.confirmNewPassword') : t('usersPage.confirmPassword') }}
              </label>
              <input
                v-model="form.confirmPassword"
                type="password"
                class="form-input"
                :placeholder="t('usersPage.confirmPasswordPlaceholder')"
                :disabled="saving"
              />
            </div>

            <div class="form-group" v-if="viewOnly">
              <label>{{ t('usersPage.shop') }}</label>
              <input
                :value="selectedUser?.shopName || '-'"
                type="text"
                class="form-input"
                disabled
              />
            </div>

            <div class="form-group" v-if="viewOnly">
              <label>{{ t('usersPage.shopCode') }}</label>
              <input
                :value="selectedUser?.shopCode || '-'"
                type="text"
                class="form-input"
                disabled
              />
            </div>

            <div class="form-group" v-if="viewOnly">
              <label>{{ t('usersPage.dateJoined') }}</label>
              <input
                :value="formatDate(selectedUser?.dateJoined || '')"
                type="text"
                class="form-input"
                disabled
              />
            </div>

            <div class="form-group" v-if="viewOnly">
              <label>{{ t('usersPage.fullName') }}</label>
              <input
                :value="selectedUser?.fullName || '-'"
                type="text"
                class="form-input"
                disabled
              />
            </div>
          </div>

          <section v-if="!viewOnly" class="menu-permission-section">
            <div class="menu-permission-header">
              <div>
                <h3>{{ t('usersPage.menuAccessTitle') }}</h3>
                <p>{{ t('usersPage.menuAccessSubtitle') }}</p>
                <p class="permission-summary" data-testid="permission-summary">
                  {{ t('usersPage.menuAccessCount', { on: grantedPermissionCount, total: menuPermissions.length }) }}
                </p>
              </div>

              <div class="menu-permission-actions">
                <button
                  type="button"
                  class="permission-action-btn"
                  @click="setAllMenuPermissions(true)"
                  :disabled="saving || permissionsLoading || !menuPermissions.length"
                >
                  {{ t('usersPage.enableAllMenus') }}
                </button>
                <button
                  type="button"
                  class="permission-action-btn"
                  @click="setAllMenuPermissions(false)"
                  :disabled="saving || permissionsLoading || !menuPermissions.length"
                >
                  {{ t('usersPage.disableAllMenus') }}
                </button>
                <button
                  type="button"
                  class="permission-action-btn"
                  @click="applyDefaultRolePermissions()"
                  :disabled="saving || permissionsLoading || !menuOptions.length"
                >
                  {{ t('usersPage.roleDefaultMenus') }}
                </button>
              </div>
            </div>

            <div v-if="permissionsLoading" class="permission-loading">
              {{ t('usersPage.loadingMenuAccess') }}
            </div>

            <div v-else class="menu-permission-groups">
              <section
                v-for="group in groupedMenuPermissions"
                :key="group.key"
                class="permission-group"
                :data-group="group.key"
              >
                <div class="permission-group-head">
                  <h4>{{ group.label }}</h4>
                  <button
                    type="button"
                    class="group-toggle-btn"
                    :disabled="saving || group.items.every((item) => item.disabled)"
                    @click="setGroupPermissions(group.key, !group.allOn)"
                  >
                    {{ group.allOn ? t('usersPage.groupAllOff') : t('usersPage.groupAllOn') }}
                  </button>
                </div>

                <div class="menu-permission-list">
                  <label
                    v-for="permission in group.items"
                    :key="permission.menuKey"
                    class="menu-permission-row"
                    :class="{ disabled: permission.disabled, on: permission.canAccess }"
                  >
                    <ModuleIcon :module="permission.menuKey" :size="28" variant="soft" />
                    <span class="permission-copy">
                      <span>{{ permissionLabel(permission) }}</span>
                      <small
                        v-if="permission.permissionSource === 'role_default'"
                        class="permission-source"
                      >
                        {{ t('usersPage.followingRoleDefault') }}
                      </small>
                    </span>
                    <span class="switch-control">
                      <input
                        v-model="permission.canAccess"
                        type="checkbox"
                        :disabled="saving || permission.disabled"
                        @change="markPermissionExplicit(permission)"
                      />
                      <span class="switch-track"></span>
                    </span>
                  </label>
                </div>
              </section>
            </div>
          </section>

        </div>

        <div class="modal-actions">
          <button class="secondary-btn" @click="closeModal">
            {{ viewOnly ? t('common.close') : t('common.cancel') }}
          </button>

          <button
            v-if="!viewOnly"
            class="save-btn"
            @click="saveUser"
            :disabled="saving || permissionsLoading"
          >
            {{ saving ? t('usersPage.saving') : isEditMode ? t('usersPage.update') : t('usersPage.save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import api from '@/services/api'
import { getApiErrorMessage } from '@/utils/apiError'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizeApiList } from '@/utils/apiData'
import { ENDPOINTS } from '@/services/endpoints'
import ModuleIcon from '@/components/icons/ModuleIcon.vue'
import { adminMenuGroups } from '@/utils/adminMenu'
import { translatedGroupLabel, translatedModuleLabel } from '@/utils/menuLabels'

type UserRoleApi = 'owner' | 'admin' | 'manager' | 'cashier' | 'inventory_staff' | 'finance'

/** Where a permission value came from, as reported by the API. */
type PermissionSource = 'explicit' | 'role_default' | 'unknown'

type MenuPermissionApiItem = {
  key?: string
  menu_key?: string
  label?: string
  group?: string
  plan_level?: string
  business_types?: string[]
  implemented?: boolean
  can_access?: boolean
  /** "explicit" = set for this user; "role_default" = inherited from the role. */
  source?: string
}

type MenuPermissionOption = {
  key: string
  label: string
  group: string
  implemented: boolean
}

type MenuPermissionState = {
  menuKey: string
  label: string
  canAccess: boolean
  group: string
  implemented: boolean
  disabled: boolean
  permissionSource: PermissionSource
}

/**
 * The switches are grouped the way the sidebar is (Sales, Inventory,
 * People, ...), not by the backend's plan tiers (Core, Pro, Enterprise). An
 * owner thinking "this person handles stock" looks for Inventory; with
 * plan-tier groups the stock pages were split over Core, Pro and Enterprise
 * and there was no Inventory to switch on. Which modules exist is still the
 * backend's list; this only decides where each one is shown.
 */
const GENERAL_GROUP = 'general'
const OTHER_GROUP = 'other'
const GENERAL_MODULES = new Set(['dashboard', 'pos', 'offline_orders'])
const sidebarGroupOf = new Map<string, string>(
  adminMenuGroups.flatMap((group) => group.items.map((item) => [item.key, group.key] as [string, string]))
)
const groupOrder = [GENERAL_GROUP, ...adminMenuGroups.map((group) => group.key), OTHER_GROUP]

function displayGroupOf(moduleKey: string) {
  if (GENERAL_MODULES.has(moduleKey)) return GENERAL_GROUP
  return sidebarGroupOf.get(moduleKey) || OTHER_GROUP
}

type StaffApiItem = {
  id: number
  username: string
  full_name: string
  first_name: string
  last_name: string
  email: string
  role: UserRoleApi
  role_label: string
  shop_id: number | null
  shop_name: string
  shop_code: string
  is_active: boolean
  date_joined: string
  menu_permissions?: MenuPermissionApiItem[]
}

type ShopUser = {
  id: number
  username: string
  fullName: string
  firstName: string
  lastName: string
  email: string
  role: UserRoleApi
  roleLabel: string
  shopId: number | null
  shopName: string
  shopCode: string
  isActive: boolean
  dateJoined: string
  /**
   * Kept exactly as the API sent it. It must NOT be normalised at list-load
   * time: the option list has not been fetched yet then, and normalising
   * against an empty option list silently threw every row away, so the Edit
   * modal opened with all permissions off.
   */
  menuPermissions: MenuPermissionApiItem[]
}

const { t, te, locale } = useI18n()

const users = ref<ShopUser[]>([])
const search = ref('')
const roleFilter = ref('')
const activeFilter = ref('')

const showModal = ref(false)
const isEditMode = ref(false)
const viewOnly = ref(false)
const editingId = ref<number | null>(null)
const selectedUser = ref<ShopUser | null>(null)

const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const permissionsLoading = ref(false)
const menuOptions = ref<MenuPermissionOption[]>([])
const menuPermissions = ref<MenuPermissionState[]>([])

function groupLabel(groupKey: string) {
  if (groupKey === GENERAL_GROUP) return t('usersPage.permissionGroupGeneral')
  if (groupKey === OTHER_GROUP) return t('usersPage.permissionGroupOther')
  const group = adminMenuGroups.find((item) => item.key === groupKey)
  return translatedGroupLabel({ t, te }, groupKey, group?.label || groupKey)
}

function permissionLabel(permission: MenuPermissionState) {
  return translatedModuleLabel({ t, te }, permission.menuKey, permission.label)
}

const groupedMenuPermissions = computed(() =>
  groupOrder
    .map((key) => {
      const items = menuPermissions.value.filter((permission) => displayGroupOf(permission.menuKey) === key)
      const enabled = items.filter((item) => !item.disabled)
      return {
        key,
        label: groupLabel(key),
        items,
        allOn: enabled.length > 0 && enabled.every((item) => item.canAccess),
      }
    })
    .filter((group) => group.items.length > 0)
)

const grantedPermissionCount = computed(
  () => menuPermissions.value.filter((permission) => permission.canAccess && !permission.disabled).length
)

function setGroupPermissions(groupKey: string, canAccess: boolean) {
  menuPermissions.value = menuPermissions.value.map((permission) =>
    displayGroupOf(permission.menuKey) !== groupKey || permission.disabled
      ? permission
      : { ...permission, canAccess, permissionSource: 'explicit' as PermissionSource }
  )
}

/*
 * Role defaults, copied from the backend's get_role_default_modules()
 * (pos/module_registry.py) - the backend applies exactly these when a user
 * has no explicit switch. They are repeated here only to pre-fill the
 * switches of a new user and for the "Role defaults" button, because no
 * endpoint returns them yet; the previous copy had drifted (manager missing
 * most modules, finance given orders, nobody given the dashboard).
 * TODO(backend): expose role defaults on /api/menu-permissions/options/ and
 * read them from there.
 */
const cashierDefaultMenus = new Set(['dashboard', 'pos', 'orders', 'customers', 'offline_orders'])

const financeDefaultMenus = new Set(['dashboard', 'reports', 'expenses', 'bank_accounts', 'bank_ledgers'])

const inventoryStaffDefaultMenus = new Set([
  'dashboard',
  'products',
  'categories',
  'units',
  'suppliers',
  'purchases',
  'inventory_counts',
  'stock_adjustments',
  'warehouses',
  'warehouse_stocks',
  'stock_transfers',
  'stock_movements',
])

const form = reactive({
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  role: 'cashier' as UserRoleApi,
  isActive: true,
  password: '',
  confirmPassword: '',
})

// A new user's switches start as the defaults of the role picked. Before,
// they were filled once for the form's initial role (cashier) and not
// refilled when the owner chose another role, so an Inventory Staff user
// was offered cashier menus. Switches the owner already flipped are kept.
watch(
  () => form.role,
  (role) => {
    if (isEditMode.value || viewOnly.value || !menuOptions.value.length) return
    const untouched = menuPermissions.value.every((permission) => permission.permissionSource !== 'explicit')
    if (untouched) applyDefaultRolePermissions(role)
  },
)

const filteredUsers = computed(() => {
  let results = [...users.value]
  const keyword = search.value.trim().toLowerCase()

  if (keyword) {
    results = results.filter((item) => {
      const haystack = [
        item.username,
        item.fullName,
        item.firstName,
        item.lastName,
        item.email,
        item.roleLabel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(keyword)
    })
  }

  if (roleFilter.value) {
    results = results.filter((item) => item.role === roleFilter.value)
  }

  if (activeFilter.value !== '') {
    const activeValue = activeFilter.value === 'true'
    results = results.filter((item) => item.isActive === activeValue)
  }

  return results
})

const activeCount = computed(() => users.value.filter((item) => item.isActive).length)
const adminCount = computed(() =>
  users.value.filter((item) => item.role === 'owner' || item.role === 'admin' || item.role === 'manager').length
)

function normalizeUser(item: StaffApiItem): ShopUser {
  return {
    id: Number(item.id),
    username: item.username || '',
    fullName: item.full_name || buildFullName(item.first_name, item.last_name),
    firstName: item.first_name || '',
    lastName: item.last_name || '',
    email: item.email || '',
    role: normalizeRole(item.role),
    roleLabel: item.role_label || roleToLabel(item.role),
    shopId: item.shop_id ?? null,
    shopName: item.shop_name || '',
    shopCode: item.shop_code || '',
    isActive: Boolean(item.is_active),
    dateJoined: item.date_joined || '',
    menuPermissions: Array.isArray(item.menu_permissions) ? item.menu_permissions : [],
  }
}

function normalizeRole(role: unknown): UserRoleApi {
  const value = String(role || '').toLowerCase()
  if (value === 'kasir') return 'cashier'
  if (
    value === 'owner' ||
    value === 'admin' ||
    value === 'manager' ||
    value === 'cashier' ||
    value === 'inventory_staff' ||
    value === 'finance'
  ) {
    return value
  }
  return 'cashier'
}

function roleToLabel(role: unknown) {
  const value = normalizeRole(role)
  if (value === 'owner') return t('usersPage.owner')
  if (value === 'admin') return t('usersPage.admin')
  if (value === 'manager') return t('usersPage.manager')
  if (value === 'inventory_staff') return t('usersPage.inventoryStaff')
  if (value === 'finance') return t('usersPage.finance')
  return t('usersPage.cashier')
}

function buildFullName(firstName?: string, lastName?: string) {
  return [firstName, lastName].filter(Boolean).join(' ').trim()
}

/**
 * Takes one entry from `GET /api/menu-permissions/options/` exactly as it
 * came. Both the label and the group are the backend's own answer for this
 * shop. The dashboard used to overlay a local catalog here, which is why a
 * retail shop was offered Workshop and Restaurant toggles it could never use.
 *
 * The response also carries `plan_level` and `business_types`. This screen
 * deliberately keeps neither: the backend has already dropped every module
 * this shop's plan or business type rules out, so those two fields are true
 * of every row shown and say nothing about the user being edited.
 */
function normalizeMenuOption(item: MenuPermissionApiItem): MenuPermissionOption | null {
  const key = String(item.key || item.menu_key || '').trim()
  if (!key) return null

  return {
    key,
    label: item.label || humanizeKey(key),
    group: String(item.group || 'System'),
    implemented: item.implemented !== false,
  }
}

function getPermissionKey(item: MenuPermissionApiItem | MenuPermissionState) {
  if ('menuKey' in item) return item.menuKey
  return String(item.menu_key || item.key || '').trim()
}

function getPermissionAccess(item: MenuPermissionApiItem | MenuPermissionState) {
  if ('canAccess' in item) return Boolean(item.canAccess)
  return Boolean(item.can_access)
}


/**
 * The backend already dropped every module this shop's plan and business type
 * do not allow, and every module with no page behind it, before it answered.
 * So the only thing left to refuse is a module that arrived flagged
 * unimplemented - a belt-and-braces check, not a second opinion.
 */
function isPermissionDisabled(option: MenuPermissionOption) {
  return option.implemented === false
}

function normalizeMenuPermissions(
  source: Array<MenuPermissionApiItem | MenuPermissionState>,
  options: MenuPermissionOption[]
) {
  const sourceByKey = new Map<string, MenuPermissionApiItem | MenuPermissionState>()

  source.forEach((item) => {
    const key = getPermissionKey(item)
    if (key) sourceByKey.set(key, item)
  })

  // Exactly one row per option the backend offered, and no others. A stale
  // UserMenuPermission row for a module this shop no longer has must not
  // resurrect a toggle for it.
  return options.map((option) => {
    const existing = sourceByKey.get(option.key)
    const disabled = isPermissionDisabled(option)

    return {
      menuKey: option.key,
      label: option.label,
      group: option.group,
      implemented: option.implemented,
      disabled,
      // `can_access` from the API is the *effective* value: the role's default
      // unless a UserMenuPermission row overrides it. It is shown as-is. The
      // `false` at the end is only for a key the API sent no row for at all,
      // which should not happen.
      canAccess: disabled ? false : existing ? getPermissionAccess(existing) : false,
      permissionSource: disabled ? 'unknown' : getPermissionSource(existing),
    }
  })
}

/**
 * Whether this value was set deliberately for this user or is just the role's
 * default. Without it, "off" is ambiguous - the owner cannot tell "I turned
 * this off" apart from "nobody has ever touched this".
 */
function getPermissionSource(
  item: MenuPermissionApiItem | MenuPermissionState | undefined
): PermissionSource {
  if (!item) return 'unknown'
  if ('permissionSource' in item && item.permissionSource) return item.permissionSource
  const raw = String((item as MenuPermissionApiItem).source || '').trim()
  if (raw === 'explicit' || raw === 'role_default') return raw
  return 'unknown'
}

function canAccessByDefault(role: string, menuKey: string) {
  const normalizedRole = role.toLowerCase()

  if (normalizedRole === 'owner' || normalizedRole === 'admin' || normalizedRole === 'manager') {
    return true
  }

  if (normalizedRole === 'cashier' || normalizedRole === 'kasir') return cashierDefaultMenus.has(menuKey)

  if (normalizedRole === 'inventory_staff') return inventoryStaffDefaultMenus.has(menuKey)

  if (normalizedRole === 'finance') return financeDefaultMenus.has(menuKey)

  return false
}

function applyDefaultRolePermissions(role = form.role) {
  menuPermissions.value = menuOptions.value.map((option) => {
    const disabled = isPermissionDisabled(option)

    return {
      menuKey: option.key,
      label: option.label,
      group: option.group,
      implemented: option.implemented,
      disabled,
      canAccess: disabled ? false : canAccessByDefault(role, option.key),
      // These values are the role's defaults by definition.
      permissionSource: (disabled ? 'unknown' : 'role_default') as PermissionSource,
    }
  })
}

function setAllMenuPermissions(canAccess: boolean) {
  menuPermissions.value = menuPermissions.value.map((permission) => ({
    ...permission,
    canAccess: permission.disabled ? false : canAccess,
    permissionSource: (permission.disabled ? 'unknown' : 'explicit') as PermissionSource,
  }))
}

/**
 * The moment an owner flips a switch, the value is theirs, not the role's, so
 * the "following role default" note has to stop claiming otherwise - even
 * before the form is saved.
 */
function markPermissionExplicit(permission: MenuPermissionState) {
  if (permission.disabled) return
  permission.permissionSource = 'explicit'
}

async function fetchMenuOptions() {
  if (menuOptions.value.length) return menuOptions.value

  permissionsLoading.value = true

  try {
    const response = await api.get(ENDPOINTS.MENU_PERMISSION_OPTIONS)
    const raw = normalizeApiList(response.data)
    menuOptions.value = raw
      .map((item) => normalizeMenuOption(item as MenuPermissionApiItem))
      .filter((item): item is MenuPermissionOption => Boolean(item))
      // A module with no page behind it is not something access can be
      // granted to, so it is not offered as a choice.
      .filter((option) => option.implemented)

    return menuOptions.value
  } catch (error: any) {
    errorMessage.value = getApiErrorMessage(error, t('usersPage.failedLoadMenuAccess'), { allFields: true })
    return []
  } finally {
    permissionsLoading.value = false
  }
}

async function prepareAddMenuPermissions() {
  const options = await fetchMenuOptions()
  if (options.length) applyDefaultRolePermissions(form.role)
}

async function prepareEditMenuPermissions(user: ShopUser) {
  // Options first: without them there is nothing to render rows against.
  const options = await fetchMenuOptions()
  if (options.length) {
    menuPermissions.value = normalizeMenuPermissions(user.menuPermissions, options)
  }
}

async function ensureMenuPermissionsReady() {
  if (menuPermissions.value.length) return true

  const options = await fetchMenuOptions()
  if (options.length) {
    applyDefaultRolePermissions(form.role)
    return true
  }

  errorMessage.value = errorMessage.value || t('usersPage.menuAccessNotReady')
  return false
}

/**
 * Submits a decision for every module the backend offered, and only those.
 * It used to submit the local catalog's keys instead, which sent the server
 * toggles for modules the shop does not have.
 */
function buildMenuPermissionPayload() {
  const permissionByKey = new Map(menuPermissions.value.map((permission) => [permission.menuKey, permission]))

  return menuOptions.value.map((option) => ({
    menu_key: option.key,
    can_access: !isPermissionDisabled(option) && Boolean(permissionByKey.get(option.key)?.canAccess),
  }))
}

function getDateLocale() {
  if (locale.value === 'id') return 'id-ID'
  return 'en-US'
}

async function fetchUsers() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get(ENDPOINTS.STAFF)
    const raw = normalizeApiList(response.data)
    users.value = raw.map(normalizeUser)
  } catch (error: any) {
    errorMessage.value = getApiErrorMessage(error, t('usersPage.failedLoad'), { allFields: true })
    users.value = []
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  search.value = ''
  roleFilter.value = ''
  activeFilter.value = ''
}

function resetForm() {
  form.username = ''
  form.firstName = ''
  form.lastName = ''
  form.email = ''
  form.role = 'cashier'
  form.isActive = true
  form.password = ''
  form.confirmPassword = ''
  menuPermissions.value = []
}

async function openAddModal() {
  successMessage.value = ''
  errorMessage.value = ''
  selectedUser.value = null
  resetForm()
  editingId.value = null
  isEditMode.value = false
  viewOnly.value = false
  showModal.value = true
  await prepareAddMenuPermissions()
}

async function openViewModal(user: ShopUser) {
  selectedUser.value = user
  resetForm()

  form.username = user.username
  form.firstName = user.firstName
  form.lastName = user.lastName
  form.email = user.email
  form.role = user.role
  form.isActive = user.isActive

  editingId.value = user.id
  isEditMode.value = false
  viewOnly.value = true
  showModal.value = true

  await prepareEditMenuPermissions(user)
}

async function openEditModal(user: ShopUser) {
  successMessage.value = ''
  errorMessage.value = ''
  selectedUser.value = user

  form.username = user.username
  form.firstName = user.firstName
  form.lastName = user.lastName
  form.email = user.email
  form.role = user.role
  form.isActive = user.isActive
  form.password = ''
  form.confirmPassword = ''

  editingId.value = user.id
  isEditMode.value = true
  viewOnly.value = false
  showModal.value = true
  await prepareEditMenuPermissions(user)
}

function closeModal() {
  showModal.value = false
  viewOnly.value = false
  isEditMode.value = false
  editingId.value = null
  selectedUser.value = null
  resetForm()
}

function validateForm() {
  if (!form.username.trim()) {
    errorMessage.value = t('usersPage.usernameRequired')
    return false
  }

  if (!/^[\w.@+-]+$/.test(form.username.trim())) {
    errorMessage.value = t('usersPage.usernameInvalid')
    return false
  }

  if (!form.role) {
    errorMessage.value = t('usersPage.roleRequired')
    return false
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errorMessage.value = t('usersPage.invalidEmail')
    return false
  }

  if (!isEditMode.value) {
    if (!form.password) {
      errorMessage.value = t('usersPage.passwordRequired')
      return false
    }

    if (form.password !== form.confirmPassword) {
      errorMessage.value = t('usersPage.passwordMismatch')
      return false
    }
  }

  if (isEditMode.value && (form.password || form.confirmPassword)) {
    if (form.password !== form.confirmPassword) {
      errorMessage.value = t('usersPage.passwordMismatch')
      return false
    }
  }

  return true
}

function buildPayload(isEdit = false) {
  const payload: Record<string, any> = {
    username: form.username.trim(),
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    email: form.email.trim(),
    role: form.role,
    is_active: Boolean(form.isActive),
    menu_permissions: buildMenuPermissionPayload(),
  }

  if (!isEdit || form.password) {
    payload.password = form.password
  }

  return payload
}

async function saveUser() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!validateForm()) return
  if (!(await ensureMenuPermissionsReady())) return

  saving.value = true
  try {
    if (isEditMode.value && editingId.value !== null) {
      const response = await api.patch(`${ENDPOINTS.STAFF}${editingId.value}/`, buildPayload(true))
      const normalized = normalizeUser(response.data)
      const index = users.value.findIndex((item) => item.id === editingId.value)
      if (index !== -1) {
        users.value[index] = normalized
      } else {
        users.value.unshift(normalized)
      }
      successMessage.value = t('usersPage.userUpdated')
    } else {
      const response = await api.post(ENDPOINTS.STAFF, buildPayload(false))
      const normalized = normalizeUser(response.data)
      users.value.unshift(normalized)
      successMessage.value = t('usersPage.userCreated')
    }

    closeModal()
    await fetchUsers()
  } catch (error: any) {
    errorMessage.value = getApiErrorMessage(error, t('usersPage.failedSave'), { allFields: true })
  } finally {
    saving.value = false
  }
}

async function deleteUser(user: ShopUser) {
  errorMessage.value = ''
  successMessage.value = ''

  const confirmed = window.confirm(t('usersPage.deleteConfirm', { username: user.username }))
  if (!confirmed) return

  deletingId.value = user.id
  try {
    await api.delete(`${ENDPOINTS.STAFF}${user.id}/`)
    users.value = users.value.filter((item) => item.id !== user.id)
    successMessage.value = t('usersPage.userDeleted')
  } catch (error: any) {
    errorMessage.value = getApiErrorMessage(error, t('usersPage.failedDelete'), { allFields: true })
  } finally {
    deletingId.value = null
  }
}

function humanizeKey(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function getInitials(firstName: string, lastName: string, username: string) {
  const a = String(firstName || '').trim().charAt(0)
  const b = String(lastName || '').trim().charAt(0)
  if (a || b) return `${a}${b}`.toUpperCase()
  return String(username || '').trim().charAt(0).toUpperCase() || 'U'
}

function roleClass(role: UserRoleApi) {
  return {
    info: role === 'owner' || role === 'admin',
    unpaid: role === 'manager',
    paid: role === 'cashier' || role === 'inventory_staff' || role === 'finance',
  }
}

function formatDate(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(getDateLocale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.dashboard-page {
  padding: 28px;
  background: #f3f4f6;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 22px;
}

.page-title {
  margin: 0;
  font-size: 32px;
  line-height: 1.15;
  font-weight: 800;
  color: #1f2a44;
}

.page-subtitle {
  margin: 10px 0 12px;
  color: #6b7280;
  font-size: 1rem;
}

.breadcrumb {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  color: #64748b;
  font-size: 0.98rem;
}

.breadcrumb .active {
  color: var(--brand-600);
  font-weight: 700;
}

.add-btn {
  border: none;
  background: var(--brand-600);
  color: white;
  padding: 14px 22px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(98, 4, 191, 0.18);
}

.add-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.add-btn span {
  font-size: 1.3rem;
  line-height: 1;
}

.alert-card {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding: 16px 18px;
  border-radius: 18px;
  margin-bottom: 18px;
  border: 1px solid transparent;
}

.alert-card strong {
  display: block;
  margin-bottom: 6px;
}

.alert-card p {
  margin: 0;
  color: inherit;
}

.alert-error {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #be123c;
}

.alert-success {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #15803d;
}

.alert-close {
  border: none;
  background: rgba(255, 255, 255, 0.7);
  width: 34px;
  height: 34px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.2rem;
  color: inherit;
  flex-shrink: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 22px;
}

.stat-card {
  background: #fff;
  border-radius: 22px;
  padding: 20px 22px;
  border: 1px solid #edf0f5;
}

.stat-label {
  font-size: 0.98rem;
  color: #6b7280;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: #1f2a44;
  margin-bottom: 6px;
}

.stat-note {
  color: #94a3b8;
  font-size: 0.95rem;
}

.toolbar-card {
  background: #fff;
  border-radius: 22px;
  padding: 18px;
  margin-bottom: 22px;
  border: 1px solid #edf0f5;
}

.toolbar-grid {
  display: grid;
  gap: 14px;
  align-items: center;
}

.toolbar-grid-4 {
  grid-template-columns: 1.8fr 1fr 1fr auto;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  background: #f8fafc;
  padding: 0 14px;
}

.search-icon {
  color: #94a3b8;
  font-size: 14px;
}

.search-box input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  font-size: 0.96rem;
  color: #334155;
}

.filter-select {
  height: 48px;
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  background: #f8fafc;
  padding: 0 14px;
  font-size: 0.96rem;
  color: #334155;
  outline: none;
}

.reset-btn,
.refresh-btn {
  height: 48px;
  padding: 0 18px;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
}

.reset-btn {
  background: #eef2f7;
  color: #334155;
}

.refresh-btn {
  background: #e0f2fe;
  color: #0369a1;
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.table-card {
  background: #fff;
  border-radius: 22px;
  border: 1px solid #edf0f5;
  overflow: hidden;
}

.table-header {
  padding: 20px 20px 8px;
}

.table-header h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #1f2a44;
}

.table-header p {
  margin: 6px 0 0;
  color: #6b7280;
}

.loading-state {
  padding: 42px 20px 48px;
  text-align: center;
}

.loading-state p {
  margin: 14px 0 0;
  color: #64748b;
  font-weight: 600;
}

.loader {
  width: 42px;
  height: 42px;
  border: 4px solid #e2e8f0;
  border-top-color: #22c55e;
  border-radius: 50%;
  margin: 0 auto;
  animation: spin 0.8s linear infinite;
}

.table-wrap {
  overflow-x: auto;
  padding: 8px 18px 18px;
}

.data-table {
  width: 100%;
  min-width: 1200px;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 14px 16px;
  font-size: 0.93rem;
  color: #64748b;
  font-weight: 700;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.data-table td {
  padding: 16px;
  vertical-align: middle;
  border-bottom: 1px solid #edf2f7;
  color: #1f2937;
  font-size: 0.96rem;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  background: var(--brand-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.95rem;
  flex-shrink: 0;
}

.title-main {
  font-weight: 700;
  color: #1f2937;
}

.sub-text {
  color: #64748b;
  font-size: 0.9rem;
  margin-top: 4px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 92px;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 700;
}

.status-badge.paid {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.unpaid {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge.info {
  background: #dbeafe;
  color: #2563eb;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-view,
.btn-edit,
.btn-delete {
  height: 38px;
  padding: 0 14px;
  border-radius: 14px;
  background: white;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.92rem;
}

.btn-view {
  border: 1px solid #bfdbfe;
  color: #2563eb;
}

.btn-edit {
  border: 1px solid #fdba74;
  color: #ea580c;
}

.btn-delete {
  border: 1px solid #fca5a5;
  color: #dc2626;
}

.btn-delete:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.empty-state {
  padding: 48px 20px;
  text-align: center;
}

.empty-state h3 {
  margin: 0 0 8px;
  color: #1f2937;
}

.empty-state p {
  margin: 0;
  color: #6b7280;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
}

.modal-card {
  width: min(760px, 100%);
  max-height: 90vh;
  background: white;
  border-radius: 22px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-card-wide {
  width: min(920px, 100%);
}

.modal-header {
  padding: 20px 22px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #edf2f7;
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  color: #1f2937;
}

.modal-header p {
  margin: 6px 0 0;
  color: #6b7280;
}

.close-btn {
  border: none;
  background: #f1f5f9;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1.4rem;
}

.modal-body {
  padding: 22px;
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
}

.form-grid {
  display: grid;
  gap: 16px;
}

.two-col {
  grid-template-columns: 1fr 1fr;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 700;
  color: #334155;
  font-size: 0.95rem;
}

.form-input {
  min-height: 46px;
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  background: #f8fafc;
  padding: 10px 14px;
  outline: none;
  font-size: 0.96rem;
  color: #334155;
  box-sizing: border-box;
}

.form-input:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

.menu-permission-section {
  margin-top: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #f8fafc;
  padding: 16px;
}

.menu-permission-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.menu-permission-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.05rem;
}

.menu-permission-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 0.92rem;
}

.menu-permission-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.permission-action-btn {
  min-height: 34px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: white;
  color: #334155;
  font-size: 0.84rem;
  font-weight: 700;
  padding: 0 10px;
  cursor: pointer;
}

.permission-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.permission-loading {
  color: #64748b;
  font-weight: 600;
  padding: 14px 0 2px;
}

.menu-permission-groups {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 4px;
}

.permission-summary {
  font-weight: 700;
  color: var(--brand-700) !important;
}

.permission-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0 0 8px;
}

.permission-group h4 {
  margin: 0;
  color: #1f2937;
  font-size: 0.8rem;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.group-toggle-btn {
  border: none;
  border-radius: 999px;
  padding: 4px 12px;
  background: var(--brand-50);
  color: var(--brand-700);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.group-toggle-btn:hover:not(:disabled) {
  background: var(--brand-100);
}

.group-toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-permission-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.menu-permission-row {
  min-height: 56px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  padding: 8px 12px;
  color: #334155;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.menu-permission-row.on {
  border-color: var(--brand-200);
  background: var(--brand-25);
}

.menu-permission-row .permission-copy {
  flex: 1;
}

.menu-permission-row.disabled {
  opacity: 0.58;
  background: #f1f5f9;
}

.permission-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.permission-source {
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
}

.switch-control {
  position: relative;
  display: inline-flex;
  width: 44px;
  height: 24px;
  flex: 0 0 auto;
}

.switch-control input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.switch-control input:disabled {
  cursor: not-allowed;
}

.switch-track {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: #cbd5e1;
  transition: background 0.15s ease;
}

.switch-track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: white;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);
  transition: transform 0.15s ease;
}

.switch-control input:checked + .switch-track {
  background: var(--brand-600);
}

.switch-control input:checked + .switch-track::after {
  transform: translateX(20px);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 22px;
  border-top: 1px solid #edf2f7;
  background: white;
  flex-shrink: 0;
  position: sticky;
  bottom: 0;
  z-index: 2;
}

.secondary-btn,
.save-btn {
  height: 46px;
  padding: 0 18px;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  border: none;
}

.secondary-btn {
  background: #eef2f7;
  color: #334155;
}

.save-btn {
  background: var(--brand-600);
  color: white;
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .toolbar-grid-4,
  .stats-grid,
  .two-col,
  .menu-permission-list {
    grid-template-columns: 1fr;
  }

  .menu-permission-header {
    flex-direction: column;
  }

  .menu-permission-actions {
    justify-content: flex-start;
  }

  .toolbar-actions {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 16px;
  }

  .page-title {
    font-size: 32px;
    line-height: 1.15;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .add-btn {
    width: 100%;
    justify-content: center;
  }

  .toolbar-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .reset-btn,
  .refresh-btn {
    width: 100%;
  }

  .modal-actions {
    flex-direction: column;
  }

  .secondary-btn,
  .save-btn {
    width: 100%;
  }
}
</style>
