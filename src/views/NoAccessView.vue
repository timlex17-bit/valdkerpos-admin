<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { clearModuleContract } from '@/services/moduleContract'

const { t } = useI18n()
const router = useRouter()

// Reached only when the router found no page at all this user may open.
// Saying so plainly beats bouncing them between pages that refuse them.
function logout() {
  for (const key of ['token', 'auth_token', 'access_token', 'user', 'shop', 'shop_code', 'effective_modules']) {
    localStorage.removeItem(key)
  }
  clearModuleContract()
  router.replace('/login')
}
</script>

<template>
  <section class="no-access">
    <div class="no-access-card">
      <div class="no-access-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="34" height="34">
          <path d="M7.6,10.4 V7.8 A4.4,4.4 0 0 1 16.4,7.8 V10.4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
          <path d="M6.4,10.4 H17.6 A1.6,1.6 0 0 1 19.2,12 V18.8 A1.6,1.6 0 0 1 17.6,20.4 H6.4 A1.6,1.6 0 0 1 4.8,18.8 V12 A1.6,1.6 0 0 1 6.4,10.4 Z" fill="none" stroke="currentColor" stroke-width="1.9" />
          <path d="M12,14.2 V16.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
        </svg>
      </div>
      <h1>{{ t('access.noAccessTitle') }}</h1>
      <p>{{ t('access.noAccessBody') }}</p>
      <button type="button" class="btn-primary" @click="logout">{{ t('logout') }}</button>
    </div>
  </section>
</template>

<style scoped>
.no-access {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.no-access-card {
  max-width: 460px;
  text-align: center;
  padding: 36px 32px;
  border-radius: 24px;
  background: var(--surface);
  border: 1px solid var(--stroke-soft);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.no-access-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  background: var(--brand-50);
  color: var(--brand-600);
}

h1 {
  margin: 0 0 10px;
  font-size: 22px;
  color: var(--text-primary);
}

p {
  margin: 0 0 22px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.btn-primary {
  border: none;
  border-radius: 12px;
  padding: 12px 22px;
  background: var(--brand-gradient);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--brand-shadow);
}
</style>
