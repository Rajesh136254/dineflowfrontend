import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBranch } from '../contexts/BranchContext';
import Chart from 'chart.js/auto';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import BranchSelector from '../components/BranchSelector';

function AnalyticsPage() {
    const { token, logout } = useAuth();
    const [timePeriod, setTimePeriod] = useState('daily');
    const [currentCurrency, setCurrentCurrency] = useState('INR');
    const [analyticsData, setAnalyticsData] = useState(null);
    const [previousPeriodData, setPreviousPeriodData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
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

    // Refs for chart canvases
    const revenueChartRef = useRef(null);
    const ordersChartRef = useRef(null);
    const categoryChartRef = useRef(null);
    const paymentChartRef = useRef(null);
    const itemsChartRef = useRef(null);
    const customerChartRef = useRef(null);
    const hourlyChartRef = useRef(null);
    const tableChartRef = useRef(null);

    // Refs for chart instances to destroy them properly
    const revenueChartInstance = useRef(null);
    const ordersChartInstance = useRef(null);
    const categoryChartInstance = useRef(null);
    const paymentChartInstance = useRef(null);
    const itemsChartInstance = useRef(null);
    const customerChartInstance = useRef(null);
    const hourlyChartInstance = useRef(null);
    const tableChartInstance = useRef(null);

    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : (process.env.REACT_APP_API_URL || 'https://dineflowbackend.onrender.com');

    const formatCurrency = (value, currency) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(value);
    };

    // Function to download table data as CSV
    const downloadTableData = () => {
        if (!analyticsData?.tablePerformance) return;

        try {
            const headers = ['Table', 'Orders', 'Revenue', 'Avg Order Value'];
            const rows = analyticsData.tablePerformance.map(table => [
                table.table_name,
                table.total_orders,
                formatCurrency(table[`total_revenue_${currentCurrency.toLowerCase()}`], currentCurrency),
                formatCurrency(table[`avg_order_value_${currentCurrency.toLowerCase()}`], currentCurrency)
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `table-performance-${timePeriod}-${currentCurrency}.csv`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading table data:", error);
            alert("Failed to download table data.");
        }
    };

    // Function to download Excel Report
    const downloadExcelReport = () => {
        if (!analyticsData) {
            alert("No data available to download.");
            return;
        }

        try {
            const wb = XLSX.utils.book_new();

            // Helper to add sheet
            const addSheet = (data, name) => {
                if (data && data.length > 0) {
                    const ws = XLSX.utils.json_to_sheet(data);
                    XLSX.utils.book_append_sheet(wb, ws, name);
                }
            };

            addSheet([analyticsData.summary], "Summary");
            addSheet(analyticsData.revenueOrders, "Revenue & Orders");
            addSheet(analyticsData.topItems, "Top Items");
            addSheet(analyticsData.categories, "Categories");

            // Payment methods needs transformation
            if (analyticsData.paymentMethods) {
                const paymentData = Object.entries(analyticsData.paymentMethods).map(([method, count]) => ({ Method: method, Orders: count }));
                addSheet(paymentData, "Payment Methods");
            }

            addSheet(analyticsData.hourlyOrders, "Hourly Orders");
            addSheet(analyticsData.tablePerformance, "Table Performance");

            if (analyticsData.customerRetention) {
                addSheet([analyticsData.customerRetention], "Customer Retention");
            }

            XLSX.writeFile(wb, `Analytics_Report_${timePeriod}_${currentCurrency}.xlsx`);
        } catch (error) {
            console.error("Error downloading Excel report:", error);
            alert("Failed to generate Excel report. Please check the console for details.");
        }
    };

    // Function to download PDF Report
    const downloadPDFReport = async () => {
        const element = document.getElementById('analytics-dashboard-content');
        if (!element) {
            alert("Dashboard content not found.");
            return;
        }

        const originalCursor = document.body.style.cursor;
        document.body.style.cursor = 'wait';

        try {
            const canvas = await html2canvas(element, {
                scale: 3, // Increased scale for better quality
                useCORS: true,
                logging: false,
                allowTaint: true,
                backgroundColor: null // Use actual background color
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Analytics_Report_${timePeriod}.pdf`);
        } catch (err) {
            console.error("PDF Generation Error:", err);
            alert("Failed to generate PDF report. Please check the console for details.");
        } finally {
            document.body.style.cursor = originalCursor;
        }
    };

    // Function to download individual chart data
    const downloadChartData = (data, filename) => {
        if (!data) {
            alert("No data to download.");
            return;
        }
        try {
            const wb = XLSX.utils.book_new();
            // Handle object data (like payment methods)
            let sheetData = data;
            if (!Array.isArray(data) && typeof data === 'object') {
                sheetData = Object.entries(data).map(([k, v]) => ({ Label: k, Value: v }));
            } else if (!Array.isArray(data)) {
                sheetData = [data];
            }

            const ws = XLSX.utils.json_to_sheet(sheetData);
            XLSX.utils.book_append_sheet(wb, ws, "Data");
            XLSX.writeFile(wb, `${filename}.xlsx`);
        } catch (error) {
            console.error("Error downloading chart data:", error);
            alert("Failed to download chart data.");
        }
    };

    // Function to download chart image
    const downloadChart = (chartRef, filename) => {
        if (chartRef.current) {
            const link = document.createElement('a');
            link.download = filename;
            link.href = chartRef.current.toDataURL('image/png');
            link.click();
        }
    };

    // Fetch analytics data from API
    const fetchAnalyticsData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);

        const authFetch = async (url) => {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.status === 401 || res.status === 403) {
                logout();
                throw new Error('Unauthorized');
            }
            return res;
        };

        try {
            const branchQuery = selectedBranch ? `&branch_id=${selectedBranch}` : '';
            const [summaryRes, revenueOrdersRes, topItemsRes, categoryRes, paymentRes, tableRes, hourlyRes, customerRes] = await Promise.all([
                authFetch(`${API_URL}/api/analytics/summary?period=${timePeriod}&currency=${currentCurrency}${branchQuery}`),
                authFetch(`${API_URL}/api/analytics/revenue-orders?period=${timePeriod}&currency=${currentCurrency}${branchQuery}`),
                authFetch(`${API_URL}/api/analytics/top-items?period=${timePeriod}&currency=${currentCurrency}${branchQuery}`),
                authFetch(`${API_URL}/api/analytics/category-performance?period=${timePeriod}&currency=${currentCurrency}${branchQuery}`),
                authFetch(`${API_URL}/api/analytics/payment-methods?period=${timePeriod}${branchQuery}`),
                authFetch(`${API_URL}/api/analytics/table-performance?period=${timePeriod}&currency=${currentCurrency}${branchQuery}`),
                authFetch(`${API_URL}/api/analytics/hourly-orders?period=${timePeriod}${branchQuery}`),
                authFetch(`${API_URL}/api/analytics/customer-retention?period=${timePeriod}${branchQuery}`)
            ]);

            if (!summaryRes.ok) throw new Error(`Summary API error: ${summaryRes.status}`);
            if (!revenueOrdersRes.ok) throw new Error(`Revenue/Orders API error: ${revenueOrdersRes.status}`);
            if (!topItemsRes.ok) throw new Error(`Top Items API error: ${topItemsRes.status}`);
            if (!categoryRes.ok) throw new Error(`Category API error: ${categoryRes.status}`);
            if (!paymentRes.ok) throw new Error(`Payment Methods API error: ${paymentRes.status}`);
            if (!tableRes.ok) throw new Error(`Table Performance API error: ${tableRes.status}`);
            if (!hourlyRes.ok) throw new Error(`Hourly Orders API error: ${hourlyRes.status}`);
            if (!customerRes.ok) throw new Error(`Customer Retention API error: ${customerRes.status}`);

            const summaryResponse = await summaryRes.json();
            const revenueOrdersResponse = await revenueOrdersRes.json();
            const topItemsResponse = await topItemsRes.json();
            const categoriesResponse = await categoryRes.json();
            const paymentResponse = await paymentRes.json();
            const tableResponse = await tableRes.json();
            const hourlyResponse = await hourlyRes.json();
            const customerResponse = await customerRes.json();

            const summary = summaryResponse.success ? summaryResponse.data : {};
            let revenueOrders = revenueOrdersResponse.success ? revenueOrdersResponse.data : (Array.isArray(revenueOrdersResponse) ? revenueOrdersResponse : []);
            let topItems = topItemsResponse.success ? topItemsResponse.data : (Array.isArray(topItemsResponse) ? topItemsResponse : []);
            let categories = categoriesResponse.success ? categoriesResponse.data : (Array.isArray(categoriesResponse) ? categoriesResponse : []);
            let paymentMethods = paymentResponse.success ? paymentResponse.data : (typeof paymentResponse === 'object' ? paymentResponse : {});
            let tablePerformance = tableResponse.success ? tableResponse.data : (Array.isArray(tableResponse) ? tableResponse : []);
            let hourlyOrders = hourlyResponse.success ? hourlyResponse.data : (Array.isArray(hourlyResponse) ? hourlyResponse : []);
            let customerRetention = customerResponse.success ? customerResponse.data : (typeof customerResponse === 'object' ? customerResponse : {});

            setAnalyticsData({
                summary,
                revenueOrders,
                topItems,
                categories,
                paymentMethods,
                tablePerformance,
                hourlyOrders,
                customerRetention
            });

            // Fetch previous period data
            try {
                const branchQuery = selectedBranch ? `&branch_id=${selectedBranch}` : '';
                const prevRes = await authFetch(`${API_URL}/api/analytics/previous-period?period=${timePeriod}&currency=${currentCurrency}${branchQuery}`);
                if (prevRes.ok) {
                    const prevData = await prevRes.json();
                    if (prevData.success) {
                        setPreviousPeriodData(prevData.data);
                    }
                }
            } catch (e) {
                console.error("Error fetching previous period data", e);
            }

        } catch (err) {
            console.error('Error fetching analytics data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [timePeriod, currentCurrency, token, logout, API_URL, selectedBranch]);

    // Initial fetch
    useEffect(() => {
        if (token) {
            fetchAnalyticsData();
        } else {
            setLoading(false);
        }
    }, [fetchAnalyticsData, token]);

    // CONSOLIDATED CHART LIFECYCLE EFFECT
    useEffect(() => {
        if (!analyticsData) return;

        // Helper to initialize or update a chart
        const initChart = (chartRef, chartInstanceRef, type, data, options) => {
            if (chartRef.current) {
                if (chartInstanceRef.current) {
                    // Check if the canvas element is the same
                    if (chartInstanceRef.current.canvas === chartRef.current) {
                        // Update existing chart
                        chartInstanceRef.current.data = data;
                        chartInstanceRef.current.options = { ...chartInstanceRef.current.options, ...options };
                        chartInstanceRef.current.update();
                        return;
                    }

                    // If canvas changed, destroy old instance
                    chartInstanceRef.current.destroy();
                    chartInstanceRef.current = null;
                }

                // Create new chart
                chartInstanceRef.current = new Chart(chartRef.current, {
                    type,
                    data,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        ...options
                    }
                });
            }
        };

        // Helper to destroy a chart
        const destroyChart = (chartInstanceRef) => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };

        // Helper to format dates for labels
        const getLabels = (data) => data.map(d => {
            const date = new Date(d.date);
            if (isNaN(date.getTime())) return d.date;
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        // --- 1. Revenue & Orders Charts (Overview & Revenue Tabs) ---
        if (['overview', 'revenue'].includes(activeTab)) {
            if (analyticsData.revenueOrders && analyticsData.revenueOrders.length > 0) {
                const labels = getLabels(analyticsData.revenueOrders);
                const revenueData = analyticsData.revenueOrders.map(d => parseFloat(d.revenue || 0));

                initChart(revenueChartRef, revenueChartInstance, 'line', {
                    labels,
                    datasets: [{
                        label: 'Revenue',
                        data: revenueData,
                        borderColor: '#f97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                }, {
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { callback: (value) => formatCurrency(value, currentCurrency) }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: (context) => `Revenue: ${formatCurrency(context.raw, currentCurrency)}` } }
                    }
                });
            }
        } else {
            destroyChart(revenueChartInstance);
        }

        // --- 2. Orders Chart (Overview Tab) ---
        if (activeTab === 'overview') {
            if (analyticsData.revenueOrders && analyticsData.revenueOrders.length > 0) {
                const labels = getLabels(analyticsData.revenueOrders);
                const ordersData = analyticsData.revenueOrders.map(d => parseInt(d.orders || 0));

                initChart(ordersChartRef, ordersChartInstance, 'bar', {
                    labels,
                    datasets: [{
                        label: 'Orders',
                        data: ordersData,
                        backgroundColor: '#3b82f6'
                    }]
                }, {
                    scales: { y: { beginAtZero: true } },
                    plugins: { legend: { display: false } }
                });
            }
        } else {
            destroyChart(ordersChartInstance);
        }

        // --- 3. Category Chart (Revenue & Items Tabs) ---
        if (['revenue', 'items'].includes(activeTab)) {
            if (analyticsData.categories && analyticsData.categories.length > 0) {
                const labels = analyticsData.categories.map(c => c.category);
                const data = analyticsData.categories.map(c => activeTab === 'revenue' ? parseFloat(c[`total_revenue_${currentCurrency.toLowerCase()}`] || 0) : parseInt(c.total_orders || 0));
                const label = activeTab === 'revenue' ? 'Revenue' : 'Orders';

                initChart(categoryChartRef, categoryChartInstance, 'doughnut', {
                    labels,
                    datasets: [{
                        label,
                        data,
                        backgroundColor: ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
                    }]
                }, {
                    plugins: { legend: { position: 'right' } }
                });
            }
        } else {
            destroyChart(categoryChartInstance);
        }

        // --- 4. Payment Methods Chart (Revenue Tab) ---
        if (activeTab === 'revenue') {
            if (analyticsData.paymentMethods && Object.keys(analyticsData.paymentMethods).length > 0) {
                const labels = Object.keys(analyticsData.paymentMethods);
                const data = Object.values(analyticsData.paymentMethods);

                initChart(paymentChartRef, paymentChartInstance, 'pie', {
                    labels,
                    datasets: [{
                        label: 'Orders',
                        data,
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b']
                    }]
                }, {
                    plugins: { legend: { position: 'right' } }
                });
            }
        } else {
            destroyChart(paymentChartInstance);
        }

        // --- 5. Top Items Chart (Items Tab) ---
        if (activeTab === 'items') {
            if (analyticsData.topItems && analyticsData.topItems.length > 0) {
                const top5 = analyticsData.topItems.slice(0, 5);
                const labels = top5.map(i => i.item_name);
                const data = top5.map(i => parseInt(i.quantity_sold));

                initChart(itemsChartRef, itemsChartInstance, 'bar', {
                    labels,
                    datasets: [{
                        label: 'Quantity Sold',
                        data,
                        backgroundColor: '#8b5cf6'
                    }]
                }, {
                    indexAxis: 'y',
                    plugins: { legend: { display: false } }
                });
            }
        } else {
            destroyChart(itemsChartInstance);
        }

        // --- 6. Customer Retention Chart (Customers Tab) ---
        if (activeTab === 'customers') {
            if (analyticsData.customerRetention) {
                const { new_customers, returning_customers } = analyticsData.customerRetention;
                initChart(customerChartRef, customerChartInstance, 'doughnut', {
                    labels: ['New Customers', 'Returning Customers'],
                    datasets: [{
                        data: [new_customers, returning_customers],
                        backgroundColor: ['#3b82f6', '#10b981']
                    }]
                }, {});
            }
        } else {
            destroyChart(customerChartInstance);
        }

        // --- 7. Hourly Orders Chart (Operations Tab) ---
        if (activeTab === 'operations') {
            if (analyticsData.hourlyOrders && analyticsData.hourlyOrders.length > 0) {
                const labels = analyticsData.hourlyOrders.map(h => `${h.hour}:00`);
                const data = analyticsData.hourlyOrders.map(h => parseInt(h.orders));

                initChart(hourlyChartRef, hourlyChartInstance, 'line', {
                    labels,
                    datasets: [{
                        label: 'Orders',
                        data,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                }, {
                    scales: { y: { beginAtZero: true } },
                    plugins: { legend: { display: false } }
                });
            }
        } else {
            destroyChart(hourlyChartInstance);
        }

        // --- 8. Table Performance Chart (Operations Tab) ---
        if (activeTab === 'operations') {
            if (analyticsData.tablePerformance && analyticsData.tablePerformance.length > 0) {
                const labels = analyticsData.tablePerformance.map(t => t.table_name);
                const data = analyticsData.tablePerformance.map(t => parseInt(t.total_orders));

                initChart(tableChartRef, tableChartInstance, 'bar', {
                    labels,
                    datasets: [{
                        label: 'Orders',
                        data,
                        backgroundColor: '#ec4899'
                    }]
                }, {
                    scales: { y: { beginAtZero: true } },
                    plugins: { legend: { display: false } }
                });
            }
        } else {
            destroyChart(tableChartInstance);
        }

        // Cleanup on unmount
        return () => {
            [revenueChartInstance, ordersChartInstance, categoryChartInstance, paymentChartInstance, itemsChartInstance, customerChartInstance, hourlyChartInstance, tableChartInstance].forEach(ref => {
                if (ref.current) {
                    ref.current.destroy();
                    ref.current = null;
                }
            });
        };

    }, [activeTab, analyticsData, timePeriod, currentCurrency]);

    const calculatePercentageChange = (current, previous) => {
        const curr = Number(current);
        const prev = Number(previous);
        if (isNaN(curr) || isNaN(prev) || prev === 0) return 0;
        return ((curr - prev) / prev * 100).toFixed(1);
    };

    const renderMetricCard = (title, value, icon, previousValue = null, color = 'orange') => {
        const trend = previousValue !== null ? calculatePercentageChange(value, previousValue) : null;

        return (
            <div className="metric-card bg-white rounded-xl shadow-lg p-4 sm:p-6 hover-lift">
                <div className="flex items-center justify-between mb-3">
                    <div className={`stat-icon w-12 h-12 bg-${color}-100 rounded-full flex items-center justify-center`}>
                        <i className={`fas ${icon} text-${color}-600 text-xl`}></i>
                    </div>
                    {trend !== null && (
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
                {trend !== null && <p className="text-xs text-gray-500 mt-1">{trend > 0 ? 'Up' : trend < 0 ? 'Down' : 'Same'} from previous period</p>}
            </div>
        );
    };

    const renderTimePeriodButtons = () => (
        <div className="flex flex-wrap gap-2 mb-6">
            {['daily', 'weekly', 'monthly', 'yearly'].map(period => (
                <button key={period} className={`period-btn px-4 py-2 rounded-lg font-medium transition ${timePeriod === period ? 'bg-orange-500 text-white active' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} onClick={() => setTimePeriod(period)}>
                    {period === 'daily' ? 'Today' : period.charAt(0).toUpperCase() + period.slice(1)}
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
            <button className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition" onClick={fetchAnalyticsData}>
                Try Again
            </button>
        </div>
    );

    const renderNoData = (message = "No data available for this period") => (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10">
            <div className="bg-gray-100 p-4 rounded-full mb-3">
                <i className="fas fa-chart-bar text-3xl text-gray-400"></i>
            </div>
            <p className="font-medium text-gray-600">{message}</p>
        </div>
    );

    const generateInsights = () => {
        if (!analyticsData) return [];
        const insights = [];
        const { topItems, categories, paymentMethods, hourlyOrders, customerRetention } = analyticsData;

        if (topItems && topItems.length > 0) {
            insights.push({ type: 'positive', title: 'Top Performer', description: `${topItems[0].item_name} is your best-selling item with ${topItems[0].quantity_sold} orders.`, icon: 'fa-trophy' });
        }
        if (hourlyOrders && hourlyOrders.length > 0) {
            const peakHour = hourlyOrders.reduce((max, hour) => (hour.orders || 0) > (max.orders || 0) ? hour : max, hourlyOrders[0]);
            insights.push({ type: 'info', title: 'Peak Hour', description: `${peakHour.hour}:00 is your busiest time with ${peakHour.orders || 0} orders.`, icon: 'fa-clock' });
        }
        if (paymentMethods && Object.keys(paymentMethods).length > 0) {
            const paymentMethodsKeys = Object.keys(paymentMethods);
            const preferredMethod = paymentMethodsKeys.reduce((max, method) => paymentMethods[method] > paymentMethods[max] ? method : max, paymentMethodsKeys[0]);
            insights.push({ type: 'info', title: 'Payment Preference', description: `Customers prefer ${preferredMethod} payments (${paymentMethods[preferredMethod]} orders).`, icon: 'fa-credit-card' });
        }
        if (categories && categories.length > 1) {
            const lowCategory = categories.reduce((min, category) => category.total_orders < min.total_orders ? category : min, categories[0]);
            insights.push({ type: 'warning', title: 'Category Opportunity', description: `${lowCategory.category} has the fewest orders. Consider promotions to boost sales.`, icon: 'fa-chart-line' });
        }
        if (customerRetention && customerRetention.retention_rate) {
            insights.push({ type: customerRetention.retention_rate > 50 ? 'positive' : 'warning', title: 'Customer Retention', description: `${customerRetention.retention_rate}% of customers are returning. ${customerRetention.retention_rate > 50 ? 'Great job!' : 'Consider loyalty programs.'}`, icon: 'fa-users' });
        }
        return insights;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className={`text-white p-4 sm:p-6 transition-all duration-500 ${!companyInfo?.banner_url ? 'gradient-bg' : ''}`}
                style={companyInfo?.banner_url ? {
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${companyInfo.banner_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                } : {}}
            >
                <div className="container mx-auto">
                    <div className="header-content flex justify-between items-start sm:items-center">
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center">
                                {companyInfo?.logo_url ? (
                                    <img src={companyInfo.logo_url} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover mr-3 border-2 border-white/30" />
                                ) : (
                                    <i className="fas fa-chart-line mr-2 sm:mr-3"></i>
                                )}
                                Analytics Dashboard
                            </h1>
                            <p className="text-white/80 mt-2">Real-time insights into your restaurant's performance</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
                            <div className="relative">
                                <select
                                    value={currentCurrency}
                                    onChange={(e) => setCurrentCurrency(e.target.value)}
                                    className="appearance-none bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                                >
                                    <option value="INR" className="text-gray-800">₹ INR</option>
                                    <option value="USD" className="text-gray-800">$ USD</option>
                                </select>
                            </div>
                            <button onClick={downloadExcelReport} className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 hover:bg-white/30 transition flex items-center text-sm font-medium" title="Export Excel Report">
                                <i className="fas fa-file-excel text-white mr-2"></i> Excel
                            </button>
                            <button onClick={downloadPDFReport} className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 hover:bg-white/30 transition flex items-center text-sm font-medium" title="Export PDF Report">
                                <i className="fas fa-file-pdf text-white mr-2"></i> PDF
                            </button>
                            <button onClick={fetchAnalyticsData} className="bg-white/20 backdrop-blur-sm rounded-lg p-2 hover:bg-white/30 transition" title="Refresh Data">
                                <i className="fas fa-sync-alt text-white"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>



            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
                <BranchSelector API_URL={API_URL} />
                {renderTimePeriodButtons()}

                {error && renderErrorState()}

                {/* Show loader if initial load */}
                {loading && !analyticsData && renderLoadingState()}

                {/* Keep content mounted if we have data, even if loading new data */}
                {analyticsData && (
                    <div id="analytics-dashboard-content" className={`transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none relative' : ''}`}>
                        {loading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                            </div>
                        )}

                        {/* Tab Navigation */}
                        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
                            {['overview', 'revenue', 'items', 'customers', 'operations'].map(tab => (
                                <button key={tab} className={`px-4 py-2 font-medium transition ${activeTab === tab ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-gray-900'}`} onClick={() => setActiveTab(tab)}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <>
                                <div className="stats-grid grid gap-4 mb-6">
                                    {renderMetricCard('Total Orders', analyticsData?.summary.total_orders || 0, 'fa-shopping-cart', previousPeriodData?.total_orders, 'blue')}
                                    {renderMetricCard('Total Revenue', formatCurrency(analyticsData?.summary[`total_revenue_${currentCurrency.toLowerCase()}`] || 0, currentCurrency), 'fa-dollar-sign', previousPeriodData?.[`total_revenue_${currentCurrency.toLowerCase()}`], 'green')}
                                    {renderMetricCard('Tables Served', analyticsData?.summary.tables_served || 0, 'fa-chair', previousPeriodData?.tables_served, 'purple')}
                                    {renderMetricCard('Avg Order Value', formatCurrency(analyticsData?.summary.avg_order_value || 0, currentCurrency), 'fa-receipt', previousPeriodData?.avg_order_value, 'pink')}
                                </div>

                                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 fade-in">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                                        Business Insights
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {generateInsights().map((insight, index) => (
                                            <div key={index} className={`insight-card p-4 rounded-lg ${insight.type === 'positive' ? 'positive' : insight.type === 'warning' ? 'negative' : ''}`}>
                                                <div className="flex items-start">
                                                    <i className={`fas ${insight.icon} mr-3 mt-1 ${insight.type === 'positive' ? 'text-green-500' : insight.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'}`}></i>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                                                        <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 fade-in chart-container-wrapper">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
                                            <div className="flex gap-2">
                                                <button onClick={() => downloadChartData(analyticsData.revenueOrders, 'Revenue_Trend_Data')} className="text-gray-400 hover:text-green-600 transition" title="Download Excel">
                                                    <i className="fas fa-file-excel"></i>
                                                </button>
                                                <button onClick={() => downloadChart(revenueChartRef, `revenue-trend-${timePeriod}-${currentCurrency}.png`)} className="text-gray-400 hover:text-blue-600 transition" title="Download Image">
                                                    <i className="fas fa-image"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="chart-container">
                                            {analyticsData?.revenueOrders?.length > 0 ? (
                                                <canvas ref={revenueChartRef}></canvas>
                                            ) : (
                                                renderNoData()
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 fade-in chart-container-wrapper">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold text-gray-900">Orders Overview</h3>
                                            <div className="flex gap-2">
                                                <button onClick={() => downloadChartData(analyticsData.revenueOrders, 'Orders_Overview_Data')} className="text-gray-400 hover:text-green-600 transition" title="Download Excel">
                                                    <i className="fas fa-file-excel"></i>
                                                </button>
                                                <button onClick={() => downloadChart(ordersChartRef, `orders-overview-${timePeriod}.png`)} className="text-gray-400 hover:text-blue-600 transition" title="Download Image">
                                                    <i className="fas fa-image"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="chart-container">
                                            {analyticsData?.revenueOrders?.length > 0 ? (
                                                <canvas ref={ordersChartRef}></canvas>
                                            ) : (
                                                renderNoData()
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Revenue Tab */}
                        {activeTab === 'revenue' && (
                            <>
                                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 fade-in">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Breakdown</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-md font-semibold text-gray-800">Revenue by Category</h4>
                                                <div className="flex gap-2">
                                                    <button onClick={() => downloadChartData(analyticsData.categories, 'Revenue_by_Category_Data')} className="text-gray-400 hover:text-green-600 transition" title="Download Excel">
                                                        <i className="fas fa-file-excel"></i>
                                                    </button>
                                                    <button onClick={() => downloadChart(categoryChartRef, `revenue-by-category-${timePeriod}-${currentCurrency}.png`)} className="text-gray-400 hover:text-blue-600 transition" title="Download Image">
                                                        <i className="fas fa-image"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="chart-container mb-4">
                                                {analyticsData?.categories?.length > 0 ? (
                                                    <canvas ref={categoryChartRef}></canvas>
                                                ) : (
                                                    renderNoData()
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-md font-semibold text-gray-800">Payment Methods</h4>
                                                <div className="flex gap-2">
                                                    <button onClick={() => downloadChartData(analyticsData.paymentMethods, 'Payment_Methods_Data')} className="text-gray-400 hover:text-green-600 transition" title="Download Excel">
                                                        <i className="fas fa-file-excel"></i>
                                                    </button>
                                                    <button onClick={() => downloadChart(paymentChartRef, `payment-methods-${timePeriod}.png`)} className="text-gray-400 hover:text-blue-600 transition" title="Download Image">
                                                        <i className="fas fa-image"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="chart-container mb-4">
                                                {analyticsData?.paymentMethods && Object.keys(analyticsData.paymentMethods).length > 0 ? (
                                                    <canvas ref={paymentChartRef}></canvas>
                                                ) : (
                                                    renderNoData()
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-md font-semibold text-gray-800">Revenue Trend</h4>
                                            <div className="flex gap-2">
                                                <button onClick={() => downloadChartData(analyticsData.revenueOrders, 'Revenue_Trend_Data')} className="text-gray-400 hover:text-green-600 transition" title="Download Excel">
                                                    <i className="fas fa-file-excel"></i>
                                                </button>
                                                <button onClick={() => downloadChart(revenueChartRef, `revenue-trend-${timePeriod}-${currentCurrency}.png`)} className="text-gray-400 hover:text-blue-600 transition" title="Download Image">
                                                    <i className="fas fa-image"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="chart-container">
                                            {analyticsData?.revenueOrders?.length > 0 ? (
                                                <canvas ref={revenueChartRef}></canvas>
                                            ) : (
                                                renderNoData()
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Items Tab */}
                        {activeTab === 'items' && (
                            <>
                                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 fade-in">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Item Performance</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-md font-semibold text-gray-800">Top Selling Items</h4>
                                                <div className="flex gap-2">
                                                    <button onClick={() => downloadChartData(analyticsData.topItems, 'Top_Items_Data')} className="text-gray-400 hover:text-green-600 transition" title="Download Excel">
                                                        <i className="fas fa-file-excel"></i>
                                                    </button>
                                                    <button onClick={() => downloadChart(itemsChartRef, `top-items-${timePeriod}-${currentCurrency}.png`)} className="text-gray-400 hover:text-blue-600 transition" title="Download Image">
                                                        <i className="fas fa-image"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="chart-container mb-4">
                                                {analyticsData?.topItems?.length > 0 ? (
                                                    <canvas ref={itemsChartRef}></canvas>
                                                ) : (
                                                    renderNoData()
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-md font-semibold text-gray-800">Category Performance</h4>
                                                <div className="flex gap-2">
                                                    <button onClick={() => downloadChartData(analyticsData.categories, 'Category_Performance_Data')} className="text-gray-400 hover:text-green-600 transition" title="Download Excel">
                                                        <i className="fas fa-file-excel"></i>
                                                    </button>
                                                    <button onClick={() => downloadChart(categoryChartRef, `category-performance-${timePeriod}-${currentCurrency}.png`)} className="text-gray-400 hover:text-blue-600 transition" title="Download Image">
                                                        <i className="fas fa-image"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="chart-container mb-4">
                                                {analyticsData?.categories?.length > 0 ? (
                                                    <canvas ref={categoryChartRef}></canvas>
                                                ) : (
                                                    renderNoData()
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <h4 className="text-md font-semibold text-gray-800 mb-3">Top Items Details</h4>
                                        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                                            {analyticsData?.topItems?.length > 0 ? (
                                                analyticsData.topItems.map((item, index) => (
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
                                                                {formatCurrency(item[`revenue_${currentCurrency.toLowerCase()}`] || 0, currentCurrency)}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{item.quantity_sold || 0} items</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                renderNoData("No items sold in this period")
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Customers Tab */}
                        {activeTab === 'customers' && (
                            <>
                                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 fade-in">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Analysis</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-md font-semibold text-gray-800">Customer Retention</h4>
                                                <div className="flex gap-2">
                                                    <button onClick={() => downloadChartData(analyticsData.customerRetention, 'Customer_Retention_Data')} className="text-gray-400 hover:text-green-600 transition" title="Download Excel">
                                                        <i className="fas fa-file-excel"></i>
                                                    </button>
                                                    <button onClick={() => downloadChart(customerChartRef, `customer-retention-${timePeriod}-${currentCurrency}.png`)} className="text-gray-400 hover:text-blue-600 transition" title="Download Image">
                                                        <i className="fas fa-image"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="chart-container mb-4">
                                                {analyticsData?.customerRetention?.new_customers > 0 || analyticsData?.customerRetention?.returning_customers > 0 ? (
                                                    <canvas ref={customerChartRef}></canvas>
                                                ) : (
                                                    renderNoData()
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-md font-semibold text-gray-800 mb-3">Customer Metrics</h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <p className="font-semibold text-gray-900">New Customers</p>
                                                    <p className="font-bold text-blue-600">{analyticsData?.customerRetention.new_customers || 0}</p>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <p className="font-semibold text-gray-900">Returning Customers</p>
                                                    <p className="font-bold text-green-600">{analyticsData?.customerRetention.returning_customers || 0}</p>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <p className="font-semibold text-gray-900">Retention Rate</p>
                                                    <p className="font-bold text-purple-600">{analyticsData?.customerRetention.retention_rate || 0}%</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Operations Tab */}
                        {activeTab === 'operations' && (
                            <>
                                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 fade-in">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Operations Analysis</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-md font-semibold text-gray-800">Hourly Order Distribution</h4>
                                                <div className="flex gap-2">
                                                    <button onClick={() => downloadChartData(analyticsData.hourlyOrders, 'Hourly_Orders_Data')} className="text-gray-400 hover:text-green-600 transition" title="Download Excel">
                                                        <i className="fas fa-file-excel"></i>
                                                    </button>
                                                    <button onClick={() => downloadChart(hourlyChartRef, `hourly-orders-${timePeriod}-${currentCurrency}.png`)} className="text-gray-400 hover:text-blue-600 transition" title="Download Image">
                                                        <i className="fas fa-image"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="chart-container mb-4">
                                                {analyticsData?.hourlyOrders?.length > 0 ? (
                                                    <canvas ref={hourlyChartRef}></canvas>
                                                ) : (
                                                    renderNoData()
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-md font-semibold text-gray-800">Table Performance</h4>
                                                <div className="flex gap-2">
                                                    <button onClick={() => downloadChartData(analyticsData.tablePerformance, 'Table_Performance_Data')} className="text-gray-400 hover:text-green-600 transition" title="Download Excel">
                                                        <i className="fas fa-file-excel"></i>
                                                    </button>
                                                    <button onClick={() => downloadChart(tableChartRef, `table-performance-${timePeriod}-${currentCurrency}.png`)} className="text-gray-400 hover:text-blue-600 transition" title="Download Image">
                                                        <i className="fas fa-image"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="chart-container mb-4">
                                                {analyticsData?.tablePerformance?.length > 0 ? (
                                                    <canvas ref={tableChartRef}></canvas>
                                                ) : (
                                                    renderNoData()
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <h4 className="text-md font-semibold text-gray-800 mb-3">Table Performance Details</h4>
                                        <div className="overflow-x-auto">
                                            {analyticsData?.tablePerformance?.length > 0 ? (
                                                <table className="data-table w-full">
                                                    <thead>
                                                        <tr>
                                                            <th>Table</th>
                                                            <th>Orders</th>
                                                            <th>Revenue</th>
                                                            <th>Avg Order</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {analyticsData?.tablePerformance.map((table, index) => (
                                                            <tr key={index}>
                                                                <td>{table.table_name}</td>
                                                                <td>{table.total_orders}</td>
                                                                <td>{formatCurrency(table[`total_revenue_${currentCurrency.toLowerCase()}`] || 0, currentCurrency)}</td>
                                                                <td>{formatCurrency(table[`avg_order_value_${currentCurrency.toLowerCase()}`] || 0, currentCurrency)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                renderNoData("No table data available")
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AnalyticsPage;
