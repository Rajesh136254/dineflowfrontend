import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useBranch } from '../contexts/BranchContext';
import BranchSelector from '../components/BranchSelector';
import io from 'socket.io-client';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

const generateFoodImageURL = (itemName, imageUrl) => {
    if (imageUrl) {
        if (imageUrl.startsWith('/uploads/')) {
            return `${API_URL}${imageUrl}`;
        }
        return imageUrl;
    }

    const normalizedName = itemName.toLowerCase().trim();
    const foodImageMap = {
        'margherita pizza': 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        'chicken biryani': 'https://images.unsplash.com/photo-1589302168068-964a4e1a9eb4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        'paneer tikka': 'https://images.unsplash.com/photo-1569957485519-258992c2e8b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        'caesar salad': 'https://images.unsplash.com/photo-1550304963-4a56a14c3df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        'masala dosa': 'https://images.unsplash.com/photo-1589302168068-964a4e1a9eb4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        'chocolate brownie': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    };
    return foodImageMap[normalizedName] || `https://picsum.photos/seed/${normalizedName.replace(/\s+/g, '')}/400/300.jpg`;
};

const MenuItemCard = ({ item, currentCurrency, t, addToCart }) => {
    const [showNutrition, setShowNutrition] = useState(false);
    const price = currentCurrency === 'INR' ? item.price_inr : item.price_usd;
    const symbol = currentCurrency === 'INR' ? '₹' : '$';
    const isAvailable = item.is_available === 1 || item.is_available === true;

    return (
        <div className={`menu-card bg-white rounded-xl shadow-md overflow-hidden card-shadow ${!isAvailable ? 'opacity-75' : ''} transition-all duration-300 hover:shadow-lg`}>
            <div className="relative h-40 sm:h-48 overflow-hidden group">
                <img
                    src={generateFoodImageURL(item.name, item.image_url)}
                    alt={item.name}
                    className={`w-full h-full object-cover food-image transition-transform duration-500 group-hover:scale-110 ${!isAvailable ? 'grayscale' : ''}`}
                />
                <div className="absolute top-2 right-2">
                    <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">{item.category}</span>
                </div>
                {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg transform -rotate-12 border-2 border-white">{t('unavailable')}</span>
                    </div>
                )}
            </div>
            <div className="p-3 sm:p-4">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{item.name}</h3>
                    {(item.nutritional_info || item.vitamins) && (
                        <button
                            onClick={() => setShowNutrition(!showNutrition)}
                            className={`text-green-600 hover:text-green-700 transition p-1 rounded-full hover:bg-green-50 ${showNutrition ? 'bg-green-100' : ''}`}
                            title={t('nutritionalInfo')}
                        >
                            <i className="fas fa-info-circle text-lg"></i>
                        </button>
                    )}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{item.description || 'Delicious dish prepared with fresh ingredients'}</p>

                {/* Nutritional Info Display */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showNutrition ? 'max-h-60 opacity-100 mb-3' : 'max-h-0 opacity-0'}`}>
                    <div className="p-3 bg-green-50 rounded-xl text-xs border border-green-100 shadow-inner">
                        <h4 className="font-bold text-green-800 mb-2 flex items-center border-b border-green-200 pb-1">
                            <i className="fas fa-leaf mr-2"></i> {t('nutritionalInfo')}
                        </h4>
                        {item.nutritional_info && (
                            <p className="text-gray-700 mb-2 leading-relaxed font-medium">{item.nutritional_info}</p>
                        )}
                        {item.vitamins && (
                            <div className="flex flex-wrap gap-1.5">
                                {item.vitamins.split(',').map((v, i) => (
                                    <span key={i} className="bg-white text-green-700 border border-green-200 px-2 py-1 rounded-md text-[10px] font-semibold shadow-sm">{v.trim()}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center mt-auto">
                    <div className="price-tag text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-md bg-gradient-to-r from-blue-600 to-blue-500">
                        {symbol}{parseFloat(price).toFixed(2)}
                    </div>
                    <button
                        onClick={() => isAvailable && addToCart(item.id)}
                        disabled={!isAvailable}
                        className={`btn-add font-bold py-2 px-4 rounded-xl transition duration-200 flex items-center text-xs sm:text-sm shadow-md active:scale-95 ${isAvailable
                            ? 'bg-gray-900 hover:bg-gray-800 text-white'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <i className="fas fa-plus mr-2"></i> {isAvailable ? t('add') : t('outOfStock')}
                    </button>
                </div>
            </div>
        </div>
    );
};

function CustomerPage() {
    // State variables
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [currentCurrency, setCurrentCurrency] = useState('INR');
    const [searchParams] = useSearchParams();
    const [tableNumber, setTableNumber] = useState(() => {
        const t = searchParams.get('table');
        return t ? parseInt(t) : null;
    });
    const [isTableSelectionModalOpen, setIsTableSelectionModalOpen] = useState(false);
    const [tables, setTables] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeVitamin, setActiveVitamin] = useState('all');
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showOrderSuccess, setShowOrderSuccess] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };
    const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
    const [customerOrders, setCustomerOrders] = useState([]);
    const [categories, setCategories] = useState([]);
    const { currentUser, logout, token } = useAuth();
    const navigate = useNavigate();
    const { t, language, changeLanguage } = useLanguage();
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [companyInfo, setCompanyInfo] = useState(null);
    const { selectedBranch, setSelectedBranch } = useBranch();


    // Handle Branch ID from URL (QR Scan)
    useEffect(() => {
        const branchParam = searchParams.get('branch_id');
        if (branchParam) {
            const bId = parseInt(branchParam);
            if (!isNaN(bId) && selectedBranch !== bId) {
                console.log('[CustomerPage] Setting branch from URL:', bId);
                setSelectedBranch(bId);
            }
        }
    }, [searchParams, selectedBranch, setSelectedBranch]);

    // 0. Enforce Authentication
    useEffect(() => {
        if (!token) {
            const currentTable = searchParams.get('table') || tableNumber;
            const currentBranchParam = searchParams.get('branch_id');
            // Force redirect to CustomerAuthPage (UserSignupPage)
            navigate(`/login?mode=signup${currentTable ? `&table=${currentTable}` : ''}${currentBranchParam ? `&branch_id=${currentBranchParam}` : ''}`);
        }
    }, [token, navigate, searchParams, tableNumber]);

    // 1. Fetch Company Info
    useEffect(() => {
        const fetchCompanyInfo = async () => {
            try {
                // Use token if available to get company info context
                const headers = getAuthHeaders();

                const res = await fetch(`${API_URL}/api/company/public`, { headers });
                const json = await res.json();
                if (json.success && json.data) {
                    setCompanyInfo(json.data);
                }
            } catch (err) {
                console.error("Failed to fetch company info", err);
            }
        };
        fetchCompanyInfo();
    }, [token]);

    // 2. Socket Connection
    useEffect(() => {
        if (!token) return;

        const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
            auth: { token }
        });

        socket.on('order-status-updated', (order) => {
            setCustomerOrders(prev => {
                const updated = prev.map(o => o.id === order.id ? { ...o, order_status: order.order_status, updated_at: order.updated_at } : o);

                // Trigger feedback if just delivered AND not already given
                const targetOrder = prev.find(o => o.id === order.id);
                if (targetOrder && targetOrder.order_status !== 'delivered' && order.order_status === 'delivered') {
                    if (!order.has_feedback) {
                        setFeedbackModal({ show: true, orderId: order.id, items: [] });
                        const audio = new Audio('/notification.mp3');
                        audio.play().catch(e => console.log(e));
                    }
                }
                return updated;
            });
        });

        socket.on('order-updated', (updatedOrder) => {
            setCustomerOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        });

        return () => socket.disconnect();
    }, [token]);

    const playNotificationSound = () => {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.log('Audio play failed', e));
    };

    // Feedback & Cancellation State
    const [feedbackModal, setFeedbackModal] = useState({ show: false, orderId: null, items: [] });
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [feedbackComment, setFeedbackComment] = useState('');

    const [cancellationModal, setCancellationModal] = useState({ show: false, type: null, orderId: null, itemId: null });
    const [cancellationReason, setCancellationReason] = useState('');

    // Track previous statuses to trigger feedback
    const prevOrderStatuses = React.useRef({});

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getAuthHeaders = useCallback(() => {
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        // Add company ID from URL if present (for testing/no-subdomain mode)
        const params = new URLSearchParams(window.location.search);
        const companyId = params.get('companyId');
        if (companyId) {
            headers['x-company-id'] = companyId;
        } else if (currentUser && currentUser.company_id) {
            headers['x-company-id'] = currentUser.company_id.toString();
        } else if (token) {
            // Fallback: If currentUser not loaded yet, try to parse token
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(window.atob(base64));
                if (payload.company_id) {
                    headers['x-company-id'] = payload.company_id.toString();
                }
            } catch (e) {/* ignore */ }
        }
        return headers;
    }, [token, currentUser]);

    // --- Data Loading Functions ---
    const loadTables = useCallback(async () => {
        try {
            console.log('[CustomerPage] Loading tables...');
            const branchQuery = selectedBranch ? `?branch_id=${selectedBranch}` : '';
            const response = await fetch(`${API_URL}/api/tables${branchQuery}`, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });
            console.log('[CustomerPage] Tables response status:', response.status);
            if (response.status === 401 || response.status === 403) {
                console.log('[CustomerPage] Tables auth failed, logging out');
                logout();
                return;
            }
            const data = await response.json();
            console.log('[CustomerPage] Tables data:', data);
            if (data.success) {
                console.log('[CustomerPage] Setting tables, count:', data.data?.length);
                setTables(data.data);
            } else {
                console.error('[CustomerPage] Tables API Error:', data.message);
            }
        } catch (error) {
            console.error('[CustomerPage] Error loading tables:', error);
        }
    }, [getAuthHeaders, logout, API_URL, selectedBranch]);

    const loadCategories = useCallback(async () => {
        try {
            const branchQuery = selectedBranch ? `?branch_id=${selectedBranch}` : '';
            const response = await fetch(`${API_URL}/api/categories${branchQuery}`, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });
            if (response.status === 401 || response.status === 403) {
                logout();
                return;
            }
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            setCategories([]);
        }
    }, [getAuthHeaders, logout, API_URL, selectedBranch]);

    const loadMenu = useCallback(async () => {
        setIsLoading(true);
        try {
            const branchQuery = selectedBranch ? `?branch_id=${selectedBranch}` : '';
            const response = await fetch(`${API_URL}/api/menu${branchQuery}`, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401 || response.status === 403) {
                logout();
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Menu error response:', errorText);
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            if (data.success) {
                // Filter out placeholder items
                const validItems = (data.data || []).filter(item =>
                    !item.name.toLowerCase().includes('placeholder') &&
                    item.category !== 'add-new' &&
                    item.is_available !== false
                );
                setMenuItems(validItems);
            } else {
                console.error('API Error:', data.message);
            }
        } catch (error) {
            console.error('Error loading menu:', error);
        } finally {
            setIsLoading(false);
        }
    }, [getAuthHeaders, logout, API_URL, selectedBranch]);

    const loadCustomerOrders = useCallback(async () => {
        if (!token) return;
        try {
            const response = await fetch(`${API_URL}/api/customer/orders`, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });
            if (response.status === 401 || response.status === 403) {
                logout();
                return;
            }

            const data = await response.json();
            if (data.success) {
                setCustomerOrders(data.data);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }, [token, getAuthHeaders, logout, API_URL]);

    // --- Cart Functions ---
    const addToCart = (itemId) => {
        const item = menuItems.find(i => i.id === itemId);
        if (!item) return;
        setCart(currentCart => {
            const existingItem = currentCart.find(i => i.id === itemId);
            if (existingItem) {
                return currentCart.map(i => i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i);
            } else {
                return [...currentCart, { ...item, quantity: 1 }];
            }
        });
        showToast('Item added to cart!', 'success');
    };

    const removeFromCart = (itemId) => {
        setCart(currentCart => currentCart.filter(i => i.id !== itemId));
    };

    const updateQuantity = (itemId, change) => {
        setCart(currentCart => {
            return currentCart.map(item => {
                if (item.id === itemId) {
                    const newQuantity = item.quantity + change;
                    return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
                }
                return item;
            }).filter(Boolean);
        });
    };

    const placeOrder = async () => {
        if (cart.length === 0) return;
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'cash';
        const orderData = {
            table_number: tableNumber,
            items: cart.map(i => ({
                id: i.id,
                quantity: i.quantity,
                price_inr: i.price_inr,
                price_usd: i.price_usd,
                name: i.name
            })),
            currency: currentCurrency,
            payment_method: paymentMethod,
            customer_id: currentUser?.id,
            branch_id: selectedBranch // Pass branch context for uniqueness
        };
        try {
            const response = await fetch(`${API_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();
            if (data.success) {
                setOrderId(data.data.id);
                setShowOrderSuccess(true);
                setCart([]);
                setIsCartModalOpen(false);
                loadCustomerOrders();
                showToast('Order placed successfully!', 'success');
            } else {
                showToast(data.message || 'Failed to place order. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            showToast('Error placing order. Please try again.', 'error');
        }
    };

    // --- Cancellation Handlers ---
    const openCancellationModal = (type, orderId, itemId = null) => {
        setCancellationModal({ show: true, type, orderId, itemId });
        setCancellationReason('');
    };

    const handleCancellationSubmit = async () => {
        if (!cancellationReason.trim()) {
            showToast('Please provide a reason for cancellation', 'error');
            return;
        }

        const { type, orderId, itemId } = cancellationModal;
        const url = type === 'order'
            ? `${API_URL}/api/orders/${orderId}/cancel`
            : `${API_URL}/api/orders/${orderId}/items/${itemId}/cancel`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reason: cancellationReason,
                    cancelled_by: 'customer'
                })
            });

            const data = await response.json();
            if (data.success) {
                showToast(type === 'order' ? 'Order cancelled successfully' : 'Item cancelled successfully', 'success');
                setCancellationModal({ show: false, type: null, orderId: null, itemId: null });
                loadCustomerOrders(); // Refresh orders
            } else {
                showToast(data.message || 'Cancellation failed', 'error');
            }
        } catch (error) {
            console.error('Error cancelling:', error);
            showToast('Failed to process cancellation', 'error');
        }
    };

    // --- Feedback Handlers ---
    const handleFeedbackSubmit = async () => {
        try {
            const response = await fetch(`${API_URL}/api/feedback`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    order_id: feedbackModal.orderId,
                    customer_id: currentUser?.id,
                    rating: feedbackRating,
                    comments: feedbackComment
                })
            });

            const data = await response.json();
            if (data.success) {
                setFeedbackModal({ show: false, orderId: null, items: [] });
                setFeedbackRating(5);
                setFeedbackComment('');
                showToast('Thank you for your feedback!', 'success');
                loadCustomerOrders(); // Refresh orders to update has_feedback status
            } else {
                showToast(data.message || 'Failed to submit feedback', 'error');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
    };

    // --- Derived State & Timers ---
    // Custom hook for running timers
    const useOrderTimer = (orders) => {
        const [now, setNow] = useState(Date.now());
        useEffect(() => {
            const interval = setInterval(() => setNow(Date.now()), 1000);
            return () => clearInterval(interval);
        }, []);
        return now;
    };

    const currentTime = useOrderTimer(customerOrders);

    const getElapsedTime = (startTime) => {
        if (!startTime) return '0m';
        const start = new Date(startTime).getTime();
        const diff = currentTime - start;
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        if (mins < 1) return `${secs}s`;
        return `${mins}m ${secs}s`;
    };

    const getTotalWaitTime = (start, end) => {
        const s = new Date(start).getTime();
        const e = new Date(end).getTime();
        const diff = e - s;
        const mins = Math.floor(diff / 60000);
        return `${mins} mins`;
    };

    // --- Reorder Logic ---
    const handleReorder = (order) => {
        const newItems = order.items.map(item => ({
            id: item.item_id || item.id, // Handle DB field naming difference if any
            name: item.item_name,
            price_inr: item.price_inr, // Assuming these fields exist on item, might need lookup if not
            price_usd: item.price_usd,
            quantity: item.quantity
        }));

        // Check if we have price info. If not, we might need to fetch menu (already loaded)
        // Let's match with menuItems to get current prices and details
        const cartItems = [];
        newItems.forEach(orderItem => {
            const menuItem = menuItems.find(m => m.id === orderItem.id || m.name === orderItem.name); // Try ID then Name
            if (menuItem) {
                cartItems.push({
                    ...menuItem,
                    quantity: orderItem.quantity
                });
            }
        });

        if (cartItems.length > 0) {
            setCart(prev => [...prev, ...cartItems]);
            setIsCartModalOpen(true);
            setIsOrdersModalOpen(false);
            showToast("Items added to cart!", "success");
        } else {
            showToast("Could not reorder items. They may no longer be available.", "error");
        }
    };

    const uniqueVitamins = useMemo(() => {
        const vitamins = new Set();
        menuItems.forEach(item => {
            if (item.vitamins) {
                item.vitamins.split(',').forEach(v => {
                    const trimmed = v.trim();
                    if (trimmed) vitamins.add(trimmed);
                });
            }
        });
        return Array.from(vitamins).sort();
    }, [menuItems]);

    const filteredMenu = menuItems.filter(item => {
        const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || (item.description && item.description.toLowerCase().includes(searchTerm));

        // Vitamin filter
        let matchesVitamin = true;
        if (activeVitamin !== 'all') {
            matchesVitamin = item.vitamins && item.vitamins.toLowerCase().includes(activeVitamin.toLowerCase());
        }

        return matchesCategory && matchesSearch && matchesVitamin;
    });

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => {
        const price = currentCurrency === 'INR' ? item.price_inr : item.price_usd;
        return sum + (price * item.quantity);
    }, 0);

    // --- useEffect Hooks ---
    // --- useEffect Hooks ---

    // 1. Load static data on mount
    // 1. Load static data on mount
    // 1. Load data explicitly when token/user is ready
    useEffect(() => {
        if (token) {
            console.log('[CustomerPage] Token available, loading data...');
            loadTables();
            loadMenu();
            loadCategories();
            loadCustomerOrders();

            // Retry after 1 second if menu is still empty (handles new signup edge case)
            const retryTimer = setTimeout(() => {
                if (menuItems.length === 0) {
                    console.log('[CustomerPage] Retrying data load (menu still empty)...');
                    loadTables();
                    loadMenu();
                    loadCategories();
                }
            }, 1000);

            return () => clearTimeout(retryTimer);
        }
    }, [token, loadTables, loadMenu, loadCategories, loadCustomerOrders]);

    // 2. Handle URL Table Param (Run only when URL params change)
    useEffect(() => {
        const tableFromUrl = searchParams.get('table');
        if (tableFromUrl) {
            const tNum = parseInt(tableFromUrl);
            if (!isNaN(tNum)) {
                setTableNumber(tNum);
                setIsTableSelectionModalOpen(false);
            }
        } else {
            // If no table in URL, and no table selected yet, open modal
            if (!tableNumber) setIsTableSelectionModalOpen(true);
        }
    }, [searchParams]);

    // 3. Load Orders (Run when token changes)


    return (
        <>
            <div className="top-cart">
                <div className={`text-white p-3 sm:p-4 transition-all duration-500 ${!companyInfo?.banner_url ? 'gradient-bg' : ''}`}
                    style={companyInfo?.banner_url ? {
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${companyInfo.banner_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    } : {}}
                >
                    <div className="container mx-auto px-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center min-w-0"> {/* min-w-0 allows shrinking */}
                                {companyInfo?.logo_url ? (
                                    <img src={companyInfo.logo_url} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover mr-2 sm:mr-3 border-2 border-white flex-shrink-0" />
                                ) : (
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                        <i className="fas fa-utensils text-blue-600 text-sm sm:text-base"></i>
                                    </div>
                                )}
                                <div className="truncate">
                                    <h1 className="text-base sm:text-2xl font-bold truncate">{t('menu')}</h1>
                                    <p className="text-blue-100 text-xs sm:text-sm flex items-center truncate">
                                        <i className="fas fa-chair mr-1"></i> {t('table')} #<span className="font-semibold ml-0.5">{tableNumber}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0 ml-2">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                                        className="bg-white/20 backdrop-blur-sm rounded-lg h-9 sm:h-10 px-2 sm:px-3 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm transition hover:bg-white/30"
                                    >
                                        <i className="fas fa-globe text-base sm:text-lg"></i>
                                        <span className="hidden sm:inline">{language.toUpperCase()}</span>
                                    </button>
                                    {showLanguageDropdown && (
                                        <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-50 py-1 text-gray-800">
                                            {['en', 'es', 'fr', 'hi', 'zh', 'ta', 'ml', 'te'].map((lang) => (
                                                <button
                                                    key={lang}
                                                    onClick={() => {
                                                        changeLanguage(lang);
                                                        setShowLanguageDropdown(false);
                                                    }}
                                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                                >
                                                    {lang === 'en' ? 'English' :
                                                        lang === 'es' ? 'Español' :
                                                            lang === 'fr' ? 'Français' :
                                                                lang === 'hi' ? 'हिंदी' :
                                                                    lang === 'zh' ? '中文' :
                                                                        lang === 'ta' ? 'தமிழ்' :
                                                                            lang === 'ml' ? 'മലയാളം' : 'తెలుగు'}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="hidden xs:block bg-white/20 backdrop-blur-sm rounded-lg h-9 sm:h-10 flex items-center px-1 sm:px-2 hover:bg-white/30 transition">
                                    <select value={currentCurrency} onChange={(e) => setCurrentCurrency(e.target.value)} className="bg-transparent text-white border-none outline-none text-xs sm:text-sm font-medium cursor-pointer w-full">
                                        <option value="INR" className="text-gray-800">₹ INR</option>
                                        <option value="USD" className="text-gray-800">$ USD</option>
                                    </select>
                                </div>
                                <button onClick={() => { setIsOrdersModalOpen(true); loadCustomerOrders(); }} className="bg-white/20 backdrop-blur-sm rounded-lg w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-white/30 transition" title="My Orders">
                                    <i className="fas fa-clipboard-list text-white text-base sm:text-lg"></i>
                                </button>
                                <button onClick={() => setIsCartModalOpen(true)} className="bg-white/20 backdrop-blur-sm rounded-lg w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-white/30 transition relative" title="Cart">
                                    <i className="fas fa-shopping-cart text-white text-base sm:text-lg"></i>
                                    {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-transparent">{cartCount}</span>}
                                </button>
                                <button onClick={handleLogout} className="bg-white/20 backdrop-blur-sm rounded-lg w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-white/30 transition" title="Logout">
                                    <i className="fas fa-sign-out-alt text-white text-base sm:text-lg"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
                <BranchSelector API_URL={API_URL} />

                {/* Search and Filter Section */}
                <div className="mb-4 sm:mb-6">
                    <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i className="fas fa-search text-gray-400"></i>
                        </div>
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('search')} className="w-full pl-10 pr-4 py-2 sm:py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-sm sm:text-base input-focus" />
                    </div>
                    <div className="flex gap-2 mb-4">
                        <div className="flex gap-2 mb-4 w-full relative">
                            <select
                                value={tableNumber || ''}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setTableNumber(isNaN(val) ? null : val);
                                }}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white text-gray-700 font-medium shadow-sm transition-all outline-none appearance-none cursor-pointer"
                            >
                                <option value="" disabled>Choose your table...</option>
                                {tables.map(table => (
                                    <option key={table.id} value={table.table_number}>
                                        {table.table_name || `Table ${table.table_number}`}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <i className="fas fa-chevron-down text-xs"></i>
                            </div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="mb-2">
                        <div className="flex gap-2 overflow-x-auto pb-2 px-1 -mx-1 scrollbar-hide">
                            <button
                                onClick={() => setActiveCategory('all')}
                                className={`category-pill px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium whitespace-nowrap flex items-center text-xs sm:text-sm flex-shrink-0 ${activeCategory === 'all' ? 'active text-white' : 'bg-gray-200 text-gray-700'}`}
                            >
                                <i className="fas fa-border-all mr-1 sm:mr-2"></i>{t('allCategories')}
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`category-pill px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium whitespace-nowrap flex items-center text-xs sm:text-sm flex-shrink-0 ${activeCategory === cat ? 'active text-white' : 'bg-gray-200 text-gray-700'}`}
                                >
                                    <i className="fas fa-utensils mr-1 sm:mr-2"></i>{cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Vitamin Filters */}
                    <div className="mb-4">
                        <div className="flex gap-2 overflow-x-auto pb-2 px-1 -mx-1 scrollbar-hide">
                            <button
                                onClick={() => setActiveVitamin('all')}
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${activeVitamin === 'all' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-white text-gray-600 border-gray-200'}`}
                            >
                                All Vitamins
                            </button>
                            {uniqueVitamins.map(vit => (
                                <button
                                    key={vit}
                                    onClick={() => setActiveVitamin(vit)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border ${activeVitamin === vit ? 'bg-green-100 text-green-800 border-green-200' : 'bg-white text-gray-600 border-gray-200'}`}
                                >
                                    {vit}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Menu Items */}
                {isLoading ? (
                    <div className="menu-grid grid gap-4 sm:gap-6">
                        {Array(6).fill().map((_, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden">
                                <div className="h-48 shimmer"></div>
                                <div className="p-4"><div className="h-4 bg-gray-200 rounded w-3/4 mb-2 shimmer"></div><div className="h-3 bg-gray-200 rounded w-full mb-1 shimmer"></div><div className="h-3 bg-gray-200 rounded w-5/6 mb-3 shimmer"></div><div className="flex justify-between items-center"><div className="h-6 bg-gray-200 rounded w-20 shimmer"></div><div className="h-10 bg-gray-200 rounded-lg w-28 shimmer"></div></div></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="menu-grid grid gap-4 sm:gap-6">
                        {filteredMenu.length === 0 ? (
                            <div className="col-span-full bg-gray-50 rounded-xl p-8 text-center">
                                <i className="fas fa-search text-gray-400 text-4xl mb-4"></i>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('noItemsFound')}</h3>
                                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                            </div>
                        ) : (
                            filteredMenu.map(item => (
                                <MenuItemCard
                                    key={item.id}
                                    item={item}
                                    currentCurrency={currentCurrency}
                                    t={t}
                                    addToCart={addToCart}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Floating Cart Button (Mobile) */}
            <button onClick={() => setIsCartModalOpen(true)} className="floating-cart bg-blue-600 hover:bg-blue-700 text-white btn-primary">
                <i className="fas fa-shopping-cart text-xl"></i>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center cart-badge">{cartCount}</span>
            </button>

            {/* Cart Modal */}
            {
                isCartModalOpen && (
                    <div className="fixed inset-0 modal-backdrop z-50 flex items-end sm:items-center justify-center">
                        <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl modal-content shadow-2xl">
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold flex items-center"><i className="fas fa-shopping-cart mr-2 text-blue-600"></i>{t('yourCart')}</h2>
                                <button onClick={() => setIsCartModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl transition"><i className="fas fa-times"></i></button>
                            </div>
                            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                                {cart.length === 0 ? <p className="text-gray-500 text-center py-8">{t('cartEmpty')}</p> : cart.map(item => {
                                    const price = currentCurrency === 'INR' ? item.price_inr : item.price_usd;
                                    const symbol = currentCurrency === 'INR' ? '₹' : '$';
                                    return (
                                        <div key={item.id} className="cart-item bg-gray-50 rounded-lg p-3">
                                            <div className="flex gap-3">
                                                <img src={generateFoodImageURL(item.name, item.image_url)} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div><h4 className="font-semibold">{item.name}</h4><p className="text-sm text-gray-600">{symbol}{parseFloat(price).toFixed(2)} each</p></div>
                                                        <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 transition"><i className="fas fa-trash-alt"></i></button>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <button onClick={() => updateQuantity(item.id, -1)} className="quantity-btn w-8 h-8 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center"><i className="fas fa-minus text-xs"></i></button>
                                                            <span className="font-semibold w-8 text-center">{item.quantity}</span>
                                                            <button onClick={() => updateQuantity(item.id, 1)} className="quantity-btn w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"><i className="fas fa-plus text-xs"></i></button>
                                                        </div>
                                                        <span className="font-bold text-blue-600">{symbol}{(price * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="border-t border-gray-200 p-4 sticky bottom-0 bg-white">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center"><i className="fas fa-credit-card mr-2"></i>{t('paymentMethod')}</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="payment-option border-2 border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-500 transition">
                                            <input type="radio" name="payment-method" value="cash" className="sr-only" defaultChecked />
                                            <div className="text-center"><i className="fas fa-money-bill-wave text-2xl text-green-600 mb-1"></i><p className="text-sm font-medium">Cash</p><p className="text-xs text-gray-500">Pay at table</p></div>
                                        </label>
                                        <label className="payment-option border-2 border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-500 transition">
                                            <input type="radio" name="payment-method" value="online" className="sr-only" />
                                            <div className="text-center"><i className="fas fa-mobile-alt text-2xl text-blue-600 mb-1"></i><p className="text-sm font-medium">Online</p><p className="text-xs text-gray-500">Digital payment</p></div>
                                        </label>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-lg font-semibold">{t('total')}:</span>
                                    <span className="text-2xl font-bold text-blue-600">{currentCurrency === 'INR' ? '₹' : '$'}{cartTotal.toFixed(2)}</span>
                                </div>
                                <button onClick={placeOrder} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 flex items-center justify-center">
                                    <i className="fas fa-check-circle mr-2"></i>{t('placeOrder')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Orders Modal */}
            {
                isOrdersModalOpen && (
                    <div className="fixed inset-0 modal-backdrop z-50 flex items-end sm:items-center justify-center">
                        <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl modal-content shadow-2xl">
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold flex items-center"><i className="fas fa-clipboard-list mr-2 text-blue-600"></i>{t('yourOrders')}</h2>
                                <button onClick={() => setIsOrdersModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl transition"><i className="fas fa-times"></i></button>
                            </div>
                            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                                {customerOrders.length === 0 ? <p className="text-gray-500 text-center py-8">{t('noOrders')}</p> : customerOrders.map(order => {
                                    const statusMap = {
                                        pending: 1,
                                        preparing: 2,
                                        ready: 3,
                                        delivered: 4
                                    };
                                    const currentStep = statusMap[order.order_status] || 0;
                                    const createdTime = new Date(order.created_at).toLocaleString();
                                    const updatedTime = order.updated_at ? new Date(order.updated_at).toLocaleString() : 'N/A';
                                    const symbol = order.currency === 'INR' ? '₹' : '$';
                                    const amount = order[`total_amount_${order.currency.toLowerCase()}`];
                                    return (
                                        <div key={order.id} className="order-item bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-gray-800 text-lg">Your Order <span className="text-gray-400 text-sm font-normal">#{order.id}</span></h4>
                                                    <p className="text-xs text-gray-500">{createdTime}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.order_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    order.order_status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                                                        order.order_status === 'ready' ? 'bg-green-100 text-green-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {order.order_status}
                                                </span>
                                            </div>

                                            <div className="mb-4 space-y-2">
                                                {order.items.map((item, index) => (
                                                    <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-gray-700 bg-white w-6 h-6 flex items-center justify-center rounded shadow-sm text-sm">{item.quantity}</span>
                                                            <span className={`text-sm font-medium ${item.item_status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                                {item.item_name}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {item.item_status === 'cancelled' ? (
                                                                <span className="text-red-500 text-[10px] font-bold border border-red-200 bg-red-50 px-2 py-0.5 rounded">CANCELLED</span>
                                                            ) : (
                                                                ['pending', 'preparing'].includes(order.order_status) && (
                                                                    <button
                                                                        onClick={() => openCancellationModal('item', order.id, item.id)}
                                                                        className="text-gray-400 hover:text-red-500 transition px-2"
                                                                        title="Cancel Item"
                                                                    >
                                                                        <i className="fas fa-times-circle"></i>
                                                                    </button>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-between items-center text-sm font-medium text-gray-600 mb-4 border-t border-gray-100 pt-3">
                                                <span>Total Amount</span>
                                                <span className="text-lg font-bold text-gray-900">{symbol}{parseFloat(amount).toFixed(2)}</span>
                                            </div>

                                            {['pending', 'preparing'].includes(order.order_status) && (
                                                <button
                                                    onClick={() => openCancellationModal('order', order.id)}
                                                    className="w-full mb-4 py-2 rounded-lg text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition flex items-center justify-center gap-2"
                                                >
                                                    <i className="fas fa-ban"></i> Cancel Full Order
                                                </button>
                                            )}

                                            {/* Dynamic Timeline */}
                                            <div className="relative pt-2 pb-4 px-2">
                                                <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 rounded-full"></div>
                                                <div
                                                    className="absolute top-5 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${(currentStep / 4) * 100}%` }}
                                                ></div>

                                                <div className="relative flex justify-between">
                                                    {/* Step 1: Ordered */}
                                                    <div className="flex flex-col items-center group">
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs z-10 transition-colors duration-300 ${currentStep >= 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-200 text-gray-400'}`}>
                                                            <i className="fas fa-clipboard-check"></i>
                                                        </div>
                                                        <span className="text-[10px] font-bold mt-1 text-gray-600">Ordered</span>
                                                        <span className="text-[10px] text-gray-400 font-mono">
                                                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>

                                                    {/* Step 2: Preparing */}
                                                    <div className="flex flex-col items-center group">
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs z-10 transition-colors duration-300 ${currentStep >= 2 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-200 text-gray-400'}`}>
                                                            <i className="fas fa-fire-alt"></i>
                                                        </div>
                                                        <span className="text-[10px] font-bold mt-1 text-gray-600">Cooking</span>
                                                        {currentStep === 2 && (
                                                            <span className="text-[10px] text-indigo-600 font-bold animate-pulse font-mono">
                                                                {getElapsedTime(order.created_at)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Step 3: Ready */}
                                                    <div className="flex flex-col items-center group">
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs z-10 transition-colors duration-300 ${currentStep >= 3 ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-gray-200 text-gray-400'}`}>
                                                            <i className="fas fa-bell"></i>
                                                        </div>
                                                        <span className="text-[10px] font-bold mt-1 text-gray-600">Ready</span>
                                                        {currentStep === 3 && (
                                                            <span className="text-[10px] text-purple-600 font-bold font-mono">
                                                                {getElapsedTime(order.updated_at)} ago
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Step 4: Delivered */}
                                                    <div className="flex flex-col items-center group">
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs z-10 transition-colors duration-300 ${currentStep >= 4 ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'bg-gray-200 text-gray-400'}`}>
                                                            <i className="fas fa-check-double"></i>
                                                        </div>
                                                        <span className="text-[10px] font-bold mt-1 text-gray-600">Enjoy</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer Actions */}
                                            <div className="mt-4 grid grid-cols-2 gap-3">
                                                {order.order_status === 'delivered' && (
                                                    <div className="col-span-2 text-center bg-gray-50 border border-gray-200 rounded-lg p-2 mb-2">
                                                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Wait Time</span>
                                                        <p className="text-sm font-black text-gray-800 font-mono">
                                                            {getTotalWaitTime(order.created_at, order.updated_at)}
                                                        </p>
                                                    </div>
                                                )}

                                                {order.order_status === 'delivered' && !order.has_feedback && (
                                                    <button onClick={() => setFeedbackModal({ show: true, orderId: order.id })} className="col-span-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2">
                                                        <i className="fas fa-star"></i> Rate Food
                                                    </button>
                                                )}

                                                {order.order_status === 'delivered' && (
                                                    <button onClick={() => handleReorder(order)} className={`bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${order.has_feedback ? 'col-span-2' : 'col-span-1'}`}>
                                                        <i className="fas fa-redo"></i> Reorder
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Order Success Modal */}
            {
                showOrderSuccess && (
                    <div className="fixed inset-0 bg-black/50 modal-backdrop z-50 flex items-center justify-center">
                        <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-check text-green-600 text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t('orderSuccess')}</h3>
                            <p className="text-gray-600 mb-4">Order ID: #{orderId}</p>
                            <p className="text-sm text-gray-500 mb-6">{t('orderPrep')}</p>
                            <button onClick={() => setShowOrderSuccess(false)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition">OK</button>
                        </div>
                    </div>
                )
            }

            {/* Feedback Modal */}
            {
                feedbackModal.show && (
                    <div className="fixed inset-0 bg-black/50 modal-backdrop z-50 flex items-center justify-center">
                        <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 w-full">
                            <h3 className="text-xl font-bold mb-4 text-center">Rate Your Order</h3>
                            <p className="text-gray-600 text-center mb-6">How was your food?</p>
                            {/* ... feedback form ... */}
                            <div className="flex justify-center gap-4 mb-6">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button key={star} onClick={() => setFeedbackRating(star)} className={`text-3xl ${star <= feedbackRating ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
                                ))}
                            </div>
                            <textarea
                                value={feedbackComment}
                                onChange={(e) => setFeedbackComment(e.target.value)}
                                placeholder="Any comments? (Optional)"
                                className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-24 resize-none"
                            />
                            <div className="flex gap-3">
                                <button onClick={handleFeedbackSubmit} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium">Submit</button>
                                <button onClick={() => setFeedbackModal({ show: false, orderId: null, items: [] })} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium">Skip</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Table Selection Modal */}
            {
                isTableSelectionModalOpen && (
                    <div className="fixed inset-0 bg-black/80 modal-backdrop z-[60] flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-chair text-blue-600 text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Select Your Table</h3>
                            <p className="text-gray-600 mb-6">Please select the table number you are seated at.</p>

                            <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto mb-6 p-2">
                                {isLoading ? (
                                    <div className="col-span-3 text-center py-4 text-gray-500">Loading tables...</div>
                                ) : (
                                    <>
                                        {tables.map(table => (
                                            <button
                                                key={table.id}
                                                onClick={() => {
                                                    setTableNumber(table.table_number);
                                                    setIsTableSelectionModalOpen(false);
                                                    // Optionally update URL without reload
                                                    navigate(`?table=${table.table_number}`, { replace: true });
                                                }}
                                                className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl p-3 transition flex flex-col items-center justify-center gap-1"
                                            >
                                                <span className="text-lg font-bold text-gray-800">{table.table_number}</span>
                                                <span className="text-[10px] text-gray-500 truncate w-full">{table.table_name || 'Table'}</span>
                                            </button>
                                        ))}
                                    </>
                                )}
                            </div>

                            {!isLoading && tables.length === 0 && (
                                <p className="text-red-500 text-sm mb-4">No tables found. Please contact staff.</p>
                            )}
                        </div>
                    </div>
                )
            }




            {/* Cancellation Modal */}
            {
                cancellationModal.show && (
                    <div className="fixed inset-0 bg-black/50 modal-backdrop z-50 flex items-center justify-center">
                        <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 w-full">
                            <h3 className="text-xl font-bold mb-4 text-red-600">
                                Cancel {cancellationModal.type === 'order' ? 'Order' : 'Item'}
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Are you sure you want to cancel? Please provide a reason.
                            </p>

                            <textarea
                                value={cancellationReason}
                                onChange={(e) => setCancellationReason(e.target.value)}
                                placeholder="Reason for cancellation..."
                                className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                                rows="3"
                            ></textarea>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setCancellationModal({ show: false, type: null, orderId: null, itemId: null })}
                                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleCancellationSubmit}
                                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                >
                                    Confirm Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Toast Notification */}
            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl animate-fade-in-down transition-all ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-900 text-white'
                    }`}>
                    <i className={`fas ${toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'} text-xl`}></i>
                    <span className="font-medium text-sm sm:text-base">{toast.message}</span>
                </div>
            )}

        </>
    );
}

export default CustomerPage;