<template>
  <div class="page">
    <!-- Header -->
    <section class="page-header">
      <div class="page-header__left">
        <div>
          <h1 class="page-title">{{ t('backupPage.title') }}</h1>
          <p class="page-subtitle">
            {{ t('backupPage.subtitle') }}
          </p>
        </div>

        <div class="breadcrumb">
          <span>{{ t('common.home') }}</span>
          <span>›</span>
          <span>{{ t('menu.systemTools') }}</span>
          <span>›</span>
          <span class="active">{{ t('menu.backupRestore') }}</span>
        </div>
      </div>

      <div class="page-header__actions">
        <button
          class="btn btn-light"
          @click="openRestoreModal"
          :disabled="!!restoreUnavailableReason"
          :title="restoreUnavailableReason"
        >
          {{ t('backupPage.restoreBackup') }}
        </button>
        <button
          class="btn btn-success"
          @click="runBackupNow"
          :disabled="runningBackup"
        >
          <span v-if="runningBackup" class="spinner" aria-hidden="true"></span>
          {{ runningBackup ? t('backupPage.creatingBackup') : t('backupPage.runBackupNow') }}
        </button>
      </div>
    </section>

    <!-- Progress: a backup or restore can take a while on a large shop -->
    <div v-if="busyState" class="progress-banner" role="status" aria-live="polite">
      <span class="spinner spinner-dark" aria-hidden="true"></span>
      <div>
        <strong>{{ busyState.title }}</strong>
        <p>{{ busyState.detail }} <span class="elapsed">{{ elapsedLabel }}</span></p>
      </div>
    </div>

    <!-- Outcome of the last restore; stays until dismissed -->
    <div v-if="resultNotice" class="result-notice" :class="resultNotice.type" role="status">
      <p>{{ resultNotice.text }}</p>
      <button class="close-btn small" @click="resultNotice = null" :aria-label="t('common.close')">×</button>
    </div>

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
          <p class="stat-label">{{ t('backupPage.autoBackupStatus') }}</p>
          <h3 class="stat-value">{{ backupSettings.enabled ? t('backupPage.enabled') : t('backupPage.disabled') }}</h3>
          <p class="stat-meta">{{ t('backupPage.autoProtection') }}</p>
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
          <p class="stat-label">{{ t('backupPage.nextScheduled') }}</p>
          <h3 class="stat-value">{{ nextScheduledBackup }}</h3>
          <p class="stat-meta">{{ t('backupPage.frequencyAt', { frequency: t(`backupPage.frequencies.${backupSettings.frequency}`), time: backupSettings.time }) }}</p>
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
          <p class="stat-label">{{ t('backupPage.lastSuccessful') }}</p>
          <h3 class="stat-value">{{ lastSuccessfulBackup }}</h3>
          <p class="stat-meta">{{ t('backupPage.latestCompleted') }}</p>
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
          <p class="stat-label">{{ t('backupPage.retentionPolicy') }}</p>
          <h3 class="stat-value">{{ t('backupPage.keepCount', { count: backupSettings.keepLast }) }}</h3>
          <p class="stat-meta">{{ t('backupPage.oldRemoved') }}</p>
        </div>
      </article>
    </section>

    <section class="content-grid">
      <!-- Backup Settings -->
      <article class="panel-card">
        <div class="card-header">
          <div>
            <h2>{{ t('backupPage.settingsTitle') }}</h2>
            <p>{{ t('backupPage.settingsSubtitle') }}</p>
          </div>
          <span class="status-pill" :class="backupSettings.enabled ? 'active' : 'inactive'">
            {{ backupSettings.enabled ? t('backupPage.active') : t('backupPage.inactive') }}
          </span>
        </div>

        <div class="settings-grid">
          <div class="field-row switch-row">
            <div>
              <label class="field-label">{{ t('backupPage.enableAutomatic') }}</label>
              <p class="field-help">{{ t('backupPage.enableAutomaticHelp') }}</p>
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
              <label class="field-label">{{ t('backupPage.frequency') }}</label>
              <select v-model="backupSettings.frequency" class="form-select">
                <option value="daily">{{ t('backupPage.frequencies.daily') }}</option>
                <option value="weekly">{{ t('backupPage.frequencies.weekly') }}</option>
                <option value="monthly">{{ t('backupPage.frequencies.monthly') }}</option>
              </select>
            </div>

            <div class="field-col">
              <label class="field-label">{{ t('backupPage.backupTime') }}</label>
              <input v-model="backupSettings.time" type="time" class="form-input" />
            </div>
          </div>

          <div class="field-row">
            <div class="field-col">
              <label class="field-label">{{ t('backupPage.keepLastN') }}</label>
              <input
                v-model.number="backupSettings.keepLast"
                type="number"
                min="1"
                class="form-input"
                placeholder="10"
              />
            </div>

            <div class="field-col">
              <label class="field-label">{{ t('backupPage.defaultRestoreMode') }}</label>
              <select v-model="backupSettings.defaultRestoreMode" class="form-select">
                <option value="master">{{ t('backupPage.modeMaster') }}</option>
                <option value="full">{{ t('backupPage.modeFull') }}</option>
              </select>
            </div>
          </div>

          <div class="checkbox-grid">
            <label class="check-item">
              <input v-model="backupSettings.includeMedia" type="checkbox" />
              <span>{{ t('backupPage.includeMedia') }}</span>
            </label>

            <label class="check-item">
              <input v-model="backupSettings.includeUsers" type="checkbox" />
              <span>{{ t('backupPage.includeUsers') }}</span>
            </label>

            <label class="check-item">
              <input v-model="backupSettings.includeSettings" type="checkbox" />
              <span>{{ t('backupPage.includeSettings') }}</span>
            </label>
          </div>

          <div class="action-row">
            <button class="btn btn-light" @click="resetBackupSettings" :disabled="savingSettings">
              {{ t('common.reset') }}
            </button>
            <button class="btn btn-primary" @click="saveBackupSettings" :disabled="savingSettings">
              {{ savingSettings ? t('settingsPage.saving') : t('backupPage.saveSettings') }}
            </button>
            <button class="btn btn-success" @click="runBackupNow" :disabled="runningBackup">
              <span v-if="runningBackup" class="spinner" aria-hidden="true"></span>
              {{ runningBackup ? t('backupPage.creatingBackup') : t('backupPage.runBackupNow') }}
            </button>
          </div>
        </div>
      </article>

      <!-- Restore Panel -->
      <article class="panel-card side-panel">
        <div class="card-header">
          <div>
            <h2>{{ t('backupPage.restoreData') }}</h2>
            <p>{{ t('backupPage.restorePanelSubtitle') }}</p>
          </div>
        </div>

        <div class="restore-box">
          <div class="restore-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </div>

          <h3>{{ t('backupPage.restoreCarefully') }}</h3>
          <p>
            {{ t('backupPage.restoreCarefullyText') }}
          </p>

          <ul class="info-list">
            <li>{{ t('backupPage.infoModes') }}</li>
            <li>{{ t('backupPage.infoFull') }}</li>
            <li>{{ t('backupPage.infoDeletes') }}</li>
            <li>{{ t('backupPage.infoPreview') }}</li>
          </ul>

          <button
            class="btn btn-success full-btn"
            @click="openRestoreModal"
            :disabled="!!restoreUnavailableReason"
          >
            {{ t('backupPage.restoreData') }}
          </button>
          <p v-if="restoreUnavailableReason" class="disabled-hint">{{ restoreUnavailableReason }}</p>
        </div>
      </article>
    </section>

    <!-- History -->
    <section class="panel-card table-panel">
      <div class="card-header">
        <div>
          <h2>{{ t('backupPage.historyTitle') }}</h2>
          <p>{{ t('backupPage.historySubtitle') }}</p>
        </div>

        <div class="history-filters">
          <input
            v-model="search"
            type="text"
            class="form-input search-input"
            :placeholder="t('backupPage.searchPlaceholder')"
            @input="debouncedFetchHistory"
          />

          <select v-model="statusFilter" class="form-select filter-select" @change="fetchBackupHistory">
            <option value="">{{ t('backupPage.allStatus') }}</option>
            <option value="Success">{{ t('backupPage.statuses.success') }}</option>
            <option value="Failed">{{ t('backupPage.statuses.failed') }}</option>
            <option value="Running">{{ t('backupPage.statuses.running') }}</option>
          </select>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('backupPage.dateTime') }}</th>
              <th>{{ t('common.type') }}</th>
              <th>{{ t('backupPage.triggeredBy') }}</th>
              <th>{{ t('common.status') }}</th>
              <th>{{ t('backupPage.fileSize') }}</th>
              <th>{{ t('backupPage.included') }}</th>
              <th class="action-col">{{ t('common.action') }}</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loadingHistory">
              <td colspan="7" class="empty-cell">{{ t('backupPage.loadingHistory') }}</td>
            </tr>

            <tr v-else-if="filteredHistory.length === 0">
              <td colspan="7" class="empty-cell">{{ t('backupPage.noHistory') }}</td>
            </tr>

            <tr v-for="item in filteredHistory" :key="item.id">
              <td>
                <div class="primary-text">{{ item.dateTime }}</div>
              </td>
              <td>
                <span class="type-badge" :class="item.type.toLowerCase()">
                  {{ typeLabel(item.type) }}
                </span>
              </td>
              <td>{{ item.triggeredBy }}</td>
              <td>
                <span class="status-badge" :class="statusClass(item.status)">
                  {{ statusLabel(item.status) }}
                </span>
              </td>
              <td>{{ item.fileSize }}</td>
              <td>{{ includedLabel(item.included) }}</td>
              <td>
                <div class="actions">
                  <button class="btn-action view" @click="viewBackup(item)">{{ t('common.view') }}</button>
                  <button
                    class="btn-action download"
                    @click="downloadBackup(item)"
                    :disabled="!item.canDownload"
                  >
                    {{ t('backupPage.download') }}
                  </button>
                  <button
                    class="btn-action restore"
                    @click="prepareRestore(item)"
                    :disabled="!item.canRestore"
                  >
                    {{ t('backupPage.restore') }}
                  </button>
                  <button
                    class="btn-action delete"
                    @click="deleteBackup(item.id)"
                    :disabled="!item.canDelete"
                  >
                    {{ t('common.delete') }}
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
            <h2>{{ t('backupPage.detailTitle') }}</h2>
            <p>{{ t('backupPage.detailSubtitle') }}</p>
          </div>
          <button class="close-btn" @click="closeDetailModal">×</button>
        </div>

        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">{{ t('backupPage.dateTime') }}</span>
              <strong>{{ selectedBackup.dateTime }}</strong>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ t('common.type') }}</span>
              <strong>{{ typeLabel(selectedBackup.type) }}</strong>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ t('backupPage.triggeredBy') }}</span>
              <strong>{{ selectedBackup.triggeredBy }}</strong>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ t('common.status') }}</span>
              <strong>{{ statusLabel(selectedBackup.status) }}</strong>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ t('backupPage.fileSize') }}</span>
              <strong>{{ selectedBackup.fileSize }}</strong>
            </div>
            <div class="detail-item">
              <span class="detail-label">{{ t('backupPage.included') }}</span>
              <strong>{{ includedLabel(selectedBackup.included) }}</strong>
            </div>
            <div class="detail-item" v-if="selectedBackup.fileName">
              <span class="detail-label">{{ t('backupPage.fileName') }}</span>
              <strong>{{ selectedBackup.fileName }}</strong>
            </div>
            <div class="detail-item" v-if="selectedBackup.durationSeconds !== null">
              <span class="detail-label">{{ t('backupPage.duration') }}</span>
              <strong>{{ t('backupPage.seconds', { count: selectedBackup.durationSeconds }) }}</strong>
            </div>
            <div class="detail-item" v-if="selectedBackup.restoreCount !== null">
              <span class="detail-label">{{ t('backupPage.restoreCount') }}</span>
              <strong>{{ selectedBackup.restoreCount }}</strong>
            </div>
            <div class="detail-item" v-if="selectedBackup.note">
              <span class="detail-label">{{ t('common.note') }}</span>
              <strong>{{ selectedBackup.note }}</strong>
            </div>
            <div class="detail-item" v-if="selectedBackup.errorMessage">
              <span class="detail-label">{{ t('backupPage.error') }}</span>
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
            <h2>{{ t('backupPage.restoreData') }}</h2>
            <p>{{ t('backupPage.restoreModalSubtitle') }}</p>
          </div>
          <button class="close-btn" @click="closeRestoreModal" :disabled="restoreBusy">×</button>
        </div>

        <div class="modal-body">
          <div class="restore-form">
            <div class="field-col">
              <label class="field-label">{{ t('backupPage.stepSelect') }}</label>
              <select
                v-model="restoreForm.backupId"
                class="form-select"
                :disabled="restoreBusy"
                @change="resetDryRun"
              >
                <option value="">{{ t('backupPage.chooseBackup') }}</option>
                <option v-for="item in successfulBackups" :key="item.id" :value="String(item.id)">
                  #{{ item.id }} · {{ item.dateTime }} — {{ item.fileSize }}
                </option>
              </select>
            </div>

            <div class="field-col">
              <label class="field-label">{{ t('backupPage.restoreMode') }}</label>
              <select
                v-model="restoreForm.mode"
                class="form-select"
                :disabled="restoreBusy"
                @change="resetDryRun"
              >
                <option value="master">{{ t('backupPage.modeMaster') }}</option>
                <option value="full">{{ t('backupPage.modeFull') }}</option>
              </select>
            </div>

            <div class="warning-box">
              <strong>{{ t('backupPage.warningTitle') }}</strong>
              <p>
                {{ t('backupPage.warningText') }}
              </p>
            </div>

            <div class="field-col">
              <label class="field-label">{{ t('backupPage.stepCheck') }}</label>
              <button
                class="btn btn-primary"
                @click="runDryRun"
                :disabled="!restoreForm.backupId || restoreBusy"
              >
                <span v-if="dryRunning" class="spinner" aria-hidden="true"></span>
                {{ dryRunning ? t('backupPage.checkingBackup') : t('backupPage.runDryRun') }}
              </button>
            </div>

            <div v-if="dryRunError" class="error-box" role="alert">
              <strong>{{ t('backupPage.dryRunFailed') }}</strong>
              <p>{{ dryRunError }}</p>
              <ul v-if="dryRunReasons.length" class="warning-list">
                <li v-for="reason in dryRunReasons" :key="reason">{{ reason }}</li>
              </ul>
            </div>

            <div v-if="dryRunResult" class="preview-box">
              <template v-if="!deletionPreview.available">
                <strong>{{ t('backupPage.previewUnavailable') }}</strong>
                <p>
                  {{ t('backupPage.previewUnavailableText') }}
                </p>
              </template>

              <template v-else-if="deletionPreview.totalDeleted === 0">
                <strong>{{ t('backupPage.nothingDeleted') }}</strong>
                <p>{{ t('backupPage.nothingDeletedText') }}</p>
              </template>

              <template v-else>
                <p class="danger-headline">
                  {{ t('backupPage.willBeDeleted', { summary: deletionPreview.summary }) }}
                </p>
                <p class="muted">
                  {{ t('backupPage.countsExplain') }}
                </p>
                <div class="table-wrap">
                  <table class="preview-table">
                    <thead>
                      <tr>
                        <th>{{ t('backupPage.data') }}</th>
                        <th>{{ t('backupPage.willBeDeletedColumn') }}</th>
                        <th>{{ t('backupPage.inBackup') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="line in deletionPreview.lines" :key="line.section">
                        <td>{{ line.label }}</td>
                        <td class="danger-cell">{{ line.deleted }}</td>
                        <td>{{ line.inBackup ?? '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>

              <ul v-if="dryRunResult.warnings?.length" class="warning-list">
                <li v-for="warning in dryRunResult.warnings" :key="warning">{{ warning }}</li>
              </ul>
            </div>

            <label v-if="dryRunReady" class="ack-row">
              <input v-model="restoreAcknowledged" type="checkbox" :disabled="restoreBusy" />
              <span>
                <template v-if="deletionPreview.totalDeleted">
                  {{ t('backupPage.ackDelete', { summary: deletionPreview.summary, shop: shopName || t('backupPage.thisShop') }) }}
                </template>
                <template v-else>
                  {{ t('backupPage.ackOverwrite', { shop: shopName || t('backupPage.thisShop') }) }}
                </template>
              </span>
            </label>

            <div v-if="restoreError" class="error-box" role="alert">
              <strong>{{ t('backupPage.restoreFailed') }}</strong>
              <p>{{ restoreError }}</p>
              <p class="muted">
                {{ t('backupPage.restoreFailedNote') }}
              </p>
            </div>

            <div class="action-row">
              <button class="btn btn-light" @click="closeRestoreModal" :disabled="restoreBusy">
                {{ t('common.cancel') }}
              </button>
              <button
                class="btn btn-danger"
                @click="confirmRestore"
                :disabled="!canRestore"
                :title="canRestore ? '' : t('backupPage.restoreDisabledHint')"
              >
                <span v-if="restoring" class="spinner" aria-hidden="true"></span>
                {{ restoring ? t('backupPage.restoring') : restoreModeLabel(restoreForm.mode) }}
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
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import { getApiErrorMessage, looksLikeDebugPage } from '@/utils/apiError'
import { ENDPOINTS } from '@/services/endpoints'
import {
  buildDeletionPreview,
  filenameFromContentDisposition,
  safetyBackupIdFor,
  type DryRunResponse,
} from '@/services/backupRestore'

const { t, te } = useI18n()

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

const BACKUP_ENDPOINTS = {
  SUMMARY: ENDPOINTS.BACKUP_CENTER_SUMMARY,
  SETTINGS: ENDPOINTS.BACKUP_SETTINGS,
  HISTORY: ENDPOINTS.BACKUPS,
  RUN: ENDPOINTS.BACKUPS_RUN,
  detail: (id: number | string) => `${ENDPOINTS.BACKUPS}${id}/`,
  download: (id: number | string) => `${ENDPOINTS.BACKUPS}${id}/download/`,
  restore: (id: number | string) => `${ENDPOINTS.BACKUPS}${id}/restore/`,
  dryRun: (id: number | string) => `${ENDPOINTS.BACKUPS}${id}/restore/dry-run/`,
  RESTORES: ENDPOINTS.RESTORES,
}

const backupSettings = reactive({
  enabled: true,
  frequency: 'daily',
  time: '23:30',
  keepLast: 10,
  includeMedia: true,
  includeUsers: true,
  includeSettings: true,
  defaultRestoreMode: 'master',
})

const initialBackupSettings = reactive({
  enabled: true,
  frequency: 'daily',
  time: '23:30',
  keepLast: 10,
  includeMedia: true,
  includeUsers: true,
  includeSettings: true,
  defaultRestoreMode: 'master',
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
  mode: 'master',
})

const shopName = ref('')

// Dry-run state. A result only counts for the backup and mode it was run
// with; changing either throws it away.
const dryRunning = ref(false)
const dryRunResult = ref<DryRunResponse | null>(null)
const dryRunKey = ref('')
const dryRunError = ref('')
const dryRunReasons = ref<string[]>([])
const restoreError = ref('')
const restoreAcknowledged = ref(false)
const resultNotice = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const currentRestoreKey = computed(() => `${restoreForm.backupId}:${restoreForm.mode}`)
const deletionPreview = computed(() =>
  buildDeletionPreview(dryRunResult.value, {
    label: (section, count) => {
      const key = `backupPage.sections.${section}`
      return te(key) ? t(key, count) : section.replace(/_/g, ' ')
    },
    andWord: t('backupPage.and'),
  }),
)
const restoreBusy = computed(() => restoring.value || dryRunning.value)
const dryRunReady = computed(
  () =>
    !!dryRunResult.value &&
    dryRunKey.value === currentRestoreKey.value &&
    dryRunResult.value.valid === true &&
    deletionPreview.value.available,
)
const canRestore = computed(() => dryRunReady.value && restoreAcknowledged.value && !restoreBusy.value)

const restoreUnavailableReason = computed(() => {
  if (loadingHistory.value && backupHistory.value.length === 0) return ''
  if (successfulBackups.value.length > 0) return ''
  return backupHistory.value.length === 0
    ? t('backupPage.nothingToRestoreYet')
    : t('backupPage.nothingToRestore')
})

// Progress while a long request runs.
const busySince = ref(0)
const now = ref(Date.now())
let tickTimer: number | null = null

const busyState = computed(() => {
  if (restoring.value) {
    return {
      title: t('backupPage.restoring'),
      detail: t('backupPage.busyRestoring'),
    }
  }
  if (runningBackup.value) {
    return {
      title: t('backupPage.creatingBackup'),
      detail: t('backupPage.busyBackup'),
    }
  }
  if (dryRunning.value) {
    return {
      title: t('backupPage.checkingBackup'),
      detail: t('backupPage.busyDryRun'),
    }
  }
  return null
})

const elapsedLabel = computed(() => {
  if (!busyState.value || !busySince.value) return ''
  const seconds = Math.max(0, Math.floor((now.value - busySince.value) / 1000))
  return `(${seconds}s)`
})

watch(busyState, (state) => {
  if (state && !tickTimer) {
    busySince.value = Date.now()
    now.value = Date.now()
    tickTimer = window.setInterval(() => {
      now.value = Date.now()
    }, 500)
  } else if (!state && tickTimer) {
    window.clearInterval(tickTimer)
    tickTimer = null
    busySince.value = 0
  }
})

onBeforeUnmount(() => {
  if (tickTimer) window.clearInterval(tickTimer)
})

const nextScheduledBackup = computed(() => {
  return summaryRaw.value?.next_scheduled_backup || t('backupPage.disabled')
})

const lastSuccessfulBackup = computed(() => {
  return summaryRaw.value?.last_successful_backup || t('backupPage.noSuccessfulYet')
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
  const kind = String(value || '').trim().toLowerCase()
  if (kind === 'auto') return 'Auto'
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
  if (raw.includes('full')) return 'full'
  return 'master'
}

function toArrayStrings(value: any): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v))
  return []
}


function restoreModeLabel(value: string): string {
  return value === 'master' ? t('backupPage.modeMaster') : t('backupPage.modeFull')
}

function statusLabel(status: BackupStatus) {
  return t(`backupPage.statuses.${status.toLowerCase()}`)
}

function typeLabel(type: BackupType) {
  return t(`backupPage.types.${type.toLowerCase()}`)
}

// Backend names for what a backup contains ("Database", "Media", ...),
// translated when known and shown as sent otherwise.
function includedLabel(included: string[]) {
  if (!included.length) return '-'
  return included
    .map((part) => {
      const key = `backupPage.includedParts.${part.trim().toLowerCase()}`
      return te(key) ? t(key) : part
    })
    .join(', ')
}

function statusClass(status: BackupStatus) {
  return {
    success: status === 'Success',
    failed: status === 'Failed',
    running: status === 'Running',
  }
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
  shopName.value = String(data.shop?.name || shopName.value || '')
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
  showFlash(t('backupPage.settingsReset'))
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
  const response = await api.get(BACKUP_ENDPOINTS.SUMMARY)
  applySummaryData(response.data || {})
}

async function fetchSettings() {
  const response = await api.get(BACKUP_ENDPOINTS.SETTINGS)
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

    const response = await api.get(BACKUP_ENDPOINTS.HISTORY, { params })
    const rows = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.results)
      ? response.data.results
      : []

    backupHistory.value = rows.map(mapBackupHistoryItem)
  } catch (error) {
    showFlash(getApiErrorMessage(error, t('backupPage.historyLoadFailed')))
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

    const response = await api.patch(BACKUP_ENDPOINTS.SETTINGS, payload)

    applySettingsData(response.data || {})
    snapshotInitialSettings()
    await fetchSummary()
    showFlash(t('backupPage.settingsSaved'))
  } catch (error) {
    showFlash(getApiErrorMessage(error, t('backupPage.settingsSaveFailed')))
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

    const response = await api.post(BACKUP_ENDPOINTS.RUN, payload)
    const backupId = response.data?.backup_id
    showFlash(
      backupId
        ? t('backupPage.backupCreated', { id: backupId, size: response.data?.file_size || t('backupPage.sizeUnknown') })
        : t('backupPage.backupCompleted'),
    )
  } catch (error: any) {
    showFlash(getApiErrorMessage(error, t('backupPage.backupFailed')), 8000)
  } finally {
    runningBackup.value = false
    // A failed run still leaves a history row, so refresh either way.
    await refreshAfterChange()
  }
}

