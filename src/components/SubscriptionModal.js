import React, { useState } from 'react';
import { load } from '@cashfreepayments/cashfree-js';

function SubscriptionModal({ isOpen, onClose }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

    const handlePayment = async (planType, amount) => {
        setLoading(true);
        setError('');

        try {
            const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
            const cashfree = await load({
                mode: isProduction ? "production" : "sandbox"
            });

            // 2. Create Order on Backend
            const token = localStorage.getItem('token'); // Simplest token retrieval
            const res = await fetch(`${API_URL}/api/payment/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ plan_type: planType, amount: amount })
            });

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to create order');
            }

            // 3. Initiate Checkout
            const checkoutOptions = {
                paymentSessionId: data.payment_session_id,
                redirectTarget: "_self" // Redirects to return_url configured in backend
            };

            cashfree.checkout(checkoutOptions);

        } catch (err) {
            console.error("Payment Error:", err);
            setError(err.message || 'Something went wrong during payment initialization.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden relative z-10 animate-fade-in-up flex flex-col md:flex-row">

                {/* Left Side: Benefits */}
                <div className="bg-gradient-to-br from-indigo-900 to-purple-800 p-8 text-white md:w-2/5 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-repeat" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>

                    <div>
                        <h2 className="text-3xl font-bold mb-2">Upgrade to Pro</h2>
                        <p className="opacity-80 mb-8">Unlock the full potential of your restaurant.</p>

                        <ul className="space-y-4">
                            {[
                                'Unlimited Orders & Menu Items',
                                'Advanced Analytics & Reports',
                                'Kitchen Display System (KDS)',
                                'Ingredient & Inventory Tracking',
                                'Priority 24/7 Support',
                                'Staff Attendance & Payroll'
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-center space-x-3">
                                    <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center flex-shrink-0">
                                        <i className="fas fa-check text-indigo-900 text-xs"></i>
                                    </div>
                                    <span className="font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-8 text-xs opacity-60">
                        Secure payments processed by Cashfree. <br />Cancel anytime.
                    </div>
                </div>

                {/* Right Side: Plans */}
                <div className="p-8 md:w-3/5 bg-gray-50">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800">Select a Plan</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100 flex items-center">
                            <i className="fas fa-exclamation-circle mr-2"></i>
                            {error}
                        </div>
                    )}

                    <div className="grid gap-4">
                        {/* Monthly Plan */}
                        <div className="border-2 border-indigo-100 hover:border-indigo-500 rounded-2xl p-4 cursor-pointer transition-all bg-white group relative" onClick={() => handlePayment('monthly', 1)}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-lg text-gray-800">Monthly</h4>
                                    <p className="text-sm text-gray-500">Billed monthly</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-indigo-600">₹1<span className="text-sm font-normal text-gray-400">/mo</span></div>
                                    <div className="text-xs text-gray-400 line-through">₹999</div>
                                </div>
                            </div>
                            <div className="mt-3 w-full bg-indigo-50 text-indigo-600 font-bold py-2 rounded-lg text-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Choose Monthly'}
                            </div>
                        </div>

                        {/* Yearly Plan */}
                        <div className="border-2 border-purple-100 hover:border-purple-500 rounded-2xl p-4 cursor-pointer transition-all bg-white group relative relative overflow-hidden" onClick={() => handlePayment('yearly', 10)}>
                            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10">BEST VALUE</div>

                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-lg text-gray-800">Yearly</h4>
                                    <p className="text-sm text-gray-500">Billed annually</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-purple-600">₹10<span className="text-sm font-normal text-gray-400">/yr</span></div>
                                    <div className="text-xs text-gray-400 line-through">₹9999</div>
                                </div>
                            </div>
                            <div className="mt-3 w-full bg-purple-50 text-purple-600 font-bold py-2 rounded-lg text-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Choose Yearly'}
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-gray-400 text-xs mt-6">
                        <i className="fas fa-lock mr-1"></i> Your payment details are encrypted and secure.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SubscriptionModal;
