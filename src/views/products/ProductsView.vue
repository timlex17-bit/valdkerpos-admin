<template>
  <section class="products-page">
    <div class="page-header">
      <div class="page-title-wrap">
        <div>
          <h1 class="page-title">Products</h1>
          <p class="page-subtitle">
            Manage products for your current shop.
          </p>
        </div>

        <nav class="breadcrumb">
          <span>Home</span>
          <span class="sep">/</span>
          <span>POS</span>
          <span class="sep">/</span>
          <span class="current">Products</span>
        </nav>
      </div>

      <div class="header-actions">
        <button class="btn btn-light" @click="fetchAllData" :disabled="loading">
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>

        <button class="btn btn-primary add-btn" @click="openCreateModal">
          <span class="btn-icon">＋</span>
          Add Product
        </button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Visible Products</div>
        <div class="stat-value">{{ filteredProducts.length }}</div>
        <div class="stat-note">Products shown in current filter</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Low Stock</div>
        <div class="stat-value">{{ lowStockCount }}</div>
        <div class="stat-note">Products with stock below 20</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Inventory Units</div>
        <div class="stat-value">{{ totalStockUnits }}</div>
        <div class="stat-note">Total stock from visible products</div>
      </div>
    </div>

    <div v-if="error" class="alert-error">
      {{ error }}
    </div>

    <div class="toolbar-card">
      <div class="toolbar-grid">
        <div class="search-box toolbar-item toolbar-search">
          <span class="search-icon">⌕</span>
          <input
            v-model="search"
            type="text"
            placeholder="Search by name, code, SKU, supplier..."
          />
        </div>

        <div class="toolbar-item">
          <select v-model="categoryFilter" class="filter-select">
            <option value="">All categories</option>
            <option
              v-for="category in categoryOptions"
              :key="category.id"
              :value="String(category.id)"
            >
              {{ category.name }}
            </option>
          </select>
        </div>

        <div class="toolbar-item">
          <select v-model="supplierFilter" class="filter-select">
            <option value="">All suppliers</option>
            <option
              v-for="supplier in supplierOptions"
              :key="supplier.id"
              :value="String(supplier.id)"
            >
              {{ supplier.name }}
            </option>
          </select>
        </div>

        <div class="toolbar-item">
          <select v-model="itemTypeFilter" class="filter-select">
            <option value="">All item types</option>
            <option value="product">Product</option>
            <option value="menu">Menu</option>
            <option value="service">Service</option>
            <option value="sparepart">Sparepart</option>
          </select>
        </div>

        <div class="toolbar-item toolbar-reset">
          <button class="btn btn-light" @click="resetFilters">
            Reset
          </button>
        </div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <div>
          <h2>Product List</h2>
          <p>{{ filteredProducts.length }} product(s) found</p>
        </div>
      </div>

      <div class="table-wrapper desktop-table">
        <table class="product-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Code</th>
              <th>SKU</th>
              <th>Item Type</th>
              <th>Category</th>
              <th>Sell Price</th>
              <th>Supplier</th>
              <th>Stock</th>
              <th>Status</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!loading && filteredProducts.length === 0">
              <td colspan="11" class="empty-cell">
                No products found.
              </td>
            </tr>

            <tr v-for="product in filteredProducts" :key="product.id">
              <td>
                <span class="id-badge">#{{ product.id }}</span>
              </td>

              <td>
                <div class="product-main">
                  <div class="product-thumb-wrap">
                    <img
                      v-if="product.image_url"
                      :src="product.image_url"
                      :alt="product.name"
                      class="product-thumb"
                    />
                    <div v-else class="product-thumb product-thumb-placeholder">
                      {{ getInitials(product.name) }}
                    </div>
                  </div>

                  <div class="product-text">
                    <div class="product-name">{{ product.name }}</div>
                    <div class="product-sub">
                      {{ product.description || 'No description' }}
                    </div>
                  </div>
                </div>
              </td>

              <td>{{ product.code }}</td>
              <td>{{ product.sku || '-' }}</td>
              <td>{{ formatItemType(product.item_type) }}</td>
              <td>{{ product.category_name || '-' }}</td>
              <td class="price-cell">${{ formatMoney(product.sell_price) }}</td>
              <td class="supplier-cell">{{ product.supplier_name || '-' }}</td>
              <td>
                <span :class="['stock-badge', Number(product.stock) < 20 ? 'stock-low' : 'stock-ok']">
                  {{ displayNumber(product.stock) }}
                </span>
              </td>
              <td>
                <span :class="['status-badge', product.is_active ? 'status-active' : 'status-inactive']">
                  {{ product.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <td class="text-right">
                <div class="row-actions">
                  <button class="btn btn-sm btn-outline" @click="openViewModal(product)">
                    View
                  </button>
                  <button class="btn btn-sm btn-warning" @click="openEditModal(product)">
                    Edit
                  </button>
                  <button class="btn btn-sm btn-danger" @click="removeProduct(product.id)">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mobile-list">
        <div v-if="!loading && filteredProducts.length === 0" class="mobile-empty">
          No products found.
        </div>

        <div
          v-for="product in filteredProducts"
          :key="product.id"
          class="mobile-card"
        >
          <div class="mobile-card-top">
            <div class="product-main">
              <div class="product-thumb-wrap">
                <img
                  v-if="product.image_url"
                  :src="product.image_url"
                  :alt="product.name"
                  class="product-thumb"
                />
                <div v-else class="product-thumb product-thumb-placeholder">
                  {{ getInitials(product.name) }}
                </div>
              </div>

              <div class="product-text">
                <div class="product-name">{{ product.name }}</div>
                <div class="product-sub">{{ product.code }}</div>
              </div>
            </div>

            <span :class="['status-badge', product.is_active ? 'status-active' : 'status-inactive']">
              {{ product.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <div class="mobile-info-grid">
            <div class="info-item">
              <span class="label">SKU</span>
              <span class="value">{{ product.sku || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Type</span>
              <span class="value">{{ formatItemType(product.item_type) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Category</span>
              <span class="value">{{ product.category_name || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Supplier</span>
              <span class="value">{{ product.supplier_name || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Sell Price</span>
              <span class="value strong">${{ formatMoney(product.sell_price) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Stock</span>
              <span class="value">{{ displayNumber(product.stock) }}</span>
            </div>
            <div class="info-item full">
              <span class="label">Description</span>
              <span class="value">{{ product.description || '-' }}</span>
            </div>
          </div>

          <div class="mobile-actions">
            <button class="btn btn-sm btn-outline" @click="openViewModal(product)">
              View
            </button>
            <button class="btn btn-sm btn-warning" @click="openEditModal(product)">
              Edit
            </button>
            <button class="btn btn-sm btn-danger" @click="removeProduct(product.id)">
              Delete
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-box">
        Loading products...
      </div>
    </div>

    <transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card modal-xl">
          <div class="modal-header">
            <div>
              <h3>
                {{
                  modalMode === 'create'
                    ? 'Add Product'
                    : modalMode === 'edit'
                    ? 'Edit Product'
                    : 'Product Detail'
                }}
              </h3>
              <p>
                {{
                  modalMode === 'view'
                    ? 'View product information'
                    : 'Fill in product information below'
                }}
              </p>
            </div>

            <button class="modal-close" @click="closeModal">×</button>
          </div>

          <div class="modal-body">
            <form class="product-form" @submit.prevent="saveProduct">
              <div class="form-grid">
                <div class="form-group">
                  <label>Name <span>*</span></label>
                  <input
                    v-model="form.name"
                    type="text"
                    placeholder="Enter product name"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group">
                  <label>Code <span>*</span></label>
                  <input
                    v-model="form.code"
                    type="text"
                    placeholder="Enter barcode / code"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group">
                  <label>SKU</label>
                  <input
                    v-model="form.sku"
                    type="text"
                    placeholder="Enter SKU"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group">
                  <label>Item Type <span>*</span></label>
                  <select v-model="form.item_type" :disabled="modalMode === 'view'">
                    <option value="product">Product</option>
                    <option value="menu">Menu</option>
                    <option value="service">Service</option>
                    <option value="sparepart">Sparepart</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Category</label>
                  <select v-model="form.category_id" :disabled="modalMode === 'view'">
                    <option :value="null">Select category</option>
                    <option
                      v-for="category in categoryOptions"
                      :key="category.id"
                      :value="category.id"
                    >
                      {{ category.name }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Unit</label>
                  <select v-model="form.unit_id" :disabled="modalMode === 'view'">
                    <option :value="null">Select unit</option>
                    <option
                      v-for="unit in unitOptions"
                      :key="unit.id"
                      :value="unit.id"
                    >
                      {{ unit.name }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Supplier</label>
                  <select v-model="form.supplier_id" :disabled="modalMode === 'view'">
                    <option :value="null">Select supplier</option>
                    <option
                      v-for="supplier in supplierOptions"
                      :key="supplier.id"
                      :value="supplier.id"
                    >
                      {{ supplier.name }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Stock <span>*</span></label>
                  <input
                    v-model.number="form.stock"
                    type="number"
                    step="1"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group">
                  <label>Buy Price <span>*</span></label>
                  <input
                    v-model="form.buy_price"
                    type="number"
                    step="0.01"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group">
                  <label>Sell Price <span>*</span></label>
                  <input
                    v-model="form.sell_price"
                    type="number"
                    step="0.01"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group">
                  <label>Weight</label>
                  <input
                    v-model="form.weight"
                    type="number"
                    step="0.01"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group checkbox-row">
                  <label>Track Stock</label>
                  <div class="checkbox-wrap">
                    <input
                      v-model="form.track_stock"
                      type="checkbox"
                      :disabled="modalMode === 'view'"
                    />
                    <span>Enable stock tracking</span>
                  </div>
                </div>

                <div class="form-group checkbox-row">
                  <label>Is Active</label>
                  <div class="checkbox-wrap">
                    <input
                      v-model="form.is_active"
                      type="checkbox"
                      :disabled="modalMode === 'view'"
                    />
                    <span>Product is active</span>
                  </div>
                </div>

                <div class="form-group full">
                  <label>Description</label>
                  <textarea
                    v-model="form.description"
                    rows="5"
                    placeholder="Enter product description"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group full">
                  <label>Image URL</label>
                  <input
                    v-model="form.image"
                    type="text"
                    placeholder="Enter image URL"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group full" v-if="currentPreviewImage">
                  <label>Preview</label>
                  <div class="image-preview-wrap">
                    <img :src="currentPreviewImage" alt="Preview" class="image-preview" />
                  </div>
                </div>
              </div>

              <div v-if="modalMode !== 'view'" class="modal-footer">
                <button type="button" class="btn btn-light modal-btn" @click="closeModal">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary modal-btn" :disabled="saving">
                  {{
                    saving
                      ? (modalMode === 'create' ? 'Saving...' : 'Updating...')
                      : (modalMode === 'create' ? 'Save Product' : 'Update Product')
                  }}
                </button>
              </div>

              <div v-else class="modal-footer">
                <button type="button" class="btn btn-primary modal-btn" @click="closeModal">
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'

type ModalMode = 'create' | 'edit' | 'view'

type RelatedCategory = {
  id: number
  name: string
  icon?: string
  icon_url?: string
}

type RelatedSupplier = {
  id: number
  name: string
  contact_person?: string
  cell?: string
  email?: string
  address?: string
}

type RelatedUnit = {
  id: number
  name: string
}

type Product = {
  id: number
  name: string
  sku: string
  code: string
  item_type: string
  track_stock: boolean
  description: string
  stock: number
  buy_price: string
  sell_price: string
  weight: string
  is_active: boolean
  image: string
  image_url: string
  shop_id: number | null
  category: RelatedCategory | null
  supplier: RelatedSupplier | null
  unit: RelatedUnit | null
  category_id: number | null
  supplier_id: number | null
  unit_id: number | null
  category_name: string
  supplier_name: string
  unit_name: string
}

type LookupOption = {
  id: number
  name: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const search = ref('')
const categoryFilter = ref('')
const supplierFilter = ref('')
const itemTypeFilter = ref('')

const showModal = ref(false)
const modalMode = ref<ModalMode>('create')
const editingId = ref<number | null>(null)

const loading = ref(false)
const saving = ref(false)
const error = ref('')

const products = ref<Product[]>([])
const categoryOptions = ref<LookupOption[]>([])
const supplierOptions = ref<LookupOption[]>([])
const unitOptions = ref<LookupOption[]>([])

const form = reactive({
  id: 0,
  name: '',
  code: '',
  sku: '',
  item_type: 'product',
  description: '',
  stock: 0,
  track_stock: true,
  buy_price: '0.00',
  sell_price: '0.00',
  weight: '0.00',
  image: '',
  is_active: true,
  category_id: null as number | null,
  supplier_id: null as number | null,
  unit_id: null as number | null,
})

const filteredProducts = computed(() => {
  let result = [...products.value]
  const q = search.value.trim().toLowerCase()

  if (q) {
    result = result.filter((product) => {
      return (
        (product.name || '').toLowerCase().includes(q) ||
        (product.code || '').toLowerCase().includes(q) ||
        (product.sku || '').toLowerCase().includes(q) ||
        (product.supplier_name || '').toLowerCase().includes(q)
      )
    })
  }

  if (categoryFilter.value) {
    result = result.filter((product) => String(product.category_id || '') === categoryFilter.value)
  }

  if (supplierFilter.value) {
    result = result.filter((product) => String(product.supplier_id || '') === supplierFilter.value)
  }

  if (itemTypeFilter.value) {
    result = result.filter((product) => product.item_type === itemTypeFilter.value)
  }

  return result
})

const lowStockCount = computed(() => {
  return filteredProducts.value.filter((product) => Number(product.stock) < 20).length
})

const totalStockUnits = computed(() => {
  return filteredProducts.value.reduce((sum, product) => sum + Number(product.stock || 0), 0)
})

const currentPreviewImage = computed(() => {
  return form.image || ''
})

function getAuthHeaders() {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token')

  return token
    ? {
        Authorization: `Token ${token}`,
      }
    : {}
}

function normalizeLookupRows(payload: any): LookupOption[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.results)
      ? payload.results
      : []

  return rows.map((item: any) => ({
    id: Number(item?.id ?? 0),
    name: item?.name ?? '-',
  }))
}

function normalizeProduct(raw: any): Product {
  const category = raw?.category ?? null
  const supplier = raw?.supplier ?? null
  const unit = raw?.unit ?? null

  return {
    id: Number(raw?.id ?? 0),
    name: raw?.name ?? '',
    sku: raw?.sku ?? '',
    code: raw?.code ?? '',
    item_type: raw?.item_type ?? 'product',
    track_stock: Boolean(raw?.track_stock),
    description: raw?.description ?? '',
    stock: Number(raw?.stock ?? 0),
    buy_price: String(raw?.buy_price ?? '0.00'),
    sell_price: String(raw?.sell_price ?? '0.00'),
    weight: String(raw?.weight ?? '0.00'),
    is_active: Boolean(raw?.is_active),
    image: raw?.image ?? '',
    image_url: raw?.image_url ?? raw?.image ?? '',
    shop_id: raw?.shop_id ?? null,
    category,
    supplier,
    unit,
    category_id: category?.id ?? null,
    supplier_id: supplier?.id ?? null,
    unit_id: unit?.id ?? null,
    category_name: category?.name ?? '',
    supplier_name: supplier?.name ?? '',
    unit_name: unit?.name ?? '',
  }
}

async function fetchProducts() {
  const response = await axios.get(`${API_BASE_URL}/api/products/`, {
    headers: {
      ...getAuthHeaders(),
    },
  })

  const rows = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data?.results)
      ? response.data.results
      : []

  products.value = rows.map(normalizeProduct)
}

async function fetchCategories() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/categories/`, {
      headers: {
        ...getAuthHeaders(),
      },
    })
    categoryOptions.value = normalizeLookupRows(response.data)
  } catch (err) {
    console.error('Failed to fetch categories:', err)
    categoryOptions.value = []
  }
}

async function fetchSuppliers() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/suppliers/`, {
      headers: {
        ...getAuthHeaders(),
      },
    })
    supplierOptions.value = normalizeLookupRows(response.data)
  } catch (err) {
    console.error('Failed to fetch suppliers:', err)
    supplierOptions.value = []
  }
}

async function fetchUnits() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/units/`, {
      headers: {
        ...getAuthHeaders(),
      },
    })
    unitOptions.value = normalizeLookupRows(response.data)
  } catch (err) {
    console.error('Failed to fetch units:', err)
    unitOptions.value = []
  }
}

async function fetchAllData() {
  loading.value = true
  error.value = ''

  try {
    await Promise.all([
      fetchProducts(),
      fetchCategories(),
      fetchSuppliers(),
      fetchUnits(),
    ])
  } catch (err: any) {
    console.error('Failed to load products data:', err)
    error.value =
      err?.response?.data?.detail ||
      'Failed to load products data. Please check API and token.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.id = 0
  form.name = ''
  form.code = ''
  form.sku = ''
  form.item_type = 'product'
  form.description = ''
  form.stock = 0
  form.track_stock = true
  form.buy_price = '0.00'
  form.sell_price = '0.00'
  form.weight = '0.00'
  form.image = ''
  form.is_active = true
  form.category_id = null
  form.supplier_id = null
  form.unit_id = null
}

function fillForm(product: Product) {
  form.id = product.id
  form.name = product.name
  form.code = product.code
  form.sku = product.sku
  form.item_type = product.item_type || 'product'
  form.description = product.description
  form.stock = Number(product.stock || 0)
  form.track_stock = product.track_stock
  form.buy_price = String(product.buy_price ?? '0.00')
  form.sell_price = String(product.sell_price ?? '0.00')
  form.weight = String(product.weight ?? '0.00')
  form.image = product.image || product.image_url || ''
  form.is_active = product.is_active
  form.category_id = product.category_id
  form.supplier_id = product.supplier_id
  form.unit_id = product.unit_id
}

function openCreateModal() {
  modalMode.value = 'create'
  editingId.value = null
  resetForm()
  showModal.value = true
}

async function openEditModal(product: Product) {
  modalMode.value = 'edit'
  editingId.value = product.id
  fillForm(product)
  showModal.value = true

  try {
    const response = await axios.get(`${API_BASE_URL}/api/products/${product.id}/`, {
      headers: {
        ...getAuthHeaders(),
      },
    })
    fillForm(normalizeProduct(response.data))
  } catch (err) {
    console.error('Failed to retrieve product detail:', err)
  }
}

async function openViewModal(product: Product) {
  modalMode.value = 'view'
  editingId.value = product.id
  fillForm(product)
  showModal.value = true

  try {
    const response = await axios.get(`${API_BASE_URL}/api/products/${product.id}/`, {
      headers: {
        ...getAuthHeaders(),
      },
    })
    fillForm(normalizeProduct(response.data))
  } catch (err) {
    console.error('Failed to retrieve product detail:', err)
  }
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  resetForm()
}

function validateForm() {
  if (!form.name.trim()) {
    alert('Product name is required.')
    return false
  }

  if (!form.code.trim()) {
    alert('Product code is required.')
    return false
  }

  if (Number(form.stock) < 0) {
    alert('Stock cannot be negative.')
    return false
  }

  if (Number(form.buy_price) < 0 || Number(form.sell_price) < 0 || Number(form.weight) < 0) {
    alert('Numeric values cannot be negative.')
    return false
  }

  return true
}

function buildPayload() {
  return {
    name: form.name.trim(),
    sku: form.sku.trim() || null,
    code: form.code.trim(),
    item_type: form.item_type,
    track_stock: form.track_stock,
    description: form.description.trim(),
    stock: Number(form.stock) || 0,
    buy_price: String(form.buy_price || '0.00'),
    sell_price: String(form.sell_price || '0.00'),
    weight: String(form.weight || '0.00'),
    is_active: form.is_active,
    image: form.image.trim() || null,
    category_id: form.category_id,
    supplier_id: form.supplier_id,
    unit_id: form.unit_id,
  }
}

async function saveProduct() {
  if (!validateForm()) return

  saving.value = true

  try {
    const payload = buildPayload()

    if (modalMode.value === 'create') {
      await axios.post(`${API_BASE_URL}/api/products/`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      })
    } else if (modalMode.value === 'edit' && editingId.value !== null) {
      await axios.put(`${API_BASE_URL}/api/products/${editingId.value}/`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      })
    }

    closeModal()
    await fetchAllData()
  } catch (err: any) {
    console.error('Failed to save product:', err)
    alert(
      err?.response?.data?.detail ||
      JSON.stringify(err?.response?.data || {}) ||
      'Failed to save product.'
    )
  } finally {
    saving.value = false
  }
}

async function removeProduct(id: number) {
  const ok = window.confirm('Delete this product?')
  if (!ok) return

  try {
    await axios.delete(`${API_BASE_URL}/api/products/${id}/`, {
      headers: {
        ...getAuthHeaders(),
      },
    })

    await fetchAllData()
  } catch (err: any) {
    console.error('Failed to delete product:', err)
    alert(
      err?.response?.data?.detail ||
      'Failed to delete product.'
    )
  }
}

function resetFilters() {
  search.value = ''
  categoryFilter.value = ''
  supplierFilter.value = ''
  itemTypeFilter.value = ''
}

function formatMoney(value: string | number) {
  return Number(value || 0).toFixed(2)
}

function displayNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return '-'
  return value
}

function formatItemType(value: string) {
  switch (value) {
    case 'product':
      return 'Product'
    case 'menu':
      return 'Menu'
    case 'service':
      return 'Service'
    case 'sparepart':
      return 'Sparepart'
    default:
      return value || '-'
  }
}

function getInitials(name: string) {
  return (
    String(name || 'NA')
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'NA'
  )
}

onMounted(() => {
  fetchAllData()
})
</script>

<style scoped>
.products-page {
  padding: 24px;
  background: #f6f8fb;
  min-height: 100vh;
}

/* HEADER */

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  background: #ffffff;
  border-radius: 16px;
  padding: 22px;
  border: 1px solid #e5e7eb;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.page-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  flex: 1 1 420px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  line-height: 1.1;
}

.page-subtitle {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}

.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
  font-size: 13px;
  color: #94a3b8;
}

.breadcrumb .current {
  color: #22c55e;
  font-weight: 700;
}

.sep {
  opacity: 0.6;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* BUTTONS */

.btn {
  border-radius: 10px;
  padding: 10px 16px;
  border: none;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: #22c55e;
  color: #ffffff;
}

.btn-primary:hover {
  background: #16a34a;
}

.btn-light {
  background: #f1f5f9;
  color: #334155;
}

.btn-warning {
  background: #f59e0b;
  color: #ffffff;
}

.btn-danger {
  background: #ef4444;
  color: #ffffff;
}

.btn-outline {
  background: #ffffff;
  color: #1d4ed8;
  border: 1px solid #cbd5e1;
}

.btn-sm {
  height: 38px;
  padding: 0 14px;
  font-size: 13px;
  border-radius: 12px;
}

.btn-icon {
  font-size: 18px;
  line-height: 1;
}

/* STATS */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #ffffff;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
}

.stat-label {
  color: #64748b;
  font-size: 13px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 26px;
  font-weight: 800;
  color: #111827;
  margin-top: 6px;
  line-height: 1.1;
}

.stat-note {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 8px;
  line-height: 1.5;
}

/* ALERT */

.alert-error {
  margin-bottom: 20px;
  background: #fee2e2;
  color: #b91c1c;
  padding: 14px 16px;
  border-radius: 14px;
  font-weight: 600;
  border: 1px solid #fecaca;
}

/* TOOLBAR */

.toolbar-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 18px;
  margin-bottom: 20px;
}

.toolbar-grid {
  display: grid;
  grid-template-columns:
    minmax(240px, 1.8fr)
    minmax(170px, 1fr)
    minmax(170px, 1fr)
    minmax(170px, 1fr)
    auto;
  gap: 12px;
  align-items: center;
}

.toolbar-item {
  min-width: 0;
}

.toolbar-search {
  min-width: 0;
}

.toolbar-reset {
  display: flex;
}

.search-box {
  position: relative;
}

.search-box input {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  border: 1px solid #dbe3ef;
  background: #f9fbff;
  padding: 0 16px 0 44px;
  font-size: 14px;
  color: #111827;
  outline: none;
  transition: 0.2s ease;
}

.search-box input:focus,
.filter-select:focus,
.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: #3b82f6;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 15px;
}

.filter-select {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  border: 1px solid #dbe3ef;
  background: #ffffff;
  padding: 0 14px;
  font-size: 14px;
  color: #162033;
  outline: none;
  transition: 0.2s ease;
}

/* TABLE */

.table-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.table-header {
  padding: 18px;
  border-bottom: 1px solid #e5e7eb;
}

.table-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #111827;
}

.table-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.table-wrapper {
  overflow-x: auto;
}

.desktop-table {
  display: block;
}

.product-table {
  width: 100%;
  min-width: 1260px;
  border-collapse: collapse;
}

.product-table th,
.product-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
}

.product-table th {
  font-size: 13px;
  color: #334155;
  font-weight: 800;
  background: #f8fafc;
  white-space: nowrap;
}

.product-table td {
  color: #1f2937;
  font-size: 14px;
  font-weight: 500;
  background: #ffffff;
}

.product-table tbody tr:hover {
  background: #f8fbff;
}

.product-table tbody tr:hover td {
  background: #f8fbff;
}

/* FIX FADED TEXT */

.product-table td:nth-child(3),
.product-table td:nth-child(4),
.product-table td:nth-child(5),
.product-table td:nth-child(6),
.product-table td:nth-child(8) {
  color: #111827;
  font-weight: 600;
}

/* PRODUCT CELL */

.product-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.product-text {
  min-width: 0;
}

.product-thumb-wrap {
  flex-shrink: 0;
}

.product-thumb {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
  background: #e2e8f0;
  border: 1px solid #dbe3ef;
}

.product-thumb-placeholder {
  display: grid;
  place-items: center;
  background: #22c55e;
  color: #ffffff;
  font-weight: 700;
  font-size: 13px;
}

.product-name {
  font-weight: 700;
  color: #111827;
  line-height: 1.4;
}

.product-sub {
  font-size: 12px;
  color: #64748b;
  margin-top: 3px;
  line-height: 1.45;
}

.price-cell {
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
}

.supplier-cell {
  font-weight: 600;
  color: #334155;
}

.id-badge {
  background: #eef2ff;
  color: #4338ca;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
}

.stock-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.stock-ok {
  background: #dcfce7;
  color: #166534;
}

.stock-low {
  background: #fee2e2;
  color: #991b1b;
}

.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-inactive {
  background: #f1f5f9;
  color: #475569;
}

.row-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.text-right {
  text-align: right;
}

.empty-cell {
  text-align: center !important;
  padding: 30px !important;
  color: #64748b;
  font-weight: 600;
}

.loading-box {
  text-align: center;
  padding: 18px;
  color: #64748b;
  font-weight: 600;
}

/* MOBILE LIST */

.mobile-list {
  display: none;
}

.mobile-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  padding: 16px;
  margin: 14px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
}

.mobile-card-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.mobile-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #334155;
  min-width: 0;
}

.info-item .label {
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-item .value {
  word-break: break-word;
  line-height: 1.5;
  color: #111827;
}

.info-item .value.strong {
  font-weight: 800;
  color: #111827;
}

.info-item.full {
  grid-column: 1 / -1;
}

.mobile-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}

.mobile-actions .btn {
  width: 100%;
}

.mobile-empty {
  text-align: center;
  color: #94a3b8;
  padding: 24px 0;
}

/* MODAL */

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-card {
  width: 100%;
  max-width: 760px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.24);
  overflow: hidden;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

.modal-xl {
  max-width: 1080px;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #eef2f7;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 22px;
  color: #162033;
}

.modal-header p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

.modal-close {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  background: #f3f6fb;
  color: #475569;
  font-size: 24px;
  cursor: pointer;
  flex-shrink: 0;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.product-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

.form-group label span {
  color: #dc2626;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  background: #fbfcff;
  padding: 12px 14px;
  font-size: 14px;
  color: #162033;
  outline: none;
  transition: 0.2s ease;
  resize: vertical;
}

.checkbox-row {
  justify-content: end;
}

.checkbox-wrap {
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 2px;
  color: #334155;
  font-size: 14px;
  flex-wrap: wrap;
}

.image-preview-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.image-preview {
  width: 120px;
  height: 120px;
  border-radius: 18px;
  object-fit: cover;
  border: 1px solid #dbe3ef;
  background: #fff;
}

.modal-footer {
  border-top: 1px solid #e5e7eb;
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.modal-btn {
  min-width: 110px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* RESPONSIVE */

@media (max-width: 1300px) {
  .toolbar-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .toolbar-reset .btn {
    width: 100%;
  }
}

@media (max-width: 1024px) {
  .products-page {
    padding: 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .checkbox-row {
    justify-content: start;
  }
}

@media (max-width: 768px) {
  .products-page {
    padding: 16px;
  }

  .page-header {
    align-items: stretch;
    padding: 18px;
  }

  .page-title-wrap {
    flex: 1 1 100%;
  }

  .page-title {
    font-size: 24px;
  }

  .page-subtitle {
    font-size: 13px;
  }

  .header-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
  }

  .desktop-table {
    display: none;
  }

  .mobile-list {
    display: block;
    padding: 0 0 14px;
  }

  .toolbar-grid,
  .mobile-info-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-item,
  .toolbar-reset,
  .toolbar-reset .btn {
    width: 100%;
  }

  .table-card,
  .toolbar-card,
  .stat-card {
    border-radius: 18px;
  }

  .modal-card,
  .modal-xl {
    max-width: 100%;
    border-radius: 20px;
    max-height: calc(100vh - 24px);
  }

  .modal-body,
  .modal-header {
    padding: 18px;
  }

  .mobile-actions {
    grid-template-columns: 1fr;
  }

  .mobile-actions .btn {
    height: 40px;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-btn {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 480px) {
  .products-page {
    padding: 12px;
  }

  .page-title {
    font-size: 22px;
  }

  .breadcrumb {
    font-size: 12px;
    gap: 6px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-value {
    font-size: 22px;
  }

  .toolbar-card {
    padding: 14px;
  }

  .table-header h2 {
    font-size: 18px;
  }

  .mobile-card {
    padding: 14px;
    border-radius: 16px;
    margin: 12px;
  }

  .product-thumb {
    width: 42px;
    height: 42px;
    border-radius: 12px;
  }

  .modal-overlay {
    padding: 12px;
  }

  .modal-header h3 {
    font-size: 18px;
  }

  .modal-close {
    width: 36px;
    height: 36px;
    font-size: 22px;
  }
}
</style>