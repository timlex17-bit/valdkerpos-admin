<template>
    <div class="admin-layout">
      <aside class="sidebar">
        <h2 class="logo">ValdKerPOS</h2>
  
        <nav class="menu">
          <RouterLink to="/dashboard">Dashboard</RouterLink>
          <RouterLink to="/products">Products</RouterLink>
          <RouterLink to="/orders">Orders</RouterLink>
          <RouterLink to="/customers">Customers</RouterLink>
          <RouterLink to="/reports">Reports</RouterLink>
          <RouterLink to="/settings">Settings</RouterLink>
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