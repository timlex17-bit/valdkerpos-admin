<template>
  <div class="page">
    <!-- Header -->
    <section class="page-header">
      <div class="page-header__left">
        <div>
          <h1 class="page-title">Backup & Restore Center</h1>
          <p class="page-subtitle">
            Manage automatic backups, monitor history, and restore your store data safely.
          </p>
        </div>

        <div class="breadcrumb">
          <span>Home</span>
          <span>›</span>
          <span>System Tools</span>
          <span>›</span>
          <span class="active">Backup & Restore</span>
        </div>
      </div>

      <div class="page-header__actions">
        <button
          class="btn btn-light"
          @click="openRestoreModal"
          :disabled="successfulBackups.length === 0"
        >
          Restore backup
        </button>
        <button
          class="btn btn-success"
          @click="runBackupNow"
          :disabled="runningBackup"
        >
          {{ runningBackup ? 'Running...' : 'Run backup now' }}
        </button>
      </div>
    </section>

    <!-- Top Summary -->
    <section class="stats-grid">
      <article class="stat-card success">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 3v12" />
            <path d="M8 11l4 4 4-4" />
            <path d="M4 21h16" />
          </svg>
        </div>
        <div>
          <p class="stat-label">Auto Backup Status</p>
          <h3 class="stat-value">{{ backupSettings.enabled ? 'Enabled' : 'Disabled' }}</h3>
          <p class="stat-meta">Automatic protection for shop data</p>
        </div>
      </article>

      <article class="stat-card info">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
        </div>
        <div>
          <p class="stat-label">Next Scheduled Backup</p>
          <h3 class="stat-value">{{ nextScheduledBackup }}</h3>
          <p class="stat-meta">{{ backupSettings.frequency }} at {{ backupSettings.time }}</p>
        </div>
      </article>

      <article class="stat-card primary">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4" />
            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
          </svg>
        </div>
        <div>
          <p class="stat-label">Last Successful Backup</p>
          <h3 class="stat-value">{{ lastSuccessfulBackup }}</h3>
          <p class="stat-meta">Latest completed backup</p>
        </div>
      </article>

      <article class="stat-card warning">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M7 10l5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
        </div>
        <div>
          <p class="stat-label">Retention Policy</p>
          <h3 class="stat-value">Keep {{ backupSettings.keepLast }}</h3>
          <p class="stat-meta">Old backups are removed automatically</p>
        </div>
      </article>
    </section>

    <section class="content-grid">
      <!-- Backup Settings -->
      <article class="panel-card">
        <div class="card-header">
          <div>
            <h2>Backup settings</h2>
            <p>Configure automatic backup schedule and backup contents.</p>
          </div>
          <span class="status-pill" :class="backupSettings.enabled ? 'active' : 'inactive'">
            {{ backupSettings.enabled ? 'Active' : 'Inactive' }}
          </span>
        </div>

        <div class="settings-grid">
          <div class="field-row switch-row">
            <div>
              <label class="field-label">Enable automatic backup</label>
              <p class="field-help">Automatically create backups based on the selected schedule.</p>
            </div>

            <button
              class="switch"
              :class="{ enabled: backupSettings.enabled }"
              @click="backupSettings.enabled = !backupSettings.enabled"
            >
              <span class="switch-thumb"></span>
            </button>
          </div>

          <div class="field-row">
            <div class="field-col">
              <label class="field-label">Frequency</label>
              <select v-model="backupSettings.frequency" class="form-select">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div class="field-col">
              <label class="field-label">Backup time</label>
              <input v-model="backupSettings.time" type="time" class="form-input" />
            </div>
          </div>

          <div class="field-row">
            <div class="field-col">
              <label class="field-label">Keep last N backups</label>
              <input
                v-model.number="backupSettings.keepLast"
                type="number"
                min="1"
                class="form-input"
                placeholder="10"
              />
            </div>

            <div class="field-col">
              <label class="field-label">Default restore mode</label>
              <select v-model="backupSettings.defaultRestoreMode" class="form-select">
                <option value="full">Full Restore</option>
                <option value="master">Master Data Only</option>
              </select>
            </div>
          </div>

          <div class="checkbox-grid">
            <label class="check-item">
              <input v-model="backupSettings.includeMedia" type="checkbox" />
              <span>Include media / logo</span>
            </label>

            <label class="check-item">
              <input v-model="backupSettings.includeUsers" type="checkbox" />
              <span>Include users</span>
            </label>

            <label class="check-item">
              <input v-model="backupSettings.includeSettings" type="checkbox" />
              <span>Include settings</span>
            </label>
          </div>

          <div class="action-row">
            <button class="btn btn-light" @click="resetBackupSettings" :disabled="savingSettings">
              Reset
            </button>
            <button class="btn btn-primary" @click="saveBackupSettings" :disabled="savingSettings">
              {{ savingSettings ? 'Saving...' : 'Save settings' }}
            </button>
            <button class="btn btn-success" @click="runBackupNow" :disabled="runningBackup">
              {{ runningBackup ? 'Running...' : 'Run backup now' }}
            </button>
          </div>
        </div>
      </article>

      <!-- Restore Panel -->
      <article class="panel-card side-panel">
        <div class="card-header">
          <div>
            <h2>Restore backup</h2>
            <p>Restore store data from a selected backup file.</p>
          </div>
        </div>

        <div class="restore-box">
          <div class="restore-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </div>

          <h3>Restore carefully</h3>
          <p>
            Restoring a backup can replace existing store data. Use this feature only when
            necessary.
          </p>

          <ul class="info-list">
            <li>Recommended mode: <strong>{{ restoreModeLabel(backupSettings.defaultRestoreMode) }}</strong></li>
            <li>Always verify the selected backup date and time</li>
            <li>Make a fresh backup before restore</li>
          </ul>

          <button
            class="btn btn-success full-btn"
            @click="openRestoreModal"
            :disabled="successfulBackups.length === 0"
          >
            Open restore wizard
          </button>
        </div>
      </article>
    </section>

    <!-- History -->
    <section class="panel-card table-panel">
      <div class="card-header">
        <div>
          <h2>Backup history</h2>
          <p>Track backup jobs, file size, status, and available actions.</p>
        </div>

        <div class="history-filters">
          <input
            v-model="search"
            type="text"
            class="form-input search-input"
            placeholder="Search by trigger or status..."
            @input="debouncedFetchHistory"
          />

          <select v-model="statusFilter" class="form-select filter-select" @change="fetchBackupHistory">
            <option value="">All status</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
            <option value="Running">Running</option>
          </select>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Triggered By</th>
              <th>Status</th>
              <th>File Size</th>
              <th>Included</th>
              <th class="action-col">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loadingHistory">
              <td colspan="7" class="empty-cell">Loading backup history...</td>
            </tr>

            <tr v-else-if="filteredHistory.length === 0">
              <td colspan="7" class="empty-cell">No backup history found.</td>
            </tr>

            <tr v-for="item in filteredHistory" :key="item.id">
              <td>
                <div class="primary-text">{{ item.dateTime }}</div>
              </td>
              <td>
                <span class="type-badge" :class="item.type.toLowerCase()">
                  {{ item.type }}
                </span>
              </td>
              <td>{{ item.triggeredBy }}</td>
              <td>
                <span class="status-badge" :class="statusClass(item.status)">
                  {{ item.status }}
                </span>
              </td>
              <td>{{ item.fileSize }}</td>
              <td>{{ item.included.length ? item.included.join(', ') : '-' }}</td>
              <td>
                <div class="actions">
                  <button class="btn-action view" @click="viewBackup(item)">View</button>
                  <button
                    class="btn-action download"
                    @click="downloadBackup(item)"
                    :disabled="!item.canDownload"
                  >
                    Download
                  </button>
                  <button
                    class="btn-action restore"
                    @click="prepareRestore(item)"
                    :disabled="!item.canRestore"
                  >
                    Restore
                  </button>
                  <button
                    class="btn-action delete"
                    @click="deleteBackup(item.id)"
                    :disabled="!item.canDelete"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Detail Modal -->
    <div v-if="showDetailModal && selectedBackup" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal-container modal-sm">
        <div class="modal-header">
          <div>
            <h2>Backup detail</h2>
            <p>Review selected backup information.</p>
          </div>
          <button class="close-btn" @click="closeDetailModal">×</button>
        </div>

        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Date & Time</span>
              <strong>{{ selectedBackup.dateTime }}</strong>
            </div>
            <div class="detail-item">
              <span class="detail-label">Type</span>
              <strong>{{ selectedBackup.type }}</strong>
            </div>
            <div class="detail-item">
              <span class="detail-label">Triggered By</span>
              <strong>{{ selectedBackup.triggeredBy }}</strong>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <strong>{{ selectedBackup.status }}</strong>
            </div>
            <div class="detail-item">
              <span class="detail-label">File Size</span>
              <strong>{{ selectedBackup.fileSize }}</strong>
            </div>
            <div class="detail-item">
              <span class="detail-label">Included</span>
              <strong>{{ selectedBackup.included.length ? selectedBackup.included.join(', ') : '-' }}</strong>
            </div>
            <div class="detail-item" v-if="selectedBackup.fileName">
              <span class="detail-label">File Name</span>
              <strong>{{ selectedBackup.fileName }}</strong>
            </div>
            <div class="detail-item" v-if="selectedBackup.durationSeconds !== null">
              <span class="detail-label">Duration</span>
              <strong>{{ selectedBackup.durationSeconds }} sec</strong>
            </div>
            <div class="detail-item" v-if="selectedBackup.restoreCount !== null">
              <span class="detail-label">Restore Count</span>
              <strong>{{ selectedBackup.restoreCount }}</strong>
            </div>
            <div class="detail-item" v-if="selectedBackup.note">
              <span class="detail-label">Note</span>
              <strong>{{ selectedBackup.note }}</strong>
            </div>
            <div class="detail-item" v-if="selectedBackup.errorMessage">
              <span class="detail-label">Error</span>
              <strong>{{ selectedBackup.errorMessage }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Restore Modal -->
    <div v-if="showRestoreModal" class="modal-overlay" @click.self="closeRestoreModal">
      <div class="modal-container">
        <div class="modal-header">
          <div>
            <h2>Restore backup</h2>
            <p>Choose backup and confirm restore mode before starting.</p>
          </div>
          <button class="close-btn" @click="closeRestoreModal">×</button>
        </div>

        <div class="modal-body">
          <div class="restore-form">
            <div class="field-col">
              <label class="field-label">Select backup</label>
              <select v-model="restoreForm.backupId" class="form-select">
                <option value="">Choose backup</option>
                <option v-for="item in successfulBackups" :key="item.id" :value="item.id">
                  {{ item.dateTime }} — {{ item.fileSize }}
                </option>
              </select>
            </div>

            <div class="field-col">
              <label class="field-label">Restore mode</label>
              <select v-model="restoreForm.mode" class="form-select">
                <option value="full">Full Restore</option>
                <option value="master">Master Data Only</option>
              </select>
            </div>

            <div class="warning-box">
              <strong>Warning</strong>
              <p>
                Restore can overwrite current data. Make sure you selected the correct backup
                before proceeding.
              </p>
            </div>

            <div class="action-row">
              <button class="btn btn-light" @click="closeRestoreModal" :disabled="restoring">
                Cancel
              </button>
              <button class="btn btn-success" @click="confirmRestore" :disabled="restoring">
                {{ restoring ? 'Restoring...' : 'Confirm restore' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notification -->
    <transition name="fade">
      <div v-if="flashMessage" class="flash-message">
        {{ flashMessage }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'

type BackupStatus = 'Success' | 'Failed' | 'Running'
type BackupType = 'Auto' | 'Manual'

type BackupHistoryItem = {
  id: number
  dateTime: string
  type: BackupType
  triggeredBy: string
  status: BackupStatus
  fileSize: string
  included: string[]
  note?: string
  fileName?: string
  errorMessage?: string
  durationSeconds?: number | null
  restoreCount?: number | null
  canRestore: boolean
  canDownload: boolean
  canDelete: boolean
}

const backupSettings = reactive({
  enabled: true,
  frequency: 'daily',
  time: '23:30',
  keepLast: 10,
  includeMedia: true,
  includeUsers: true,
  includeSettings: true,
  defaultRestoreMode: 'full',
})

const initialBackupSettings = reactive({
  enabled: true,
  frequency: 'daily',
  time: '23:30',
  keepLast: 10,
  includeMedia: true,
  includeUsers: true,
  includeSettings: true,
  defaultRestoreMode: 'full',
})

const summaryRaw = ref<Record<string, any> | null>(null)
const backupHistory = ref<BackupHistoryItem[]>([])

const search = ref('')
const statusFilter = ref('')
const flashMessage = ref('')
const showDetailModal = ref(false)
const showRestoreModal = ref(false)
const selectedBackup = ref<BackupHistoryItem | null>(null)

const loadingHistory = ref(false)
const savingSettings = ref(false)
const runningBackup = ref(false)
const restoring = ref(false)

const restoreForm = reactive({
  backupId: '',
  mode: 'full',
})

const nextScheduledBackup = computed(() => {
  return summaryRaw.value?.next_scheduled_backup || 'Disabled'
})

const lastSuccessfulBackup = computed(() => {
  return summaryRaw.value?.last_successful_backup || 'No successful backup yet'
})

const filteredHistory = computed(() => backupHistory.value)

const successfulBackups = computed(() => {
  return backupHistory.value.filter((item) => item.status === 'Success')
})

function normalizeStatus(value: any): BackupStatus {
  const s = String(value || '').trim().toLowerCase()
  if (s === 'success') return 'Success'
  if (s === 'failed') return 'Failed'
  return 'Running'
}

function normalizeType(value: any): BackupType {
  const t = String(value || '').trim().toLowerCase()
  if (t === 'auto') return 'Auto'
  return 'Manual'
}

function normalizeFrequency(value: any): string {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === 'daily') return 'daily'
  if (raw === 'weekly') return 'weekly'
  if (raw === 'monthly') return 'monthly'
  if (raw === 'dayli' || raw === 'day') return 'daily'
  if (raw === 'weekli' || raw === 'week') return 'weekly'
  if (raw === 'monthli' || raw === 'month') return 'monthly'
  return 'daily'
}

function normalizeRestoreMode(value: any): string {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === 'master') return 'master'
  if (raw === 'full') return 'full'
  if (raw.includes('master')) return 'master'
  return 'full'
}

function toArrayStrings(value: any): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v))
  return []
}

