import React, { useState, useEffect, useRef, useCallback } from 'react';

function KitchenPage() {
    // State variables
    const [orders, setOrders] = useState([]);
    const [currentFilter, setCurrentFilter] = useState('pending');
    const [connectionStatus, setConnectionStatus] = useState('Connecting...');
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

    // Refs for non-state values
    const audioRef = useRef(null);
    const prevOrdersRef = useRef([]);
    const API_URL = 'http://localhost:5000'; // Force use of backend server

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

    // --- Data Loading and Updating Functions ---
    const loadOrders = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/orders`);
            const data = await response.json();
            if (data.success) {
                const newOrders = data.data;
                if (newOrders.length > prevOrdersRef.current.length) {
                    playNotificationSound();
                    if (notificationPermission === 'granted') {
                        new Notification('New Order Received!', {
                            body: `Order #${newOrders[newOrders.length - 1].id} from Table ${newOrders[newOrders.length - 1].table_number}`
                        });
                    }
                }
                setOrders(newOrders);
                prevOrdersRef.current = newOrders;
            } else {
                console.error('API Error:', data.message);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }, [notificationPermission]);

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_status: newStatus })
            });

            const data = await response.json();
            if (data.success) {
                setOrders(currentOrders => currentOrders.map(order => 
                    order.id === orderId ? { ...order, order_status: newStatus, updated_at: new Date().toISOString() } : order
                ));
            } else {
                console.error('API Error:', data.message);
            }
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    };

    // --- useEffect Hooks ---
    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(setNotificationPermission);
        }
        setConnectionStatus('🟢 Connected');
        loadOrders();
        const intervalId = setInterval(loadOrders, 30000);
        return () => clearInterval(intervalId);
    }, [loadOrders]);

    // --- Derived State ---
    const statusCounts = {
        pending: orders.filter(o => o.order_status === 'pending').length,
        preparing: orders.filter(o => o.order_status === 'preparing').length,
        ready: orders.filter(o => o.order_status === 'ready').length,
        delivered: orders.filter(o => o.order_status === 'delivered').length,
    };
    const filteredOrders = orders.filter(o => o.order_status === currentFilter);

    // --- Render Logic ---
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">👨‍🍳 Kitchen Dashboard</h1>
                        <p className="text-green-100 text-sm sm:text-base">Real-time Order Management</p>
                    </div>
                    <div className="mt-2 sm:mt-0 text-right">
                        <p className="text-xl sm:text-3xl font-bold text-green-600">{orders.length}</p>
                        <p className="text-xs sm:text-sm text-gray-200">Total Orders</p>
                    </div>
                </div>
            </div>

            <div className="p-2 sm:p-4">
                {/* Connection Status */}
                <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold">Status</h2>
                            <p className={`text-xs sm:text-sm ${connectionStatus.includes('Connected') ? 'text-green-600' : 'text-red-600'}`}>{connectionStatus}</p>
                        </div>
                    </div>
                </div>

                {/* Compact Stats for mobile */}
                <div className="compact-stats">
                    <div className="compact-stat"><div className="number text-orange-600">{statusCounts.pending}</div><div className="label">Pending</div></div>
                    <div className="compact-stat"><div className="number text-blue-600">{statusCounts.preparing}</div><div className="label">Preparing</div></div>
                    <div className="compact-stat"><div className="number text-green-600">{statusCounts.ready}</div><div className="label">Ready</div></div>
                    <div className="compact-stat"><div className="number text-gray-600">{statusCounts.delivered}</div><div className="label">Delivered</div></div>
                </div>

                {/* Order Status Statistics */}
                <div className="stats-grid">
                    <div className="stats-card"><div className="stats-icon bg-orange-100 text-orange-600"><i className="fas fa-clock text-sm"></i></div><div className="stats-number text-orange-600">{statusCounts.pending}</div><div className="stats-label">Pending</div></div>
                    <div className="stats-card"><div className="stats-icon bg-blue-100 text-blue-600"><i className="fas fa-fire text-sm"></i></div><div className="stats-number text-blue-600">{statusCounts.preparing}</div><div className="stats-label">Preparing</div></div>
                    <div className="stats-card"><div className="stats-icon bg-green-100 text-green-600"><i className="fas fa-check-circle text-sm"></i></div><div className="stats-number text-green-600">{statusCounts.ready}</div><div className="stats-label">Ready</div></div>
                    <div className="stats-card"><div className="stats-icon bg-gray-100 text-gray-600"><i className="fas fa-truck text-sm"></i></div><div className="stats-number text-gray-600">{statusCounts.delivered}</div><div className="stats-label">Delivered</div></div>
                </div>

                {/* Filter Buttons */}
                <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                        {['pending', 'preparing', 'ready', 'delivered'].map(status => (
                            <button key={status} onClick={() => setCurrentFilter(status)} className={`filter-button px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium relative text-sm ${currentFilter === status ? 'active text-white' : 'bg-gray-200 text-gray-700'}`} style={{ backgroundColor: currentFilter === status ? (status === 'pending' ? '#ea580c' : status === 'preparing' ? '#2563eb' : status === 'ready' ? '#059669' : '#4b5563') : '' }}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                <span className="count">{statusCounts[status]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Orders Container */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {filteredOrders.length === 0 ? (
                        <div className="col-span-full text-center py-8 sm:py-12">
                            <p className="text-gray-500 text-base sm:text-lg">No orders to display</p>
                        </div>
                    ) : (
                        filteredOrders.map(order => {
                            const statusColors = { pending: 'border-orange-300', preparing: 'border-blue-300', ready: 'border-green-300', delivered: 'border-gray-300' };
                            const statusIndicator = { pending: 'pending-indicator', preparing: 'preparing-indicator', ready: 'ready-indicator', delivered: 'delivered-indicator' };
                            const time = new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                            const symbol = order.currency === 'INR' ? '₹' : '$';
                            const amount = order[`total_amount_${order.currency.toLowerCase()}`];
                            
                            return (
                                <div key={order.id} className={`order-card bg-white rounded-lg shadow-md p-3 sm:p-4 border-l-4 ${statusColors[order.order_status]}`}>
                                    <div className={`progress-indicator ${statusIndicator[order.order_status]}`}></div>
                                    <div className="flex justify-between items-start mb-2 sm:mb-3">
                                        <div>
                                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Table {order.table_number}</h3>
                                            <p className="text-xs sm:text-sm text-gray-500">Order #{order.id} • {time}</p>
                                            <p className="order-time">Wait time: {calculateWaitTime(order.created_at, order.updated_at)}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.order_status === 'pending' ? 'bg-orange-100 text-orange-800' : order.order_status === 'preparing' ? 'bg-blue-100 text-blue-800' : order.order_status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {order.order_status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="mb-2 sm:mb-3 space-y-1 sm:space-y-2">
                                        {order.items.map((item, index) => (
                                            <div key={index} className="flex justify-between text-xs sm:text-sm">
                                                <span><span className="font-semibold">{item.quantity}x</span> {item.item_name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-gray-200 pt-2 sm:pt-3 mb-2 sm:mb-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs sm:text-sm font-medium text-gray-600">Total:</span>
                                            <span className="text-base sm:text-lg font-bold text-gray-900">{symbol}{parseFloat(amount).toFixed(2)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{order.payment_method === 'cash' ? '💵 Cash' : '💳 Online'}</p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {order.order_status === 'pending' && <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold transition duration-200">Start Preparing</button>}
                                        {order.order_status === 'preparing' && <button onClick={() => updateOrderStatus(order.id, 'ready')} className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold transition duration-200">Mark as Ready</button>}
                                        {order.order_status === 'ready' && <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold transition duration-200">Mark as Delivered</button>}
                                    </div>

                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Hidden Audio Element */}
            <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKzn77RiGwU7k9n0yXkpBSd60O3WjjsJEle07O2rVhMKRp3h8r5sIAUsgs/z2og1CBtpvfDmm04MDFCr5/C1YhsFO5PY88l6KwUme9Dt1o46CRJYtOztqVYUCUad4PO+ax8FLIPo8tmJNQgbabzw5ZtODAxPquXus2IbBTuU2fPJeiwFJnvP7NWOOgkSWLPp7KlWFApGneDzvmsfBSyD6PLZiTYIG2m88OSbTgwMT6rl7rNiGwU7k9j0yXorBSZ8z+3WjjkJEliy6eqoVhQKRp3h8r5sIAUsgo/z2Ik2CBtpvPDlm04MDFCq5e+zYhsFPJTY9Ml6KwUmfM/t1o46CRNYs+rqqFYUCkad4PO+bCAFLIKP89mINggbabzw5ptODAxQquXvs2IbBTyU2PTJeisFJnzP7daOOgkTWLTq6qhWFApGneDzvmwgBSyCkPPZiDYIG2m88OWbTgwMUKrl77NiHAU8lNn0yXorBSZ8z+3VjjkJEliz6uuoVhMKRp3g875sIAUsg5Dz2Yg2CBxpvPDlm04MDFCq5e+zYhwFPJTY9Ml6KwUmfM/t1Y46CRJYs+rqqFYTCkad4PO+bCAFLIOQ89mINggcabzw5ZtODAxQquXvs2IbBTyU2fTJeisFJnzP7dWOOgkSWLPq6qhWEwpGneDzvmwgBSyDkPPZiDYIHGm88OWbTgwMUKrl77NiHAU8lNn0yXorBSZ8z+3VjjkJEliz6uuoVhMKRp3g875sIAUshJDz2Yg2CBxpvPDlm04MDFCq5e+zYhwFPJTZ9Ml6KwUmfM/t1Y46CRJYs+rqqFYTCkad4PO+bCAFLISQ89mINggcabzw5ZtODAxQquXvs2IcBTyU2fTJeisFJnzP7dWOOgkSWLPq6qhWEwpGneDzvmwgBSyEkPPZiDYIHGm88OWbTgwMT6vl77NiHAU8lNn0yXorBSZ8z+3VjjkJEliz6uuoVhMKRp3g875sIAUshJDz2Yg2CBxpvPDlm04MDFCr5e+zYhwFPJTZ9Ml6KwUmfM/t1Y46CRJYtOrqqFYTCkad4PO+bCAFLISQ89mINggcabzw5ZtODAxPq+Xvs2IbBTyU2fTJeisFJnzP7dWOOgkSWLTq6qhWEwpGneDzvmwgBSyEkPPZiDYIHGm88OWbTgwMT6vl77NiHAU8lNn0yXorBSZ8z+3VjjkJEliz6uuoVhMKRp3g875sIAUshJDz2Yg2CBxpvPDlm04MDFCr5e+zYhwFPJTZ9Ml6KwUmfM/t1Y46CRJYtOrqqFYTCkad4PO+bCAFLISQ89mINggcabzw5ZtODAxPq+Xvs2IcBTyU2fTJeisFJnzP7dWOOgkSWLTq6qhWEwpGneDzvmwgBSyEkPPZiDYIHGm88OWbTgwMT6vl77NiHAU8lNn0yXorBSZ8z+3VjjkJEliz6uuoVhMKRp3g875sIAUshJDz2Yg2CBxpvPDlm04MDFCr5e+zYhwFPJTZ9Ml6KwUmfM/t1Y46CRJYtOrqqFYTCkad4PO+bCAFLISQ89mINggcabzw5ZtODAxPq+Xvs2IcBTyU2fTJeisFJnzP7dWOOgkSWLTq6qhWEwpGneDzvmwgBSyEkPPZiDYIHGm88OWbTgwMT6vl77NiHAU8lNn0yXorBSZ8z+3VjjkJEliz6uuoVhMK" preload="auto" />
        </div>
    );
}

export default KitchenPage;