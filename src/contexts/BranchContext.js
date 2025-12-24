import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AuthContext from './AuthContext';

const BranchContext = createContext();

export const useBranch = () => {
    const context = useContext(BranchContext);
    if (!context) {
        throw new Error('useBranch must be used within BranchProvider');
    }
    return context;
};

export const BranchProvider = ({ children }) => {
    // 1. Initialize from localStorage
    const [selectedBranch, setSelectedBranch] = useState(() => {
        const saved = localStorage.getItem('selectedBranch');
        return saved ? parseInt(saved) : null;
    });
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { token } = useContext(AuthContext); // Access token directly from AuthContext

    // 2. Persist to localStorage whenever selectedBranch changes
    useEffect(() => {
        if (selectedBranch) {
            localStorage.setItem('selectedBranch', selectedBranch);
        } else {
            localStorage.removeItem('selectedBranch');
        }
    }, [selectedBranch]);

    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

    // Load branches function
    const loadBranches = useCallback(async (authToken) => {
        if (!authToken) return;

        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/branches`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
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
    }, [API_URL]);

    // 3. Auto-load branches whenever token becomes available
    useEffect(() => {
        if (token) {
            loadBranches(token);
        } else {
            setBranches([]);
        }
    }, [token, loadBranches]);

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