function frequencyLabel(value: string): string {
  if (value === 'weekly') return 'Weekly'
  if (value === 'monthly') return 'Monthly'
  return 'Daily'
}

function restoreModeLabel(value: string): string {
  return value === 'master' ? 'Master Data Only' : 'Full Restore'
}

function statusClass(status: BackupStatus) {
  return {
    success: status === 'Success',
    failed: status === 'Failed',
    running: status === 'Running',
  }
}

function getErrorMessage(error: any, fallback = 'Request failed.') {
  const data = error?.response?.data

  if (typeof data === 'string') return data
  if (data?.detail) return String(data.detail)
  if (data?.message) return String(data.message)
  if (data?.error) return String(data.error)

  if (data && typeof data === 'object') {
    const firstKey = Object.keys(data)[0]
    const firstVal = data[firstKey]
    if (Array.isArray(firstVal) && firstVal.length) return String(firstVal[0])
    if (typeof firstVal === 'string') return firstVal
    if (typeof firstVal === 'object' && firstVal !== null) return JSON.stringify(firstVal)
  }

  return error?.message || fallback
}

function applySummaryData(data: Record<string, any>) {
  summaryRaw.value = data || {}

  backupSettings.enabled = Boolean(data.enabled)
  backupSettings.frequency = normalizeFrequency(data.frequency_value || data.frequency)
  backupSettings.time = String(data.time || backupSettings.time)
  backupSettings.keepLast = Number(data.retention_keep_last || backupSettings.keepLast)
  backupSettings.defaultRestoreMode = normalizeRestoreMode(data.default_restore_mode)
}

