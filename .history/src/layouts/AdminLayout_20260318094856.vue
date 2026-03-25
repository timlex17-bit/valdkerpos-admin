<script setup lang="ts">
import { ref, computed } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'

type Shop = {
  id: string | number
  name: string
}

const openGroups = ref({
  sales: true,
  inventory: true,
  people: true,
  finance: true,
  reports: true,
})

const isCollapsed = ref(false)
const isMobileOpen = ref(false)
const isDark = ref(false)
const profileOpen = ref(false)

const shops = ref<Shop[]>([
  { id: '1', name: 'Wfour Mart' },
  { id: '2', name: 'Valdker Cafe' },
  { id: '3', name: 'Main Outlet' },
])

const selectedShopId = ref('1')

const currentShop = computed<Shop | null>(() => {
  return shops.value.find((shop) => String(shop.id) === selectedShopId.value) ?? null
})

const toggleGroup = (group: keyof typeof openGroups.value) => {
  openGroups.value[group] = !openGroups.value[group]
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const toggleMobileSidebar = () => {
  isMobileOpen.value = !isMobileOpen.value
}

const closeMobileSidebar = () => {
  isMobileOpen.value = false
}

const toggleDark = () => {
  isDark.value = !isDark.value
}

const toggleProfile = () => {
  profileOpen.value = !profileOpen.value
}

const changeShop = (shopId: string | number) => {
  selectedShopId.value = String(shopId)
}
</script>