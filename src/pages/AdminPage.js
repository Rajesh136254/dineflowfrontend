import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

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
    onConfirm: () => { },
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
  const { t, language, changeLanguage } = useLanguage();
  const { token, logout } = useAuth();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Refs
  const qrRefs = useRef({});
  const BASE_URL = window.location.origin;
  // Use environment variable for API URL with fallback
  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order_status: newStatus }),
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
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
  }, [API_URL, token, logout]);

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
    if (token) {
      loadMenu();
      loadTables();
      loadCategories();
      loadTableGroups();
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'tables' && token) loadOrders();
  }, [activeTab, token]);

  // ── Generate QR ───────────────────────────
  const generateQRCode = (tableId, tableNumber) => {
    if (typeof window.QRCode === 'undefined') return;

    const el = qrRefs.current[tableId];
    if (el) {
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
      const res = await fetch(`${API_URL}/api/menu`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      const json = await res.json();
      if (json.success) {
        // Filter out placeholder items and 'add-new' categories
        const validItems = (json.data || []).filter(item =>
          item.name !== '[Category Placeholder]' &&
          item.category !== 'add-new'
        );
        setMenuItems(validItems);
      }
    } catch (err) {
      showToast('Failed to load menu', 'error');
    } finally {
      setIsMenuLoading(false);
    }
  }, [API_URL, token, logout]);

  const loadTables = useCallback(async () => {
    setIsTablesLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/tables`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      const json = await res.json();
      if (res.ok) {
        if (json.success) {
          setTables(json.data || []);
        } else {
          showToast(json.message || 'Failed to load tables', 'error');
        }
      } else {
        showToast(`Server error: ${res.status}`, 'error');
      }
    } catch (err) {
      showToast('Network error while loading tables', 'error');
    } finally {
      setIsTablesLoading(false);
    }
  }, [API_URL, token, logout]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCategories(json.data.filter(c => c && c.trim() !== ''));
      }
    } catch {
      setCategories(['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Salad']);
    }
  }, [API_URL, token, logout]);

  const loadOrders = useCallback(async () => {
    setIsOrdersLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      const json = await res.json();
      if (json.success) setOrders(json.data || []);
    } catch (err) {
      showToast('Failed to load orders', 'error');
    } finally {
      setIsOrdersLoading(false);
    }
  }, [API_URL, token, logout]);

  const loadTableGroups = useCallback(async () => {
    setIsGroupsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/table-groups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      const json = await res.json();
      if (json.success) {
        const uniqueGroups = json.data.filter((g, index, self) => index === self.findIndex(g2 => g2.id === g.id));
        setTableGroups(uniqueGroups || []);
      } else {
        showToast(json.message || 'Failed to load groups', 'error');
      }
    } catch (err) {
      showToast('Failed to load groups', 'error');
      setTableGroups([]);
    } finally {
      setIsGroupsLoading(false);
    }
  }, [API_URL, token, logout]);

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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name }),
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name }),
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
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
        const res = await fetch(`${API_URL}/api/table-groups/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) {
          logout();
          return;
        }
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
      nutritional_info: f.get('nutritional_info'),
      vitamins: f.get('vitamins'),
    };
    try {
      const url = id ? `${API_URL}/api/menu/${id}` : `${API_URL}/api/menu`;
      const res = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      console.log('Menu submit response status:', res.status);

      if (res.status === 401 || res.status === 403) {
        console.error('Authentication failed during menu submit');
        showToast('Session expired. Please login again.', 'error');
        // setTimeout(() => logout(), 2000); // Commented out to prevent forced redirect
        return;
      }
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      console.log('Table submit response status:', res.status);

      if (res.status === 401 || res.status === 403) {
        console.error('Authentication failed during table submit');
        showToast('Session expired. Please login again.', 'error');
        // setTimeout(() => logout(), 2000); // Commented out to prevent forced redirect
        return;
      }

      const json = await res.json();

      if (res.ok) {
        if (json.success) {
          closeTableModal();
          loadTables();
          showToast(id ? 'Updated' : 'Added', 'success');
          if (!id) {
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
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  // ── DELETE ─────────
  const deleteMenuItem = (id) => {
    openConfirm('Delete item?', async () => {
      try {
        const res = await fetch(`${API_URL}/api/menu/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) {
          logout();
          return;
        }
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
        const res = await fetch(`${API_URL}/api/tables/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) {
          logout();
          return;
        }
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
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');

      if (!printWindow) {
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
    const catOk = selectedCategory ? i.category === selectedCategory : true;
    return nameOk && catOk;
  });

  const filteredTables = selectedGroupFilter === 'all'
    ? tables
    : tables.filter(t => t.group_id === selectedGroupFilter);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <style>{`
        @keyframes fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .fade { animation: fade .3s ease-out; }
        .card { transition:all .3s; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
        .card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0, 0, 0, .1); }
        .btn { transition:all .2s; cursor: pointer; border-radius: 8px; font-weight: 500; }
        .btn:hover { transform: scale(1.02); }
        .toast { position: fixed; bottom: 20px; right: 20px; padding: 16px 24px; background: white; color:#1f2937; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, .15); display: flex; align-items: center; z-index: 1000; transform: translateX(400px); transition: transform 0.3s ease-in-out; }
        .toast.show { transform: translateX(0); }
        .toast.success { border-left: 4px solid #10B981; }
        .toast.error { border-left: 4px solid #EF4444; }
        .toast.info { border-left: 4px solid #3B82F6; }
        .input-field { width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; outline: none; transition: border-color 0.2s; }
        .input-field:focus { border-color: #4f46e5; }
        .btn-primary { background-color: #4f46e5; color: white; }
        .btn-primary:hover { background-color: #4338ca; }
        .btn-secondary { background-color: #f3f4f6; color: #374151; }
        .btn-secondary:hover { background-color: #e5e7eb; }
        .btn-danger { background-color: #ef4444; color: white; }
        .btn-danger:hover { background-color: #dc2626; }
        .modal-overlay { background-color: rgba(0, 0, 0, 0.5); }
        .modal-content { color: #1f2937; }
      `}</style>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Manage your restaurant efficiently</p>
        </div>
        <div className="flex gap-4 relative">
          <button
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition"
          >
            <i className="fas fa-globe text-indigo-600"></i>
            <span className="uppercase font-medium">{language}</span>
            <i className={`fas fa-chevron-down text-xs transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`}></i>
          </button>

          {showLanguageDropdown && (
            <div className="absolute right-0 mt-12 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-fade-in">
              {[
                { code: 'en', label: 'English' },
                { code: 'es', label: 'Español' },
                { code: 'fr', label: 'Français' },
                { code: 'hi', label: 'हिन्दी' },
                { code: 'zh', label: '中文' },
                { code: 'ta', label: 'தமிழ்' },
                { code: 'ml', label: 'മലയാളം' },
                { code: 'te', label: 'తెలుగు' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    changeLanguage(lang.code);
                    setShowLanguageDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition flex items-center justify-between ${language === lang.code ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-gray-700'}`}
                >
                  <span>{lang.label}</span>
                  {language === lang.code && <i className="fas fa-check text-xs"></i>}
                </button>
              ))}
            </div>
          )}

          <button onClick={logout} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 text-red-600 transition">
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-6 flex gap-4 border-b overflow-x-auto">
        {['menu', 'tables', 'groups'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2 px-4 capitalize whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'menu' && (
        <div className="max-w-7xl mx-auto fade">
          <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
            <div className="flex gap-2 flex-1">
              <input placeholder={t('search') || "Search..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field max-w-xs" />
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="input-field max-w-xs">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={showAddMenuModal} className="btn btn-primary px-4 py-2">+ {t('addItem')}</button>
          </div>
          {isMenuLoading ? <div className="text-center py-10">Loading menu...</div> : (
            filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-utensils text-3xl text-indigo-500"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Your menu is empty</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Start by adding delicious items to your menu. You can organize them into categories and even use AI to generate nutritional info!</p>
                <button onClick={showAddMenuModal} className="btn btn-primary px-6 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                  <i className="fas fa-plus mr-2"></i> Add Your First Item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filtered.map(item => (
                  <div key={item.id} className="card bg-white overflow-hidden flex flex-col">
                    <div className="h-48 bg-gray-200 relative">
                      {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-400">No Image</div>}
                      <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${item.category === 'Veg' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.category}</span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-lg">{item.name}</h3><span className="font-bold text-indigo-600">₹{item.price_inr}</span></div>
                      <p className="text-gray-500 text-sm mb-4 flex-1 line-clamp-2">{item.description}</p>
                      <div className="flex gap-2 mt-auto">
                        <button onClick={() => editMenuItem(item)} className="btn btn-secondary flex-1 py-1 text-sm">Edit</button>
                        <button onClick={() => deleteMenuItem(item.id)} className="btn btn-danger flex-1 py-1 text-sm">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {activeTab === 'tables' && (
        <div className="max-w-7xl mx-auto fade">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <select value={selectedGroupFilter} onChange={e => setSelectedGroupFilter(e.target.value)} className="input-field">
                <option value="all">All Groups</option>
                <option value="non_ac">Non AC</option>
                {tableGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <button onClick={showAddTableModal} className="btn btn-primary px-4 py-2">+ Add Table</button>
          </div>
          {isTablesLoading ? <div className="text-center py-10">Loading tables...</div> : (
            filteredTables.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-chair text-3xl text-indigo-500"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No tables found</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Set up your restaurant layout by adding tables. You can assign them to groups (like AC, Garden) later.</p>
                <button onClick={showAddTableModal} className="btn btn-primary px-6 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                  <i className="fas fa-plus mr-2"></i> Add Your First Table
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredTables.map(t => {
                  const counts = getTableCounts(t.table_number);
                  const activeCount = counts.pending + counts.preparing + counts.ready;
                  return (
                    <div key={t.id} className="card bg-white p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div><h3 className="text-lg font-bold">Table {t.table_number}</h3><p className="text-gray-500 text-sm">{t.table_name || 'No Name'}</p><span className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">{getGroupName(t.group_id, tableGroups.find(g => g.id === t.group_id)?.name)}</span></div>
                        <div className={`w-3 h-3 rounded-full ${activeCount > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      </div>

                      <div className="grid grid-cols-4 gap-1 text-center mb-4 text-xs">
                        <div className="bg-yellow-50 p-1 rounded border border-yellow-100">
                          <div className="font-bold text-yellow-700">{counts.pending}</div>
                          <div className="text-yellow-600 text-[10px] uppercase">P</div>
                        </div>
                        <div className="bg-blue-50 p-1 rounded border border-blue-100">
                          <div className="font-bold text-blue-700">{counts.preparing}</div>
                          <div className="text-blue-600 text-[10px] uppercase">Prep</div>
                        </div>
                        <div className="bg-green-50 p-1 rounded border border-green-100">
                          <div className="font-bold text-green-700">{counts.ready}</div>
                          <div className="text-green-600 text-[10px] uppercase">R</div>
                        </div>
                        <div className="bg-gray-50 p-1 rounded border border-gray-100">
                          <div className="font-bold text-gray-700">{counts.delivered}</div>
                          <div className="text-gray-600 text-[10px] uppercase">D</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => editTable(t)} className="btn btn-primary flex-1 py-2 text-sm">Edit</button>
                        <button onClick={() => showQRModal(t)} className="btn bg-indigo-600 hover:bg-indigo-700 text-white flex-1 py-2 text-sm">QR</button>
                        <button onClick={() => deleteTable(t.id)} className="btn btn-danger flex-1 py-2 text-sm">Del</button>
                      </div>
                      <button onClick={() => showOrdersForTable(t)} className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm disabled:opacity-50" disabled={activeCount === 0}>Show Orders ({activeCount})</button>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="max-w-7xl mx-auto fade">
          <div className="flex justify-end mb-6"><button onClick={showAddGroupModal} className="btn btn-primary px-4 py-2">+ Add Group</button></div>
          {tableGroups.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-layer-group text-3xl text-indigo-500"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No table groups yet</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">Groups help you organize your tables (e.g., "AC Section", "Outdoor", "First Floor").</p>
              <button onClick={showAddGroupModal} className="btn btn-primary px-6 py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                <i className="fas fa-plus mr-2"></i> Create Your First Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tableGroups.map(g => (
                <div key={g.id} className="card bg-white p-4 flex justify-between items-center">
                  <span className="font-bold text-lg">{g.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => editGroup(g)} className="btn btn-secondary px-3 py-1 text-sm">Edit</button>
                    <button onClick={() => deleteGroup(g.id)} className="btn btn-danger px-3 py-1 text-sm">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isMenuModalOpen && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4" onClick={closeMenuModal}>
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">{currentMenuItem.id ? t('edit') : t('addItem')}</h3>
            <form onSubmit={handleMenuSubmit}>
              <input type="hidden" name="id" value={currentMenuItem.id || ''} />
              {menuImagePreview && <img src={menuImagePreview} alt="prev" className="w-full h-48 object-cover rounded mb-3" />}
              <input type="file" accept="image/*" onChange={handleImageChange} className="w-full mb-3" />
              <input name="name" defaultValue={currentMenuItem.name} placeholder={t('name') || "Name"} required className="input-field w-full mb-3" />
              <div className="relative mb-3">
                <textarea name="description" defaultValue={currentMenuItem.description} placeholder={t('description') || "Description"} className="input-field w-full" rows="2" />
                <button type="button" onClick={async () => {
                  const name = document.querySelector('input[name="name"]').value;
                  const desc = document.querySelector('textarea[name="description"]').value;
                  if (!name) { showToast(t('name') + ' required', 'error'); return; }
                  showToast(t('generating'), 'info');
                  try {
                    const res = await fetch(`${API_URL}/api/ai/nutrition`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description: desc }) });
                    const json = await res.json();
                    if (json.success) {
                      document.querySelector('input[name="nutritional_info"]').value = json.data.nutritional_info;
                      document.querySelector('input[name="vitamins"]').value = json.data.vitamins;
                      showToast(t('aiSuccess'), 'success');
                    } else { showToast(json.message || 'Generation failed', 'error'); }
                  } catch (error) { console.error(error); showToast('Network error', 'error'); }
                }} className="absolute right-2 bottom-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200">✨ {t('aiRecommendation')}</button>
              </div>
              <input name="nutritional_info" defaultValue={currentMenuItem.nutritional_info} placeholder={t('nutritionalInfo') || "Nutritional Info"} className="input-field w-full mb-3" />
              <input name="vitamins" defaultValue={currentMenuItem.vitamins} placeholder={t('vitamins') || "Vitamins"} className="input-field w-full mb-3" />
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input name="price_inr" type="number" step="0.01" defaultValue={currentMenuItem.price_inr} placeholder="INR" required className="input-field" />
                <input name="price_usd" type="number" step="0.01" defaultValue={currentMenuItem.price_usd} placeholder="USD" required className="input-field" />
              </div>
              <div className="mb-3">
                <select name="category" defaultValue={currentMenuItem.category || ''} required className="input-field w-full" onChange={(e) => e.target.value === 'add-new' && setShowNewCategoryInput(true)}>
                  <option value="">{t('allCategories')}</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="add-new">➕ Add New</option>
                </select>
                {showNewCategoryInput && (
                  <div className="flex gap-2 mt-2">
                    <input type="text" placeholder="New category name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="input-field flex-1" autoFocus />
                    <button type="button" onClick={addNewCategory} className="btn bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">Add</button>
                    <button type="button" onClick={() => { setShowNewCategoryInput(false); setNewCategoryName(''); }} className="btn btn-secondary px-3 py-2 rounded text-sm">✕</button>
                  </div>
                )}
              </div>
              <label className="flex items-center mb-4"><input type="checkbox" name="is_available" defaultChecked={currentMenuItem.id ? !!currentMenuItem.is_available : true} className="mr-2" />{t('available')}</label>
              <div className="flex gap-3"><button type="submit" className="btn btn-primary flex-1 py-2">{t('save')}</button><button type="button" onClick={closeMenuModal} className="btn btn-secondary flex-1 py-2">{t('cancel')}</button></div>
            </form>
          </div>
        </div>
      )}

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

      {confirmModal.show && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 modal-content">
            <h3 className="text-lg font-bold mb-4">Confirm Action</h3>
            <p className="mb-6 text-gray-600">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button onClick={confirmModal.onConfirm} className="btn btn-danger flex-1 py-2">Yes</button>
              <button onClick={() => setConfirmModal({ show: false })} className="btn btn-secondary flex-1 py-2">No</button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`toast ${toast.type} show`}>
          {toast.type === 'success' && <i className="fas fa-check-circle text-green-500 mr-3"></i>}
          {toast.type === 'error' && <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>}
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default AdminPage;