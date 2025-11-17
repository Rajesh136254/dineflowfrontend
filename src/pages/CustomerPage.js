import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showOrderSuccess, setShowOrderSuccess] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
    const [customerOrders, setCustomerOrders] = useState([]);
    // Add this line with other state variables
    const [categories, setCategories] = useState([]);
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    

    const API_URL = 'http://localhost:5000'; // Backend server URL

    // --- Helper Functions ---
    const generateFoodImageURL = (itemName, imageUrl) => {
        // If we have an image_url from the database, use it
        if (imageUrl) {
            // If it's a relative path, prepend the API URL
            if (imageUrl.startsWith('/uploads/')) {
                return `${API_URL}${imageUrl}`;
            }
            // If it's already a full URL, use it as is
            return imageUrl;
        }
        
        // Fallback to placeholder images if no image_url is available
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
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
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
            const data = await response.json();
            if (data.success) {
                setTables(data.data);
            } else {
                console.error('API Error:', data.message);
            }
        } catch (error) {
            console.error('Error loading tables:', error);
        }
    }, []);
    
    const loadCategories = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/categories`, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            } else {
                // Fallback to default categories if API fails
                setCategories(['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Salad']);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            // Fallback to default categories if API fails
            setCategories(['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Salad']);
        }
    }, []);

        const loadMenu = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/menu`, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Menu error response:', errorText);
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            if (data.success) {
                setMenuItems(data.data);
            } else {
                console.error('API Error:', data.message);
            }
        } catch (error) {
            console.error('Error loading menu:', error);
        } finally {
            setIsLoading(false);
        }
    }, [API_URL]); // Add API_URL as dependency

    const loadCustomerOrders = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/orders?table_number=${tableNumber}`, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                setCustomerOrders(data.data);
            } else {
                console.error('API Error:', data.message);
            }
        } catch (error) {
            console.error('Error loading customer orders:', error);
        }
    }, [tableNumber]);

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
            payment_method: paymentMethod 
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
            } else {
                alert('Failed to place order. Please try again.');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Error placing order. Please try again.');
        }
    };

    // --- Derived State ---
    
    const filteredMenu = menuItems.filter(item => {
        const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || (item.description && item.description.toLowerCase().includes(searchTerm));
        return matchesCategory && matchesSearch;
    });
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => {
        const price = currentCurrency === 'INR' ? item.price_inr : item.price_usd;
        return sum + (price * item.quantity);
    }, 0);

    // --- useEffect Hooks ---
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tableFromUrl = parseInt(urlParams.get('table') || '1');
        setTableNumber(tableFromUrl);
        loadTables();
        loadMenu();
        loadCategories();
    }, [loadTables, loadMenu, loadCategories]);

    useEffect(() => {
        if (isOrdersModalOpen) {
            loadCustomerOrders();
        }
    }, [isOrdersModalOpen, loadCustomerOrders]);

    // --- Render Logic ---
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Cart Bar */}
            <div className="top-cart">
                <div className="gradient-bg text-white p-3 sm:p-4">
                    <div className="container mx-auto">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center mr-2 sm:mr-3">
                                    <i className="fas fa-utensils text-blue-600 text-sm sm:text-base"></i>
                                </div>
                                <div>
                                    <h1 className="text-lg sm:text-2xl font-bold">Menu</h1>
                                    <p className="text-blue-100 text-xs sm:text-sm flex items-center">
                                        <i className="fas fa-chair mr-1"></i> Table #<span>{tableNumber}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4">
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
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search for dishes, ingredients..." className="w-full pl-10 pr-4 py-2 sm:py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-sm sm:text-base input-focus" />
                    </div>
                    <div className="flex gap-2 mb-4">
                        <select value={tableNumber} onChange={(e) => setTableNumber(parseInt(e.target.value))} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm input-focus">
                            {tables.map(table => <option key={table.id} value={table.table_number}>{table.table_name}</option>)}
                        </select>
                    </div>
                    <div className="mb-4 sm:mb-6">
                    <div className="flex gap-2 overflow-x-auto pb-2 px-1 -mx-1 scrollbar-hide">
                        <button 
                            onClick={() => setActiveCategory('all')} 
                            className={`category-pill px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium whitespace-nowrap flex items-center text-xs sm:text-sm flex-shrink-0 ${
                                activeCategory === 'all' ? 'active text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                            <i className="fas fa-border-all mr-1 sm:mr-2"></i>All
                        </button>
                        {categories.map(cat => (
                            <button 
                                key={cat} 
                                onClick={() => setActiveCategory(cat)} 
                                className={`category-pill px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium whitespace-nowrap flex items-center text-xs sm:text-sm flex-shrink-0 ${
                                    activeCategory === cat ? 'active text-white' : 'bg-gray-200 text-gray-700'
                                }`}
                            >
                                <i className="fas fa-utensils mr-1 sm:mr-2"></i>{cat}
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
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">No items found</h3>
                                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                            </div>
                        ) : (
                            filteredMenu.map(item => {
                                const price = currentCurrency === 'INR' ? item.price_inr : item.price_usd;
                                const symbol = currentCurrency === 'INR' ? '₹' : '$';
                                return (
                                    <div key={item.id} className="menu-card bg-white rounded-xl shadow-md overflow-hidden card-shadow">
                                        <div className="relative h-40 sm:h-48 overflow-hidden">
                                            <img src={generateFoodImageURL(item.name, item.image_url)} alt={item.name} className="w-full h-full object-cover food-image" />
                                            <div className="absolute top-2 right-2">
                                                <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">{item.category}</span>
                                            </div>
                                        </div>
                                        <div className="p-3 sm:p-4">
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">{item.name}</h3>
                                            <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{item.description || 'Delicious dish prepared with fresh ingredients'}</p>
                                            <div className="flex justify-between items-center">
                                                <div className="price-tag text-white px-2 sm:px-3 py-1 rounded-full font-bold text-xs sm:text-sm">
                                                    {symbol}{parseFloat(price).toFixed(2)}
                                                </div>
                                                <button onClick={() => addToCart(item.id)} className="btn-add bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg transition duration-200 flex items-center text-xs sm:text-sm">
                                                    <i className="fas fa-plus mr-1"></i> Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
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
            {isCartModalOpen && (
                <div className="fixed inset-0 modal-backdrop z-50 flex items-end sm:items-center justify-center">
                    <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl modal-content shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
                            <h2 className="text-xl font-bold flex items-center"><i className="fas fa-shopping-cart mr-2 text-blue-600"></i>Your Cart</h2>
                            <button onClick={() => setIsCartModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl transition"><i className="fas fa-times"></i></button>
                        </div>
                        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                            {cart.length === 0 ? <p className="text-gray-500 text-center py-8">Your cart is empty</p> : cart.map(item => {
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
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center"><i className="fas fa-credit-card mr-2"></i>Payment Method</label>
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
                                <span className="text-lg font-semibold">Total:</span>
                                <span className="text-2xl font-bold text-blue-600">{currentCurrency === 'INR' ? '₹' : '$'}{cartTotal.toFixed(2)}</span>
                            </div>
                            <button onClick={placeOrder} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 flex items-center justify-center">
                                <i className="fas fa-check-circle mr-2"></i>Place Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Orders Modal */}
            {isOrdersModalOpen && (
                <div className="fixed inset-0 modal-backdrop z-50 flex items-end sm:items-center justify-center">
                    <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl modal-content shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
                            <h2 className="text-xl font-bold flex items-center"><i className="fas fa-clipboard-list mr-2 text-blue-600"></i>Your Orders</h2>
                            <button onClick={() => { setIsOrdersModalOpen(false); setCustomerOrders([]); }} className="text-gray-500 hover:text-gray-700 text-2xl transition"><i className="fas fa-times"></i></button>
                        </div>
                        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                            {customerOrders.length === 0 ? <p className="text-gray-500 text-center py-8">No orders placed yet</p> : customerOrders.map(order => {
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
                                        <div className="mb-2">
                                            {order.items.map((item, index) => (
                                                <div key={index} className="text-sm">{item.quantity}x {item.item_name}</div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span>Total: {symbol}{parseFloat(amount).toFixed(2)}</span>
                                            <span>Payment: {order.payment_method}</span>
                                        </div>
                                        <div className="timeline flex justify-between items-center relative">
                                            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-300 -translate-y-1/2"></div>
                                            <div className="absolute top-1/2 left-0 w-full h-1 bg-blue-600 -translate-y-1/2" style={{width: `${(currentStep / 4) * 100}%`}}></div>
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
            )}

            {/* Order Success Modal */}
            {showOrderSuccess && (
                <div className="fixed inset-0 bg-black/50 modal-backdrop z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-check text-green-600 text-2xl"></i>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Order Placed Successfully!</h3>
                        <p className="text-gray-600 mb-4">Order ID: #{orderId}</p>
                        <p className="text-sm text-gray-500 mb-6">Your order will be prepared shortly</p>
                        <button onClick={() => setShowOrderSuccess(false)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition">OK</button>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            <div id="toast" className={`toast ${showToast ? 'show' : ''}`}>
                <i className="fas fa-check-circle"></i>
                <span id="toast-message">Item added to cart!</span>
            </div>
        </div>
    );
}

export default CustomerPage;