async function refreshAfterChange() {
  try {
    await Promise.all([fetchSummary(), fetchBackupHistory()])
  } catch (error) {
    showFlash(getApiErrorMessage(error, t('backupPage.historyRefreshFailed')))
  }
}

async function viewBackup(item: BackupHistoryItem) {
  try {
    const response = await api.get(BACKUP_ENDPOINTS.detail(item.id))
    selectedBackup.value = mapBackupHistoryItem(response.data)
    showDetailModal.value = true
  } catch (error) {
    showFlash(getApiErrorMessage(error, t('backupPage.detailLoadFailed')))
  }
}

function closeDetailModal() {
  showDetailModal.value = false
  selectedBackup.value = null
}

function resetDryRun() {
  dryRunResult.value = null
  dryRunKey.value = ''
  dryRunError.value = ''
  dryRunReasons.value = []
  restoreError.value = ''
  restoreAcknowledged.value = false
}

function openRestoreModal() {
  restoreForm.mode = backupSettings.defaultRestoreMode
  resetDryRun()
  showRestoreModal.value = true
}

function closeRestoreModal() {
  if (restoreBusy.value) return
  showRestoreModal.value = false
  restoreForm.backupId = ''
  restoreForm.mode = backupSettings.defaultRestoreMode
  resetDryRun()
}