function applySettingsData(data: Record<string, any>) {
  backupSettings.enabled = Boolean(data.enabled)
  backupSettings.frequency = normalizeFrequency(data.frequency)
  backupSettings.time = String(data.backup_time_display || data.backup_time || backupSettings.time)
  backupSettings.keepLast = Number(data.keep_last || backupSettings.keepLast)
  backupSettings.includeMedia = Boolean(data.include_media)
  backupSettings.includeUsers = Boolean(data.include_users)
  backupSettings.includeSettings = Boolean(data.include_settings)
  backupSettings.defaultRestoreMode = normalizeRestoreMode(data.default_restore_mode)
}

function snapshotInitialSettings() {
  initialBackupSettings.enabled = backupSettings.enabled
  initialBackupSettings.frequency = backupSettings.frequency
  initialBackupSettings.time = backupSettings.time
  initialBackupSettings.keepLast = backupSettings.keepLast
  initialBackupSettings.includeMedia = backupSettings.includeMedia
  initialBackupSettings.includeUsers = backupSettings.includeUsers
  initialBackupSettings.includeSettings = backupSettings.includeSettings
  initialBackupSettings.defaultRestoreMode = backupSettings.defaultRestoreMode
}

function resetBackupSettings() {
  backupSettings.enabled = initialBackupSettings.enabled
  backupSettings.frequency = initialBackupSettings.frequency
  backupSettings.time = initialBackupSettings.time
  backupSettings.keepLast = initialBackupSettings.keepLast
  backupSettings.includeMedia = initialBackupSettings.includeMedia
  backupSettings.includeUsers = initialBackupSettings.includeUsers
  backupSettings.includeSettings = initialBackupSettings.includeSettings
  backupSettings.defaultRestoreMode = initialBackupSettings.defaultRestoreMode
  showFlash('Backup settings reset.')
}

