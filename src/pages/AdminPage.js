import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import SupportTicketModal from '../components/SupportTicketModal';
import BranchesTab from '../components/BranchesTab';
import BranchSelector from '../components/BranchSelector';
import { useBranch } from '../contexts/BranchContext';

function AdminPage() {
  const { selectedBranch } = useBranch();
  // ── State ───────────────────────────────────────
  const [activeTab, setActiveTab] = useState('menu');
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [tableGroups, setTableGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [companyProfile, setCompanyProfile] = useState({ name: '', logo_url: '', banner_url: '' });
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [leavesList, setLeavesList] = useState([]);
  const [isStaffLoading, setIsStaffLoading] = useState(false);
  const [visiblePins, setVisiblePins] = useState({});
  const [rolesList, setRolesList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState({ name: '', permissions: {} });
  const [currentUser, setCurrentUser] = useState({ full_name: '', email: '', phone: '', password: '', role_id: '' });

  // Branch Management State
  const [branchesList, setBranchesList] = useState([]);
  const [isBranchesLoading, setIsBranchesLoading] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [currentBranch, setCurrentBranch] = useState({
    name: '',
    address: '',
    phone: '',
    manager_name: '',
    is_active: true
  });

  const AVAILABLE_PERMISSIONS = [
    { id: 'admin', label: 'Admin Dashboard' },
    { id: 'kitchen', label: 'Kitchen Display' },
    { id: 'orders', label: 'Orders Management' },
    { id: 'menu', label: 'Menu Management' },
    { id: 'tables', label: 'Table Management' },
    { id: 'staff', label: 'Staff Management' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'ingredients', label: 'Ingredients' },
    { id: 'branches', label: 'Branch Management' },
    { id: 'settings', label: 'Company Settings' },
    { id: 'users', label: 'User Management' },
    { id: 'roles', label: 'Role Management' }
  ];

  // Modals
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isStaffQRModalOpen, setIsStaffQRModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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
  const { token, logout, currentUser: authUser, isLoading } = useAuth();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !authUser) {
      logout();
    }
  }, [isLoading, authUser, logout]);

  // Refs
  const qrRefs = useRef({});
  const BASE_URL = window.location.origin;
  // Use environment variable for API URL with fallback
  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

  // Set initial active tab based on permissions
  useEffect(() => {
    if (authUser && authUser.role !== 'admin' && authUser.permissions) {
      const permMap = {
        'menu': 'menu',
        'tables': 'tables',
        'groups': 'tables',
        'staff': 'staff',
        'users': 'users',
        'roles': 'roles'
      };

      // If current tab is not allowed, switch to first allowed tab
      if (!authUser.permissions[permMap[activeTab]]) {
        const tabs = ['menu', 'tables', 'groups', 'staff', 'users', 'roles'];
        const firstAllowed = tabs.find(t => authUser.permissions[permMap[t]]);
        if (firstAllowed) {
          setActiveTab(firstAllowed);
        }
      }
    }
  }, [authUser, activeTab]);

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
      loadCompanyProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Only token - callbacks are stable via useCallback

  // ── Reload data when branch changes ─────────────
  useEffect(() => {
    if (token && selectedBranch !== undefined) {
      loadMenu();
      loadTables();
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch, token]); // Callbacks are stable via useCallback

  useEffect(() => {
    if (activeTab === 'tables' && token) loadOrders();
    if (activeTab === 'settings' && token) loadCompanyProfile();
    if (activeTab === 'staff' && token) {
      loadStaff();
      loadLeaves();
    }
    if (activeTab === 'roles' && token) loadRoles();
    if (activeTab === 'users' && token) {
      loadUsers();
      loadRoles(); // Need roles for dropdown
    }
  }, [activeTab, token]);

  // ── Generate QR ───────────────────────────
  const generateQRCode = (tableId, tableNumber, branchId) => {
    if (typeof window.QRCode === 'undefined') return;

    const el = qrRefs.current[tableId];
    if (el) {
      el.innerHTML = '';
      const branchParam = branchId ? `&branch_id=${branchId}` : '';
      new window.QRCode(el, {
        text: `${BASE_URL}/customer.html?table=${tableNumber}&companyId=${authUser?.company_id}${branchParam}`,
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
      let url = `${API_URL}/api/menu`;
      if (selectedBranch) url += `?branch_id=${selectedBranch}`;

      const res = await fetch(url, {
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
  }, [API_URL, token, logout, selectedBranch]);

  const loadTables = useCallback(async () => {
    setIsTablesLoading(true);
    try {
      let url = `${API_URL}/api/tables`;
      if (selectedBranch) url += `?branch_id=${selectedBranch}`;

      const res = await fetch(url, {
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
  }, [API_URL, token, logout, selectedBranch]);

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
      let url = `${API_URL}/api/orders`;
      if (selectedBranch) url += `?branch_id=${selectedBranch}`;

      const res = await fetch(url, {
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
  }, [API_URL, token, logout, selectedBranch]);

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

  const loadCompanyProfile = useCallback(async () => {
    setIsProfileLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/company/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      const json = await res.json();
      if (json.success) {
        setCompanyProfile(json.data);
      }
    } catch (err) {
      showToast('Failed to load profile', 'error');
    } finally {
      setIsProfileLoading(false);
    }
  }, [API_URL, token, logout]);

  const loadRoles = useCallback(async () => {
    setIsRolesLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/roles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setRolesList(json.data);
    } catch (err) {
      showToast('Failed to load roles', 'error');
    } finally {
      setIsRolesLoading(false);
    }
  }, [API_URL, token]);

  const saveRole = async (e) => {
    e.preventDefault();
    try {
      const method = currentRole.id ? 'PUT' : 'POST';
      const url = currentRole.id ? `${API_URL}/api/roles/${currentRole.id}` : `${API_URL}/api/roles`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(currentRole)
      });

      const json = await res.json();
      if (json.success) {
        showToast('Role saved successfully');
        setIsRoleModalOpen(false);
        loadRoles();
      } else {
        showToast(json.message || 'Failed to save role', 'error');
      }
    } catch (err) {
      showToast('Error saving role', 'error');
    }
  };

  const deleteRole = async (id) => {
    openConfirm('Are you sure you want to delete this role?', async () => {
      try {
        const res = await fetch(`${API_URL}/api/roles/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          showToast('Role deleted');
          loadRoles();
        } else {
          showToast(json.message || 'Failed to delete role', 'error');
        }
      } catch (err) {
        showToast('Error deleting role', 'error');
      }
    });
  };

  const loadUsers = useCallback(async () => {
    setIsUsersLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setUsersList(json.data);
    } catch (err) {
      showToast('Failed to load users', 'error');
    } finally {
      setIsUsersLoading(false);
    }
  }, [API_URL, token]);

  const saveUser = async (e) => {
    e.preventDefault();
    try {
      const method = currentUser.id ? 'PUT' : 'POST';
      const url = currentUser.id ? `${API_URL}/api/users/${currentUser.id}` : `${API_URL}/api/users`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(currentUser)
      });

      const json = await res.json();
      if (json.success) {
        showToast('User saved successfully');
        setIsUserModalOpen(false);
        loadUsers();
      } else {
        showToast(json.message || 'Failed to save user', 'error');
      }
    } catch (err) {
      showToast('Error saving user', 'error');
    }
  };

  const deleteUser = async (id) => {
    openConfirm('Are you sure you want to delete this user?', async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          showToast('User deleted');
          loadUsers();
        } else {
          showToast(json.message || 'Failed to delete user', 'error');
        }
      } catch (err) {
        showToast('Error deleting user', 'error');
      }
    });
  };

  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        return json.url;
      } else {
        showToast(json.message || 'Upload failed', 'error');
        return null;
      }
    } catch (err) {
      showToast('Upload error', 'error');
      return null;
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      name: f.get('name'),
      logo_url: companyProfile.logo_url, // Use state value
      banner_url: companyProfile.banner_url, // Use state value
    };

    try {
      const res = await fetch(`${API_URL}/api/company/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }

      const json = await res.json();
      if (json.success) {
        setCompanyProfile(json.data);
        showToast('Profile updated!', 'success');
      } else {
        showToast(json.message || 'Failed', 'error');
      }
    } catch (err) {
      showToast('Update failed', 'error');
    }
  };

  const loadStaff = useCallback(async () => {
    setIsStaffLoading(true);
    try {
      // Assuming GET /api/staff exists (I might need to add it if not present)
      // Wait, I didn't add GET /api/staff endpoint yet. I should add it to server.js or use existing if any.
      // I'll add it to server.js in next step if needed. For now I'll write the frontend code.
      const res = await fetch(`${API_URL}/api/staff`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setStaffList(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsStaffLoading(false);
    }
  }, [API_URL, token]);

  const loadLeaves = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/staff/leaves`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setLeavesList(json.data);
    } catch (err) {
      console.error(err);
    }
  }, [API_URL, token]);

  const deleteStaff = async (id) => {
    openConfirm('Are you sure you want to delete this staff member?', async () => {
      try {
        const res = await fetch(`${API_URL}/api/staff/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          showToast('Staff deleted', 'success');
          loadStaff();
        } else {
          showToast(json.message || 'Failed to delete staff', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Network error', 'error');
      }
    });
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      name: f.get('name'),
      role: f.get('role'),
      pin: f.get('pin'),
    };
    // Add staff endpoint
    try {
      const res = await fetch(`${API_URL}/api/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Staff added');
        loadStaff();
        e.target.reset();
      } else {
        showToast(json.message, 'error');
      }
    } catch (err) {
      showToast('Failed to add staff', 'error');
    }
  };

  const handleLeaveAction = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/staff/leaves/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Leave ${status}`);
        loadLeaves();
      }
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

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
      branch_id: selectedBranch || null,
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
      branch_id: selectedBranch || null, // Add branch context
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
      generateQRCode(t.id, t.table_number, t.branch_id);
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

  // Support Ticket State
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <style>{`
        @keyframes fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .fade { animation: fade .3s ease-out; }
        .card { transition:all .3s; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
        .card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0, 0, 0, .1); }
        .btn { transition:all .2s; cursor: pointer; border-radius: 8px; font-weight: 500; }
        .btn:active { transform: scale(0.95); }
        .btn-primary { background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); }
        .btn-primary:hover { box-shadow: 0 6px 15px rgba(79, 70, 229, 0.4); }
        .btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
        .btn-secondary:hover { background: #e5e7eb; }
        .btn-danger { background: #fee2e2; color: #991b1b; }
        .btn-danger:hover { background: #fecaca; }
        .input-field { width: 100%; padding: 0.5rem 1rem; border-radius: 0.5rem; border: 1px solid #d1d5db; transition: all 0.2s; }
        .input-field:focus { border-color: #6366f1; ring: 2px solid #e0e7ff; outline: none; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; backdrop-filter: blur(4px); }
        .modal-content { background: white; border-radius: 1rem; padding: 2rem; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); animation: fade 0.3s ease-out; }
        @media print {
            body * { visibility: hidden; }
            .qr-print-area, .qr-print-area * { visibility: visible; }
            .qr-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
        /* Fix button hover visibility */
        .btn-secondary:hover { color: #1f2937 !important; background-color: #e5e7eb; }
        .btn-primary:hover { color: white !important; }
        .btn-danger:hover { color: white !important; }
      `}</style>

      <div className={`relative mb-8 rounded-2xl shadow-sm transition-all duration-500 ${!companyProfile.banner_url ? 'bg-white' : 'text-white'}`}
        style={companyProfile.banner_url ? {
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${companyProfile.banner_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      >
        <div className="flex flex-col md:flex-row justify-between items-center p-6 gap-4 backdrop-blur-sm">
          <div className={`flex items-center gap-4 cursor-pointer p-2 rounded-lg transition group ${companyProfile.banner_url ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`} onClick={() => setIsProfileModalOpen(true)}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2 relative shadow-md ${companyProfile.banner_url ? 'bg-black/20 border-white/20' : 'bg-indigo-100 border-indigo-200'}`}>
              {companyProfile.logo_url ? (
                <img src={companyProfile.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <i className={`fas fa-store text-2xl ${companyProfile.banner_url ? 'text-white' : 'text-indigo-600'}`}></i>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <i className="fas fa-pen text-white text-base"></i>
              </div>
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${companyProfile.banner_url ? 'text-white' : 'text-gray-900'}`}>{companyProfile.name || 'Admin Dashboard'}</h1>
              <div className={`flex items-center gap-2 text-sm transition-colors ${companyProfile.banner_url ? 'text-gray-200 group-hover:text-white' : 'text-gray-500 group-hover:text-indigo-600'}`}>
                <span>Click to edit profile</span>
                <i className="fas fa-pen opacity-0 group-hover:opacity-100 transition-opacity duration-200"></i>
              </div>
            </div>
          </div>
          <div className="flex gap-4 relative items-center">
            {/* User Profile */}
            {authUser && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-white/80 backdrop-blur px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-gray-900">{authUser.full_name || 'User'}</p>
                    <p className="text-xs text-gray-500">{authUser.email}</p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 overflow-hidden border border-indigo-200">
                    <i className="fas fa-user"></i>
                  </div>
                </div>
                <button onClick={logout} className="bg-white/80 backdrop-blur p-2 rounded-lg shadow-sm border border-gray-200 hover:bg-red-50 hover:text-red-600 transition" title="Logout">
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            )}
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:bg-white transition"
            >
              <i className="fas fa-globe text-indigo-600"></i>
              <span className="uppercase font-medium">{language}</span>
              <i className={`fas fa-chevron-down text-xs transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`}></i>
            </button>
          </div>
        </div>


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


      </div>

      <div className="max-w-7xl mx-auto mb-6">
        <BranchSelector API_URL={API_URL} />
      </div>

      <div className="max-w-7xl mx-auto mb-6 flex gap-4 border-b overflow-x-auto">
        {['menu', 'tables', 'groups', 'staff', 'users', 'roles', 'branches'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2 px-4 capitalize whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab}
          </button>
        ))}
      </div>

      {
        activeTab === 'menu' && (
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
        )
      }

      {
        activeTab === 'tables' && (
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
        )
      }

      {
        activeTab === 'groups' && (
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
        )
      }

      {
        activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto fade">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold mb-6">Company Settings</h2>
              {isProfileLoading ? <div className="text-center py-10">Loading...</div> : (
                <form onSubmit={handleProfileSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input name="name" defaultValue={companyProfile.name} required className="input-field" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                    <div className="flex items-center gap-4">
                      {companyProfile.logo_url && <img src={companyProfile.logo_url} alt="Logo" className="h-16 w-16 object-contain rounded border" />}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          if (e.target.files[0]) {
                            showToast('Uploading logo...', 'info');
                            const url = await handleFileUpload(e.target.files[0]);
                            if (url) {
                              setCompanyProfile(prev => ({ ...prev, logo_url: url }));
                              showToast('Logo uploaded!', 'success');
                            }
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    </div>
                    <input type="hidden" name="logo_url" value={companyProfile.logo_url || ''} />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banner</label>
                    <div className="space-y-2">
                      {companyProfile.banner_url && <img src={companyProfile.banner_url} alt="Banner" className="w-full h-32 object-cover rounded border" />}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          if (e.target.files[0]) {
                            showToast('Uploading banner...', 'info');
                            const url = await handleFileUpload(e.target.files[0]);
                            if (url) {
                              setCompanyProfile(prev => ({ ...prev, banner_url: url }));
                              showToast('Banner uploaded!', 'success');
                            }
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    </div>
                    <input type="hidden" name="banner_url" value={companyProfile.banner_url || ''} />
                  </div>
                  <button type="submit" className="btn btn-primary px-6 py-2">Save Changes</button>
                </form>
              )}
            </div>
          </div>
        )
      }

      {
        activeTab === 'staff' && (
          <div className="max-w-7xl mx-auto fade">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Staff Management */}
              {/* Staff Management */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Staff Members</h2>
                  <button onClick={() => setIsStaffQRModalOpen(true)} className="btn btn-secondary text-sm px-3 py-1">
                    <i className="fas fa-qrcode mr-2"></i> Portal QR
                  </button>
                </div>
                <form onSubmit={handleStaffSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-3">Add New Staff</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <input name="name" placeholder="Name" required className="input-field" />
                    <select name="role" className="input-field">
                      <option value="waiter">Waiter</option>
                      <option value="kitchen">Kitchen</option>
                      <option value="manager">Manager</option>
                      <option value="chef">Chef</option>
                      <option value="cashier">Cashier</option>
                      <option value="cleaner">Cleaner</option>
                      <option value="other">Other</option>
                    </select>
                    <input name="pin" placeholder="PIN (6 digits)" maxLength="6" required className="input-field" />
                  </div>
                  <button type="submit" className="btn btn-primary w-full">Add Staff</button>
                </form>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-sm">
                        <th className="p-3">Name</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">PIN</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffList.map(s => (
                        <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                          <td className="p-3 font-medium">{s.name}</td>
                          <td className="p-3 capitalize">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.role === 'manager' ? 'bg-purple-100 text-purple-700' :
                              s.role === 'chef' ? 'bg-orange-100 text-orange-700' :
                                s.role === 'kitchen' ? 'bg-red-100 text-red-700' :
                                  'bg-blue-100 text-blue-700'
                              }`}>
                              {s.role}
                            </span>
                          </td>
                          <td className="p-3 font-mono">
                            <div className="flex items-center gap-2">
                              <span>{visiblePins[s.id] ? s.pin : '••••••'}</span>
                              <button
                                type="button"
                                onClick={() => setVisiblePins(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                                className="text-gray-400 hover:text-indigo-600 transition-colors focus:outline-none"
                              >
                                <i className={`fas ${visiblePins[s.id] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => deleteStaff(s.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
                              title="Delete Staff"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {staffList.length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-8 text-center text-gray-500">
                            No staff members added yet. Add your first staff member above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Leave Requests */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold mb-6">Leave Requests</h2>
                <div className="space-y-4">
                  {leavesList.map(leave => (
                    <div key={leave.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold">{leave.staff_name}</h4>
                          <p className="text-sm text-gray-500">{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                          leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                          {leave.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{leave.reason}</p>
                      {leave.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleLeaveAction(leave.id, 'approved')} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">Approve</button>
                          <button onClick={() => handleLeaveAction(leave.id, 'rejected')} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {leavesList.length === 0 && <p className="text-gray-500 text-center">No leave requests</p>}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {
        isStaffQRModalOpen && (
          <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4" onClick={() => setIsStaffQRModalOpen(false)}>
            <div className="bg-white rounded-lg max-w-sm w-full p-6 text-center modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">Staff Portal QR</h3>
              <div className="bg-white p-4 inline-block rounded-lg shadow-inner mb-4 border">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/staff`)}`}
                  alt="Staff Portal QR"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm text-gray-500 mb-4">Scan to access Staff Dashboard</p>
              <p className="text-xs text-gray-400 break-all mb-4">{`${window.location.origin}/staff`}</p>
              <button onClick={() => setIsStaffQRModalOpen(false)} className="btn btn-secondary w-full">Close</button>
            </div>
          </div>
        )
      }

      {
        isMenuModalOpen && (
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
        )
      }

      {
        isGroupModalOpen && (
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
        )
      }

      {
        isProfileModalOpen && (
          <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4" onClick={() => setIsProfileModalOpen(false)}>
            <div className="bg-white rounded-lg max-w-md w-full p-6 modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">Edit Company Profile</h3>
              <form onSubmit={(e) => { handleProfileSubmit(e); setIsProfileModalOpen(false); }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input name="name" defaultValue={companyProfile.name} required className="input-field" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                  <div className="flex items-center gap-4">
                    {companyProfile.logo_url && <img src={companyProfile.logo_url} alt="Logo Preview" className="h-16 w-16 object-contain border rounded p-1" />}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files[0]) {
                          showToast('Uploading logo...', 'info');
                          const url = await handleFileUpload(e.target.files[0]);
                          if (url) {
                            setCompanyProfile(prev => ({ ...prev, logo_url: url }));
                            showToast('Logo uploaded!', 'success');
                          }
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                  <input type="hidden" name="logo_url" value={companyProfile.logo_url || ''} />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banner</label>
                  <div className="space-y-2">
                    {companyProfile.banner_url && <img src={companyProfile.banner_url} alt="Banner Preview" className="w-full h-24 object-cover rounded" />}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files[0]) {
                          showToast('Uploading banner...', 'info');
                          const url = await handleFileUpload(e.target.files[0]);
                          if (url) {
                            setCompanyProfile(prev => ({ ...prev, banner_url: url }));
                            showToast('Banner uploaded!', 'success');
                          }
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                  <input type="hidden" name="banner_url" value={companyProfile.banner_url || ''} />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn btn-primary flex-1 py-2">Save Changes</button>
                  <button type="button" onClick={() => setIsProfileModalOpen(false)} className="btn btn-secondary flex-1 py-2">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {
        isTableModalOpen && (
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
        )
      }

      {
        isQRModalOpen && selectedTableForQR && (
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
        )
      }

      {
        showOrdersModal && (
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
        )
      }


      {
        activeTab === 'roles' && (
          <div className="max-w-7xl mx-auto fade">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Role Management</h2>
              <button
                onClick={() => {
                  setCurrentRole({ name: '', permissions: {} });
                  setIsRoleModalOpen(true);
                }}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition shadow-lg flex items-center gap-2"
              >
                <i className="fas fa-plus"></i> Create Role
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-4 font-semibold text-gray-600">Role Name</th>
                      <th className="p-4 font-semibold text-gray-600">Permissions</th>
                      <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isRolesLoading ? (
                      <tr><td colSpan="3" className="p-8 text-center text-gray-500">Loading roles...</td></tr>
                    ) : rolesList.length === 0 ? (
                      <tr><td colSpan="3" className="p-8 text-center text-gray-500">No roles found</td></tr>
                    ) : (
                      rolesList.map(role => (
                        <tr key={role.id} className="hover:bg-gray-50 transition">
                          <td className="p-4 font-medium text-gray-800">{role.name}</td>
                          <td className="p-4 text-gray-600">
                            <div className="flex flex-wrap gap-2">
                              {AVAILABLE_PERMISSIONS.filter(p => role.permissions && role.permissions[p.id]).map(p => (
                                <span key={p.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                  {p.label}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setCurrentRole(role);
                                setIsRoleModalOpen(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 mr-3 transition"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => deleteRole(role.id)}
                              className="text-red-500 hover:text-red-700 transition"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      }

      {
        activeTab === 'users' && (
          <div className="max-w-7xl mx-auto fade">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
              <button
                onClick={() => {
                  setCurrentUser({ full_name: '', email: '', phone: '', password: '', role_id: '' });
                  setIsUserModalOpen(true);
                }}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition shadow-lg flex items-center gap-2"
              >
                <i className="fas fa-plus"></i> Add User
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-4 font-semibold text-gray-600">Name</th>
                      <th className="p-4 font-semibold text-gray-600">Email</th>
                      <th className="p-4 font-semibold text-gray-600">Phone</th>
                      <th className="p-4 font-semibold text-gray-600">Role</th>
                      <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isUsersLoading ? (
                      <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading users...</td></tr>
                    ) : usersList.length === 0 ? (
                      <tr><td colSpan="5" className="p-8 text-center text-gray-500">No users found</td></tr>
                    ) : (
                      usersList.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 transition">
                          <td className="p-4 font-medium text-gray-800">{user.full_name}</td>
                          <td className="p-4 text-gray-600">{user.email}</td>
                          <td className="p-4 text-gray-600">{user.phone || '-'}</td>
                          <td className="p-4 text-gray-600">
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                              {user.role_name || user.role || 'Custom'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setCurrentUser({ ...user, password: '' }); // Don't show hash
                                setIsUserModalOpen(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 mr-3 transition"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="text-red-500 hover:text-red-700 transition"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      }

      {
        activeTab === 'branches' && (
          <div className="max-w-7xl mx-auto fade">
            <BranchesTab token={token} API_URL={API_URL} />
          </div>
        )
      }

      {/* Role Modal */}
      {
        isRoleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto modal-content">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">{currentRole.id ? 'Edit Role' : 'Create Role'}</h3>
                <button onClick={() => setIsRoleModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <form onSubmit={saveRole} className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    value={currentRole.name}
                    onChange={e => setCurrentRole({ ...currentRole, name: e.target.value })}
                    placeholder="e.g., Manager, Supervisor"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_PERMISSIONS.map(perm => (
                      <label key={perm.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition">
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                          checked={currentRole.permissions?.[perm.id] || false}
                          onChange={e => {
                            const newPerms = { ...currentRole.permissions, [perm.id]: e.target.checked };
                            setCurrentRole({ ...currentRole, permissions: newPerms });
                          }}
                        />
                        <span className="text-gray-700 font-medium">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                  <button type="button" onClick={() => setIsRoleModalOpen(false)} className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition btn-secondary">Cancel</button>
                  <button type="submit" className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-bold shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 btn-primary">
                    {currentRole.id ? 'Update Role' : 'Create Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* User Modal */}
      {
        isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden modal-content">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">{currentUser.id ? 'Edit User' : 'Add User'}</h3>
                <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <form onSubmit={saveUser} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 transition"
                      value={currentUser.full_name}
                      onChange={e => setCurrentUser({ ...currentUser, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 transition"
                      value={currentUser.email}
                      onChange={e => setCurrentUser({ ...currentUser, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 transition"
                      value={currentUser.phone}
                      onChange={e => setCurrentUser({ ...currentUser, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 transition"
                      value={currentUser.role_id || ''}
                      onChange={e => setCurrentUser({ ...currentUser, role_id: e.target.value ? parseInt(e.target.value) : null })}
                    >
                      <option value="">Select Role</option>
                      {rolesList.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {currentUser.id ? 'New Password (leave blank to keep current)' : 'Password'}
                    </label>
                    <input
                      type="password"
                      required={!currentUser.id}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 transition"
                      value={currentUser.password}
                      onChange={e => setCurrentUser({ ...currentUser, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                  <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition btn-secondary">Cancel</button>
                  <button type="submit" className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-bold shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 btn-primary">Save User</button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {
        confirmModal.show && (
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
        )
      }

      {
        toast.show && (
          <div className={`toast ${toast.type} show`}>
            {toast.type === 'success' && <i className="fas fa-check-circle text-green-500 mr-3"></i>}
            {toast.type === 'error' && <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>}
            {toast.message}
          </div>
        )
      }
      {/* Support Chat Button */}
      <button
        onClick={() => {
          const storedUser = localStorage.getItem('user');
          const storedToken = localStorage.getItem('token');
          console.log('🎫 Opening Support Modal - Full Debug:', {
            authUser: authUser,
            authUserEmail: authUser?.email,
            storedUser: storedUser ? JSON.parse(storedUser) : null,
            hasToken: !!storedToken,
            tokenLength: storedToken?.length
          });
          setIsSupportOpen(true);
        }}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition transform hover:scale-110 z-50 flex items-center justify-center group"
        title="Support Chat"
      >
        <i className="fas fa-comments text-2xl"></i>
        <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
          Chat with us
        </span>
      </button>


      <SupportTicketModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        currentUser={authUser}
      />
    </div >
  );
}

export default AdminPage;