function prepareRestore(item: BackupHistoryItem) {
  if (!item.canRestore) {
    showFlash(t('backupPage.onlySuccessfulRestorable'))
    return
  }

  restoreForm.backupId = String(item.id)
  restoreForm.mode = backupSettings.defaultRestoreMode
  resetDryRun()
  showRestoreModal.value = true
}

function selectedBackupLabel() {
  const item = backupHistory.value.find((row) => String(row.id) === restoreForm.backupId)
  return item
    ? t('backupPage.backupFrom', { id: item.id, date: item.dateTime })
    : t('backupPage.backupNumber', { id: restoreForm.backupId })
}

async function runDryRun() {
  if (!restoreForm.backupId) return
  const key = currentRestoreKey.value
  resetDryRun()
  dryRunning.value = true
  try {
    const response = await api.post(BACKUP_ENDPOINTS.dryRun(restoreForm.backupId), {
      mode: restoreForm.mode,
    })
    dryRunResult.value = response.data || {}
    dryRunKey.value = key
    if (response.data?.valid === false) {
      applyDryRunFailure({ response }, t('backupPage.dryRunNotPassed'))
    }
  } catch (error) {
    applyDryRunFailure(error, t('backupPage.dryRunNotCompleted'))
  } finally {
    dryRunning.value = false
  }
}