function mapBackupHistoryItem(item: any): BackupHistoryItem {
  return {
    id: Number(item.id),
    dateTime: String(item.date_time || '-'),
    type: normalizeType(item.type || item.backup_type),
    triggeredBy: String(item.triggered_by || '-'),
    status: normalizeStatus(item.status),
    fileSize: String(item.file_size || '-'),
    included: toArrayStrings(item.included),
    note: item.note || '',
    fileName: item.file_name || '',
    errorMessage: item.error_message || '',
    durationSeconds:
      item.duration_seconds === null || item.duration_seconds === undefined
        ? null
        : Number(item.duration_seconds),
    restoreCount:
      item.restore_count === null || item.restore_count === undefined
        ? null
        : Number(item.restore_count),
    canRestore: Boolean(item.can_restore),
    canDownload: Boolean(item.can_download),
    canDelete: Boolean(item.can_delete),
  }
}

async function fetchSummary() {
  const response = await api.get(ENDPOINTS.BACKUP_CENTER_SUMMARY)
  applySummaryData(response.data || {})
}

async function fetchSettings() {
  const response = await api.get(ENDPOINTS.BACKUP_SETTINGS)
  applySettingsData(response.data || {})
  snapshotInitialSettings()
}

async function fetchBackupHistory() {
  loadingHistory.value = true
  try {
    const params: Record<string, string> = {}

    if (search.value.trim()) {
      params.search = search.value.trim()
    }

    if (statusFilter.value) {
      params.status = statusFilter.value.toLowerCase()
    }

    const response = await api.get(ENDPOINTS.BACKUPS, { params })
    const rows = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.results)
      ? response.data.results
      : []

    backupHistory.value = rows.map(mapBackupHistoryItem)
  } catch (error) {
    showFlash(getErrorMessage(error, 'Failed to load backup history.'))
  } finally {
    loadingHistory.value = false
  }
}

