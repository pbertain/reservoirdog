/**
 * Main JavaScript for Reservoir Dog dashboard
 */

// Configuration
const GRAFANA_URL = 'http://localhost:3000'; // Update this to your Grafana URL
const API_BASE = '/api';

// Fetch and display latest data for all reservoirs
async function loadReservoirData() {
    const reservoirs = ['BER', 'ORO'];
    
    for (const code of reservoirs) {
        try {
            const response = await fetch(`${API_BASE}/reservoir/${code}/latest`);
            if (response.ok) {
                const data = await response.json();
                updateReservoirStats(code, data);
            } else {
                console.error(`Failed to load data for ${code}`);
            }
        } catch (error) {
            console.error(`Error loading data for ${code}:`, error);
        }
    }
}

// Update reservoir statistics display
function updateReservoirStats(code, data) {
    const formatNumber = (num) => {
        if (num === null || num === undefined) return '--';
        return new Intl.NumberFormat('en-US').format(Math.round(num));
    };

    const formatDate = (dateString) => {
        if (!dateString) return '--';
        const date = new Date(dateString);
        // Format: %a %Y-%m-%e-%H:%M (e.g., "Mon 2025-11-15-21:30")
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = days[date.getDay()];
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${dayName} ${year}-${month}-${day}-${hours}:${minutes}`;
    };

    // Update storage
    const storageEl = document.getElementById(`storage-${code}`);
    if (storageEl) {
        storageEl.textContent = formatNumber(data.storage);
    }

    // Update elevation
    const elevationEl = document.getElementById(`elevation-${code}`);
    if (elevationEl) {
        elevationEl.textContent = formatNumber(data.reservoir_elevation);
    }

    // Update timestamp in header
    const timestampHeaderEl = document.getElementById(`timestamp-header-${code}`);
    if (timestampHeaderEl) {
        timestampHeaderEl.textContent = formatDate(data.timestamp);
    }
}

// Create Chart.js charts
async function createCharts() {
    const reservoirs = ['BER', 'ORO'];
    
    for (const code of reservoirs) {
        try {
            const response = await fetch(`${API_BASE}/reservoir/${code}/data?days=30`);
            if (response.ok) {
                const data = await response.json();
                
                // Create storage chart
                createChart(code, 'storage', data.data, 'Storage (acre-feet)');
                
                // Create elevation chart
                createChart(code, 'elevation', data.data, 'Elevation (feet)');
            }
        } catch (error) {
            console.error(`Error loading chart data for ${code}:`, error);
        }
    }
}

// Create a Chart.js chart
function createChart(reservoirCode, metric, dataPoints, label) {
    const panel = document.getElementById(`grafana-${metric}-${reservoirCode}`);
    if (!panel) return;
    
    // Clear any existing content
    panel.innerHTML = '<canvas></canvas>';
    const canvas = panel.querySelector('canvas');
    if (!canvas) return;
    
    // Prepare data
    const labels = dataPoints.map(d => {
        const date = new Date(d.timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const data = dataPoints.map(d => {
        if (metric === 'storage') {
            return d.storage;
        } else {
            return d.reservoir_elevation;
        }
    });
    
    // Create chart
    new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: metric === 'storage' ? '#4A90E2' : '#5FB3B3',
                backgroundColor: metric === 'storage' ? 'rgba(74, 144, 226, 0.1)' : 'rgba(95, 179, 179, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 10,
                    titleFont: { size: 12 },
                    bodyFont: { size: 11 }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 6,
                        font: { size: 9 }
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { size: 9 },
                        callback: function(value) {
                            if (metric === 'storage') {
                                return (value / 1000000).toFixed(1) + 'M';
                            }
                            return value.toFixed(0);
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Embed Grafana panels (for future Grafana integration)
function embedGrafanaPanels() {
    // This function is kept for future Grafana integration
    // Currently using Chart.js instead
}

// Chart modal functionality
function setupChartModals() {
    const modal = document.getElementById('chart-modal');
    const closeBtn = document.querySelector('.chart-modal-close');
    const chartContainers = document.querySelectorAll('.chart-container-compact');
    
    // Open modal on chart click
    chartContainers.forEach(container => {
        container.addEventListener('click', () => {
            const chartType = container.getAttribute('data-chart-type');
            const reservoirCode = container.getAttribute('data-reservoir');
            const reservoirName = container.closest('.reservoir-card').querySelector('h2').textContent;
            
            const title = `${reservoirName} - ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Over Time`;
            const panelId = chartType === 'storage' 
                ? `storage-${reservoirCode}` 
                : `elevation-${reservoirCode}`;
            
            document.getElementById('chart-modal-title').textContent = title;
            
            // Load data and create full-size chart in modal
            const modalBody = document.getElementById('chart-modal-body');
            modalBody.innerHTML = '<div class="grafana-panel"><canvas></canvas></div>';
            const modalCanvas = modalBody.querySelector('canvas');
            
            // Fetch data for the chart
            fetch(`${API_BASE}/reservoir/${reservoirCode}/data?days=90`)
                .then(response => response.json())
                .then(data => {
                    const labels = data.data.map(d => {
                        const date = new Date(d.timestamp);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    });
                    
                    const chartData = data.data.map(d => {
                        if (chartType === 'storage') {
                            return d.storage;
                        } else {
                            return d.reservoir_elevation;
                        }
                    });
                    
                    const chartLabel = chartType === 'storage' ? 'Storage (acre-feet)' : 'Elevation (feet)';
                    const borderColor = chartType === 'storage' ? '#4A90E2' : '#5FB3B3';
                    const bgColor = chartType === 'storage' ? 'rgba(74, 144, 226, 0.1)' : 'rgba(95, 179, 179, 0.1)';
                    
                    new Chart(modalCanvas, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: chartLabel,
                                data: chartData,
                                borderColor: borderColor,
                                backgroundColor: bgColor,
                                borderWidth: 2,
                                fill: true,
                                tension: 0.4,
                                pointRadius: 2,
                                pointHoverRadius: 6
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: true,
                                    position: 'top'
                                },
                                tooltip: {
                                    mode: 'index',
                                    intersect: false
                                }
                            },
                            scales: {
                                x: {
                                    display: true,
                                    grid: {
                                        display: false
                                    }
                                },
                                y: {
                                    display: true,
                                    grid: {
                                        color: 'rgba(0, 0, 0, 0.05)'
                                    },
                                    ticks: {
                                        callback: function(value) {
                                            if (chartType === 'storage') {
                                                return (value / 1000000).toFixed(1) + 'M';
                                            }
                                            return value.toFixed(0);
                                        }
                                    }
                                }
                            }
                        }
                    });
                })
                .catch(error => {
                    console.error('Error loading chart data:', error);
                    modalBody.innerHTML = '<p style="padding: 2rem; text-align: center; color: #5A6C7D;">Error loading chart data</p>';
                });
            
            modal.classList.add('show');
        });
    });
    
    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            modal.classList.remove('show');
        }
    });
}

// Alternative: Use Chart.js for visualization (if Grafana is not available)
async function createChartJSCharts() {
    const reservoirs = ['BER', 'ORO'];
    
    for (const code of reservoirs) {
        try {
            const response = await fetch(`${API_BASE}/reservoir/${code}/data?days=30`);
            if (response.ok) {
                const data = await response.json();
                // Create Chart.js charts here if needed
                // This would require including Chart.js library
            }
        } catch (error) {
            console.error(`Error loading chart data for ${code}:`, error);
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadReservoirData();
    createCharts();
    setupChartModals();
    
    // Refresh data every 5 minutes
    setInterval(() => {
        loadReservoirData();
        createCharts();
    }, 5 * 60 * 1000);
});