function applyDryRunFailure(error: unknown, fallback: string) {
  // A refused dry-run answers {message, errors[]}. Which of the two carries
  // the useful part varies ("only available for full restore" is in
  // message; "not a valid ZIP package" is in errors), so show both.
  const response = (error as { response?: { status?: number; data?: unknown } } | null)?.response
  const body = response?.data as { message?: unknown; errors?: unknown } | undefined
  const status = response?.status || 0
  const clean = (value: unknown) =>
    typeof value === 'string' && value.trim() && !looksLikeDebugPage(value) ? value.trim() : ''

  if (body && typeof body === 'object' && status < 500) {
    const headline = clean(body.message)
    const reasons = (Array.isArray(body.errors) ? body.errors : []).map(clean).filter(Boolean)
    if (headline || reasons.length) {
      dryRunError.value = headline || reasons[0]
      dryRunReasons.value = headline ? reasons : reasons.slice(1)
      return
    }
  }
  dryRunError.value = getApiErrorMessage(error, fallback)
  dryRunReasons.value = []
}

async function confirmRestore() {
  if (!canRestore.value) return

  const preview = deletionPreview.value
  const what = preview.totalDeleted
    ? t('backupPage.confirmDeleted', { summary: preview.summary })
    : t('backupPage.confirmOverwrite')
  const confirmed = window.confirm(
    `${t('backupPage.confirmQuestion', { backup: selectedBackupLabel(), mode: restoreModeLabel(restoreForm.mode) })}\n\n${what}\n\n` +
      t('backupPage.confirmNoRecovery'),
  )
  if (!confirmed) return

  const backupLabel = selectedBackupLabel()
  const modeLabel = restoreModeLabel(restoreForm.mode)
  restoreError.value = ''
  restoring.value = true
  try {
    const response = await api.post(BACKUP_ENDPOINTS.restore(restoreForm.backupId), {
      mode: restoreForm.mode,
      confirm_overwrite: true,
    })

    const safety = await findSafetyBackup(response.data?.restore_id)
    let text = t('backupPage.restoreComplete', { backup: backupLabel, mode: modeLabel })
    if (typeof safety === 'number') {
      text += ` ${t('backupPage.safetyCreated', { id: safety })}`
    } else if (safety === null) {
      text += ` ${t('backupPage.noSafety')}`
    }
    restoring.value = false
    closeRestoreModal()
    resultNotice.value = { type: 'success', text }
  } catch (error) {
    restoreError.value = getApiErrorMessage(error, t('backupPage.restoreNotCompleted'))
  } finally {
    restoring.value = false
    // Success and failure can both add a safety backup to the history.
    await refreshAfterChange()
  }
}