async function saveBackupSettings() {
  savingSettings.value = true
  try {
    const payload = {
      enabled: backupSettings.enabled,
      frequency: backupSettings.frequency,
      backup_time: backupSettings.time,
      keep_last: backupSettings.keepLast,
      include_media: backupSettings.includeMedia,
      include_users: backupSettings.includeUsers,
      include_settings: backupSettings.includeSettings,
      default_restore_mode: backupSettings.defaultRestoreMode,
    }

    const response = await api.patch(ENDPOINTS.BACKUP_SETTINGS, payload)

    applySettingsData(response.data || {})
    snapshotInitialSettings()
    await fetchSummary()
    showFlash('Backup settings saved successfully.')
  } catch (error) {
    showFlash(getErrorMessage(error, 'Failed to save backup settings.'))
  } finally {
    savingSettings.value = false
  }
}

async function runBackupNow() {
  runningBackup.value = true
  try {
    const payload = {
      include_media: backupSettings.includeMedia,
      include_users: backupSettings.includeUsers,
      include_settings: backupSettings.includeSettings,
    }

    const response = await api.post(ENDPOINTS.BACKUPS_RUN, payload)

    showFlash(response.data?.message || 'Manual backup completed successfully.')
    await Promise.all([fetchSummary(), fetchBackupHistory()])
  } catch (error) {
    showFlash(getErrorMessage(error, 'Failed to run backup.'))
  } finally {
    runningBackup.value = false
  }
}

