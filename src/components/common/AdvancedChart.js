import React, { useRef, useEffect } from 'react';

const AdvancedChart = ({ type, data, options, title, onDownload }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (chartRef.current && typeof window.Chart !== 'undefined') {
            // Destroy previous chart instance if it exists
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            // Create new chart instance
            chartInstance.current = new window.Chart(chartRef.current, {
                type,
                data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    ...options
                }
            });
        }

        // Cleanup function
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [type, data, options]);

    const downloadChart = () => {
        if (chartRef.current) {
            const url = chartRef.current.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.png`;
            link.href = url;
            link.click();
        }
    };

    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3 className="chart-title">{title}</h3>
                <div className="chart-actions">
                    <button onClick={downloadChart} className="chart-action-btn" title="Download Chart">
                        <i className="fas fa-download"></i>
                    </button>
                    {onDownload && (
                        <button onClick={onDownload} className="chart-action-btn" title="Download Data">
                            <i className="fas fa-file-csv"></i>
                        </button>
                    )}
                </div>
            </div>
            <div className="chart-wrapper">
                <canvas ref={chartRef}></canvas>
            </div>
        </div>
    );
};

export default AdvancedChart;