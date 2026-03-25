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

      <button class="btn btn-primary add-btn" @click="openCreateModal">
        <span class="btn-icon">＋</span>
        Add Product
      </button>
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
              v-for="category in uniqueCategories"
              :key="category"
              :value="category"
            >
              {{ category }}
            </option>
          </select>
        </div>

        <div class="toolbar-item">
          <select v-model="supplierFilter" class="filter-select">
            <option value="">All suppliers</option>
            <option
              v-for="supplier in uniqueSuppliers"
              :key="supplier"
              :value="supplier"
            >
              {{ supplier }}
            </option>
          </select>
        </div>

        <div class="toolbar-item">
          <select v-model="itemTypeFilter" class="filter-select">
            <option value="">All item types</option>
            <option value="Product">Product</option>
            <option value="Service">Service</option>
            <option value="Part">Part</option>
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
            <tr v-if="filteredProducts.length === 0">
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
                      v-if="product.product_image"
                      :src="product.product_image"
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
              <td>{{ product.item_type }}</td>
              <td>{{ product.category || '-' }}</td>
              <td class="price-cell">${{ formatMoney(product.sell_price) }}</td>
              <td class="supplier-cell">{{ product.supplier || '-' }}</td>
              <td>
                <span :class="['stock-badge', product.stock < 20 ? 'stock-low' : 'stock-ok']">
                  {{ product.stock }}
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
        <div v-if="filteredProducts.length === 0" class="mobile-empty">
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
                  v-if="product.product_image"
                  :src="product.product_image"
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
              <span class="value">{{ product.item_type }}</span>
            </div>
            <div class="info-item">
              <span class="label">Category</span>
              <span class="value">{{ product.category || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Supplier</span>
              <span class="value">{{ product.supplier || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Sell Price</span>
              <span class="value strong">${{ formatMoney(product.sell_price) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Stock</span>
              <span class="value">{{ product.stock }}</span>
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
                    <option value="Product">Product</option>
                    <option value="Service">Service</option>
                    <option value="Part">Part</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Category</label>
                  <input
                    v-model="form.category"
                    type="text"
                    placeholder="Enter category"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group">
                  <label>Unit</label>
                  <input
                    v-model="form.unit"
                    type="text"
                    placeholder="Enter unit"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group">
                  <label>Supplier</label>
                  <input
                    v-model="form.supplier"
                    type="text"
                    placeholder="Enter supplier"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group">
                  <label>Stock <span>*</span></label>
                  <input
                    v-model.number="form.stock"
                    type="number"
                    min="0"
                    step="1"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group">
                  <label>Buy Price <span>*</span></label>
                  <input
                    v-model.number="form.buy_price"
                    type="number"
                    min="0"
                    step="0.01"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group">
                  <label>Sell Price <span>*</span></label>
                  <input
                    v-model.number="form.sell_price"
                    type="number"
                    min="0"
                    step="0.01"
                    :disabled="modalMode === 'view'"
                  />
                </div>

                <div class="form-group">
                  <label>Weight <span>*</span></label>
                  <input
                    v-model.number="form.weight"
                    type="number"
                    min="0"
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
                  <label>Product Image</label>
                  <div class="image-upload-box">
                    <input
                      ref="fileInputRef"
                      type="file"
                      accept="image/*"
                      :disabled="modalMode === 'view'"
                      @change="onImageChange"
                    />

                    <div v-if="form.product_image" class="image-preview-wrap">
                      <img :src="form.product_image" alt="Preview" class="image-preview" />
                      <button
                        v-if="modalMode !== 'view'"
                        type="button"
                        class="btn btn-danger btn-sm"
                        @click="removeImage"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="modalMode !== 'view'" class="modal-footer">
                <button type="button" class="btn btn-light modal-btn" @click="closeModal">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary modal-btn">
                  {{ modalMode === 'create' ? 'Save Product' : 'Update Product' }}
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
import { computed, reactive, ref } from 'vue'

type ItemType = 'Product' | 'Service' | 'Part'
type ModalMode = 'create' | 'edit' | 'view'

type Product = {
  id: number
  name: string
  code: string
  sku: string
  item_type: ItemType
  category: string
  description: string
  stock: number
  track_stock: boolean
  buy_price: number
  sell_price: number
  weight: number
  unit: string
  supplier: string
  product_image: string
  is_active: boolean
}

const search = ref('')
const categoryFilter = ref('')
const supplierFilter = ref('')
const itemTypeFilter = ref('')

const showModal = ref(false)
const modalMode = ref<ModalMode>('create')
const editingId = ref<number | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const products = ref<Product[]>([
  {
    id: 8,
    name: 'Busy',
    code: '9354104000031',
    sku: '',
    item_type: 'Product',
    category: 'Drink',
    description: 'Cold drink item.',
    stock: 500,
    track_stock: true,
    buy_price: 1.5,
    sell_price: 2.5,
    weight: 0.3,
    unit: 'Bottle',
    supplier: 'Wellys Unipessoal',
    product_image: '',
    is_active: true,
  },
  {
    id: 7,
    name: 'Service Oli',
    code: '123',
    sku: '123',
    item_type: 'Service',
    category: 'Workshop',
    description: 'Oil service package.',
    stock: 1000,
    track_stock: false,
    buy_price: 2.5,
    sell_price: 3.5,
    weight: 0.35,
    unit: 'Service',
    supplier: 'Rymond Unipessoal',
    product_image: '',
    is_active: true,
  },
  {
    id: 6,
    name: 'Ice Cream',
    code: '63737378373',
    sku: '',
    item_type: 'Product',
    category: 'Frozen',
    description: 'Sweet frozen snack.',
    stock: 100,
    track_stock: true,
    buy_price: 0.65,
    sell_price: 1.0,
    weight: 0.2,
    unit: 'Cup',
    supplier: 'Leader Unipessoal',
    product_image: '',
    is_active: true,
  },
  {
    id: 5,
    name: 'Oli Yamaha Lube',
    code: '6937467600037',
    sku: '6937467600037',
    item_type: 'Part',
    category: 'Workshop',
    description: 'Engine oil product.',
    stock: 500,
    track_stock: true,
    buy_price: 4.25,
    sell_price: 5.5,
    weight: 1,
    unit: 'Bottle',
    supplier: 'Wellys Unipessoal',
    product_image: '',
    is_active: true,
  },
])

const form = reactive<Product>({
  id: 0,
  name: '',
  code: '',
  sku: '',
  item_type: 'Product',
  category: '',
  description: '',
  stock: 0,
  track_stock: true,
  buy_price: 0,
  sell_price: 0,
  weight: 0,
  unit: '',
  supplier: '',
  product_image: '',
  is_active: true,
})

const uniqueCategories = computed(() => {
  return [...new Set(products.value.map((p) => p.category).filter(Boolean))]
})

const uniqueSuppliers = computed(() => {
  return [...new Set(products.value.map((p) => p.supplier).filter(Boolean))]
})

const filteredProducts = computed(() => {
  let result = [...products.value]
  const q = search.value.trim().toLowerCase()

  if (q) {
    result = result.filter((product) => {
      return (
        product.name.toLowerCase().includes(q) ||
        product.code.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        product.supplier.toLowerCase().includes(q)
      )
    })
  }

  if (categoryFilter.value) {
    result = result.filter((product) => product.category === categoryFilter.value)
  }

  if (supplierFilter.value) {
    result = result.filter((product) => product.supplier === supplierFilter.value)
  }

  if (itemTypeFilter.value) {
    result = result.filter((product) => product.item_type === itemTypeFilter.value)
  }

  return result
})

const lowStockCount = computed(() => {
  return filteredProducts.value.filter((product) => product.stock < 20).length
})

const totalStockUnits = computed(() => {
  return filteredProducts.value.reduce((sum, product) => sum + Number(product.stock || 0), 0)
})

function resetForm() {
  form.id = 0
  form.name = ''
  form.code = ''
  form.sku = ''
  form.item_type = 'Product'
  form.category = ''
  form.description = ''
  form.stock = 0
  form.track_stock = true
  form.buy_price = 0
  form.sell_price = 0
  form.weight = 0
  form.unit = ''
  form.supplier = ''
  form.product_image = ''
  form.is_active = true

  if (fileInputRef.value) fileInputRef.value.value = ''
}

function fillForm(product: Product) {
  form.id = product.id
  form.name = product.name
  form.code = product.code
  form.sku = product.sku
  form.item_type = product.item_type
  form.category = product.category
  form.description = product.description
  form.stock = product.stock
  form.track_stock = product.track_stock
  form.buy_price = product.buy_price
  form.sell_price = product.sell_price
  form.weight = product.weight
  form.unit = product.unit
  form.supplier = product.supplier
  form.product_image = product.product_image
  form.is_active = product.is_active

  if (fileInputRef.value) fileInputRef.value.value = ''
}

function openCreateModal() {
  modalMode.value = 'create'
  editingId.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(product: Product) {
  modalMode.value = 'edit'
  editingId.value = product.id
  fillForm(product)
  showModal.value = true
}

function openViewModal(product: Product) {
  modalMode.value = 'view'
  editingId.value = product.id
  fillForm(product)
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  resetForm()
}

function saveProduct() {
  if (!form.name.trim()) {
    alert('Product name is required.')
    return
  }

  if (!form.code.trim()) {
    alert('Product code is required.')
    return
  }

  if (form.buy_price < 0 || form.sell_price < 0 || form.stock < 0 || form.weight < 0) {
    alert('Numeric values cannot be negative.')
    return
  }

  const payload: Product = {
    id: editingId.value ?? 0,
    name: form.name.trim(),
    code: form.code.trim(),
    sku: form.sku.trim(),
    item_type: form.item_type,
    category: form.category.trim(),
    description: form.description.trim(),
    stock: Number(form.stock) || 0,
    track_stock: form.track_stock,
    buy_price: Number(form.buy_price) || 0,
    sell_price: Number(form.sell_price) || 0,
    weight: Number(form.weight) || 0,
    unit: form.unit.trim(),
    supplier: form.supplier.trim(),
    product_image: form.product_image,
    is_active: form.is_active,
  }

  if (modalMode.value === 'create') {
    const nextId =
      products.value.length > 0
        ? Math.max(...products.value.map((product) => product.id)) + 1
        : 1

    products.value.unshift({
      ...payload,
      id: nextId,
    })
  } else if (modalMode.value === 'edit' && editingId.value !== null) {
    const index = products.value.findIndex((product) => product.id === editingId.value)
    if (index !== -1) {
      products.value[index] = {
        ...payload,
        id: editingId.value,
      }
    }
  }

  closeModal()
}

function removeProduct(id: number) {
  const ok = window.confirm('Delete this product?')
  if (!ok) return
  products.value = products.value.filter((product) => product.id !== id)
}

function resetFilters() {
  search.value = ''
  categoryFilter.value = ''
  supplierFilter.value = ''
  itemTypeFilter.value = ''
}

function onImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    form.product_image = String(reader.result || '')
  }
  reader.readAsDataURL(file)
}

function removeImage() {
  form.product_image = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function formatMoney(value: number) {
  return Number(value || 0).toFixed(2)
}

function getInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'NA'
  )
}
</script>

<style scoped>
.products-page {
  padding: 24px;
  background: #f5f7fb;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
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
  font-size: 32px;
  font-weight: 800;
  color: #162033;
  line-height: 1.1;
}

.page-subtitle {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}

.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: #7b8496;
  font-size: 14px;
}

.breadcrumb .current {
  color: #1f6feb;
  font-weight: 600;
}

.sep {
  opacity: 0.6;
}

.add-btn {
  flex-shrink: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card,
.toolbar-card,
.table-card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  border: 1px solid #eef1f6;
}

.stat-card {
  padding: 20px;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.stat-value {
  font-size: clamp(24px, 3vw, 28px);
  font-weight: 800;
  color: #172033;
  line-height: 1.1;
  word-break: break-word;
}

.stat-note {
  margin-top: 8px;
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
}

.toolbar-card {
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
  outline: none;
  transition: 0.2s ease;
}

.search-box input:focus,
.filter-select:focus,
.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: #3b82f6;
  background: #fff;
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
  background: #f9fbff;
  padding: 0 14px;
  font-size: 14px;
  color: #162033;
  outline: none;
  transition: 0.2s ease;
}

.table-card {
  padding: 18px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.table-header h2 {
  margin: 0;
  font-size: 20px;
  color: #162033;
}

.table-header p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.table-wrapper {
  overflow-x: auto;
}

.product-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1260px;
}

.product-table th,
.product-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #edf2f7;
  vertical-align: middle;
}

.product-table th {
  font-size: 13px;
  color: #64748b;
  font-weight: 700;
  background: #fbfcfe;
  white-space: nowrap;
}

.product-table tbody tr:hover {
  background: #fafcff;
}

.id-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: #eef4ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
}

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
  width: 48px;
  height: 48px;
  border-radius: 14px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.product-thumb-placeholder {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #2563eb, #60a5fa);
  color: white;
  font-size: 13px;
  font-weight: 800;
}

.product-name {
  font-weight: 700;
  color: #162033;
  line-height: 1.4;
  word-break: break-word;
}

.product-sub {
  margin-top: 3px;
  font-size: 12px;
  color: #7c8798;
  max-width: 260px;
  line-height: 1.45;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.price-cell {
  font-weight: 800;
  color: #162033;
  white-space: nowrap;
}

.supplier-cell {
  word-break: break-word;
}

.stock-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.stock-ok {
  background: #ecfdf3;
  color: #16a34a;
}

.stock-low {
  background: #fff7ed;
  color: #c2410c;
}

.status-active {
  background: #eff6ff;
  color: #2563eb;
}

.status-inactive {
  background: #f1f5f9;
  color: #475569;
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.text-right {
  text-align: right;
}

.empty-cell {
  text-align: center !important;
  color: #94a3b8;
  padding: 32px !important;
}

.mobile-list {
  display: none;
}

.mobile-card {
  border: 1px solid #edf2f7;
  border-radius: 18px;
  padding: 16px;
  background: #fff;
  margin-bottom: 14px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.mobile-card:last-child {
  margin-bottom: 0;
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
}

.info-item .value.strong {
  font-weight: 800;
  color: #162033;
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

.btn {
  border: none;
  outline: none;
  cursor: pointer;
  transition: 0.2s ease;
  border-radius: 14px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #16a34a, #22c55e);
  color: #fff;
  height: 48px;
  padding: 0 18px;
  box-shadow: 0 10px 20px rgba(34, 197, 94, 0.18);
}

.btn-primary:hover {
  transform: translateY(-1px);
}

.btn-light {
  background: #eef2f7;
  color: #334155;
  height: 48px;
  padding: 0 16px;
}

.btn-outline {
  background: #fff;
  color: #2563eb;
  border: 1px solid #cfe0ff;
}

.btn-warning {
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
}

.btn-danger {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.btn-sm {
  height: 38px;
  padding: 0 12px;
  font-size: 13px;
  border-radius: 12px;
}

.btn-icon {
  font-size: 18px;
  line-height: 1;
}

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
  background: #fff;
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

.image-upload-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.modal-btn {
  min-width: 150px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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
  }

  .page-title-wrap {
    flex: 1 1 100%;
  }

  .page-title {
    font-size: 26px;
  }

  .page-subtitle {
    font-size: 13px;
  }

  .add-btn {
    width: 100%;
  }

  .desktop-table {
    display: none;
  }

  .mobile-list {
    display: block;
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

  .table-card {
    padding: 14px;
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