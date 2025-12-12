import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useBranch } from '../contexts/BranchContext';
import BranchSelector from '../components/BranchSelector';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

function IngredientsPage() {
    const [ingredients, setIngredients] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentIngredient, setCurrentIngredient] = useState({ unit: 'kg' });
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });
    const { token, logout } = useAuth();
    const { selectedBranch, branches } = useBranch();
    const navigate = useNavigate();
    const [companyInfo, setCompanyInfo] = useState(null);

    useEffect(() => {
        const fetchCompanyInfo = async () => {
            try {
                const res = await fetch(`${API_URL}/api/company/public`);
                const json = await res.json();
                if (json.success && json.data) {
                    setCompanyInfo(json.data);
                }
            } catch (err) {
                console.error("Failed to fetch company info", err);
            }
        };
        fetchCompanyInfo();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const loadIngredients = React.useCallback(async () => {
        setIsLoading(true);
        try {
            let url = `${API_URL}/api/ingredients`;
            if (selectedBranch) {
                url += `?branch_id=${selectedBranch}`;
            }
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401 || response.status === 403) {
                logout();
                return;
            }
            const data = await response.json();
            if (data.success) {
                setIngredients(data.data);
            }
        } catch (error) {
            console.error('Error loading ingredients:', error);
            showToast('Failed to load ingredients', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [token, logout, selectedBranch]);

    useEffect(() => {
        if (token) {
            loadIngredients();
        }
    }, [token, loadIngredients]);


    const handleSubmit = async (e) => {
        e.preventDefault();

        // Frontend Validation
        if (!currentIngredient.name || !currentIngredient.name.trim()) {
            showToast('Name is required', 'error');
            return;
        }
        if (!currentIngredient.unit) {
            showToast('Unit is required', 'error');
            return;
        }

        const method = currentIngredient.id ? 'PUT' : 'POST';
        const url = currentIngredient.id
            ? `${API_URL}/api/ingredients/${currentIngredient.id}`
            : `${API_URL}/api/ingredients`;

        const qty = parseFloat(currentIngredient.quantity);
        const thresh = parseFloat(currentIngredient.threshold);

        const payload = {
            ...currentIngredient,
            quantity: isNaN(qty) ? 0 : qty,
            threshold: isNaN(thresh) ? 0 : thresh,
            branch_id: selectedBranch // Associate with current branch if selected
        };

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.status === 401 || response.status === 403) {
                logout();
                return;
            }

            const data = await response.json();
            if (data.success) {
                loadIngredients();
                setIsModalOpen(false);
                setCurrentIngredient({ unit: 'kg' });
                showToast(currentIngredient.id ? 'Ingredient updated' : 'Ingredient added', 'success');
            } else {
                showToast(data.message || 'Operation failed', 'error');
            }
        } catch (error) {
            console.error('Error saving ingredient:', error);
            showToast('Error saving ingredient', 'error');
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            show: true,
            message: 'Are you sure you want to delete this ingredient?',
            onConfirm: async () => {
                try {
                    const response = await fetch(`${API_URL}/api/ingredients/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.status === 401 || response.status === 403) {
                        logout();
                        return;
                    }

                    const data = await response.json();
                    if (data.success) {
                        loadIngredients();
                        showToast('Ingredient deleted successfully', 'success');
                    } else {
                        showToast(data.message || 'Failed to delete', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting ingredient:', error);
                    showToast('Error deleting ingredient', 'error');
                } finally {
                    setConfirmModal({ show: false, message: '', onConfirm: null });
                }
            }
        });
    };

    const filteredIngredients = ingredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className={`flex justify-between items-center mb-8 p-6 rounded-xl shadow-sm transition-all duration-500 ${!companyInfo?.banner_url ? 'bg-white' : 'text-white'}`}
                    style={companyInfo?.banner_url ? {
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${companyInfo.banner_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    } : {}}
                >
                    <div>
                        <h1 className={`text-3xl font-bold ${!companyInfo?.banner_url ? 'text-gray-900' : 'text-white'}`}>Ingredients Management</h1>
                        <p className={`${!companyInfo?.banner_url ? 'text-gray-600' : 'text-gray-200'}`}>Manage your inventory and stock levels</p>

                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => navigate('/admin.html')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition">
                            Back to Admin
                        </button>
                        <button
                            onClick={() => { setCurrentIngredient({ unit: 'kg', threshold: 5 }); setIsModalOpen(true); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center"
                        >
                            <i className="fas fa-plus mr-2"></i> Add Ingredient
                        </button>
                    </div>
                </div>

                <BranchSelector API_URL={API_URL} />

                {/* Search and Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 text-sm font-medium">Total Ingredients</h3>
                            <i className="fas fa-cubes text-blue-500 bg-blue-50 p-2 rounded-lg"></i>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{ingredients.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 text-sm font-medium">Low Stock Items</h3>
                            <i className="fas fa-exclamation-triangle text-orange-500 bg-orange-50 p-2 rounded-lg"></i>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">
                            {ingredients.filter(i => parseFloat(i.quantity || 0) <= parseFloat(i.threshold || 0)).length}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                        <div className="relative w-full">
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input
                                type="text"
                                placeholder="Search ingredients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Ingredients Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Name</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Quantity</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Unit</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Threshold</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr><td colSpan="6" className="text-center py-8 text-gray-500">Loading...</td></tr>
                                ) : filteredIngredients.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-8 text-gray-500">No ingredients found</td></tr>
                                ) : (
                                    filteredIngredients.map(ing => (
                                        <tr key={ing.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 font-medium text-gray-900">{ing.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{ing.quantity}</td>
                                            <td className="px-6 py-4 text-gray-600">{ing.unit}</td>
                                            <td className="px-6 py-4 text-gray-600">{ing.threshold}</td>
                                            <td className="px-6 py-4">
                                                {parseFloat(ing.quantity) <= parseFloat(ing.threshold) ? (
                                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">Low Stock</span>
                                                ) : (
                                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">In Stock</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => { setCurrentIngredient(ing); setIsModalOpen(true); }}
                                                    className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(ing.id)}
                                                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                {currentIngredient.id ? 'Edit Ingredient' : 'Add Ingredient'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={currentIngredient.name || ''}
                                    onChange={e => setCurrentIngredient({ ...currentIngredient, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={currentIngredient.quantity || ''}
                                        onChange={e => setCurrentIngredient({ ...currentIngredient, quantity: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                    <select
                                        value={currentIngredient.unit || 'kg'}
                                        onChange={e => setCurrentIngredient({ ...currentIngredient, unit: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    >
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                        <option value="l">l</option>
                                        <option value="ml">ml</option>
                                        <option value="pcs">pcs</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={currentIngredient.threshold !== undefined && currentIngredient.threshold !== null ? currentIngredient.threshold : 5}
                                    onChange={e => setCurrentIngredient({ ...currentIngredient, threshold: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
                                >
                                    Save Ingredient
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                    <div className="flex items-center gap-2">
                        <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Action</h3>
                            <p className="text-gray-600">{confirmModal.message}</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal({ show: false, message: '', onConfirm: null })}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmModal.onConfirm}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium shadow-md"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default IngredientsPage;
