import React, { useState, useEffect, useCallback, useRef } from 'react';

function AdminPage() {
  // ── State ───────────────────────────────────────
  const [activeTab, setActiveTab] = useState('menu');
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);

  // Modals
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    message: '',
    onConfirm: () => {},
  });

  // Add New Category Inline
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Form data
  const [currentMenuItem, setCurrentMenuItem] = useState({});
  const [currentTable, setCurrentTable] = useState({});
  const [menuImagePreview, setMenuImagePreview] = useState(null);
  const [menuImageFile, setMenuImageFile] = useState(null);

  // Loading & Filters
  const [isMenuLoading, setIsMenuLoading] = useState(false);
  const [isTablesLoading, setIsTablesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Refs
  const qrRefs = useRef({});
  const BASE_URL = window.location.origin;
  const API_URL = 'http://localhost:5000';

  // ── Helpers ─────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const openConfirm = (message, onYes) => {
    setConfirmModal({ show: true, message, onConfirm: onYes });
  };

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
  }, []);

  // ── Generate QR codes ───────────────────────────
  useEffect(() => {
    if (typeof window.QRCode === 'undefined' || tables.length === 0) return;
    tables.forEach((table) => {
      const el = qrRefs.current[table.id];
      if (el && !el.hasChildNodes()) {
        new window.QRCode(el, {
          text: `${BASE_URL}/customer.html?table=${table.table_number}`,
          width: 200,
          height: 200,
        });
      }
    });
  }, [tables]);

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
  }, []);

  const loadTables = useCallback(async () => {
    setIsTablesLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/tables`);
      const json = await res.json();
      if (json.success) setTables(json.data || []);
    } catch {
      showToast('Failed to load tables', 'error');
    } finally {
      setIsTablesLoading(false);
    }
  }, []);

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
  }, []);

  // ── Add New Category ────────────────────────────
  const addNewCategory = async () => {
    const name = newCategoryName.trim();
    if (!name || categories.includes(name)) {
      showToast(name ? 'Category already exists' : 'Enter a name', 'error');
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
        showToast(`Category "${name}" added!`, 'success');
      } else {
        showToast(json.message || 'Failed to add category', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
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
      const promise = () => new Promise((res) => {
        const r = new FileReader();
        r.onloadend = () => res(r.result);
        r.readAsDataURL(menuImageFile);
      });
      image_url = await promise();
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
        loadCategories(); // Refresh categories in case new one was used
        showToast(id ? 'Item updated!' : 'Item added!', 'success');
      } else {
        showToast(json.message || 'Failed to save', 'error');
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

    const payload = {
      table_number: num,
      table_name: f.get('table_name') || null,
    };

    try {
      const url = id ? `${API_URL}/api/tables/${id}` : `${API_URL}/api/tables`;
      const res = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        closeTableModal();
        loadTables();
        showToast(id ? 'Table updated' : 'Table added', 'success');
        if (!id) setTimeout(() => showQRModal({ ...payload, id: json.data.id, table_number: num }), 300);
      } else showToast(json.message || 'Failed', 'error');
    } catch {
      showToast('Save error', 'error');
    }
  };

  // ── DELETE MENU ITEM (NOW REALLY WORKS) ─────────
  const deleteMenuItem = (id) => {
    openConfirm('Delete this menu item permanently?', async () => {
      try {
        const res = await fetch(`${API_URL}/api/menu/${id}`, { 
          method: 'DELETE' 
        });
        const json = await res.json();
        
        if (json.success) {
          setMenuItems(prev => prev.filter(item => item.id !== id));
          showToast('Item deleted successfully!', 'success');
          loadCategories(); // Refresh in case category becomes empty
        } else {
          showToast(json.message || 'Cannot delete (used in orders)', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Delete failed', 'error');
      }
      setConfirmModal({ show: false });
    });
  };

  const deleteTable = (id) => {
    openConfirm('Delete this table & QR code?', async () => {
      try {
        const res = await fetch(`${API_URL}/api/tables/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          loadTables();
          showToast('Table deleted', 'success');
        }
      } catch {
        showToast('Error', 'error');
      }
    });
  };

  // ── Modal Controls ─────────────────────────────
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
  const showAddTableModal = () => { setCurrentTable({}); setIsTableModalOpen(true); };
  const editTable = (t) => { setCurrentTable(t); setIsTableModalOpen(true); };
  const showQRModal = (t) => { setSelectedTableForQR(t); setIsQRModalOpen(true); };
  const closeQRModal = () => setIsQRModalOpen(false);

  const printQR = (id) => {
    const el = document.getElementById(`qr-modal-${id}`) || document.getElementById(`qr-${id}`);
    if (!el?.parentElement) return;
    const win = window.open('', '', 'width=800,height=600');
    win.document.write(`
      <html><head><title>QR - Table ${id}</title>
      <style>body{display:flex;justify-content:center;align-items:center;height:100vh;background:#f9fafb;}
      .box{background:white;padding:40px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,.1);}</style>
      </head><body><div class="box">${el.parentElement.innerHTML}</div></body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  // ── Filters ───────────────────────────────────
  const filtered = menuItems.filter((i) => {
    const s = searchTerm.toLowerCase();
    const nameOk = i.name.toLowerCase().includes(s);
    const descOk = i.description?.toLowerCase().includes(s);
    const catOk = !selectedCategory || i.category === selectedCategory;
    return (nameOk || descOk) && catOk;
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
        @keyframes fade {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .fade{animation:fade .3s ease-out}
        .card{transition:all .3s}
        .card:hover{transform:translateY(-5px);box-shadow:0 10px 20px rgba(0,0,0,.1)}
        .btn{transition:all .2s;cursor:pointer}
        .btn:hover{transform:scale(1.05)}
        .toast{position:fixed;bottom:20px;right:20px;padding:16px 24px;background:white;border-radius:8px;
          box-shadow:0 4px 12px rgba(0,0,0,.15);display:flex;align-items:center;z-index:1000;
          transform:translateX(400px);transition:transform .3s}
        .toast.show{transform:translateX(0)}
        .toast.success{border-left:4px solid #10b981}
        .toast.error{border-left:4px solid #ef4444;background:#fef2f2;color:#991b1b}
        .loader{border:4px solid #f3f3f3;border-top:4px solid #9333ea;border-radius:50%;width:40px;height:40px;
          animation:spin 1s linear infinite;margin:20px auto}
        @keyframes spin{to{transform:rotate(360deg)}}
        .gradient-bg{background:linear-gradient(135deg,#667eea,#764ba2)}
        .cat-badge{padding:4px 8px;border-radius:4px;font-size:.75rem;font-weight:600}
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
            <button onClick={() => setActiveTab('menu')} className={`px-6 py-3 font-semibold ${activeTab === 'menu' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600'}`}>
              Menu
            </button>
            <button onClick={() => setActiveTab('tables')} className={`px-6 py-3 font-semibold ${activeTab === 'tables' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600'}`}>
              Tables
            </button>
          </div>

          {/* MENU TAB */}
          {activeTab === 'menu' && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Menu Items</h2>
                <button onClick={showAddMenuModal} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium">
                  Add Item
                </button>
              </div>

              <div className="flex gap-4 mb-6">
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 px-4 py-2 border rounded" />
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 py-2 border rounded">
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
                          <button onClick={() => editMenuItem(item)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm">Edit</button>
                          <button onClick={() => deleteMenuItem(item.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm">Delete</button>
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
                <button onClick={showAddTableModal} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium">Add Table</button>
              </div>

              {isTablesLoading ? (
                <div className="loader"></div>
              ) : tables.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No tables</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {tables.map((t) => (
                    <div key={t.id} className="bg-white rounded-lg shadow p-6 text-center card">
                      <h3 className="font-bold text-xl">{t.table_name || `Table ${t.table_number}`}</h3>
                      <div ref={(el) => (qrRefs.current[t.id] = el)} className="my-4"></div>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => editTable(t)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm">Edit</button>
                        <button onClick={() => showQRModal(t)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded text-sm">QR</button>
                        <button onClick={() => deleteTable(t.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm">Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MENU MODAL */}
        {isMenuModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={closeMenuModal}>
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">{currentMenuItem.id ? 'Edit' : 'Add'} Item</h3>
              <form onSubmit={handleMenuSubmit}>
                <input type="hidden" name="id" value={currentMenuItem.id || ''} />
                {menuImagePreview && <img src={menuImagePreview} alt="prev" className="w-full h-48 object-cover rounded mb-3" />}
                <input type="file" accept="image/*" onChange={handleImageChange} className="w-full mb-3" />
                <input name="name" defaultValue={currentMenuItem.name} placeholder="Name" required className="w-full px-4 py-2 border mb-3 rounded" />
                <textarea name="description" defaultValue={currentMenuItem.description} placeholder="Description" className="w-full px-4 py-2 border mb-3 rounded" rows="2" />

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input name="price_inr" type="number" step="0.01" defaultValue={currentMenuItem.price_inr} placeholder="INR" required className="px-4 py-2 border rounded" />
                  <input name="price_usd" type="number" step="0.01" defaultValue={currentMenuItem.price_usd} placeholder="USD" required className="px-4 py-2 border rounded" />
                </div>

                {/* CATEGORY SELECT WITH ADD NEW */}
                <div className="mb-3">
                  <select
                    name="category"
                    defaultValue={currentMenuItem.category || ''}
                    required
                    className="w-full px-4 py-2 border rounded"
                    onChange={(e) => {
                      if (e.target.value === 'add-new') {
                        setShowNewCategoryInput(true);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="add-new">➕ Add New Category...</option>
                  </select>

                  {showNewCategoryInput && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="New category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={addNewCategory}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCategoryInput(false);
                          setNewCategoryName('');
                        }}
                        className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm"
                      >
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
                  <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-medium">
                    Save
                  </button>
                  <button type="button" onClick={closeMenuModal} className="flex-1 bg-gray-300 hover:bg-gray-400 py-2 rounded">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* OTHER MODALS (Table, QR, Confirm) */}
        {isTableModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={closeTableModal}>
            <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">{currentTable.id ? 'Edit' : 'Add'} Table</h3>
              <form onSubmit={handleTableSubmit}>
                <input type="hidden" name="id" value={currentTable.id || ''} />
                <input name="table_number" type="number" defaultValue={currentTable.table_number} placeholder="Number" required className="w-full px-4 py-2 border mb-3 rounded" />
                <input name="table_name" defaultValue={currentTable.table_name} placeholder="Name (optional)" className="w-full px-4 py-2 border mb-3 rounded" />
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-medium">Save</button>
                  <button type="button" onClick={closeTableModal} className="flex-1 bg-gray-300 hover:bg-gray-400 py-2 rounded">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isQRModalOpen && selectedTableForQR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={closeQRModal}>
            <div className="bg-white rounded-lg max-w-md w-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">QR – Table {selectedTableForQR.table_number}</h3>
              <div id={`qr-modal-${selectedTableForQR.id}`} ref={(el) => (qrRefs.current[selectedTableForQR.id] = el)}></div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => printQR(selectedTableForQR.id)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded">Print</button>
                <button onClick={closeQRModal} className="flex-1 bg-gray-300 hover:bg-gray-400 py-2 rounded">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {confirmModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <p className="text-lg mb-6">{confirmModal.message}</p>
              <div className="flex gap-3">
                <button onClick={() => { confirmModal.onConfirm(); setConfirmModal({ show: false }); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded">Yes, Delete</button>
                <button onClick={() => setConfirmModal({ show: false })} className="flex-1 bg-gray-300 hover:bg-gray-400 py-2 rounded">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        <div className={`toast ${toast.show ? 'show' : ''} ${toast.type}`}>
          {toast.message}
        </div>
      </div>
    </>
  );
}

export default AdminPage;