async function findSafetyBackup(restoreId: unknown): Promise<number | null | undefined> {
  if (restoreId === undefined || restoreId === null) return undefined
  try {
    const response = await api.get(BACKUP_ENDPOINTS.RESTORES)
    const rows = Array.isArray(response.data) ? response.data : response.data?.results
    return safetyBackupIdFor(rows, Number(restoreId))
  } catch {
    // The restore itself succeeded; not knowing the safety backup number
    // must not turn that into an error.
    return undefined
  }
}

async function readBlobError(error: unknown) {
  // With responseType 'blob' an error body arrives as a Blob too; turn it
  // back into JSON so the reason can be shown.
  const response = (error as { response?: { data?: unknown } } | null)?.response
  if (response && typeof Blob !== 'undefined' && response.data instanceof Blob) {
    const text = await response.data.text()
    try {
      response.data = JSON.parse(text)
    } catch {
      response.data = text
    }
  }
  return error
}

async function downloadBackup(item: BackupHistoryItem) {
  if (!item.canDownload) {
    showFlash(t('backupPage.cannotDownload'))
    return
  }

  try {
    const response = await api.get(BACKUP_ENDPOINTS.download(item.id), {
      responseType: 'blob',
    })

    // The backend names the file in Content-Disposition. Cross-origin, the
    // browser only lets us read that header if the API lists it in
    // Access-Control-Expose-Headers; otherwise fall back.
    const fileName =
      filenameFromContentDisposition(response.headers?.['content-disposition']) ||
      item.fileName ||
      `backup_${item.id}.zip`

    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)

    showFlash(t('backupPage.downloadStarted', { name: fileName }))
  } catch (error) {
    showFlash(getApiErrorMessage(await readBlobError(error), t('backupPage.downloadFailed')), 8000)
  }
}

