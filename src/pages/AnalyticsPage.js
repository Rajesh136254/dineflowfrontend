/* global Chart */
import React, { useState, useLayoutEffect, useRef, useCallback } from 'react';
const formatCurrency = (value) => {
  const num = Number(value);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const formatNumber = (value) => {
  const num = Number(value);
  return isNaN(num) ? '0' : num.toLocaleString();
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';


function AnalyticsPage() {
    const [currentCurrency, setCurrentCurrency] = useState('INR');
    const [timePeriod, setTimePeriod] = useState('daily');
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const revenueChartRef = useRef(null);
    const ordersChartRef = useRef(null);
    const categoryChartRef = useRef(null);
    const paymentChartRef = useRef(null);
    const hourlyChartRef = useRef(null);
    const itemsChartRef = useRef(null);
    
    const revenueChartInstance = useRef(null);
    const ordersChartInstance = useRef(null);
    const categoryChartInstance = useRef(null);
    const paymentChartInstance = useRef(null);
    const hourlyChartInstance = useRef(null);
    const itemsChartInstance = useRef(null);

    // Fetch analytics data from API
   // Replace the entire fetchAnalyticsData function in AnalyticsPage.js with this version
const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
        // Fetch all required data
        const [summaryRes, revenueOrdersRes, topItemsRes, categoryRes, paymentRes, tableRes, hourlyRes] = await Promise.all([
            fetch(`${API_URL}/api/analytics/summary?period=${timePeriod}&currency=${currentCurrency}`),
            fetch(`${API_URL}/api/analytics/revenue-orders?period=${timePeriod}&currency=${currentCurrency}`),
            fetch(`${API_URL}/api/analytics/top-items?period=${timePeriod}&currency=${currentCurrency}`),
            fetch(`${API_URL}/api/analytics/category-performance?period=${timePeriod}&currency=${currentCurrency}`),
            fetch(`${API_URL}/api/analytics/payment-methods?period=${timePeriod}`),
            fetch(`${API_URL}/api/analytics/table-performance?period=${timePeriod}&currency=${currentCurrency}`),
            fetch(`${API_URL}/api/analytics/hourly-orders?period=${timePeriod}`)
        ]);

        // Check if responses are OK
        if (!summaryRes.ok) {
            throw new Error(`Summary API error: ${summaryRes.status}`);
        }
        if (!revenueOrdersRes.ok) {
            throw new Error(`Revenue/Orders API error: ${revenueOrdersRes.status}`);
        }
        if (!topItemsRes.ok) {
            throw new Error(`Top Items API error: ${topItemsRes.status}`);
        }
        if (!categoryRes.ok) {
            throw new Error(`Category API error: ${categoryRes.status}`);
        }
        if (!paymentRes.ok) {
            throw new Error(`Payment Methods API error: ${paymentRes.status}`);
        }
        if (!tableRes.ok) {
            throw new Error(`Table Performance API error: ${tableRes.status}`);
        }
        if (!hourlyRes.ok) {
            throw new Error(`Hourly Orders API error: ${hourlyRes.status}`);
        }

        // Parse JSON responses
        const summaryResponse = await summaryRes.json();
        const revenueOrdersResponse = await revenueOrdersRes.json();
        const topItemsResponse = await topItemsRes.json();
        const categoriesResponse = await categoryRes.json();
        const paymentResponse = await paymentRes.json();
        const tableResponse = await tableRes.json();
        const hourlyResponse = await hourlyRes.json();

        // Extract data from the response format
        const summary = summaryResponse.success ? summaryResponse.data : {};
        const revenueOrders = revenueOrdersResponse.success ? revenueOrdersResponse.data : [];
        const topItems = topItemsResponse.success ? topItemsResponse.data : [];
        const categories = categoriesResponse.success ? categoriesResponse.data : [];
        const paymentMethods = paymentResponse.success ? paymentResponse.data : {};
        const tablePerformance = tableResponse.success ? tableResponse.data : [];
        const hourlyOrders = hourlyResponse.success ? hourlyResponse.data : [];

        setAnalyticsData({
            summary,
            daily: revenueOrders,
            items: topItems,
            categories,
            payment_methods: paymentMethods,
            table_performance: tablePerformance,
            hourly_orders: hourlyOrders
        });
    } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(err.message);
    } finally {
        setLoading(false);
    }
}, [timePeriod, currentCurrency]);

    // Initialize charts
    const initializeCharts = useCallback(() => {
        if (typeof window.Chart === 'undefined') return;

        const chartOptions = { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { display: false } 
            } 
        };

        // Revenue Chart
        if (revenueChartRef.current && !revenueChartInstance.current) {
            revenueChartInstance.current = new Chart(revenueChartRef.current, {
                type: 'line',
                data: { 
                    labels: [], 
                    datasets: [{ 
                        label: 'Revenue', 
                        data: [], 
                        borderColor: '#f97316', 
                        backgroundColor: 'rgba(249, 115, 22, 0.1)', 
                        tension: 0.4, 
                        fill: true 
                    }] 
                },
                options: chartOptions
            });
        }

        // Orders Chart
        if (ordersChartRef.current && !ordersChartInstance.current) {
            ordersChartInstance.current = new Chart(ordersChartRef.current, {
                type: 'bar',
                data: { 
                    labels: [], 
                    datasets: [{ 
                        label: 'Orders', 
                        data: [], 
                        backgroundColor: '#3b82f6' 
                    }] 
                },
                options: chartOptions
            });
        }

        // Category Chart
        if (categoryChartRef.current && !categoryChartInstance.current) {
            categoryChartInstance.current = new Chart(categoryChartRef.current, {
                type: 'doughnut',
                data: { 
                    labels: [], 
                    datasets: [{ 
                        data: [], 
                        backgroundColor: ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'] 
                    }] 
                },
                options: { 
                    ...chartOptions, 
                    plugins: { 
                        legend: { position: 'bottom' } 
                    } 
                }
            });
        }

        // Payment Methods Chart
        if (paymentChartRef.current && !paymentChartInstance.current) {
            paymentChartInstance.current = new Chart(paymentChartRef.current, {
                type: 'doughnut',
                data: { 
                    labels: ['Cash', 'Online'], 
                    datasets: [{ 
                        data: [0, 0], 
                        backgroundColor: ['#10b981', '#3b82f6'] 
                    }] 
                },
                options: { 
                    ...chartOptions, 
                    plugins: { 
                        legend: { position: 'bottom' } 
                    } 
                }
            });
        }

        // Hourly Orders Chart
        if (hourlyChartRef.current && !hourlyChartInstance.current) {
            hourlyChartInstance.current = new Chart(hourlyChartRef.current, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Orders',
                        data: [],
                        backgroundColor: '#8b5cf6'
                    }]
                },
                options: {
                    ...chartOptions,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Hour of Day'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Number of Orders'
                            }
                        }
                    }
                }
            });
        }

        // Top Items Chart
        if (itemsChartRef.current && !itemsChartInstance.current) {
            itemsChartInstance.current = new Chart(itemsChartRef.current, {
                type: 'horizontalBar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Quantity Sold',
                        data: [],
                        backgroundColor: '#ec4899'
                    }]
                },
                options: {
                    ...chartOptions,
                    indexAxis: 'y',
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Quantity Sold'
                            }
                        }
                    }
                }
            });
        }
    }, []);

    // Update charts with new data
    const updateCharts = useCallback((data) => {
        if (!data || typeof window.Chart === 'undefined') return;

        // Update Revenue and Orders Charts
        if (data.daily) {
            const labels = data.daily.map(d => d.date);
            const revenueData = data.daily.map(d => d[`revenue_${currentCurrency.toLowerCase()}`]);
            const ordersData = data.daily.map(d => d.orders);

            if (revenueChartInstance.current) {
                revenueChartInstance.current.data.labels = labels;
                revenueChartInstance.current.data.datasets[0].data = revenueData;
                revenueChartInstance.current.update();
            }
            if (ordersChartInstance.current) {
                ordersChartInstance.current.data.labels = labels;
                ordersChartInstance.current.data.datasets[0].data = ordersData;
                ordersChartInstance.current.update();
            }
        }

        // Update Category Chart
        if (data.categories && categoryChartInstance.current) {
            categoryChartInstance.current.data.labels = data.categories.map(c => c.category);
            categoryChartInstance.current.data.datasets[0].data = data.categories.map(c => c.total_orders);
            categoryChartInstance.current.update();
        }

        // Update Payment Methods Chart
        if (data.payment_methods && paymentChartInstance.current) {
            const labels = Object.keys(data.payment_methods);
            const values = Object.values(data.payment_methods);
            
            paymentChartInstance.current.data.labels = labels;
            paymentChartInstance.current.data.datasets[0].data = values;
            paymentChartInstance.current.update();
        }

        // Update Hourly Orders Chart
        if (data.hourly_orders && hourlyChartInstance.current) {
            hourlyChartInstance.current.data.labels = data.hourly_orders.map(h => h.hour_label);
            hourlyChartInstance.current.data.datasets[0].data = data.hourly_orders.map(h => h.orders);
            hourlyChartInstance.current.update();
        }

        // Update Top Items Chart
        if (data.items && itemsChartInstance.current) {
            itemsChartInstance.current.data.labels = data.items.slice(0, 5).map(i => i.item_name);
            itemsChartInstance.current.data.datasets[0].data = data.items.slice(0, 5).map(i => i.quantity_sold);
            itemsChartInstance.current.update();
        }
    }, [currentCurrency]);

    // Initialize charts on mount
    useLayoutEffect(() => {
        initializeCharts();
        fetchAnalyticsData();

        return () => {
            // Clean up chart instances
            [
                revenueChartInstance,
                ordersChartInstance,
                categoryChartInstance,
                paymentChartInstance,
                hourlyChartInstance,
                itemsChartInstance
            ].forEach(chart => {
                if (chart.current) chart.current.destroy();
            });
        };
    }, []);

    // Update charts when data changes
    useLayoutEffect(() => {
        updateCharts(analyticsData);
    }, [analyticsData, currentCurrency, updateCharts]);

    // Refetch data when time period or currency changes
    useLayoutEffect(() => {
        fetchAnalyticsData();
    }, [timePeriod, currentCurrency, fetchAnalyticsData]);

    const renderMetricCard = (title, value, icon, trend = null) => (
        <div className="stat-card bg-white rounded-xl shadow-lg p-4 sm:p-6 hover-lift">
            <div className="flex items-center justify-between mb-3">
                <div className="stat-icon w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <i className={`fas ${icon} text-orange-600 text-xl`}></i>
                </div>
                {trend && (
                    <div className="flex items-center text-sm">
                        <span className={trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : 'trend-neutral'}>
                            <i className={`fas fa-arrow-${trend > 0 ? 'up' : trend < 0 ? 'down' : 'right'}`}></i>
                        </span>
                        <span className="ml-1 text-gray-600">{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-600">{title}</p>
        </div>
    );

    const renderTimePeriodButtons = () => (
        <div className="flex flex-wrap gap-2 mb-6">
            {['daily', 'weekly', 'monthly', 'yearly'].map(period => (
                <button
                    key={period}
                    className={`period-btn px-4 py-2 rounded-lg font-medium transition ${
                        timePeriod === period 
                            ? 'bg-orange-500 text-white active' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setTimePeriod(period)}
                >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
            ))}
        </div>
    );

    const renderLoadingState = () => (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
    );

    const renderErrorState = () => (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
                <i className="fas fa-exclamation-circle mr-2"></i>
                <p>Error loading analytics data: {error}</p>
            </div>
            <button 
                className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                onClick={fetchAnalyticsData}
            >
                Try Again
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="gradient-bg text-white p-4 sm:p-6">
                <div className="container mx-auto">
                    <div className="header-content flex justify-between items-start sm:items-center">
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center">
                                <i className="fas fa-chart-line mr-2 sm:mr-3"></i>
                                Analytics Dashboard
                            </h1>
                            <p className="text-orange-100 text-sm sm:text-base mt-1">
                                Real-time Business Insights & Performance Metrics
                            </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                                <select 
                                    value={currentCurrency} 
                                    onChange={(e) => setCurrentCurrency(e.target.value)} 
                                    className="bg-transparent text-white px-3 py-1 rounded-lg border-none outline-none text-sm sm:text-base"
                                >
                                    <option value="INR" className="text-gray-800">₹ INR</option>
                                    <option value="USD" className="text-gray-800">$ USD</option>
                                </select>
                            </div>
                            <button 
                                onClick={() => alert('Exported!')} 
                                className="bg-white/20 backdrop-blur-sm rounded-lg p-2 hover:bg-white/30 transition"
                            >
                                <i className="fas fa-download text-white"></i>
                            </button>
                            <button 
                                onClick={fetchAnalyticsData} 
                                className="bg-white/20 backdrop-blur-sm rounded-lg p-2 hover:bg-white/30 transition"
                            >
                                <i className="fas fa-sync-alt text-white"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {renderTimePeriodButtons()}
                
                {loading && renderLoadingState()}
                {error && renderErrorState()}
                
                {!loading && !error && analyticsData && (
                    <>
                        <div className="stats-grid grid gap-4 mb-6">
                            {renderMetricCard(
                                'Total Orders', 
                                analyticsData?.summary.total_orders || 0, 
                                'fa-shopping-cart'
                            )}
                            {renderMetricCard(
                                'Total Revenue', 
                                `${currentCurrency === 'INR' ? '₹' : '$'}${formatCurrency(analyticsData?.summary[`total_revenue_${currentCurrency.toLowerCase()}`])}`, 
                                'fa-dollar-sign'
                            )}
                            {renderMetricCard(
                                'Tables Served', 
                                analyticsData?.summary.tables_served || 0, 
                                'fa-chair'
                            )}
                            {renderMetricCard(
                                'Avg Order Value', 
                                `${currentCurrency === 'INR' ? '₹' : '$'}${formatCurrency(analyticsData?.summary.avg_order_value)}`, 
                                'fa-receipt'
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 fade-in">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Trend</h3>
                                <div className="chart-container">
                                    <canvas ref={revenueChartRef}></canvas>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 fade-in">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Orders Distribution</h3>
                                <div className="chart-container">
                                    <canvas ref={ordersChartRef}></canvas>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 fade-in">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Top Selling Items</h3>
                                <div className="chart-container mb-4">
                                    <canvas ref={itemsChartRef}></canvas>
                                </div>
                                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                                    {analyticsData?.items.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                            <div className="flex items-center">
                                                <span className="text-lg font-bold text-gray-500 mr-3">{index + 1}</span>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{item.item_name}</p>
                                                    <p className="text-xs text-gray-500">{item.category}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-orange-600">
                                                    {currentCurrency === 'INR' ? '₹' : '$'}
                                                    {formatCurrency(item[`revenue_${currentCurrency.toLowerCase()}`])}
                                                </p>
                                                <p className="text-xs text-gray-500">{item.quantity_sold} items</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 fade-in">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Category Performance</h3>
                                <div className="chart-container">
                                    <canvas ref={categoryChartRef}></canvas>
                                </div>
                                <div className="mt-4 space-y-3">
                                    {analyticsData?.categories.map((category, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <p className="font-semibold text-gray-900">{category.category}</p>
                                            <div className="text-right">
                                                <p className="font-bold text-blue-600">{category.total_orders} orders</p>
                                                <p className="text-xs text-gray-500">{category.total_items} items</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 fade-in">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Methods</h3>
                                <div className="chart-container">
                                    <canvas ref={paymentChartRef}></canvas>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 fade-in">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Hourly Order Distribution</h3>
                                <div className="chart-container">
                                    <canvas ref={hourlyChartRef}></canvas>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 fade-in">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Table Performance</h3>
                            <div className="overflow-x-auto">
                                <table className="data-table w-full">
                                    <thead>
                                        <tr>
                                            <th>Table</th>
                                            <th>Orders</th>
                                            <th>Revenue</th>
                                            <th>Avg Order Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analyticsData?.table_performance.map((table, index) => (
                                            <tr key={index}>
                                                <td>{table.table_name}</td>
                                                <td>{table.total_orders}</td>
                                                <td>
                                                    {currentCurrency === 'INR' ? '₹' : '$'}
                                                    {formatCurrency(table[`total_revenue_${currentCurrency.toLowerCase()}`])}
                                                </td>
                                                <td>
                                                    {currentCurrency === 'INR' ? '₹' : '$'}
                                                    {formatCurrency(table[`avg_order_value_${currentCurrency.toLowerCase()}`])}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default AnalyticsPage;