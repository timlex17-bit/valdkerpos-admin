<script setup>
defineProps({
  isDark: Boolean,
  userName: {
    type: String,
    default: 'Owner',
  },
  currentShopName: {
    type: String,
    default: 'Main Shop',
  },
  profileOpen: Boolean,
})

const emit = defineEmits([
  'toggle-mobile-sidebar',
  'toggle-dark',
  'toggle-profile',
])
</script>

<template>
  <header class="topbar" :class="{ dark: isDark }">
    <div class="topbar-left">
      <button class="mobile-menu-btn" @click="$emit('toggle-mobile-sidebar')">
        ☰
      </button>

      <div class="topbar-title-wrap">
        <h1>Admin Panel</h1>
        <p>{{ currentShopName }}</p>
      </div>
    </div>

    <div class="topbar-right">
      <button class="icon-btn" @click="$emit('toggle-dark')">
        {{ isDark ? '☀' : '🌙' }}
      </button>

      <div class="profile-wrap">
        <button class="profile-btn" @click="$emit('toggle-profile')">
          <span class="avatar">R</span>
          <span class="profile-name">{{ userName }}</span>
        </button>

        <div v-if="profileOpen" class="profile-dropdown">
          <button class="dropdown-item">Profile</button>
          <button class="dropdown-item">Settings</button>
          <button class="dropdown-item danger">Logout</button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  background: #ffffff;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.topbar.dark {
  background: #0f172a;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  color: #fff;
}

.topbar-left,
.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar-title-wrap h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #059814;
}

.topbar-title-wrap p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.topbar.dark .topbar-title-wrap p {
  color: #cbd5e1;
}

.mobile-menu-btn,
.icon-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 10px;
  cursor: pointer;
}

.topbar.dark .mobile-menu-btn,
.topbar.dark .icon-btn {
  background: #111827;
  color: white;
  border-color: rgba(255,255,255,0.08);
}

.mobile-menu-btn {
  display: none;
}

.profile-wrap {
  position: relative;
}

.profile-btn {
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 12px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.topbar.dark .profile-btn {
  background: #111827;
  color: white;
  border-color: rgba(255,255,255,0.08);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: linear-gradient(135deg, #60E66C, #059814);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.profile-name {
  font-size: 14px;
  font-weight: 600;
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 180px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 14px 28px rgba(0,0,0,0.08);
  padding: 8px;
  z-index: 40;
}

.topbar.dark .profile-dropdown {
  background: #111827;
  border-color: rgba(255,255,255,0.08);
}

.dropdown-item {
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  color: inherit;
}

.dropdown-item:hover {
  background: #f3f4f6;
}

.topbar.dark .dropdown-item:hover {
  background: rgba(255,255,255,0.06);
}

.dropdown-item.danger {
  color: #dc2626;
}

@media (max-width: 1024px) {
  .mobile-menu-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .profile-name {
    display: none;
  }
}
</style>