async function viewBackup(item: BackupHistoryItem) {
  try {
    const response = await api.get(`${ENDPOINTS.BACKUPS}${item.id}/`)
    selectedBackup.value = mapBackupHistoryItem(response.data)
    showDetailModal.value = true
  } catch (error) {
    showFlash(getErrorMessage(error, 'Failed to load backup detail.'))
  }
}

function closeDetailModal() {
  showDetailModal.value = false
  selectedBackup.value = null
}

function openRestoreModal() {
  restoreForm.mode = backupSettings.defaultRestoreMode
  showRestoreModal.value = true
}

function closeRestoreModal() {
  showRestoreModal.value = false
  restoreForm.backupId = ''
  restoreForm.mode = backupSettings.defaultRestoreMode
}

function prepareRestore(item: BackupHistoryItem) {
  if (!item.canRestore) {
    showFlash('Only allowed successful backups can be restored.')
    return
  }

  restoreForm.backupId = String(item.id)
  restoreForm.mode = backupSettings.defaultRestoreMode
  showRestoreModal.value = true
}

async function confirmRestore() {
  if (!restoreForm.backupId) {
    showFlash('Please select a backup first.')
    return
  }

  restoring.value = true
  try {
    const response = await api.post(
      `${ENDPOINTS.BACKUPS}${restoreForm.backupId}/restore/`,
      {
        mode: restoreForm.mode,
        confirm_overwrite: true,
      }
    )

    showFlash(response.data?.message || `Restore started with mode: ${restoreModeLabel(restoreForm.mode)}.`)
    closeRestoreModal()
  } catch (error) {
    showFlash(getErrorMessage(error, 'Failed to restore backup.'))
  } finally {
    restoring.value = false
  }
}

async function downloadBackup(item: BackupHistoryItem) {
  if (!item.canDownload) {
    showFlash('This backup cannot be downloaded.')
    return
  }

  try {
    const response = await api.get(`${ENDPOINTS.BACKUPS}${item.id}/download/`, {
      responseType: 'blob',
    })

    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = item.fileName || `backup_${item.id}.zip`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)

    showFlash(`Download started for backup ${item.dateTime}.`)
  } catch (error) {
    showFlash(getErrorMessage(error, 'Failed to download backup.'))
  }
}

