import React, { createContext, useContext, useState, useEffect } from 'react';

const BranchContext = createContext();

export const useBranch = () => {
    const context = useContext(BranchContext);
    if (!context) {
        throw new Error('useBranch must be used within BranchProvider');
    }
    return context;
};

export const BranchProvider = ({ children }) => {
    const [selectedBranch, setSelectedBranch] = useState(null); // null = All Branches
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load branches when provider mounts
    const loadBranches = async (token, API_URL) => {
        if (!token) return;

        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/branches`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setBranches(json.data);
            }
        } catch (err) {
            console.error('Failed to load branches:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        selectedBranch,
        setSelectedBranch,
        branches,
        setBranches,
        isLoading,
        loadBranches
    };

    return (
        <BranchContext.Provider value={value}>
            {children}
        </BranchContext.Provider>
    );
};
