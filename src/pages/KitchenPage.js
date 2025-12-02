import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

function KitchenPage() {
    // State variables
    const [orders, setOrders] = useState([]);
    const [currentFilter, setCurrentFilter] = useState('pending');
    const [connectionStatus, setConnectionStatus] = useState('Connecting...');
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const { token, logout } = useAuth();
    const [deliveredDateFilter, setDeliveredDateFilter] = useState('today'); // New state for date filter

    // Refs for non-state values
    const audioRef = useRef(null);
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

    // --- Helper Functions ---
    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
    };

    const calculateWaitTime = (createdAt, updatedAt) => {
        const created = new Date(createdAt);
        const updated = updatedAt ? new Date(updatedAt) : new Date();
        const diffMs = updated - created;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ${diffHours % 24}h`;
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
            const response = await fetch(`${API_URL}/api/orders`, {
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
    }, [API_URL, token, logout]);

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
        <div className="min-h-screen bg-gray-100 p-6">
            <audio ref={audioRef} src="/notification.mp3" />

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Kitchen Display System</h1>
                    <p className="text-gray-500 text-sm mt-1">{connectionStatus}</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                        <span className="text-gray-500 text-sm">Active Orders: </span>
                        <span className="font-bold text-indigo-600 text-xl ml-2">
                            {statusCounts.pending + statusCounts.preparing}
                        </span>
                    </div>
                    <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
                        Logout
                    </button>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                {['pending', 'preparing', 'ready', 'delivered'].map(status => (
                    <button
                        key={status}
                        onClick={() => setCurrentFilter(status)}
                        className={`flex-1 min-w-[150px] p-4 rounded-xl border-2 transition-all ${currentFilter === status
                            ? `border-${getStatusColor(status)}-500 bg-${getStatusColor(status)}-50`
                            : 'border-white bg-white hover:border-gray-200'
                            }`}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className={`uppercase font-bold text-sm text-${getStatusColor(status)}-600`}>
                                {status}
                            </span>
                            <span className={`bg-${getStatusColor(status)}-100 text-${getStatusColor(status)}-700 px-2 py-1 rounded-full text-xs font-bold`}>
                                {statusCounts[status]}
                            </span>
                        </div>
                        <div className={`h-1 w-full bg-${getStatusColor(status)}-200 rounded-full overflow-hidden`}>
                            <div
                                className={`h-full bg-${getStatusColor(status)}-500 transition-all duration-500`}
                                style={{ width: '100%' }}
                            ></div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Date Filter for Delivered Orders */}
            {currentFilter === 'delivered' && (
                <div className="mb-6 flex justify-end">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 inline-flex">
                        {['today', 'yesterday', 'week', 'month'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setDeliveredDateFilter(filter)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${deliveredDateFilter === filter
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredOrders.length === 0 ? (
                    <div className="col-span-full text-center py-20">
                        <div className="text-gray-300 mb-4">
                            <i className="fas fa-clipboard-list text-6xl"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-400">No {currentFilter} orders</h3>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col animate-fade-in">
                            {/* Order Header */}
                            <div className={`p-4 border-b border-gray-100 flex justify-between items-center bg-${getStatusColor(order.order_status)}-50`}>
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Table</span>
                                    <div className="text-2xl font-bold text-gray-800">{order.table_number}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order #{order.id}</div>
                                    <div className="text-sm font-medium text-gray-600">
                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="p-4 flex-1 overflow-y-auto max-h-[300px]">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center mb-3 last:mb-0">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-gray-100 text-gray-800 font-bold w-8 h-8 flex items-center justify-center rounded-lg">
                                                {item.quantity}
                                            </span>
                                            <span className="font-medium text-gray-700">{item.item_name}</span>
                                        </div>
                                    </div>
                                ))}
                                {order.notes && (
                                    <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-100">
                                        <i className="fas fa-sticky-note mr-2"></i>
                                        {order.notes}
                                    </div>
                                )}
                            </div>

                            {/* Order Footer */}
                            <div className="p-4 bg-gray-50 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
                                    <span>Wait time:</span>
                                    <span className="font-mono font-bold">{calculateWaitTime(order.created_at, order.updated_at)}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {order.order_status === 'pending' && (
                                        <button
                                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                                            className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition shadow-sm"
                                        >
                                            Start Preparing
                                        </button>
                                    )}
                                    {order.order_status === 'preparing' && (
                                        <button
                                            onClick={() => updateOrderStatus(order.id, 'ready')}
                                            className="col-span-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition shadow-sm"
                                        >
                                            Mark Ready
                                        </button>
                                    )}
                                    {order.order_status === 'ready' && (
                                        <button
                                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                                            className="col-span-2 bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-lg font-bold transition shadow-sm"
                                        >
                                            Complete Order
                                        </button>
                                    )}
                                    {order.order_status === 'delivered' && (
                                        <div className="col-span-2 text-center text-green-600 font-bold py-2 bg-green-50 rounded-lg border border-green-100">
                                            <i className="fas fa-check-circle mr-2"></i> Completed
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// Helper to get color based on status
const getStatusColor = (status) => {
    switch (status) {
        case 'pending': return 'yellow';
        case 'preparing': return 'blue';
        case 'ready': return 'green';
        case 'delivered': return 'gray';
        default: return 'gray';
    }
};

export default KitchenPage;