async function deleteBackup(id: number) {
  const confirmed = window.confirm(t('backupPage.deleteConfirm'))
  if (!confirmed) return

  try {
    await api.delete(BACKUP_ENDPOINTS.detail(id))
    backupHistory.value = backupHistory.value.filter((item) => item.id !== id)
    await fetchSummary()
    showFlash(t('backupPage.deleted'))
  } catch (error) {
    showFlash(getApiErrorMessage(error, t('backupPage.deleteFailed')))
  }
}

let searchTimer: number | null = null
function debouncedFetchHistory() {
  if (searchTimer) window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    fetchBackupHistory()
  }, 350)
}

let flashTimer: number | null = null
function showFlash(message: string, durationMs = 3500) {
  flashMessage.value = message
  if (flashTimer) window.clearTimeout(flashTimer)
  flashTimer = window.setTimeout(() => {
    flashMessage.value = ''
    flashTimer = null
  }, durationMs)
}

onMounted(async () => {
  try {
    await Promise.all([fetchSummary(), fetchSettings(), fetchBackupHistory()])
    restoreForm.mode = backupSettings.defaultRestoreMode
  } catch (error) {
    showFlash(getApiErrorMessage(error, t('backupPage.loadFailed')))
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
  color: var(--brand-600);
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
  border-top: 4px solid var(--brand-600);
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
  background: var(--brand-50);
  color: var(--brand-600);
  flex-shrink: 0;
}

.stat-card.info .stat-icon {
  background: #eff6ff;
  color: #0ea5e9;
}

.stat-card.primary .stat-icon {
  background: var(--brand-50);
  color: var(--brand-600);
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
  border-color: var(--brand-600);
  box-shadow: 0 0 0 4px rgba(98, 4, 191, 0.1);
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
  background: var(--brand-gradient);
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
  background: var(--brand-50);
  color: var(--brand-600);
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
  background: var(--brand-600);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--brand-700);
}

.btn-success {
  background: var(--brand-gradient);
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

.spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

.spinner-dark {
  width: 22px;
  height: 22px;
  border: 3px solid #bfdbfe;
  border-top-color: #1d4ed8;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.progress-banner {
  position: fixed;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1300;
  display: flex;
  align-items: center;
  gap: 14px;
  width: min(640px, calc(100% - 32px));
  padding: 14px 18px;
  border-radius: 16px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e3a8a;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.18);
}

.progress-banner p {
  margin: 4px 0 0;
  line-height: 1.5;
}

.elapsed {
  font-variant-numeric: tabular-nums;
  color: #3b82f6;
}

.result-notice {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 22px;
  padding: 16px 18px;
  border-radius: 16px;
  font-weight: 600;
  line-height: 1.6;
}

.result-notice p {
  margin: 0;
}

.result-notice.success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.result-notice.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.close-btn.small {
  width: 32px;
  height: 32px;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.disabled-hint {
  margin: 12px 0 0 !important;
  font-size: 0.9rem;
  color: #92400e !important;
  text-align: left;
}

.error-box {
  padding: 16px;
  border-radius: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.error-box p {
  margin: 6px 0 0;
  line-height: 1.6;
}

.preview-box {
  padding: 16px;
  border-radius: 16px;
  background: #fff;
  border: 2px solid #fca5a5;
  color: #1f2937;
}

.preview-box p {
  margin: 6px 0 0;
  line-height: 1.6;
}

.danger-headline {
  margin: 0 !important;
  font-size: 1.05rem;
  font-weight: 800;
  color: #b91c1c;
}

.muted {
  color: #6b7280;
  font-size: 0.9rem;
}

.preview-table {
  width: 100%;
  margin-top: 12px;
  border-collapse: collapse;
  font-size: 0.92rem;
}

.preview-table th,
.preview-table td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid #f1f5f9;
}

.preview-table th {
  color: #64748b;
  font-weight: 700;
}

.danger-cell {
  color: #b91c1c;
  font-weight: 800;
}

.warning-list {
  margin: 10px 0 0;
  padding-left: 18px;
  color: #92400e;
  line-height: 1.6;
}

.ack-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  border-radius: 14px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #7c2d12;
  line-height: 1.6;
}

.ack-row input {
  margin-top: 5px;
}

.btn-danger {
  background: #dc2626;
  color: #fff;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.modal-container {
  max-height: calc(100vh - 40px);
  overflow-y: auto;
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
