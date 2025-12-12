import React, { useEffect } from 'react';
import { useBranch } from '../contexts/BranchContext';
import { useAuth } from '../contexts/AuthContext';

function BranchSelector({ API_URL }) {
    const { selectedBranch, setSelectedBranch, branches, loadBranches, isLoading } = useBranch();
    const { token } = useAuth();

    useEffect(() => {
        if (token && branches.length === 0) {
            loadBranches(token, API_URL);
        }
    }, [token, API_URL, branches.length, loadBranches]);

    if (branches.length === 0 && !isLoading) {
        return null; // Don't show selector if no branches
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <i className="fas fa-code-branch text-purple-600 text-xl"></i>
                    <label className="text-sm font-semibold text-gray-700">
                        Select Branch:
                    </label>
                </div>

                <select
                    value={selectedBranch || 'all'}
                    onChange={(e) => setSelectedBranch(e.target.value === 'all' ? null : parseInt(e.target.value))}
                    className="flex-1 max-w-md px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none text-gray-700 font-medium"
                    disabled={isLoading}
                >
                    <option value="all">🌐 All Branches (Combined View)</option>
                    {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                            {branch.is_active ? '🟢' : '⚪'} {branch.name}
                            {branch.address ? ` - ${branch.address.substring(0, 30)}...` : ''}
                        </option>
                    ))}
                </select>

                {selectedBranch && (
                    <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        <i className="fas fa-filter mr-1"></i>
                        Filtered
                    </div>
                )}
            </div>

            {selectedBranch && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-800">
                        <i className="fas fa-info-circle mr-2"></i>
                        <strong>Viewing data for:</strong> {branches.find(b => b.id === selectedBranch)?.name}
                        {' - '}All menu items, orders, ingredients, and analytics are filtered to this branch.
                    </p>
                </div>
            )}
        </div>
    );
}

export default BranchSelector;