async function deleteBackup(id: number) {
  const confirmed = window.confirm('Delete this backup?')
  if (!confirmed) return

  try {
    await api.delete(`${ENDPOINTS.BACKUPS}${id}/`)
    backupHistory.value = backupHistory.value.filter((item) => item.id !== id)
    await fetchSummary()
    showFlash('Backup deleted successfully.')
  } catch (error) {
    showFlash(getErrorMessage(error, 'Failed to delete backup.'))
  }
}

let searchTimer: number | null = null
function debouncedFetchHistory() {
  if (searchTimer) window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    fetchBackupHistory()
  }, 350)
}

function showFlash(message: string) {
  flashMessage.value = message
  window.setTimeout(() => {
    flashMessage.value = ''
  }, 2200)
}

onMounted(async () => {
  try {
    await Promise.all([fetchSummary(), fetchSettings(), fetchBackupHistory()])
    restoreForm.mode = backupSettings.defaultRestoreMode
  } catch (error) {
    showFlash(getErrorMessage(error, 'Failed to load backup center data.'))
  }
})
</script>

<style scoped>
.page {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.page-header__left {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.page-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
}

.page-subtitle {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 1rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.92rem;
  color: #64748b;
}

.breadcrumb .active {
  color: #059814;
  font-weight: 700;
}

.page-header__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}

.stat-card {
  position: relative;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.stat-card.success {
  border-top: 4px solid #16a34a;
}

.stat-card.info {
  border-top: 4px solid #0ea5e9;
}

.stat-card.primary {
  border-top: 4px solid #2563eb;
}

.stat-card.warning {
  border-top: 4px solid #f59e0b;
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f0fdf4;
  color: #059814;
  flex-shrink: 0;
}

.stat-card.info .stat-icon {
  background: #eff6ff;
  color: #0ea5e9;
}

.stat-card.primary .stat-icon {
  background: #eff6ff;
  color: #2563eb;
}

.stat-card.warning .stat-icon {
  background: #fffbeb;
  color: #f59e0b;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-label {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: #64748b;
}

.stat-value {
  margin: 6px 0 4px;
  font-size: 1.25rem;
  font-weight: 800;
  color: #111827;
}

.stat-meta {
  margin: 0;
  color: #6b7280;
  font-size: 0.92rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 18px;
  margin-bottom: 22px;
}

.panel-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.card-header {
  padding: 22px 22px 18px;
  border-bottom: 1px solid #eef2f7;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #111827;
}

.card-header p {
  margin: 6px 0 0;
  color: #6b7280;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 700;
}

.status-pill.active {
  background: #dcfce7;
  color: #166534;
}

.status-pill.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.settings-grid {
  padding: 22px;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 18px;
}

.switch-row {
  grid-template-columns: 1fr auto;
  align-items: center;
}

.field-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1f2937;
}

.field-help {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.form-input,
.form-select {
  width: 100%;
  min-height: 48px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 0 14px;
  background: #fff;
  color: #111827;
  font-size: 0.98rem;
  outline: none;
  transition: 0.2s ease;
}

.form-input:focus,
.form-select:focus {
  border-color: #16a34a;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.action-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.switch {
  width: 62px;
  height: 34px;
  border-radius: 999px;
  border: none;
  padding: 4px;
  background: #cbd5e1;
  cursor: pointer;
  position: relative;
  transition: 0.2s ease;
}

.switch.enabled {
  background: linear-gradient(90deg, #60e66c, #059814);
}

.switch-thumb {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: #fff;
  display: block;
  transform: translateX(0);
  transition: 0.2s ease;
}

.switch.enabled .switch-thumb {
  transform: translateX(28px);
}

.side-panel {
  overflow: hidden;
}

.restore-box {
  padding: 22px;
  text-align: center;
}

.restore-icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0fdf4;
  color: #059814;
}

.restore-icon svg {
  width: 30px;
  height: 30px;
}

.restore-box h3 {
  margin: 0 0 10px;
  color: #111827;
  font-size: 1.2rem;
}

.restore-box p {
  margin: 0 0 14px;
  color: #6b7280;
  line-height: 1.6;
}

.info-list {
  text-align: left;
  padding-left: 18px;
  margin: 0 0 18px;
  color: #374151;
  line-height: 1.8;
}

.full-btn {
  width: 100%;
}

.table-panel {
  overflow: hidden;
}

.history-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  width: 280px;
}

