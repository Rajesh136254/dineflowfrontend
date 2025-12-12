import React, { useState, useEffect, useCallback } from 'react';

function BranchesTab({ token, API_URL }) {
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
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: () => { } });

    const showToast = (msg, type = 'success') => {
        setToast({ show: true, message: msg, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const openConfirm = (message, onYes) => {
        setConfirmModal({ show: true, message, onConfirm: onYes });
    };

    // Load Branches
    const loadBranches = useCallback(async () => {
        setIsBranchesLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/branches`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) setBranchesList(json.data);
        } catch (err) {
            showToast('Failed to load branches', 'error');
        } finally {
            setIsBranchesLoading(false);
        }
    }, [API_URL, token]);

    // Load branches on mount
    useEffect(() => {
        if (token) loadBranches();
    }, [token, loadBranches]);

    // Save Branch
    const saveBranch = async (e) => {
        e.preventDefault();
        try {
            const method = currentBranch.id ? 'PUT' : 'POST';
            const url = currentBranch.id
                ? `${API_URL}/api/branches/${currentBranch.id}`
                : `${API_URL}/api/branches`;

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(currentBranch)
            });

            const json = await res.json();
            if (json.success) {
                showToast('Branch saved successfully!');
                setIsBranchModalOpen(false);
                loadBranches();
            } else {
                showToast(json.message || 'Failed to save branch', 'error');
            }
        } catch (err) {
            showToast('Error saving branch', 'error');
        }
    };

    // Delete Branch
    const deleteBranch = async (id) => {
        openConfirm('Are you sure you want to delete this branch? This cannot be undone.', async () => {
            try {
                const res = await fetch(`${API_URL}/api/branches/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.success) {
                    showToast('Branch deleted successfully');
                    loadBranches();
                } else {
                    showToast(json.message || 'Failed to delete branch', 'error');
                }
            } catch (err) {
                showToast('Error deleting branch', 'error');
            }
            setConfirmModal({ show: false, message: '', onConfirm: () => { } });
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        Branch Management
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Manage your restaurant branches across locations</p>
                </div>
                <button
                    onClick={() => {
                        setCurrentBranch({ name: '', address: '', phone: '', manager_name: '', is_active: true });
                        setIsBranchModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
                >
                    <i className="fas fa-plus"></i>
                    <span>Add New Branch</span>
                </button>
            </div>

            {/* Loading State */}
            {isBranchesLoading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
                    <p className="mt-6 text-gray-600 font-medium text-lg">Loading branches...</p>
                </div>
            ) : branchesList.length === 0 ? (
                /* Empty State */
                <div className="text-center py-20 bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 rounded-3xl border-2 border-dashed border-purple-200">
                    <div className="max-w-md mx-auto px-6">
                        <div className="bg-gradient-to-br from-purple-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-store-alt text-4xl text-purple-600"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">No Branches Yet</h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Start expanding your business by creating your first branch location. Each branch can have its own menu, staff, and operations.
                        </p>
                        <button
                            onClick={() => {
                                setCurrentBranch({ name: '', address: '', phone: '', manager_name: '', is_active: true });
                                setIsBranchModalOpen(true);
                            }}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-2xl transform hover:scale-105"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            Create Your First Branch
                        </button>
                    </div>
                </div>
            ) : (
                /* Branches Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branchesList.map((branch) => (
                        <div
                            key={branch.id}
                            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-2"
                        >
                            {/* Branch Header with Gradient */}
                            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                                <div className="absolute top-0 left-0 w-24 h-24 bg-purple-600 opacity-20 rounded-full -ml-12 -mt-12"></div>
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <i className="fas fa-store text-purple-200"></i>
                                                <h3 className="text-xl font-bold">{branch.name}</h3>
                                            </div>
                                            {branch.manager_name && (
                                                <p className="text-sm text-purple-100 flex items-center">
                                                    <i className="fas fa-user-tie mr-2"></i>
                                                    {branch.manager_name}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${branch.is_active
                                                ? 'bg-green-400 text-green-900 shadow-md'
                                                : 'bg-gray-400 text-gray-900 shadow-md'
                                            }`}>
                                            {branch.is_active ? '● Active' : '○ Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Branch Details */}
                            <div className="p-6 space-y-3">
                                {branch.address && (
                                    <div className="flex items-start space-x-3 text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        <i className="fas fa-map-marker-alt text-purple-500 mt-1"></i>
                                        <span className="flex-1 text-sm">{branch.address}</span>
                                    </div>
                                )}
                                {branch.phone && (
                                    <div className="flex items-center space-x-3 text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        <i className="fas fa-phone text-indigo-500"></i>
                                        <span className="text-sm font-medium">{branch.phone}</span>
                                    </div>
                                )}

                                {/* Stats - Only show if stats exist */}
                                {branch.stats && (
                                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-200">
                                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-600">{branch.stats.menu_items}</div>
                                            <div className="text-xs text-gray-600 mt-1">Menu</div>
                                        </div>
                                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                                            <div className="text-2xl font-bold text-indigo-600">{branch.stats.orders}</div>
                                            <div className="text-xs text-gray-600 mt-1">Orders</div>
                                        </div>
                                        <div className="text-center p-3 bg-pink-50 rounded-lg">
                                            <div className="text-2xl font-bold text-pink-600">{branch.stats.ingredients}</div>
                                            <div className="text-xs text-gray-600 mt-1">Items</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="px-6 pb-6 flex space-x-3">
                                <button
                                    onClick={() => {
                                        setCurrentBranch(branch);
                                        setIsBranchModalOpen(true);
                                    }}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                >
                                    <i className="fas fa-edit mr-2"></i>
                                    Edit
                                </button>
                                <button
                                    onClick={() => deleteBranch(branch.id)}
                                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                >
                                    <i className="fas fa-trash mr-2"></i>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Branch Modal */}
            {isBranchModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white sticky top-0 z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-3xl font-bold mb-1">
                                        {currentBranch.id ? 'Edit Branch' : 'Add New Branch'}
                                    </h3>
                                    <p className="text-purple-100 text-sm">
                                        {currentBranch.id ? 'Update branch information' : 'Create a new branch location'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsBranchModalOpen(false)}
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-3 transition-all duration-200"
                                >
                                    <i className="fas fa-times text-2xl"></i>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={saveBranch} className="p-8 space-y-6">
                            {/* Branch Name */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Branch Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={currentBranch.name}
                                    onChange={(e) => setCurrentBranch({ ...currentBranch, name: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none"
                                    placeholder="e.g., Downtown Branch, Airport Location"
                                    required
                                />
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Address
                                </label>
                                <textarea
                                    value={currentBranch.address || ''}
                                    onChange={(e) => setCurrentBranch({ ...currentBranch, address: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none resize-none"
                                    placeholder="Full address of the branch location"
                                    rows="3"
                                />
                            </div>

                            {/* Grid for Phone and Manager */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={currentBranch.phone || ''}
                                        onChange={(e) => setCurrentBranch({ ...currentBranch, phone: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none"
                                        placeholder="+1-555-0100"
                                    />
                                </div>

                                {/* Manager Name */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Manager Name
                                    </label>
                                    <input
                                        type="text"
                                        value={currentBranch.manager_name || ''}
                                        onChange={(e) => setCurrentBranch({ ...currentBranch, manager_name: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none"
                                        placeholder="Branch manager's name"
                                    />
                                </div>
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center space-x-3 p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-100">
                                <input
                                    type="checkbox"
                                    id="branch-active"
                                    checked={currentBranch.is_active}
                                    onChange={(e) => setCurrentBranch({ ...currentBranch, is_active: e.target.checked })}
                                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                />
                                <label htmlFor="branch-active" className="text-sm font-semibold text-gray-700 cursor-pointer flex items-center">
                                    <i className="fas fa-toggle-on text-purple-600 mr-2"></i>
                                    Branch is Active and Accepting Orders
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-4 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsBranchModalOpen(false)}
                                    className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    {currentBranch.id ? 'Update Branch' : 'Create Branch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed bottom-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl animate-fade-in ${toast.type === 'success'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                    <div className="flex items-center space-x-3">
                        <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-xl`}></i>
                        <span className="font-medium">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
                        <div className="text-center mb-6">
                            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-exclamation-triangle text-3xl text-red-600"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Deletion</h3>
                            <p className="text-gray-600">{confirmModal.message}</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setConfirmModal({ show: false, message: '', onConfirm: () => { } })}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmModal.onConfirm}
                                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
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

export default BranchesTab;
