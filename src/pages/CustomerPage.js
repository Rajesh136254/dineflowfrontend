import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const API_URL = process.env.REACT_APP_API_URL;

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
        return parseInt(searchParams.get('table') || '1');
    });
    const [tables, setTables] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeVitamin, setActiveVitamin] = useState('all');
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showOrderSuccess, setShowOrderSuccess] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
    const [customerOrders, setCustomerOrders] = useState([]);
    const [categories, setCategories] = useState([]);
    const { currentUser, logout, token } = useAuth();
    const navigate = useNavigate();
    const { t, language, changeLanguage } = useLanguage();
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

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

    const getAuthHeaders = () => {
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    // --- Data Loading Functions ---
    const loadTables = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/tables`, {
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
                setTables(data.data);
            } else {
                console.error('API Error:', data.message);
            }
        } catch (error) {
            console.error('Error loading tables:', error);
        }
    }, [logout]);

    const loadCategories = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/categories`, {
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
    }, [logout]);

    const loadMenu = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/menu`, {
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
    }, [logout]);

    const loadCustomerOrders = useCallback(async () => {
        if (!token) return; // Don't fetch orders if not logged in
        try {
            const customerIdParam = currentUser?.id ? `&customer_id=${currentUser.id}` : '';
            const response = await fetch(`${API_URL}/api/orders?table_number=${tableNumber}${customerIdParam}`, {
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
    }, [tableNumber, currentUser, token]);

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
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
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
            customer_id: currentUser?.id
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
            } else {
                alert('Failed to place order. Please try again.');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Error placing order. Please try again.');
        }
    };

    // --- Cancellation Handlers ---
    const openCancellationModal = (type, orderId, itemId = null) => {
        setCancellationModal({ show: true, type, orderId, itemId });
        setCancellationReason('');
    };

    const handleCancellationSubmit = async () => {
        if (!cancellationReason.trim()) {
            alert('Please provide a reason for cancellation');
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
                alert(type === 'order' ? 'Order cancelled successfully' : 'Item cancelled successfully');
                setCancellationModal({ show: false, type: null, orderId: null, itemId: null });
                loadCustomerOrders(); // Refresh orders
            } else {
                alert(data.message || 'Cancellation failed');
            }
        } catch (error) {
            console.error('Error cancelling:', error);
            alert('Failed to process cancellation');
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
                alert('Thank you for your feedback!');
            } else {
                alert(data.message || 'Failed to submit feedback');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
    };

    // --- Derived State ---

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
    useEffect(() => {
        const tableFromUrl = parseInt(searchParams.get('table') || '1');
        setTableNumber(tableFromUrl);
        loadTables();
        loadMenu();
        loadCategories();
    }, [searchParams, loadTables, loadMenu, loadCategories]);

    return (
        <>
            <div className="top-cart">
                <div className="gradient-bg text-white p-3 sm:p-4">
                    <div className="container mx-auto">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center mr-2 sm:mr-3">
                                    <i className="fas fa-utensils text-blue-600 text-sm sm:text-base"></i>
                                </div>
                                <div>
                                    <h1 className="text-lg sm:text-2xl font-bold">{t('menu')}</h1>
                                    <p className="text-blue-100 text-xs sm:text-sm flex items-center">
                                        <i className="fas fa-chair mr-1"></i> {t('table')} #<span>{tableNumber}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                                        className="bg-white/20 backdrop-blur-sm rounded-lg p-1 sm:p-2 flex items-center gap-1 text-xs sm:text-sm"
                                    >
                                        <i className="fas fa-globe"></i>
                                        {language.toUpperCase()}
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
                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1 sm:p-2">
                                    <select value={currentCurrency} onChange={(e) => setCurrentCurrency(e.target.value)} className="bg-transparent text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg border-none outline-none text-xs sm:text-sm">
                                        <option value="INR" className="text-gray-800">₹ INR</option>
                                        <option value="USD" className="text-gray-800">$ USD</option>
                                    </select>
                                </div>
                                <button onClick={() => setIsOrdersModalOpen(true)} className="bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-3 hover:bg-white/30 transition">
                                    <i className="fas fa-clipboard-list text-white"></i>
                                </button>
                                <button onClick={() => setIsCartModalOpen(true)} className="bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-3 hover:bg-white/30 transition relative">
                                    <i className="fas fa-shopping-cart text-white"></i>
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center cart-badge">{cartCount}</span>
                                </button>
                                <button onClick={handleLogout} className="bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-3 hover:bg-white/30 transition">
                                    <i className="fas fa-sign-out-alt text-white"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {/* Search and Filter Section */}
                <div className="mb-4 sm:mb-6">
                    <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i className="fas fa-search text-gray-400"></i>
                        </div>
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('search')} className="w-full pl-10 pr-4 py-2 sm:py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-sm sm:text-base input-focus" />
                    </div>
                    <div className="flex gap-2 mb-4">
                        <select value={tableNumber} onChange={(e) => setTableNumber(parseInt(e.target.value))} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm input-focus">
                            {tables.map(table => <option key={table.id} value={table.table_number}>{table.table_name}</option>)}
                        </select>
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
                                <button onClick={() => { setIsOrdersModalOpen(false); setCustomerOrders([]); }} className="text-gray-500 hover:text-gray-700 text-2xl transition"><i className="fas fa-times"></i></button>
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
                                        <div key={order.id} className="order-item bg-gray-50 rounded-lg p-3">
                                            <h4 className="font-semibold mb-2">Order #{order.id} - {createdTime}</h4>
                                            <div className="mb-2 space-y-1">
                                                {order.items.map((item, index) => (
                                                    <div key={index} className="text-sm flex justify-between items-center">
                                                        <span>{item.quantity}x {item.item_name}</span>
                                                        {['pending', 'preparing'].includes(order.order_status) && item.item_status !== 'cancelled' && (
                                                            <button
                                                                onClick={() => openCancellationModal('item', order.id, item.id)}
                                                                className="text-red-500 text-xs hover:text-red-700 underline ml-2"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                        {item.item_status === 'cancelled' && (
                                                            <span className="text-red-500 text-xs italic ml-2">Cancelled</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span>Total: {symbol}{parseFloat(amount).toFixed(2)}</span>
                                                <span>Payment: {order.payment_method}</span>
                                            </div>
                                            {['pending', 'preparing'].includes(order.order_status) && (
                                                <button
                                                    onClick={() => openCancellationModal('order', order.id)}
                                                    className="w-full mb-3 bg-red-50 text-red-600 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition border border-red-100"
                                                >
                                                    Cancel Order
                                                </button>
                                            )}
                                            <div className="timeline flex justify-between items-center relative">
                                                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-300 -translate-y-1/2"></div>
                                                <div className="absolute top-1/2 left-0 w-full h-1 bg-blue-600 -translate-y-1/2" style={{ width: `${(currentStep / 4) * 100}%` }}></div>
                                                <div className={`step z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                                    <i className="fas fa-clock"></i>
                                                </div>
                                                <div className={`step z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                                    <i className="fas fa-fire"></i>
                                                </div>
                                                <div className={`step z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                                    <i className="fas fa-check"></i>
                                                </div>
                                                <div className={`step z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs ${currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                                    <i className="fas fa-truck"></i>
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-xs mt-1">
                                                <span>Ordered</span>
                                                <span>Preparing</span>
                                                <span>Ready</span>
                                                <span>Delivered</span>
                                            </div>
                                            <div className="text-xs text-center mt-2">
                                                Current Status: {order.order_status.toUpperCase()} at {updatedTime}
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

                            <div className="flex justify-center gap-2 mb-6">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => setFeedbackRating(star)}
                                        className={`text-3xl transition ${star <= feedbackRating ? 'text-yellow-400' : 'text-gray-300'}`}
                                    >
                                        <i className="fas fa-star"></i>
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={feedbackComment}
                                onChange={(e) => setFeedbackComment(e.target.value)}
                                placeholder="Any comments or suggestions?"
                                className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                rows="3"
                            ></textarea>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setFeedbackModal({ show: false, orderId: null, items: [] })}
                                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={handleFeedbackSubmit}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Submit
                                </button>
                            </div>
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
            <div id="toast" className={`toast ${showToast ? 'show' : ''}`}>
                <i className="fas fa-check-circle"></i>
                <span id="toast-message">{t('itemAdded')}</span>
            </div>

        </>
    );
}

export default CustomerPage;