.filter-select {
  width: 180px;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  min-width: 1100px;
  border-collapse: collapse;
}

.data-table thead th {
  text-align: left;
  padding: 18px 16px;
  color: #1677ff;
  font-size: 0.96rem;
  font-weight: 800;
  border-bottom: 1px solid #e5e7eb;
  background: #fcfdff;
}

.data-table tbody td {
  padding: 16px;
  border-bottom: 1px solid #eef2f7;
  color: #1f2937;
  vertical-align: middle;
}

.data-table tbody tr:hover {
  background: #f9fbff;
}

.primary-text {
  font-weight: 700;
}

.type-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
}

.type-badge.auto {
  background: rgba(14, 165, 233, 0.12);
  color: #0369a1;
}

.type-badge.manual {
  background: rgba(22, 163, 74, 0.12);
  color: #166534;
}

.status-badge.success {
  background: rgba(34, 197, 94, 0.12);
  color: #166534;
}

.status-badge.failed {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.status-badge.running {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.action-col {
  width: 260px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-action {
  min-height: 36px;
  border: none;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-action:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-action.view {
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
}

.btn-action.download {
  background: rgba(14, 165, 233, 0.12);
  color: #0ea5e9;
}

.btn-action.restore {
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
}

.btn-action.delete {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.empty-cell {
  text-align: center;
  color: #6b7280;
  padding: 30px !important;
}

.btn {
  min-height: 46px;
  border: none;
  border-radius: 12px;
  padding: 0 18px;
  font-size: 0.96rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-light {
  background: #f3f4f6;
  color: #111827;
}

.btn-light:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-primary {
  background: #1677ff;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #0f67ea;
}

.btn-success {
  background: linear-gradient(90deg, #60e66c, #059814);
  color: #fff;
}

.btn-success:hover:not(:disabled) {
  filter: brightness(0.97);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-container {
  width: 100%;
  max-width: 720px;
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22);
  overflow: hidden;
}

.modal-sm {
  max-width: 560px;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 16px;
  border-bottom: 1px solid #eef2f7;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #111827;
}

.modal-header p {
  margin: 6px 0 0;
  color: #6b7280;
}

.close-btn {
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 12px;
  background: #f3f4f6;
  font-size: 1.5rem;
  cursor: pointer;
}

.modal-body {
  padding: 24px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-item {
  padding: 16px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
}

.detail-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.84rem;
  font-weight: 700;
  color: #64748b;
}

.restore-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.warning-box {
  padding: 16px;
  border-radius: 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

.warning-box strong {
  display: block;
  margin-bottom: 6px;
}

.warning-box p {
  margin: 0;
  line-height: 1.6;
}

.flash-message {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 1200;
  background: #111827;
  color: #fff;
  padding: 14px 18px;
  border-radius: 14px;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.28);
  font-weight: 700;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }

  .page-title {
    font-size: 1.6rem;
  }

  .stats-grid,
  .detail-grid,
  .checkbox-grid,
  .field-row {
    grid-template-columns: 1fr;
  }

  .history-filters,
  .page-header__actions,
  .action-row {
    width: 100%;
  }

  .search-input,
  .filter-select,
  .btn {
    width: 100%;
  }

  .switch-row {
    grid-template-columns: 1fr;
  }
}
</style>