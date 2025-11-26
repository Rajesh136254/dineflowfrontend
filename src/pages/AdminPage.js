
import React, { useState, useEffect, useCallback, useRef } from 'react';

function AdminPage() {
  // ── State ───────────────────────────────────────
  const [activeTab, setActiveTab] = useState('menu');
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [tableGroups, setTableGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  
  // Modals
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState(null);
  const [selectedTableNum, setSelectedTableNum] = useState(null);
  const [selectedTableOrders, setSelectedTableOrders] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    message: '',
    onConfirm: () => {},
  });
  
  // Category inline
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Form data
  const [currentMenuItem, setCurrentMenuItem] = useState({});
  const [currentTable, setCurrentTable] = useState({ group_id: null });
  const [currentGroup, setCurrentGroup] = useState({ name: '' });
  const [menuImagePreview, setMenuImagePreview] = useState(null);
  const [menuImageFile, setMenuImageFile] = useState(null);
  
  // Loading & Filters
  const [isMenuLoading, setIsMenuLoading] = useState(false);
  const [isTablesLoading, setIsTablesLoading] = useState(false);
  const [isGroupsLoading, setIsGroupsLoading] = useState(false);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Refs
  const qrRefs = useRef({});
  const BASE_URL = window.location.origin;
  const API_URL = process.env.REACT_APP_API_URL || '';
  
  // ── Helpers ─────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };
  
  const openConfirm = (message, onYes) => {
    setConfirmModal({ show: true, message, onConfirm: onYes });
  };
  
  const getTableCounts = useCallback((tableNumber) => {
    const tableOrders = orders.filter(o => o.table_number == tableNumber);
    return {
      pending: tableOrders.filter(o => o.order_status === 'pending').length,
      preparing: tableOrders.filter(o => o.order_status === 'preparing').length,
      ready: tableOrders.filter(o => o.order_status === 'ready').length,
      delivered: tableOrders.filter(o => o.order_status === 'delivered').length,
    };
  }, [orders]);
  
  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus, updated_at: new Date().toISOString() } : o));
        showToast('Status updated!');
      } else {
        showToast(json.message || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Update failed', 'error');
    }
  }, [API_URL]);
  
  const getGroupName = (groupId, groupName) => groupName || 'Non AC';
  
  // ── Load QRCode lib ─────────────────────────────
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);
  
  // ── Load data ───────────────────────────────────
  useEffect(() => {
    loadMenu();
    loadTables();
    loadCategories();
    loadTableGroups();
  }, []);
  
  useEffect(() => {
    if (activeTab === 'tables') loadOrders();
  }, [activeTab]);
  
  // ── Generate QR ───────────────────────────
  const generateQRCode = (tableId, tableNumber) => {
    if (typeof window.QRCode === 'undefined') return;
    
    const el = qrRefs.current[tableId];
    if (el) {
      // Clear previous QR code if exists
      el.innerHTML = '';
      
      new window.QRCode(el, {
        text: `${BASE_URL}/customer.html?table=${tableNumber}`,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.H
      });
    }
  };
  
  // ── API Calls ───────────────────────────────────
  const loadMenu = useCallback(async () => {
    setIsMenuLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/menu`);
      const json = await res.json();
      if (json.success) setMenuItems(json.data || []);
    } catch (err) {
      showToast('Failed to load menu', 'error');
    } finally {
      setIsMenuLoading(false);
    }
  }, [API_URL]);
  
  const loadTables = useCallback(async () => {
    setIsTablesLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/tables`);
      const json = await res.json();
      if (res.ok) {
        if (json.success) {
          setTables(json.data || []);
          console.log('Tables loaded:', json.data);
        } else {
          showToast(json.message || 'Failed to load tables', 'error');
        }
      } else {
        showToast(`Server error: ${res.status}`, 'error');
        console.error('Server response:', json);
      }
    } catch (err) {
      console.error('Error loading tables:', err);
      showToast('Network error while loading tables', 'error');
    } finally {
      setIsTablesLoading(false);
    }
  }, [API_URL]);
  
  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCategories(json.data.filter(c => c && c.trim() !== ''));
      }
    } catch {
      setCategories(['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Salad']);
    }
  }, [API_URL]);
  
  const loadOrders = useCallback(async () => {
    setIsOrdersLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders`);
      const json = await res.json();
      if (json.success) setOrders(json.data || []);
    } catch (err) {
      showToast('Failed to load orders', 'error');
    } finally {
      setIsOrdersLoading(false);
    }
  }, [API_URL]);
  
  const loadTableGroups = useCallback(async () => {
    setIsGroupsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/table-groups`);
      const json = await res.json();
      if (json.success) {
        const uniqueGroups = json.data.filter((g, index, self) => index === self.findIndex(g2 => g2.id === g.id));
        setTableGroups(uniqueGroups || []);
        console.log('Table groups loaded:', uniqueGroups);
      } else {
        showToast(json.message || 'Failed to load groups', 'error');
      }
    } catch (err) {
      console.error('Error loading table groups:', err);
      showToast('Failed to load groups', 'error');
      setTableGroups([]);
    } finally {
      setIsGroupsLoading(false);
    }
  }, [API_URL]);
  
  // ── Add Category ────────────────────────────
  const addNewCategory = async () => {
    const name = newCategoryName.trim();
    if (!name || categories.includes(name)) {
      showToast(name ? 'Category exists' : 'Enter name', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (json.success) {
        setCategories(prev => [...prev, name]);
        setNewCategoryName('');
        setShowNewCategoryInput(false);
        showToast(`"${name}" added!`, 'success');
      } else {
        showToast(json.message || 'Failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };
  
  // ── Group Submit ───────────────────────────
  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    if (!name) return showToast('Enter group name', 'error');
    try {
      const url = currentGroup.id ? `${API_URL}/api/table-groups/${currentGroup.id}` : `${API_URL}/api/table-groups`;
      const res = await fetch(url, {
        method: currentGroup.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (json.success) {
        closeGroupModal();
        loadTableGroups();
        loadTables();
        showToast(currentGroup.id ? 'Updated!' : 'Added!', 'success');
      } else {
        showToast(json.message || 'Failed', 'error');
      }
    } catch {
      showToast('Save failed', 'error');
    }
  };
  
  // ── Delete Group ───────────────────────────
  const deleteGroup = (id) => {
    openConfirm('Delete group? Tables in this group will be set to Non AC.', async () => {
      try {
        const res = await fetch(`${API_URL}/api/table-groups/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          loadTableGroups();
          loadTables();
          showToast('Deleted', 'success');
        } else {
          showToast(json.message || 'Failed', 'error');
        }
      } catch {
        showToast('Delete failed', 'error');
      }
      setConfirmModal({ show: false });
    });
  };
  
  // ── Handlers ───────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMenuImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setMenuImagePreview(reader.result);
    reader.readAsDataURL(file);
  };
  
  // ── Submit Handlers ─────────────────────────────
  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const id = f.get('id');
    const category = f.get('category');
    let image_url = currentMenuItem.image_url || null;
    if (menuImageFile) {
      image_url = await new Promise((res) => {
        const r = new FileReader();
        r.onloadend = () => res(r.result);
        r.readAsDataURL(menuImageFile);
      });
    }
    const payload = {
      name: f.get('name'),
      description: f.get('description'),
      price_inr: parseFloat(f.get('price_inr')),
      price_usd: parseFloat(f.get('price_usd')),
      category,
      is_available: f.get('is_available') === 'on',
      image_url,
    };
    try {
      const url = id ? `${API_URL}/api/menu/${id}` : `${API_URL}/api/menu`;
      const res = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        closeMenuModal();
        loadMenu();
        loadCategories();
        showToast(id ? 'Updated!' : 'Added!', 'success');
      } else {
        showToast(json.message || 'Failed', 'error');
      }
    } catch {
      showToast('Save failed', 'error');
    }
  };
  
  const handleTableSubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const id = f.get('id');
    const num = parseInt(f.get('table_number'), 10);
    const groupId = f.get('group_id') ? parseInt(f.get('group_id'), 10) : null;
    const payload = {
      table_number: num,
      table_name: f.get('table_name') || null,
      group_id: groupId,
    };
    
    try {
      const url = id ? `${API_URL}/api/tables/${id}` : `${API_URL}/api/tables`;
      const res = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const json = await res.json();
      
      if (res.ok) {
        if (json.success) {
          closeTableModal();
          loadTables();
          showToast(id ? 'Updated' : 'Added', 'success');
          if (!id) {
            // Set to selected table for QR and show modal after a short delay
            setTimeout(() => {
              const newTable = { ...payload, id: json.data.id, table_number: num };
              setSelectedTableForQR(newTable);
              setIsQRModalOpen(true);
            }, 300);
          }
        } else {
          showToast(json.message || 'Failed', 'error');
        }
      } else {
        showToast(json.message || `Server error: ${res.status}`, 'error');
        console.error('Server response:', json);
      }
    } catch (err) {
      console.error('Error submitting table:', err);
      showToast('Network error', 'error');
    }
  };
  
  // ── DELETE ─────────
  const deleteMenuItem = (id) => {
    openConfirm('Delete item?', async () => {
      try {
        const res = await fetch(`${API_URL}/api/menu/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          setMenuItems(prev => prev.filter(item => item.id !== id));
          showToast('Deleted!', 'success');
          loadCategories();
        } else {
          showToast(json.message || 'Cannot delete', 'error');
        }
      } catch (err) {
        showToast('Delete failed', 'error');
      }
      setConfirmModal({ show: false });
    });
  };
  
  const deleteTable = (id) => {
    openConfirm('Delete table & QR?', async () => {
      try {
        const res = await fetch(`${API_URL}/api/tables/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          loadTables();
          loadOrders();
          showToast('Deleted', 'success');
        }
      } catch {
        showToast('Error', 'error');
      }
    });
  };
  
  // ── Modals ─────────────────────────────
  const showAddMenuModal = () => {
    setCurrentMenuItem({});
    setMenuImagePreview(null);
    setMenuImageFile(null);
    setShowNewCategoryInput(false);
    setNewCategoryName('');
    setIsMenuModalOpen(true);
  };
  
  const editMenuItem = (item) => {
    setCurrentMenuItem(item);
    setMenuImagePreview(item.image_url || null);
    setMenuImageFile(null);
    setShowNewCategoryInput(false);
    setNewCategoryName('');
    setIsMenuModalOpen(true);
  };
  
  const closeMenuModal = () => setIsMenuModalOpen(false);
  const closeTableModal = () => setIsTableModalOpen(false);
  
  const showAddTableModal = () => { 
    setCurrentTable({ group_id: null }); 
    setIsTableModalOpen(true); 
  };
  
  const editTable = (t) => { 
    setCurrentTable(t); 
    setIsTableModalOpen(true); 
  };
  
  const showAddGroupModal = () => {
    setCurrentGroup({ name: '' });
    setIsGroupModalOpen(true);
  };
  
  const editGroup = (g) => {
    setCurrentGroup(g);
    setIsGroupModalOpen(true);
  };
  
  const closeGroupModal = () => {
    setIsGroupModalOpen(false);
    setCurrentGroup({ name: '' });
  };
  
  const showQRModal = (t) => { 
    setSelectedTableForQR(t); 
    setIsQRModalOpen(true); 
    
    // Generate QR code after modal opens
    setTimeout(() => {
      generateQRCode(t.id, t.table_number);
    }, 100);
  };
  
  const closeQRModal = () => {
    setIsQRModalOpen(false);
    setSelectedTableForQR(null);
  };
  
  const showOrdersForTable = (t) => {
    const tableOrders = orders.filter(o => o.table_number === t.table_number);
    setSelectedTableOrders(tableOrders);
    setSelectedTableNum(t.table_number);
    setShowOrdersModal(true);
  };
  
  const closeOrdersModal = () => {
    setShowOrdersModal(false);
    setSelectedTableOrders([]);
    setSelectedTableNum(null);
  };
  
  // ── Print QR ─────────────────────────────
  const printQR = (id) => {
    const el = document.getElementById(`qr-modal-${id}`) || document.getElementById(`qr-${id}`);
    if (!el?.parentElement) return showToast('QR not found', 'error');
    
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (!printWindow) {
        // If popup is blocked, use an alternative method
        const printContent = document.createElement('div');
        printContent.id = 'print-content';
        printContent.innerHTML = `
          <div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f9fafb;">
            <div style="background:white;padding:40px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,.1);text-align:center;">
              <h2 style="margin-bottom:20px;color:#333;">Table QR Code</h2>
              <div>${el.parentElement.innerHTML}</div>
              <p style="margin-top:20px;color:#666;font-size:14px;">Scan this QR code to place an order</p>
            </div>
          </div>
        `;
        printContent.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:white;z-index:9999';
        document.body.appendChild(printContent);
        window.print();
        setTimeout(() => document.body.removeChild(printContent), 1000);
        showToast('Printed (popup blocked)', 'info');
        return;
      }
      
      // Write content to new window
      printWindow.document.write(`
        <html>
          <head>
            <title>QR - Table ${id}</title>
            <style>
              body {
                display:flex;
                justify-content:center;
                align-items:center;
                height:100vh;
                background:#f9fafb;
                font-family:Arial, sans-serif;
                margin:0;
                padding:20px;
                box-sizing:border-box;
              }
              .box {
                background:white;
                padding:40px;
                border-radius:12px;
                box-shadow:0 10px 25px rgba(0,0,0,.1);
                text-align:center;
              }
              h2 {
                margin-top:0;
                margin-bottom:20px;
                color:#333;
              }
              p {
                margin-top:20px;
                color:#666;
                font-size:14px;
              }
              .qr-container {
                display:inline-block;
                border:1px solid #e5e7eb;
                border-radius:8px;
                padding:10px;
                background:white;
              }
              @media print {
                body { background:white; }
                .box { box-shadow:none; }
              }
            </style>
          </head>
          <body>
            <div class="box">
              <h2>Table QR Code</h2>
              <div class="qr-container">${el.parentElement.innerHTML}</div>
              <p>Scan this QR code to place an order</p>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load before printing
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
      
      showToast('QR sent to printer', 'success');
    } catch (err) {
      console.error('Print error:', err);
      showToast('Print failed', 'error');
    }
  };
  
  // ── Filters ───────────────────────────────────
  const filtered = menuItems.filter((i) => {
    const s = searchTerm.toLowerCase();
    const nameOk = i.name.toLowerCase().includes(s);
    const descOk = i.description?.toLowerCase().includes(s);
    const catOk = !selectedCategory || i.category === selectedCategory;
    return (nameOk || descOk) && catOk;
  });
  
  const filteredTables = tables.filter((t) => {
    if (selectedGroupFilter === 'all') return true;
    if (selectedGroupFilter === 'non_ac') return !t.group_id;
    return t.group_id == selectedGroupFilter;
  });
  
  const getCategoryColor = (c) => {
    const map = {
      Appetizer: 'bg-yellow-100 text-yellow-800',
      'Main Course': 'bg-blue-100 text-blue-800',
      Dessert: 'bg-pink-100 text-pink-800',
      Beverage: 'bg-purple-100 text-purple-800',
      Salad: 'bg-green-100 text-green-800',
    };
    return map[c] || 'bg-gray-100 text-gray-800';
  };
  
  // ── Render ─────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        @keyframes fade {
          from { opacity:0; transform:translateY(10px); }
          to { opacity:1; transform:none; }
        }
        
        .fade {
          animation:fade .3s ease-out;
        }
        
        .card {
          transition:all .3s;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .card:hover {
          transform:translateY(-5px);
          box-shadow:0 10px 20px rgba(0,0,0,.1);
        }
        
        .btn {
          transition:all .2s;
          cursor:pointer;
          border-radius: 8px;
          font-weight: 500;
        }
        
        .btn:hover {
          transform:scale(1.02);
        }
        
        .toast {
          position:fixed;
          bottom:20px;
          right:20px;
          padding:16px 24px;
          background:white;
          border-radius:8px;
          box-shadow:0 4px 12px rgba(0,0,0,.15);
          display:flex;
          align-items:center;
          z-index:1000;
          transform:translateX(400px);
          transition:transform .3s;
          color:#333;
          max-width: 300px;
        }
        
        .toast.show {
          transform:translateX(0);
        }
        
        .toast.success {
          border-left:4px solid #10b981;
        }
        
        .toast.error {
          border-left:4px solid #ef4444;
          background:#fef2f2;
          color:#991b1b;
        }
        
        .toast.info {
          border-left:4px solid #3b82f6;
        }
        
        .loader {
          border:4px solid #f3f3f3;
          border-top:4px solid #9333ea;
          border-radius:50%;
          width:40px;
          height:40px;
          animation:spin 1s linear infinite;
          margin:20px auto;
        }
        
        @keyframes spin {
          to { transform:rotate(360deg); }
        }
        
        .gradient-bg {
          background:linear-gradient(135deg,#667eea,#764ba2);
        }
        
        .cat-badge {
          padding:4px 8px;
          border-radius:4px;
          font-size:.75rem;
          font-weight:600;
        }
        
        .status-badge {
          padding:2px 6px;
          border-radius:4px;
          font-size:.7rem;
          font-weight:500;
          text-transform:uppercase;
        }
        
        .status-pending {
          background-color:#fef3c7;
          color:#92400e;
        }
        
        .status-preparing {
          background-color:#dbeafe;
          color:#1e40af;
        }
        
        .status-ready {
          background-color:#d1fae5;
          color:#065f46;
        }
        
        .status-delivered {
          background-color:#f3f4f6;
          color:#374151;
        }
        
        .qr-container {
          border:1px solid #e5e7eb;
          border-radius:8px;
          padding:8px;
          background:white;
          margin:0 auto;
          display:block;
          width: fit-content;
        }
        
        .group-badge {
          padding:6px 12px;
          border-radius:8px;
          font-size:.8rem;
          font-weight:600;
          background:#f3f4f6;
          color:#374151;
          cursor:pointer;
          transition:all .2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin: 0 8px 8px 0;
        }
        
        .group-badge:hover {
          background:#e5e7eb;
        }
        
        .group-badge.active {
          background:#6366f1;
          color:white;
        }
        
        .group-edit, .group-delete {
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .group-edit:hover {
          background-color: rgba(59, 130, 246, 0.1);
        }
        
        .group-delete:hover {
          background-color: rgba(239, 68, 68, 0.1);
        }
        
        .filter-select {
          padding:4px 8px;
          border:1px solid #d1d5db;
          border-radius:4px;
        }
        
        @media print {
          body * { visibility:hidden; }
          #print-content, #print-content * { visibility:visible; }
          #print-content { position:absolute; left:0; top:0; }
        }
        
        .modal-overlay {
          background-color: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }
        
        .modal-content {
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .input-field {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 10px 12px;
          transition: border-color 0.2s;
        }
        
        .input-field:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        .btn-primary {
          background-color: #6366f1;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #5558e3;
        }
        
        .btn-secondary {
          background-color: #f3f4f6;
          color: #374151;
        }
        
        .btn-secondary:hover {
          background-color: #e5e7eb;
        }
        
        .btn-danger {
          background-color: #ef4444;
          color: white;
        }
        
        .btn-danger:hover {
          background-color: #dc2626;
        }
      `}</style>
      
      <div className="min-h-screen bg-gray-50">
        <header className="gradient-bg text-white p-6 shadow-lg">
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-purple-200 mt-1">Manage Menu & Tables</p>
          </div>
        </header>
        
        <div className="container mx-auto px-4 mt-6">
          <div className="flex border-b">
            <button 
              onClick={() => setActiveTab('menu')} 
              className={`px-6 py-3 font-semibold ${activeTab === 'menu' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600'}`}
            >
              Menu
            </button>
            <button 
              onClick={() => setActiveTab('tables')} 
              className={`px-6 py-3 font-semibold ${activeTab === 'tables' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600'}`}
            >
              Tables
            </button>
          </div>
          
          {/* MENU TAB */}
          {activeTab === 'menu' && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Menu Items</h2>
                <button 
                  onClick={showAddMenuModal} 
                  className="btn btn-primary px-4 py-2"
                >
                  Add Item
                </button>
              </div>
              
              <div className="flex gap-4 mb-6">
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="input-field flex-1" 
                />
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)} 
                  className="input-field"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              
              {isMenuLoading ? (
                <div className="loader"></div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No items found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden card">
                      {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover" />}
                      <div className="p-5">
                        <h3 className="font-bold text-lg">{item.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{item.description || 'No description'}</p>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-xl font-bold text-purple-600">₹{item.price_inr}</span>
                          <span className={`cat-badge ${getCategoryColor(item.category)}`}>{item.category}</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button 
                            onClick={() => editMenuItem(item)} 
                            className="btn btn-primary flex-1 py-2 text-sm"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteMenuItem(item.id)} 
                            className="btn btn-danger flex-1 py-2 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* TABLES TAB */}
          {activeTab === 'tables' && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Tables</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={showAddGroupModal} 
                    className="btn bg-orange-600 hover:bg-orange-700 text-white px-4 py-2"
                  >
                    Add Group
                  </button>
                  <button 
                    onClick={showAddTableModal} 
                    className="btn btn-primary px-4 py-2"
                  >
                    Add Table
                  </button>
                </div>
              </div>
              
              {/* Groups List with Filter Buttons */}
              {isGroupsLoading ? (
                <div className="loader"></div>
              ) : (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Filter by Group</h3>
                  <div className="flex flex-wrap">
                    <button 
                      className={`group-badge ${selectedGroupFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedGroupFilter('all')}
                    >
                      All Tables
                    </button>
                    <button 
                      className={`group-badge ${selectedGroupFilter === 'non_ac' ? 'active' : ''}`}
                      onClick={() => setSelectedGroupFilter('non_ac')}
                    >
                      Non AC
                    </button>
                    {tableGroups.filter(g => g.name !== 'Non AC').map((g) => (
                      <button 
                        key={g.id} 
                        className={`group-badge ${selectedGroupFilter == g.id ? 'active' : ''}`}
                        onClick={() => setSelectedGroupFilter(g.id.toString())}
                      >
                        {g.name}
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            editGroup(g);
                          }} 
                          className="group-edit" 
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </span>
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteGroup(g.id);
                          }} 
                          className="group-delete" 
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {(isTablesLoading || isOrdersLoading) ? (
                <div className="loader"></div>
              ) : filteredTables.length === 0 ? (
                <p className="text-center text-gray-500 py-12">
                  No tables in {selectedGroupFilter === 'all' ? '' : selectedGroupFilter === 'non_ac' ? 'Non AC' : tableGroups.find(g => g.id == selectedGroupFilter)?.name}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredTables.map((t) => {
                    const counts = getTableCounts(t.table_number);
                    const activeCount = counts.pending + counts.preparing + counts.ready;
                    const groupName = getGroupName(t.group_id, t.group_name);
                    
                    return (
                      <div key={t.id} className="bg-white rounded-lg shadow p-6 text-center card">
                        <h3 className="font-bold text-xl">{t.table_name || `Table ${t.table_number}`}</h3>
                        <span className="group-badge block mb-2">{groupName}</span>
                        
                        <div className="flex justify-around mt-2 mb-4 text-xs">
                          <span className="status-badge status-pending">P: {counts.pending}</span>
                          <span className="status-badge status-preparing">Prep: {counts.preparing}</span>
                          <span className="status-badge status-ready">R: {counts.ready}</span>
                          <span className="status-badge status-delivered">D: {counts.delivered}</span>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <button 
                            onClick={() => editTable(t)} 
                            className="btn btn-primary flex-1 py-2 text-sm"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => showQRModal(t)} 
                            className="btn bg-indigo-600 hover:bg-indigo-700 text-white flex-1 py-2 text-sm"
                          >
                            QR
                          </button>
                          <button 
                            onClick={() => deleteTable(t.id)} 
                            className="btn btn-danger flex-1 py-2 text-sm"
                          >
                            Del
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => showOrdersForTable(t)} 
                          className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm disabled:opacity-50"
                          disabled={activeCount === 0}
                        >
                          Show Orders ({activeCount})
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* MENU MODAL */}
        {isMenuModalOpen && (
          <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4" onClick={closeMenuModal}>
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">{currentMenuItem.id ? 'Edit' : 'Add'} Item</h3>
              <form onSubmit={handleMenuSubmit}>
                <input type="hidden" name="id" value={currentMenuItem.id || ''} />
                {menuImagePreview && <img src={menuImagePreview} alt="prev" className="w-full h-48 object-cover rounded mb-3" />}
                <input type="file" accept="image/*" onChange={handleImageChange} className="w-full mb-3" />
                <input name="name" defaultValue={currentMenuItem.name} placeholder="Name" required className="input-field w-full mb-3" />
                <textarea name="description" defaultValue={currentMenuItem.description} placeholder="Description" className="input-field w-full mb-3" rows="2" />
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input name="price_inr" type="number" step="0.01" defaultValue={currentMenuItem.price_inr} placeholder="INR" required className="input-field" />
                  <input name="price_usd" type="number" step="0.01" defaultValue={currentMenuItem.price_usd} placeholder="USD" required className="input-field" />
                </div>
                <div className="mb-3">
                  <select
                    name="category"
                    defaultValue={currentMenuItem.category || ''}
                    required
                    className="input-field w-full"
                    onChange={(e) => e.target.value === 'add-new' && setShowNewCategoryInput(true)}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="add-new">➕ Add New</option>
                  </select>
                  {showNewCategoryInput && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="New category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="input-field flex-1"
                        autoFocus
                      />
                      <button type="button" onClick={addNewCategory} className="btn bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
                        Add
                      </button>
                      <button type="button" onClick={() => { setShowNewCategoryInput(false); setNewCategoryName(''); }} className="btn btn-secondary px-3 py-2 rounded text-sm">
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <label className="flex items-center mb-4">
                  <input type="checkbox" name="is_available" defaultChecked={currentMenuItem.is_available !== false} className="mr-2" />
                  Available
                </label>
                <div className="flex gap-3">
                  <button type="submit" className="btn btn-primary flex-1 py-2">Save</button>
                  <button type="button" onClick={closeMenuModal} className="btn btn-secondary flex-1 py-2">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* GROUP MODAL */}
        {isGroupModalOpen && (
          <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4" onClick={closeGroupModal}>
            <div className="bg-white rounded-lg max-w-md w-full p-6 modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">{currentGroup.id ? 'Edit' : 'Add'} Group</h3>
              <form onSubmit={handleGroupSubmit}>
                <input type="hidden" name="id" value={currentGroup.id || ''} />
                <input name="name" defaultValue={currentGroup.name} placeholder="Group Name (e.g., AC, Garden)" required className="input-field w-full mb-3" />
                <div className="flex gap-3">
                  <button type="submit" className="btn btn-primary flex-1 py-2">Save</button>
                  <button type="button" onClick={closeGroupModal} className="btn btn-secondary flex-1 py-2">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* TABLE MODAL */}
        {isTableModalOpen && (
          <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4" onClick={closeTableModal}>
            <div className="bg-white rounded-lg max-w-md w-full p-6 modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">{currentTable.id ? 'Edit' : 'Add'} Table</h3>
              <form onSubmit={handleTableSubmit}>
                <input type="hidden" name="id" value={currentTable.id || ''} />
                <input name="table_number" type="number" defaultValue={currentTable.table_number} placeholder="Number" required className="input-field w-full mb-3" />
                <input name="table_name" defaultValue={currentTable.table_name} placeholder="Name (optional)" className="input-field w-full mb-3" />
                <select name="group_id" defaultValue={currentTable.group_id || ''} className="input-field w-full mb-3">
                  <option value="">Non AC (Default)</option>
                  {tableGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <button type="submit" className="btn btn-primary flex-1 py-2">Save</button>
                  <button type="button" onClick={closeTableModal} className="btn btn-secondary flex-1 py-2">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* QR MODAL */}
        {isQRModalOpen && selectedTableForQR && (
          <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4" onClick={closeQRModal}>
            <div className="bg-white rounded-lg max-w-md w-full p-6 text-center modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">QR – Table {selectedTableForQR.table_number}</h3>
              <div className="flex justify-center items-center">
                <div id={`qr-modal-${selectedTableForQR.id}`} className="qr-container" ref={(el) => (qrRefs.current[selectedTableForQR.id] = el)}></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => printQR(selectedTableForQR.id)} className="btn bg-indigo-600 hover:bg-indigo-700 text-white flex-1 py-2">Print</button>
                <button onClick={closeQRModal} className="btn btn-secondary flex-1 py-2">Close</button>
              </div>
            </div>
          </div>
        )}
        
        {/* ORDERS MODAL */}
        {showOrdersModal && (
          <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4" onClick={closeOrdersModal}>
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">Orders for Table #{selectedTableNum}</h3>
              {selectedTableOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No orders</p>
              ) : (
                <div className="space-y-4">
                  {selectedTableOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold">Order #{order.id}</h4>
                        <span className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</span>
                      </div>
                      <div className="mb-2 text-sm">
                        {order.items.map((item, idx) => (
                          <div key={idx}>{item.quantity}x {item.item_name} - ₹{parseFloat(item.price_inr * item.quantity).toFixed(2)}</div>
                        ))}
                      </div>
                      <div className="flex justify-between mb-2 text-sm">
                        <span>Total: ₹{parseFloat(order.total_amount_inr || 0).toFixed(2)}</span>
                        <span>Payment: {order.payment_method}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <select value={order.order_status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="input-field px-3 py-1 text-sm">
                          <option value="pending">Pending</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={closeOrdersModal} className="btn btn-secondary flex-1 py-2">Close</button>
              </div>
            </div>
          </div>
        )}
        
        {/* CONFIRM MODAL */}
        {confirmModal.show && (
          <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full modal-content">
              <p className="text-lg mb-6">{confirmModal.message}</p>
              <div className="flex gap-3">
                <button onClick={() => { confirmModal.onConfirm(); setConfirmModal({ show: false }); }} className="btn btn-danger flex-1 py-2">Yes, Delete</button>
                <button onClick={() => setConfirmModal({ show: false })} className="btn btn-secondary flex-1 py-2">Cancel</button>
              </div>
            </div>
          </div>
        )}
        
        {/* TOAST */}
        <div className={`toast ${toast.show ? 'show' : ''} ${toast.type}`}>
          {toast.message}
        </div>
      </div>
    </>
  );
}

export default AdminPage;