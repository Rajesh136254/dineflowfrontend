import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { useBranch } from '../contexts/BranchContext';
import BranchSelector from '../components/BranchSelector';

function KitchenPage() {
    // State variables
    const [orders, setOrders] = useState([]);
    const [currentFilter, setCurrentFilter] = useState('pending');
    const [connectionStatus, setConnectionStatus] = useState('Connecting...');
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const { token, logout } = useAuth();
    const [deliveredDateFilter, setDeliveredDateFilter] = useState('today'); // New state for date filter
    const [companyInfo, setCompanyInfo] = useState(null);
    const { selectedBranch, branches } = useBranch();

    useEffect(() => {
        const fetchCompanyInfo = async () => {
            try {
                const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:5000'
                    : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

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

    // Refs for non-state values
    const audioRef = useRef(null);
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

    // --- Helper Functions ---
    // Custom hook for current time to drive updates
    const useCurrentTimer = () => {
        const [now, setNow] = useState(Date.now());
        useEffect(() => {
            const interval = setInterval(() => setNow(Date.now()), 1000);
            return () => clearInterval(interval);
        }, []);
        return now;
    };

    const currentTime = useCurrentTimer();

    const getElapsedTimeParts = (createdAt) => {
        const created = new Date(createdAt).getTime();
        const diff = currentTime - created;
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        return { mins, secs, totalMins: mins };
    };

    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
    };


    // Function to get date range based on filter
    const getDateRange = (filter) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        switch (filter) {
            case 'today':
                return { start: today, end: tomorrow };
            case 'yesterday':
                return { start: yesterday, end: today };
            case 'week':
                return { start: weekAgo, end: tomorrow };
            case 'month':
                return { start: monthAgo, end: tomorrow };
            default:
                return { start: today, end: tomorrow };
        }
    };

    const loadOrders = useCallback(async () => {
        try {
            let url = `${API_URL}/api/orders`;
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
                setOrders(data.data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }, [API_URL, token, logout, selectedBranch]);

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ order_status: newStatus })
            });

            if (response.status === 401 || response.status === 403) {
                logout();
                return;
            }

            const data = await response.json();
            if (data.success) {
                console.log('Order status updated');
            } else {
                console.error('API Error:', data.message);
            }
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    };

    // --- useEffect Hooks ---
    useEffect(() => {
        if (!token) return;

        // Initialize Socket.IO connection
        const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
            auth: { token }
        });

        socket.on('connect', () => {
            console.log('Connected to server');
            setConnectionStatus('🟢 Connected');
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from server');
            setConnectionStatus('🔴 Disconnected');
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            setConnectionStatus(`🔴 Error: ${err.message}`);
            if (err.message === 'Authentication error' || err.message === 'jwt expired') {
                logout();
            }
        });

        socket.on('new-order', (order) => {
            // Filter incoming orders by selected branch
            if (selectedBranch && order.branch_id && order.branch_id !== selectedBranch) {
                return;
            }

            console.log('New order received:', order);
            setOrders(prevOrders => {
                const updatedOrders = [order, ...prevOrders];
                // Sort to maintain FIFO order
                return updatedOrders.sort((a, b) =>
                    new Date(a.created_at) - new Date(b.created_at)
                );
            });
            playNotificationSound();
            if (notificationPermission === 'granted') {
                new Notification('New Order Received!', {
                    body: `Order #${order.id} from Table ${order.table_number}`
                });
            }
        });

        socket.on('order-updated', (updatedOrder) => {
            console.log('Order updated:', updatedOrder);
            setOrders(prevOrders => {
                // If status changed to cancelled or updated, reflect efficiently
                const newOrders = prevOrders.map(o =>
                    o.id === updatedOrder.id ? updatedOrder : o
                );
                return newOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            });
            playNotificationSound(); // Optional: sound on update/cancel
        });

        socket.on('order-status-updated', (order) => {
            console.log('Order status updated:', order);
            setOrders(prevOrders => {
                const updatedOrders = prevOrders.map(o =>
                    o.id === order.id ? { ...o, order_status: order.order_status, updated_at: order.updated_at } : o
                );
                // Re-sort to maintain FIFO order
                return updatedOrders.sort((a, b) =>
                    new Date(a.created_at) - new Date(b.created_at)
                );
            });
        });

        // Request notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(setNotificationPermission);
        }

        // Load initial orders
        loadOrders();

        // Set up interval to refresh orders
        const intervalId = setInterval(loadOrders, 30000);

        // Clean up
        return () => {
            clearInterval(intervalId);
            socket.disconnect();
        };
    }, [loadOrders, notificationPermission, token, logout]);

    // --- Derived State ---
    // Calculate filtered orders based on current filter and date filter (for delivered orders)
    const filteredOrders = (() => {
        let filtered = orders.filter(o => o.order_status === currentFilter);

        // Apply date filter only for delivered orders
        if (currentFilter === 'delivered') {
            const { start, end } = getDateRange(deliveredDateFilter);
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate >= start && orderDate < end;
            });
        }

        return filtered;
    })();

    // Calculate status counts based on filtered orders
    const statusCounts = {
        pending: orders.filter(o => o.order_status === 'pending').length,
        preparing: orders.filter(o => o.order_status === 'preparing').length,
        ready: orders.filter(o => o.order_status === 'ready').length,
        // For delivered, count based on the current date filter
        delivered: (() => {
            if (currentFilter === 'delivered') {
                return filteredOrders.length;
            }
            // Default to today's delivered count
            const { start, end } = getDateRange('today');
            return orders.filter(o => {
                if (o.order_status !== 'delivered') return false;
                const orderDate = new Date(o.created_at);
                return orderDate >= start && orderDate < end;
            }).length;
        })()
    };

    // --- Render Logic ---
    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-6 font-sans antialiased">
            <audio ref={audioRef} src="/notification.mp3" />

            {/* Top Bar / Header */}
            <div
                className={`flex flex-col md:flex-row justify-between items-center mb-10 p-6 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100/50 backdrop-blur-xl transition-all duration-500 ${!companyInfo?.banner_url ? 'bg-white' : 'text-white'}`}
                style={companyInfo?.banner_url ? {
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${companyInfo.banner_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                } : {}}
            >
                <div className="flex items-center gap-6 mb-4 md:mb-0">
                    {companyInfo?.logo_url && (
                        <div className={`p-2 rounded-2xl border backdrop-blur-sm ${companyInfo?.banner_url ? 'bg-black/20 border-white/20' : 'bg-slate-50 border-slate-100'}`}>
                            <img src={companyInfo.logo_url} alt="Logo" className="h-14 w-14 object-contain" />
                        </div>
                    )}
                    <div>
                        <h1 className={`text-4xl font-black tracking-tight ${companyInfo?.banner_url ? 'text-white' : 'text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700'}`}>Kitchen Display</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`flex h-2.5 w-2.5 relative`}>
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connectionStatus.includes('Connected') ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connectionStatus.includes('Connected') ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            </span>
                            <span className={`text-sm font-semibold tracking-wide ${companyInfo?.banner_url ? 'text-slate-200' : 'text-slate-500'}`}>{connectionStatus}</span>

                        </div>
                    </div>
                </div>



                <div className="flex gap-4">
                    <div className="px-8 py-4 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-200">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-1">Active</span>
                        <span className="font-bold text-4xl tracking-tight">{statusCounts.pending + statusCounts.preparing}</span>
                    </div>
                    <div className={`px-8 py-4 rounded-2xl backdrop-blur border shadow-xl ${companyInfo?.banner_url ? 'bg-white/10 border-white/20 shadow-none text-white' : 'bg-white border-slate-100 shadow-slate-100'}`}>
                        <span className={`text-xs font-bold uppercase tracking-widest block mb-1 ${companyInfo?.banner_url ? 'text-slate-300' : 'text-slate-400'}`}>Completed</span>
                        <span className={`font-bold text-4xl tracking-tight ${companyInfo?.banner_url ? 'text-emerald-400' : 'text-emerald-600'}`}>{statusCounts.delivered}</span>
                    </div>
                </div>
            </div >



            <BranchSelector API_URL={API_URL} />

            {/* Status Tabs / Filter */}
            < div className="flex flex-wrap gap-4 mb-10 justify-center md:justify-start" >
                {
                    ['pending', 'preparing', 'ready', 'delivered'].map(status => (
                        <button
                            key={status}
                            onClick={() => setCurrentFilter(status)}
                            className={`group relative px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 ${currentFilter === status
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105'
                                : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 shadow-sm border border-slate-200/50'
                                }`}
                        >
                            <span className="relative z-10 uppercase flex items-center gap-3">
                                {status}
                                <span className={`px-2 py-0.5 rounded-md text-xs ${currentFilter === status ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                                    }`}>
                                    {statusCounts[status]}
                                </span>
                            </span>
                        </button>
                    ))
                }
            </div >

            {/* Date Filter for Delivered */}
            {
                currentFilter === 'delivered' && (
                    <div className="mb-8 flex justify-end animate-fade-in-down">
                        <div className="bg-white p-1.5 rounded-xl border border-slate-100 inline-flex shadow-sm">
                            {['today', 'yesterday', 'week', 'month'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setDeliveredDateFilter(filter)}
                                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${deliveredDateFilter === filter
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Orders View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredOrders.length === 0 ? (
                    <div className="col-span-full py-40 text-center rounded-[2.5rem] border border-dashed border-slate-200 bg-white/50">
                        <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-check text-4xl text-slate-300"></i>
                        </div>
                        <span className="text-3xl font-bold text-slate-700 block mb-2">All {currentFilter} orders cleared!</span>
                        <p className="text-slate-400 font-medium">Great job keeping up with the pace.</p>
                    </div>
                ) : (
                    filteredOrders.map(order => {
                        const { mins, secs, totalMins } = getElapsedTimeParts(order.created_at);
                        const isLate = totalMins > 20; // 20 mins threshold

                        return (
                            <div key={order.id} className={`bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1`}>
                                {/* Card Header */}
                                <div className={`p-5 border-b border-slate-50 flex justify-between items-start ${order.order_status === 'pending' ? 'bg-amber-50/50' :
                                    order.order_status === 'preparing' ? 'bg-sky-50/50' :
                                        'bg-white'
                                    }`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-slate-900 text-white tracking-widest shadow-sm">Table</span>
                                            <span className="text-3xl font-black text-slate-800 tracking-tight">{order.table_number}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 tracking-wide">#{order.id} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    {order.order_status !== 'delivered' && (
                                        <div className={`text-right px-4 py-2 rounded-xl border ${isLate ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' : 'bg-white border-slate-100 text-slate-600 shadow-sm'}`}>
                                            <div className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-0.5">Time</div>
                                            <div className="font-mono font-bold text-xl tracking-tight">{mins}m {secs}s</div>
                                        </div>
                                    )}
                                </div>

                                {/* Items List */}
                                <div className="p-5 flex-1 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                    <div className="space-y-4">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className={`flex justify-between items-start group ${item.item_status === 'cancelled' ? 'opacity-50 grayscale' : ''
                                                }`}>
                                                <div className="flex items-start gap-4">
                                                    <span className={`flex items-center justify-center w-7 h-7 rounded-lg font-bold text-sm shadow-sm border ${item.item_status === 'cancelled'
                                                        ? 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                                                        : 'bg-slate-900 text-white border-slate-900'
                                                        }`}>
                                                        {item.quantity}
                                                    </span>
                                                    <div>
                                                        <div className={`font-bold text-[15px] leading-snug transition-colors ${item.item_status === 'cancelled'
                                                            ? 'text-slate-400 line-through'
                                                            : 'text-slate-700'
                                                            }`}>
                                                            {item.item_name}
                                                        </div>
                                                    </div>
                                                </div>
                                                {item.item_status === 'cancelled' && (
                                                    <span className="ml-2 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md border border-rose-100 uppercase tracking-wide">
                                                        Cancelled
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {order.notes && (
                                        <div className="mt-5 p-4 bg-amber-50 text-amber-900 text-sm rounded-xl border-l-4 border-amber-400 flex items-start gap-3">
                                            <i className="fas fa-sticky-note mt-1 text-amber-500"></i>
                                            <span className="font-medium">{order.notes}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions Footer */}
                                <div className="p-4 bg-slate-50 border-t border-slate-100">
                                    <div className="grid grid-cols-1 gap-2">
                                        {order.order_status === 'pending' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'preparing')}
                                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-slate-900/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                Start Preparation <i className="fas fa-fire-alt"></i>
                                            </button>
                                        )}
                                        {order.order_status === 'preparing' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'ready')}
                                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                Mark Ready <i className="fas fa-check"></i>
                                            </button>
                                        )}
                                        {order.order_status === 'ready' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'delivered')}
                                                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                Complete <i className="fas fa-check-double"></i>
                                            </button>
                                        )}
                                        {order.order_status === 'delivered' && (
                                            <div className="w-full py-3.5 bg-white border border-slate-200 rounded-xl text-center">
                                                <span className="text-emerald-600 font-bold flex items-center justify-center gap-2 uppercase tracking-wide text-xs">
                                                    <i className="fas fa-check-circle text-lg"></i> Completed
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div >
    );
}

// Helper to get color based on status
const getStatusColor = (status) => {
    switch (status) {
        // Updated colors slightly for the new theme
        case 'pending': return { text: 'text-amber-500', bg: 'bg-amber-500' };
        case 'preparing': return { text: 'text-sky-500', bg: 'bg-sky-500' };
        case 'ready': return { text: 'text-emerald-500', bg: 'bg-emerald-500' };
        case 'delivered': return { text: 'text-slate-400', bg: 'bg-slate-400' };
        default: return { text: 'text-slate-400', bg: 'bg-slate-400' };
    }
};

export default KitchenPage;