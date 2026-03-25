<template>
    <div class="admin-layout">
      <aside class="sidebar">
        <h2 class="logo">ValdKerPOS</h2>
  
        <nav class="menu">

            <div class="menu-group">

            <p class="menu-title">MAIN</p>

            <RouterLink to="/dashboard">
            Dashboard
            </RouterLink>

            </div>


            <div class="menu-group">

            <p class="menu-title">SALES</p>

            <RouterLink to="/orders">
            Orders
            </RouterLink>

            <RouterLink to="/product-returns">
            Product Returns
            </RouterLink>

            <RouterLink to="/shifts">
            Shifts
            </RouterLink>

            </div>


            <div class="menu-group">

            <p class="menu-title">INVENTORY</p>

            <RouterLink to="/products">
            Products
            </RouterLink>

            <RouterLink to="/categories">
            Categories
            </RouterLink>

            <RouterLink to="/units">
            Units
            </RouterLink>

            <RouterLink to="/purchases">
            Purchases
            </RouterLink>

            <RouterLink to="/inventory-counts">
            Inventory Counts
            </RouterLink>

            <RouterLink to="/stock-adjustments">
            Stock Adjustments
            </RouterLink>

            <RouterLink to="/stock-movements">
            Stock Movements
            </RouterLink>

            </div>


            <div class="menu-group">

            <p class="menu-title">PEOPLE</p>

            <RouterLink to="/customers">
            Customers
            </RouterLink>

            <RouterLink to="/suppliers">
            Suppliers
            </RouterLink>

            <RouterLink to="/users">
            Users
            </RouterLink>

            </div>


            <div class="menu-group">

            <p class="menu-title">FINANCE</p>

            <RouterLink to="/expenses">
            Expenses
            </RouterLink>

            </div>


            <div class="menu-group">

            <p class="menu-title">REPORTS</p>

            <RouterLink to="/sales-report">
            Sales Report
            </RouterLink>

            <RouterLink to="/expense-report">
            Expense Report
            </RouterLink>

            <RouterLink to="/sales-chart">
            Sales Chart
            </RouterLink>

            <RouterLink to="/expense-chart">
            Expense Chart
            </RouterLink>

            </div>

            </nav>
      </aside>
  
      <main class="main-content">
        <header class="topbar">
          <h1>Admin Panel</h1>
        </header>
  
        <section class="page-content">
          <router-view />
        </section>
      </main>
    </div>
  </template>
  
  <style scoped>
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background: #f5f7fb;
    color: #111827;
  }
  
  .sidebar {
    width: 250px;
    background: #111827;
    color: #fff;
    padding: 24px 16px;
  }
  
  .logo {
    margin: 0 0 24px;
    font-size: 22px;
    font-weight: 700;
  }
  
  .menu {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .menu a {
    color: #d1d5db;
    text-decoration: none;
    padding: 10px 12px;
    border-radius: 8px;
    transition: 0.2s ease;
  }
  
  .menu a:hover {
    background: #1f2937;
    color: #fff;
  }
  
  .menu a.router-link-active {
    background: #2563eb;
    color: #fff;
  }

  .menu-group{
margin-bottom:25px;
}

.menu-title{
font-size:11px;
font-weight:600;
color:#9ca3af;
margin-bottom:10px;
letter-spacing:1px;
}

.menu a{
display:block;
color:#d1d5db;
padding:9px 12px;
border-radius:8px;
text-decoration:none;
margin-bottom:4px;
}

.menu a:hover{
background:#1f2937;
color:white;
}

.menu a.router-link-active{
background:#2563eb;
color:white;
}
  
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .topbar {
    background: #fff;
    padding: 18px 24px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .topbar h1 {
    margin: 0;
    font-size: 20px;
  }
  
  .page-content {
    padding: 24px;
  }
  </style>