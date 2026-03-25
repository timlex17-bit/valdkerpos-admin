<template>
    <div class="page">
      <!-- Header -->
      <section class="page-header">
        <div class="page-header__left">
          <div>
            <h1 class="page-title">Import Master Data</h1>
            <p class="page-subtitle">
              Migrate categories, units, products, customers, suppliers, and opening stock from your old POS system.
            </p>
          </div>
  
          <div class="breadcrumb">
            <span>Home</span>
            <span>›</span>
            <span>System Tools</span>
            <span>›</span>
            <span class="active">Import Master Data</span>
          </div>
        </div>
  
        <div class="page-header__actions">
          <button class="btn btn-light" @click="downloadTemplate">
            Download template
          </button>
          <button class="btn btn-success" @click="openUploadDialog">
            Upload file
          </button>
        </div>
      </section>
  
      <!-- Summary Cards -->
      <section class="stats-grid">
        <article class="stat-card primary">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3v12" />
              <path d="M8 11l4 4 4-4" />
              <path d="M4 21h16" />
            </svg>
          </div>
          <div>
            <p class="stat-label">Template Format</p>
            <h3 class="stat-value">Excel Workbook</h3>
            <p class="stat-meta">One file with multiple sheets</p>
          </div>
        </article>
  
        <article class="stat-card success">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4" />
              <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
            </svg>
          </div>
          <div>
            <p class="stat-label">Valid Rows</p>
            <h3 class="stat-value">{{ validationSummary.validRows }}</h3>
            <p class="stat-meta">Ready to import</p>
          </div>
        </article>
  
        <article class="stat-card warning">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </div>
          <div>
            <p class="stat-label">Invalid Rows</p>
            <h3 class="stat-value">{{ validationSummary.invalidRows }}</h3>
            <p class="stat-meta">Require correction before import</p>
          </div>
        </article>
  
        <article class="stat-card info">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18" />
              <path d="M8 17v-6" />
              <path d="M12 17V7" />
              <path d="M16 17v-3" />
            </svg>
          </div>
          <div>
            <p class="stat-label">Total Rows</p>
            <h3 class="stat-value">{{ validationSummary.totalRows }}</h3>
            <p class="stat-meta">Detected from uploaded workbook</p>
          </div>
        </article>
      </section>
  
      <!-- Stepper -->
      <section class="stepper-card">
        <div class="stepper">
          <div class="step-item" :class="{ active: currentStep >= 1 }">
            <div class="step-number">1</div>
            <div class="step-text">
              <strong>Download Template</strong>
              <span>Get standard Excel file</span>
            </div>
          </div>
  
          <div class="step-line"></div>
  
          <div class="step-item" :class="{ active: currentStep >= 2 }">
            <div class="step-number">2</div>
            <div class="step-text">
              <strong>Upload File</strong>
              <span>Select completed workbook</span>
            </div>
          </div>
  
          <div class="step-line"></div>
  
          <div class="step-item" :class="{ active: currentStep >= 3 }">
            <div class="step-number">3</div>
            <div class="step-text">
              <strong>Validation Preview</strong>
              <span>Review summary and errors</span>
            </div>
          </div>
  
          <div class="step-line"></div>
  
          <div class="step-item" :class="{ active: currentStep >= 4 }">
            <div class="step-number">4</div>
            <div class="step-text">
              <strong>Confirm Import</strong>
              <span>Start migration to ValdKerPOS</span>
            </div>
          </div>
        </div>
      </section>
  
      <section class="content-grid">
        <!-- Left -->
        <div class="main-column">
          <!-- Step 1 -->
          <article class="panel-card">
            <div class="card-header">
              <div>
                <h2>Step 1 — Download standard template</h2>
                <p>Use the provided Excel format to avoid import structure errors.</p>
              </div>
            </div>
  
            <div class="card-body">
              <div class="template-box">
                <div class="template-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </div>
  
                <div class="template-content">
                  <h3>ValdKerPOS Master Import Template.xlsx</h3>
                  <p>
                    Recommended sheets:
                    <strong>Categories, Units, Products, Customers, Suppliers, OpeningStock</strong>
                  </p>
  
                  <div class="sheet-tags">
                    <span class="sheet-tag">Categories</span>
                    <span class="sheet-tag">Units</span>
                    <span class="sheet-tag">Products</span>
                    <span class="sheet-tag">Customers</span>
                    <span class="sheet-tag">Suppliers</span>
                    <span class="sheet-tag">OpeningStock</span>
                  </div>
  
                  <button class="btn btn-success" @click="downloadTemplate">
                    Download standard Excel template
                  </button>
                </div>
              </div>
            </div>
          </article>
  
          <!-- Step 2 -->
          <article class="panel-card">
            <div class="card-header">
              <div>
                <h2>Step 2 — Upload completed file</h2>
                <p>Drag and drop your Excel workbook or choose it manually.</p>
              </div>
            </div>
  
            <div class="card-body">
              <div class="upload-zone" @click="openUploadDialog">
                <div class="upload-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="M7 10l5-5 5 5" />
                    <path d="M12 15V5" />
                  </svg>
                </div>
  
                <h3>Drop Excel file here</h3>
                <p>Supported format: .xlsx</p>
  
                <div class="upload-actions">
                  <button class="btn btn-light" @click.stop="openUploadDialog">
                    Choose file
                  </button>
                  <button class="btn btn-primary" @click.stop="mockValidateUpload">
                    Validate preview
                  </button>
                </div>
  
                <div v-if="uploadedFileName" class="uploaded-file">
                  Uploaded file: <strong>{{ uploadedFileName }}</strong>
                </div>
              </div>
            </div>
          </article>
  
          <!-- Step 3 -->
          <article class="panel-card">
            <div class="card-header">
              <div>
                <h2>Step 3 — Validation preview</h2>
                <p>Review data quality before starting import.</p>
              </div>
            </div>
  
            <div class="card-body">
              <div class="preview-summary-grid">
                <div class="preview-card">
                  <span class="preview-label">Total rows</span>
                  <strong>{{ validationSummary.totalRows }}</strong>
                </div>
                <div class="preview-card success">
                  <span class="preview-label">Valid rows</span>
                  <strong>{{ validationSummary.validRows }}</strong>
                </div>
                <div class="preview-card danger">
                  <span class="preview-label">Invalid rows</span>
                  <strong>{{ validationSummary.invalidRows }}</strong>
                </div>
              </div>
  
              <div class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Sheet</th>
                      <th>Field</th>
                      <th>Error Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="validationErrors.length === 0">
                      <td colspan="4" class="empty-cell">No validation errors.</td>
                    </tr>
                    <tr v-for="error in validationErrors" :key="error.id">
                      <td>{{ error.row }}</td>
                      <td>
                        <span class="sheet-badge">{{ error.sheet }}</span>
                      </td>
                      <td>{{ error.field }}</td>
                      <td class="danger-text">{{ error.message }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </article>
  
          <!-- Step 4 -->
          <article class="panel-card">
            <div class="card-header">
              <div>
                <h2>Step 4 — Confirm import</h2>
                <p>Start importing valid data into your shop database.</p>
              </div>
            </div>
  
            <div class="card-body">
              <div class="confirm-box">
                <div class="confirm-info">
                  <h3>Ready to import</h3>
                  <p>
                    Imported data can include categories, units, products, customers, suppliers,
                    and opening stock from your old POS file.
                  </p>
  
                  <ul class="confirm-list">
                    <li>Only validated rows should be imported</li>
                    <li>Invalid rows should be corrected first</li>
                    <li>Recommended to make a backup before import</li>
                  </ul>
                </div>
  
                <div class="confirm-actions">
                  <button class="btn btn-light" @click="resetImportState">Reset</button>
                  <button class="btn btn-success" @click="startImport">Import now</button>
                </div>
              </div>
            </div>
          </article>
        </div>
  
        <!-- Right -->
        <aside class="side-column">
          <article class="panel-card side-panel">
            <div class="card-header">
              <div>
                <h2>Import tips</h2>
                <p>Best practice before migrating your old master data.</p>
              </div>
            </div>
  
            <div class="tips-list">
              <div class="tip-item">
                <strong>1. Use template only</strong>
                <p>Do not rename sheet names or column headers.</p>
              </div>
  
              <div class="tip-item">
                <strong>2. Clean old data</strong>
                <p>Remove duplicate products, wrong SKU, and incomplete customer names.</p>
              </div>
  
              <div class="tip-item">
                <strong>3. Validate first</strong>
                <p>Always review invalid rows before pressing Import now.</p>
              </div>
  
              <div class="tip-item">
                <strong>4. Backup first</strong>
                <p>Create a backup before importing large master data files.</p>
              </div>
            </div>
          </article>
  
          <article class="panel-card side-panel">
            <div class="card-header">
              <div>
                <h2>Sheets overview</h2>
                <p>Expected structure in the workbook.</p>
              </div>
            </div>
  
            <div class="sheet-overview">
              <div class="sheet-row">
                <span>Categories</span>
                <small>Category name, description</small>
              </div>
              <div class="sheet-row">
                <span>Units</span>
                <small>Unit name, short code</small>
              </div>
              <div class="sheet-row">
                <span>Products</span>
                <small>Name, SKU, barcode, price, stock</small>
              </div>
              <div class="sheet-row">
                <span>Customers</span>
                <small>Name, phone, email, address</small>
              </div>
              <div class="sheet-row">
                <span>Suppliers</span>
                <small>Name, phone, email, address</small>
              </div>
              <div class="sheet-row">
                <span>OpeningStock</span>
                <small>Product, quantity, warehouse</small>
              </div>
            </div>
          </article>
        </aside>
      </section>
  
      <!-- Toast -->
      <transition name="fade">
        <div v-if="flashMessage" class="flash-message">
          {{ flashMessage }}
        </div>
      </transition>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  
  type ValidationError = {
    id: number
    row: number
    sheet: string
    field: string
    message: string
  }
  
  const currentStep = ref(1)
  const uploadedFileName = ref('')
  const flashMessage = ref('')
  
  const validationSummary = ref({
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
  })
  
  const validationErrors = ref<ValidationError[]>([])
  
  function downloadTemplate() {
    currentStep.value = Math.max(currentStep.value, 1)
    showFlash('Template download started.')
  }
  
  function openUploadDialog() {
    currentStep.value = Math.max(currentStep.value, 2)
    uploadedFileName.value = 'valdker_master_import_template_filled.xlsx'
    showFlash('Mock file selected.')
  }
  
  function mockValidateUpload() {
    currentStep.value = 3
    uploadedFileName.value = uploadedFileName.value || 'valdker_master_import_template_filled.xlsx'
  
    validationSummary.value = {
      totalRows: 248,
      validRows: 236,
      invalidRows: 12,
    }
  
    validationErrors.value = [
      {
        id: 1,
        row: 14,
        sheet: 'Products',
        field: 'SKU',
        message: 'SKU is required.',
      },
      {
        id: 2,
        row: 27,
        sheet: 'Products',
        field: 'Selling Price',
        message: 'Selling price must be greater than 0.',
      },
      {
        id: 3,
        row: 9,
        sheet: 'Customers',
        field: 'Name',
        message: 'Customer name cannot be empty.',
      },
      {
        id: 4,
        row: 18,
        sheet: 'Suppliers',
        field: 'Phone',
        message: 'Phone format is invalid.',
      },
      {
        id: 5,
        row: 31,
        sheet: 'OpeningStock',
        field: 'Quantity',
        message: 'Quantity must be a numeric value.',
      },
    ]
  
    showFlash('Validation preview generated.')
  }
  
  function startImport() {
    if (!uploadedFileName.value) {
      showFlash('Please upload file first.')
      return
    }
  
    currentStep.value = 4
    showFlash(`Import started. ${validationSummary.value.validRows} valid rows will be processed.`)
  }
  
  function resetImportState() {
    currentStep.value = 1
    uploadedFileName.value = ''
    validationSummary.value = {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
    }
    validationErrors.value = []
    showFlash('Import state reset.')
  }
  
  function showFlash(message: string) {
    flashMessage.value = message
    setTimeout(() => {
      flashMessage.value = ''
    }, 2200)
  }
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
    display: flex;
    gap: 14px;
    align-items: flex-start;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  }
  
  .stat-card.primary {
    border-top: 4px solid #2563eb;
  }
  
  .stat-card.success {
    border-top: 4px solid #16a34a;
  }
  
  .stat-card.warning {
    border-top: 4px solid #f59e0b;
  }
  
  .stat-card.info {
    border-top: 4px solid #0ea5e9;
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
  
  .stat-card.primary .stat-icon {
    background: #eff6ff;
    color: #2563eb;
  }
  
  .stat-card.warning .stat-icon {
    background: #fffbeb;
    color: #f59e0b;
  }
  
  .stat-card.info .stat-icon {
    background: #ecfeff;
    color: #0891b2;
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
  
  .stepper-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
    margin-bottom: 22px;
  }
  
  .stepper {
    display: flex;
    align-items: center;
    gap: 12px;
    overflow-x: auto;
  }
  
  .step-item {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 220px;
    opacity: 0.5;
  }
  
  .step-item.active {
    opacity: 1;
  }
  
  .step-number {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #e5e7eb;
    color: #111827;
    font-weight: 800;
    flex-shrink: 0;
  }
  
  .step-item.active .step-number {
    background: linear-gradient(90deg, #60e66c, #059814);
    color: #fff;
  }
  
  .step-text {
    display: flex;
    flex-direction: column;
  }
  
  .step-text strong {
    color: #111827;
    font-size: 0.95rem;
  }
  
  .step-text span {
    color: #64748b;
    font-size: 0.84rem;
  }
  
  .step-line {
    width: 42px;
    height: 2px;
    background: #d1d5db;
    flex-shrink: 0;
  }
  
  .content-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 18px;
  }
  
  .main-column,
  .side-column {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  
  .panel-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
    overflow: hidden;
  }
  
  .card-header {
    padding: 22px 22px 18px;
    border-bottom: 1px solid #eef2f7;
  }
  
  .card-header h2 {
    margin: 0;
    font-size: 1.2rem;
    color: #111827;
  }
  
  .card-header p {
    margin: 6px 0 0;
    color: #6b7280;
  }
  
  .card-body {
    padding: 22px;
  }
  
  .template-box {
    display: flex;
    gap: 18px;
    align-items: flex-start;
    padding: 20px;
    border-radius: 18px;
    background: linear-gradient(135deg, #f0fdf4, #f8fafc);
    border: 1px solid #dcfce7;
  }
  
  .template-icon,
  .upload-icon {
    width: 64px;
    height: 64px;
    border-radius: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    color: #059814;
    box-shadow: 0 10px 18px rgba(15, 23, 42, 0.06);
    flex-shrink: 0;
  }
  
  .template-icon svg,
  .upload-icon svg {
    width: 28px;
    height: 28px;
  }
  
  .template-content h3 {
    margin: 0 0 8px;
    color: #111827;
  }
  
  .template-content p {
    margin: 0 0 14px;
    color: #6b7280;
    line-height: 1.6;
  }
  
  .sheet-tags {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  
  .sheet-tag,
  .sheet-badge {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    background: rgba(22, 163, 74, 0.12);
    color: #166534;
    font-size: 0.82rem;
    font-weight: 700;
  }
  
  .upload-zone {
    border: 2px dashed #cbd5e1;
    border-radius: 20px;
    padding: 30px 24px;
    background: #fcfdff;
    text-align: center;
    cursor: pointer;
    transition: 0.2s ease;
  }
  
  .upload-zone:hover {
    border-color: #16a34a;
    background: #f9fffb;
  }
  
  .upload-zone h3 {
    margin: 14px 0 8px;
    color: #111827;
  }
  
  .upload-zone p {
    margin: 0 0 16px;
    color: #64748b;
  }
  
  .upload-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .uploaded-file {
    margin-top: 16px;
    color: #166534;
    font-weight: 700;
  }
  
  .preview-summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 18px;
  }
  
  .preview-card {
    padding: 18px;
    border-radius: 18px;
    border: 1px solid #e5e7eb;
    background: #f8fafc;
  }
  
  .preview-card.success {
    background: #f0fdf4;
    border-color: #dcfce7;
  }
  
  .preview-card.danger {
    background: #fff1f2;
    border-color: #fecdd3;
  }
  
  .preview-label {
    display: block;
    color: #64748b;
    font-size: 0.88rem;
    font-weight: 700;
    margin-bottom: 6px;
  }
  
  .preview-card strong {
    font-size: 1.25rem;
    color: #111827;
  }
  
  .table-wrap {
    width: 100%;
    overflow-x: auto;
  }
  
  .data-table {
    width: 100%;
    min-width: 760px;
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
  }
  
  .data-table tbody tr:hover {
    background: #f9fbff;
  }
  
  .empty-cell {
    text-align: center;
    color: #6b7280;
    padding: 30px !important;
  }
  
  .danger-text {
    color: #b91c1c;
    font-weight: 600;
  }
  
  .confirm-box {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    padding: 20px;
    border-radius: 18px;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    flex-wrap: wrap;
  }
  
  .confirm-info h3 {
    margin: 0 0 8px;
    color: #111827;
  }
  
  .confirm-info p {
    margin: 0 0 12px;
    color: #6b7280;
    line-height: 1.6;
  }
  
  .confirm-list {
    margin: 0;
    padding-left: 18px;
    color: #374151;
    line-height: 1.8;
  }
  
  .confirm-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .side-panel {
    height: fit-content;
  }
  
  .tips-list,
  .sheet-overview {
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  
  .tip-item,
  .sheet-row {
    padding: 16px;
    border-radius: 16px;
    border: 1px solid #e5e7eb;
    background: #f8fafc;
  }
  
  .tip-item strong,
  .sheet-row span {
    display: block;
    color: #111827;
    margin-bottom: 6px;
  }
  
  .tip-item p,
  .sheet-row small {
    color: #6b7280;
    line-height: 1.6;
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
  
  .btn-light {
    background: #f3f4f6;
    color: #111827;
  }
  
  .btn-light:hover {
    background: #e5e7eb;
  }
  
  .btn-primary {
    background: #1677ff;
    color: #fff;
  }
  
  .btn-primary:hover {
    background: #0f67ea;
  }
  
  .btn-success {
    background: linear-gradient(90deg, #60e66c, #059814);
    color: #fff;
  }
  
  .btn-success:hover {
    filter: brightness(0.97);
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
  
    .preview-summary-grid,
    .stats-grid {
      grid-template-columns: 1fr;
    }
  
    .template-box,
    .confirm-box {
      flex-direction: column;
    }
  
    .page-header__actions,
    .upload-actions,
    .confirm-actions {
      width: 100%;
    }
  
    .btn {
      width: 100%;
    }
  
    .stepper {
      align-items: flex-start;
    }
  }
  </style>