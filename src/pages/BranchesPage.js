import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBranch } from '../contexts/BranchContext';

const BranchesPage = () => {
    const { token, company_id } = useAuth();
    const { setBranches, setSelectedBranch } = useBranch(); // We'll update context
    const [localBranches, setLocalBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const res = await fetch(`${API_URL}/api/branches`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.success) {
                    setLocalBranches(json.data);
                    setBranches(json.data); // Update context too
                }
            } catch (err) {
                console.error("Failed to load branches", err);
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchBranches();
    }, [token, API_URL, setBranches]);

    const handleBranchSelect = (branch) => {
        // 1. Set the selected branch in global context
        setSelectedBranch(branch.id);

        // 2. Navigate to detailed Branch Dashboard OR Filtered Home Page
        // We will navigate to the main hub (HomePage) which contains all the apps
        navigate('/homepage');
    };

    if (loading) return <div className="flex justify-center items-center h-screen">Loading Branches...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Select a Branch</h1>
                        <p className="text-gray-500 mt-2">Choose a location to manage or view</p>
                    </div>
                    <button
                        onClick={() => navigate('/homepage')}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition"
                    >
                        <i className="fas fa-arrow-left mr-2"></i> Back to Main Hub
                    </button>
                </div>

                {/* Branch Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {localBranches.map((branch) => (
                        <div
                            key={branch.id}
                            onClick={() => handleBranchSelect(branch)}
                            className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 group overflow-hidden"
                        >
                            <div className={`h-3 w-full ${branch.is_active ? 'bg-gradient-to-r from-purple-500 to-indigo-600' : 'bg-gray-300'}`}></div>
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-indigo-50 p-3 rounded-xl group-hover:bg-indigo-100 transition-colors">
                                        <i className="fas fa-store text-2xl text-indigo-600"></i>
                                    </div>
                                    {branch.is_active ? (
                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide">Active</span>
                                    ) : (
                                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wide">Inactive</span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{branch.name}</h3>

                                <div className="space-y-3 text-sm text-gray-500 mb-6">
                                    {branch.address && (
                                        <div className="flex items-start gap-3">
                                            <i className="fas fa-map-marker-alt mt-1 text-gray-400"></i>
                                            <span>{branch.address}</span>
                                        </div>
                                    )}
                                    {branch.phone && (
                                        <div className="flex items-center gap-3">
                                            <i className="fas fa-phone text-gray-400"></i>
                                            <span>{branch.phone}</span>
                                        </div>
                                    )}
                                    {branch.manager_name && (
                                        <div className="flex items-center gap-3">
                                            <i className="fas fa-user-tie text-gray-400"></i>
                                            <span>{branch.manager_name}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-500">View Dashboard</span>
                                    <i className="fas fa-arrow-right text-indigo-400 group-hover:translate-x-1 transition-transform"></i>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add New Branch Card (Direct Link to Admin) */}
                    <div
                        onClick={() => { setSelectedBranch(null); navigate('/admin.html'); }}
                        className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-gray-100 transition-all cursor-pointer flex flex-col items-center justify-center p-8 text-center min-h-[300px]"
                    >
                        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                            <i className="fas fa-plus text-2xl text-gray-400"></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-600 mb-1">Manage Branches</h3>
                        <p className="text-sm text-gray-400">Go to Global Admin to add/edit branches</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BranchesPage;
