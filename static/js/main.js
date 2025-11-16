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

// Get selected time range for a reservoir
function getTimeRange(reservoirCode) {
    const select = document.getElementById(`time-range-${reservoirCode}`);
    return select ? parseInt(select.value) : 7; // Default to 1 week
}

// Create Chart.js charts
async function createCharts(reservoirCode = null) {
    const reservoirs = reservoirCode ? [reservoirCode] : ['BER', 'ORO'];
    
    for (const code of reservoirs) {
        const days = getTimeRange(code);
        try {
            const response = await fetch(`${API_BASE}/reservoir/${code}/data?days=${days}`);
            if (response.ok) {
                const result = await response.json();
                console.log(`API response for ${code}:`, result);
                const dataPoints = result.data || [];
                console.log(`Data points for ${code}:`, dataPoints.length, dataPoints);
                
                if (dataPoints.length > 0) {
                    // Create storage chart
                    createChart(code, 'storage', dataPoints, 'Storage (acre-feet)', days);
                    
                    // Create elevation chart
                    createChart(code, 'elevation', dataPoints, 'Elevation (feet)', days);
                } else {
                    console.warn(`No data points for ${code} - showing placeholder`);
                    showChartPlaceholder(code, 'storage');
                    showChartPlaceholder(code, 'elevation');
                }
            } else {
                const errorText = await response.text();
                console.error(`Failed to load data for ${code}: ${response.status} - ${errorText}`);
                showChartPlaceholder(code, 'storage');
                showChartPlaceholder(code, 'elevation');
            }
        } catch (error) {
            console.error(`Error loading chart data for ${code}:`, error);
            showChartPlaceholder(code, 'storage');
            showChartPlaceholder(code, 'elevation');
        }
    }
}

// Show placeholder when no data
function showChartPlaceholder(reservoirCode, metric) {
    const panel = document.getElementById(`grafana-${metric}-${reservoirCode}`);
    if (panel) {
        panel.innerHTML = `
            <div style="padding: 1rem; text-align: center; color: #5A6C7D; display: flex; align-items: center; justify-content: center; height: 100%;">
                <p style="font-size: 0.8rem;">No data yet<br><span style="font-size: 0.7rem;">Collecting...</span></p>
            </div>
        `;
    }
}

// Format date label based on time range
function formatDateLabel(date, days, index = null, totalPoints = null) {
    if (days <= 1) {
        // For 1 day: Show time every 2 hours (00:00, 02:00, 04:00, etc.)
        const hours = date.getHours();
        if (hours % 2 === 0) {
            return String(hours).padStart(2, '0') + ':00';
        }
        return '';
    } else if (days <= 7) {
        // For 1 week: Show day of week at midnight, or first occurrence of each day
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const isFirst = index === 0;
        const isLast = index !== null && totalPoints !== null && index === totalPoints - 1;
        
        // Show label at midnight (00:00) or first data point of each day
        if (hours === 0 && minutes === 0) {
            return dayNames[date.getDay()];
        }
        
        // Also show first and last points
        if (isFirst || isLast) {
            return dayNames[date.getDay()];
        }
        
        // Show first data point of each day (when hour changes from previous day)
        // This will be handled by checking if it's the first point with this day
        return '';
    } else if (days <= 30) {
        // For 1 month: Show date every few days
        const dayOfMonth = date.getDate();
        if (dayOfMonth % 5 === 0 || dayOfMonth === 1) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return '';
    } else {
        // For longer ranges: Show month/day less frequently
        const dayOfMonth = date.getDate();
        if (dayOfMonth === 1 || dayOfMonth === 15) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return '';
    }
}

// Create a Chart.js chart
function createChart(reservoirCode, metric, dataPoints, label, days = 7) {
    console.log(`createChart called: ${reservoirCode}, ${metric}, ${dataPoints.length} data points, ${days} days`);
    
    const panel = document.getElementById(`grafana-${metric}-${reservoirCode}`);
    if (!panel) {
        console.error(`Panel not found: grafana-${metric}-${reservoirCode}`);
        return;
    }
    
    if (!dataPoints || dataPoints.length === 0) {
        console.warn(`No data points for ${reservoirCode} ${metric}`);
        showChartPlaceholder(reservoirCode, metric);
        return;
    }
    
    // Clear any existing content
    panel.innerHTML = '<canvas></canvas>';
    const canvas = panel.querySelector('canvas');
    if (!canvas) {
        console.error('Canvas element not created');
        return;
    }
    
    // Prepare data - keep labels and data aligned
    const chartData = [];
    const chartLabels = [];
    let lastDay = -1; // Track last day shown for week view
    
    for (let i = 0; i < dataPoints.length; i++) {
        const d = dataPoints[i];
        let value = null;
        if (metric === 'storage') {
            value = d.storage !== null && d.storage !== undefined ? d.storage : null;
        } else {
            value = d.reservoir_elevation !== null && d.reservoir_elevation !== undefined ? d.reservoir_elevation : null;
        }
        
        if (value === null) {
            console.warn(`Null value for ${reservoirCode} ${metric} at ${d.timestamp}`);
            continue;
        }
        
        try {
            const date = new Date(d.timestamp);
            if (isNaN(date.getTime())) {
                console.warn(`Invalid date: ${d.timestamp}`);
                continue;
            }
            
            // For week view, show first data point of each day
            let dateLabel = '';
            if (days <= 7) {
                const currentDay = date.getDate();
                const hours = date.getHours();
                const minutes = date.getMinutes();
                
                // Show at midnight or first occurrence of each day
                if ((hours === 0 && minutes === 0) || (currentDay !== lastDay && lastDay !== -1)) {
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    dateLabel = dayNames[date.getDay()];
                    lastDay = currentDay;
                } else if (i === 0) {
                    // Always show first point
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    dateLabel = dayNames[date.getDay()];
                    lastDay = currentDay;
                }
            } else {
                dateLabel = formatDateLabel(date, days, chartData.length, dataPoints.length);
            }
            
            chartLabels.push(dateLabel);
            chartData.push({
                x: d.timestamp,
                y: value
            });
        } catch (e) {
            console.warn(`Failed to parse timestamp: ${d.timestamp}`, e);
            continue;
        }
    }
    
    console.log(`Processed data for ${reservoirCode} ${metric}: ${chartData.length} points`);
    
    if (chartData.length === 0 || chartLabels.length === 0) {
        console.warn(`No valid data for ${reservoirCode} ${metric} after processing`);
        showChartPlaceholder(reservoirCode, metric);
        return;
    }
    
    if (chartData.length !== chartLabels.length) {
        console.error(`Data/label mismatch for ${reservoirCode} ${metric}: ${chartData.length} data points vs ${chartLabels.length} labels`);
        showChartPlaceholder(reservoirCode, metric);
        return;
    }
    
    // Create chart
    try {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            showChartPlaceholder(reservoirCode, metric);
            return;
        }
        
        console.log(`Creating chart for ${reservoirCode} ${metric} with ${chartData.length} points`);
        console.log(`Labels:`, chartLabels);
        console.log(`Data:`, chartData);
        
        // Calculate dynamic Y-axis range based on data
        const values = chartData.map(d => typeof d === 'object' ? d.y : d);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const range = maxValue - minValue;
        const padding = range * 0.1; // 10% padding
        
        let yMin, yMax, stepSize;
        if (metric === 'storage') {
            // Round to nearest 0.1M
            yMin = Math.max(0, Math.floor((minValue - padding) / 100000) * 100000);
            yMax = Math.ceil((maxValue + padding) / 100000) * 100000;
            stepSize = Math.max(200000, Math.ceil((yMax - yMin) / 5 / 200000) * 200000); // Steps of 0.2M or larger
        } else {
            // Round to nearest 50 feet
            yMin = Math.max(0, Math.floor((minValue - padding) / 50) * 50);
            yMax = Math.ceil((maxValue + padding) / 50) * 50;
            stepSize = Math.max(50, Math.ceil((yMax - yMin) / 5 / 50) * 50); // Steps of 50 feet or larger
        }
        
        new Chart(canvas, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: label,
                data: chartData,
                borderColor: metric === 'storage' ? '#4A90E2' : '#5FB3B3',
                backgroundColor: metric === 'storage' ? 'rgba(74, 144, 226, 0.1)' : 'rgba(95, 179, 179, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: chartData.length > 2 ? 0.4 : 0, // No tension for very few points
                pointRadius: chartData.length <= 5 ? 3 : 0, // Show points if few data points
                pointHoverRadius: 5
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
                    bodyFont: { size: 11 },
                    callbacks: {
                        title: function(context) {
                            const dataIndex = context[0].dataIndex;
                            const dataPoint = chartData[dataIndex];
                            if (dataPoint && typeof dataPoint === 'object' && dataPoint.x) {
                                const date = new Date(dataPoint.x);
                                const month = date.toLocaleString('en-US', { month: 'short' });
                                const day = date.getDate();
                                const hours = String(date.getHours()).padStart(2, '0');
                                const minutes = String(date.getMinutes()).padStart(2, '0');
                                return `${month} ${day} ${hours}h${minutes}`;
                            }
                            return context[0].label || '';
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: days <= 7, // Show grid for weekly view
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        maxTicksLimit: days <= 7 ? 8 : 6,
                        font: { size: 9 },
                        callback: function(value, index) {
                            // Only show non-empty labels
                            const label = chartLabels[index];
                            return label || '';
                        }
                    }
                },
                y: {
                    display: true,
                    min: yMin,
                    max: yMax,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { size: 10 },
                        stepSize: stepSize,
                        callback: function(value) {
                            if (metric === 'storage') {
                                // Show in millions with 1 decimal
                                return (value / 1000000).toFixed(1);
                            } else {
                                // Show elevation in feet
                                return value.toFixed(0);
                            }
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
    } catch (error) {
        console.error(`Error creating chart for ${reservoirCode} ${metric}:`, error);
        showChartPlaceholder(reservoirCode, metric);
    }
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
            
            // Fetch data for the modal chart - use 1 day for detailed view
            fetch(`${API_BASE}/reservoir/${reservoirCode}/data?days=1`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(result => {
                    const dataPoints = result.data || [];
                    
                    if (dataPoints.length === 0) {
                        modalBody.innerHTML = '<p style="padding: 2rem; text-align: center; color: #5A6C7D;">No data available yet. Data is being collected.</p>';
                        return;
                    }
                    
                    // Prepare data - keep labels and data aligned
                    const modalChartData = [];
                    const modalChartLabels = [];
                    
                    for (const d of dataPoints) {
                        let value = null;
                        if (chartType === 'storage') {
                            value = d.storage !== null && d.storage !== undefined ? d.storage : null;
                        } else {
                            value = d.reservoir_elevation !== null && d.reservoir_elevation !== undefined ? d.reservoir_elevation : null;
                        }
                        
                        if (value === null) continue;
                        
                        try {
                            const date = new Date(d.timestamp);
                            // For 1 day view, show time every 2 hours
                            const hours = date.getHours();
                            const label = hours % 2 === 0 ? String(hours).padStart(2, '0') + ':00' : '';
                            modalChartLabels.push(label);
                            modalChartData.push({
                                x: d.timestamp,
                                y: value
                            });
                        } catch (e) {
                            console.warn(`Failed to parse timestamp: ${d.timestamp}`, e);
                            continue;
                        }
                    }
                    
                    if (modalChartData.length === 0 || modalChartLabels.length === 0) {
                        modalBody.innerHTML = '<p style="padding: 2rem; text-align: center; color: #5A6C7D;">No valid data available for this chart.</p>';
                        return;
                    }
                    
                    if (modalChartData.length !== modalChartLabels.length) {
                        console.error(`Data/label mismatch: ${modalChartData.length} data points vs ${modalChartLabels.length} labels`);
                        modalBody.innerHTML = '<p style="padding: 2rem; text-align: center; color: #5A6C7D;">Data format error. Please check console.</p>';
                        return;
                    }
                    
                    if (typeof Chart === 'undefined') {
                        console.error('Chart.js is not loaded');
                        modalBody.innerHTML = '<p style="padding: 2rem; text-align: center; color: #5A6C7D;">Chart library failed to load. Please refresh the page.</p>';
                        return;
                    }
                    
                    // Calculate dynamic Y-axis range for modal
                    const modalValues = modalChartData.map(d => typeof d === 'object' ? d.y : d);
                    const modalMinValue = Math.min(...modalValues);
                    const modalMaxValue = Math.max(...modalValues);
                    const modalRange = modalMaxValue - modalMinValue;
                    const modalPadding = modalRange * 0.1;
                    
                    let modalYMin, modalYMax, modalStepSize;
                    if (chartType === 'storage') {
                        modalYMin = Math.max(0, Math.floor((modalMinValue - modalPadding) / 100000) * 100000);
                        modalYMax = Math.ceil((modalMaxValue + modalPadding) / 100000) * 100000;
                        modalStepSize = Math.max(200000, Math.ceil((modalYMax - modalYMin) / 5 / 200000) * 200000);
                    } else {
                        modalYMin = Math.max(0, Math.floor((modalMinValue - modalPadding) / 50) * 50);
                        modalYMax = Math.ceil((modalMaxValue + modalPadding) / 50) * 50;
                        modalStepSize = Math.max(50, Math.ceil((modalYMax - modalYMin) / 5 / 50) * 50);
                    }
                    
                    const chartLabel = chartType === 'storage' ? 'Storage (acre-feet)' : 'Elevation (feet)';
                    const borderColor = chartType === 'storage' ? '#4A90E2' : '#5FB3B3';
                    const bgColor = chartType === 'storage' ? 'rgba(74, 144, 226, 0.1)' : 'rgba(95, 179, 179, 0.1)';
                    
                    try {
                        new Chart(modalCanvas, {
                        type: 'line',
                        data: {
                            labels: modalChartLabels,
                            datasets: [{
                                label: chartLabel,
                                data: modalChartData,
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
                                    display: false
                                },
                                tooltip: {
                                    mode: 'index',
                                    intersect: false,
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                    padding: 10,
                                    titleFont: { size: 12 },
                                    bodyFont: { size: 11 },
                        callbacks: {
                            title: function(context) {
                                const dataIndex = context[0].dataIndex;
                                const dataPoint = modalChartData[dataIndex];
                                if (dataPoint && typeof dataPoint === 'object' && dataPoint.x) {
                                    const date = new Date(dataPoint.x);
                                    const month = date.toLocaleString('en-US', { month: 'short' });
                                    const day = date.getDate();
                                    const hours = String(date.getHours()).padStart(2, '0');
                                    const minutes = String(date.getMinutes()).padStart(2, '0');
                                    return `${month} ${day} ${hours}h${minutes}`;
                                }
                                return context[0].label || '';
                            }
                        }
                                }
                            },
                            scales: {
                                x: {
                                    display: true,
                                    grid: {
                                        display: true,
                                        color: 'rgba(0, 0, 0, 0.05)'
                                    },
                                    ticks: {
                                        maxTicksLimit: 12,
                                        font: { size: 11 },
                                        callback: function(value, index) {
                                            // Only show non-empty labels (every 2 hours)
                                            const label = modalChartLabels[index];
                                            return label || '';
                                        }
                                    }
                                },
                                y: {
                                    display: true,
                                    min: modalYMin,
                                    max: modalYMax,
                                    grid: {
                                        color: 'rgba(0, 0, 0, 0.05)'
                                    },
                                    ticks: {
                                        font: { size: 11 },
                                        stepSize: modalStepSize,
                                        callback: function(value) {
                                            if (chartType === 'storage') {
                                                return (value / 1000000).toFixed(1);
                                            }
                                            return value.toFixed(0);
                                        }
                                    }
                                }
                            }
                        }
                        });
                    } catch (chartError) {
                        console.error('Error creating chart:', chartError);
                        modalBody.innerHTML = '<p style="padding: 2rem; text-align: center; color: #5A6C7D;">Error creating chart. Please check console for details.</p>';
                    }
                })
                .catch(error => {
                    console.error('Error loading chart data:', error);
                    modalBody.innerHTML = `<p style="padding: 2rem; text-align: center; color: #5A6C7D;">Error loading chart data: ${error.message}</p>`;
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

// Wait for Chart.js to load
function waitForChartJS(callback, maxAttempts = 150) {
    console.log(`waitForChartJS: attempt ${150 - maxAttempts + 1}/${150}, Chart defined: ${typeof Chart !== 'undefined'}`);
    
    if (typeof Chart !== 'undefined') {
        console.log('Chart.js loaded successfully!');
        callback();
    } else if (maxAttempts > 0) {
        setTimeout(() => waitForChartJS(callback, maxAttempts - 1), 100);
    } else {
        console.error('Chart.js failed to load after 15 seconds. Final check - Chart:', typeof Chart);
        console.error('window.chartJsLoadSuccess:', window.chartJsLoadSuccess);
        console.error('window.chartJsLoadFailed:', window.chartJsLoadFailed);
        
        // Show error message in chart containers
        document.querySelectorAll('.grafana-panel-compact').forEach(panel => {
            if (!panel.querySelector('canvas') && !panel.textContent.includes('No data')) {
                panel.innerHTML = '<p style="padding: 1rem; text-align: center; color: #d32f2f; font-size: 0.8rem;">Chart library failed to load<br><span style="font-size: 0.7rem;">Check browser console</span></p>';
            }
        });
    }
}

// Create overlay charts showing both reservoirs
async function createOverlayCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded, skipping overlay charts');
        return;
    }
    
    // Get time range from first reservoir (they should be the same)
    const days = getTimeRange('BER');
    
    try {
        // Fetch data for both reservoirs
        const [berResponse, oroResponse] = await Promise.all([
            fetch(`${API_BASE}/reservoir/BER/data?days=${days}`),
            fetch(`${API_BASE}/reservoir/ORO/data?days=${days}`)
        ]);
        
        if (!berResponse.ok || !oroResponse.ok) {
            console.error('Failed to load data for overlay charts');
            return;
        }
        
        const berData = await berResponse.json();
        const oroData = await oroResponse.json();
        
        // Create storage overlay chart
        createOverlayChart('storage', berData.data || [], oroData.data || [], days, 'Storage (acre-feet)');
        
        // Create elevation overlay chart
        createOverlayChart('elevation', berData.data || [], oroData.data || [], days, 'Elevation (feet)');
    } catch (error) {
        console.error('Error creating overlay charts:', error);
    }
}

// Create a single overlay chart with both reservoirs
function createOverlayChart(metric, berDataPoints, oroDataPoints, days, label) {
    const panel = document.getElementById(`overlay-${metric}-chart`);
    if (!panel) {
        console.error(`Overlay panel not found: overlay-${metric}-chart`);
        return;
    }
    
    // Clear and create canvas
    panel.innerHTML = '<canvas></canvas>';
    const canvas = panel.querySelector('canvas');
    if (!canvas) return;
    
    // Prepare data for both reservoirs
    const berData = prepareChartData(berDataPoints, metric, days, 'BER');
    const oroData = prepareChartData(oroDataPoints, metric, days, 'ORO');
    
    if (berData.values.length === 0 && oroData.values.length === 0) {
        panel.innerHTML = '<p style="padding: 2rem; text-align: center; color: #5A6C7D;">No data available</p>';
        return;
    }
    
    // Use labels from the dataset with more points, or combine them
    const labels = berData.labels.length >= oroData.labels.length ? berData.labels : oroData.labels;
    
    // Calculate dynamic Y-axis range based on all values
    const allValues = [...berData.values, ...oroData.values];
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const range = maxValue - minValue;
    const padding = range * 0.1;
    
    let yMin, yMax, stepSize;
    if (metric === 'storage') {
        yMin = Math.max(0, Math.floor((minValue - padding) / 100000) * 100000);
        yMax = Math.ceil((maxValue + padding) / 100000) * 100000;
        stepSize = Math.max(200000, Math.ceil((yMax - yMin) / 5 / 200000) * 200000);
    } else {
        yMin = Math.max(0, Math.floor((minValue - padding) / 50) * 50);
        yMax = Math.ceil((maxValue + padding) / 50) * 50;
        stepSize = Math.max(50, Math.ceil((yMax - yMin) / 5 / 50) * 50);
    }
    
    // Merge timestamps and create aligned datasets by timestamp
    const allTimestamps = new Set();
    berData.timestamps.forEach(ts => allTimestamps.add(ts));
    oroData.timestamps.forEach(ts => allTimestamps.add(ts));
    
    // Sort timestamps
    const sortedTimestamps = Array.from(allTimestamps).sort();
    
    // Create maps for quick lookup
    const berMap = new Map();
    berData.timestamps.forEach((ts, idx) => {
        berMap.set(ts, berData.values[idx]);
    });
    
    const oroMap = new Map();
    oroData.timestamps.forEach((ts, idx) => {
        oroMap.set(ts, oroData.values[idx]);
    });
    
    // Rebuild labels and aligned data based on sorted timestamps
    const alignedLabels = [];
    const berAligned = [];
    const oroAligned = [];
    let lastDay = -1;
    
    sortedTimestamps.forEach((ts, idx) => {
        const date = new Date(ts);
        let label = '';
        
        // Generate label based on time range
        if (days <= 7) {
            const currentDay = date.getDate();
            const hours = date.getHours();
            const minutes = date.getMinutes();
            
            if ((hours === 0 && minutes === 0) || (currentDay !== lastDay && lastDay !== -1)) {
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                label = dayNames[date.getDay()];
                lastDay = currentDay;
            } else if (idx === 0) {
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                label = dayNames[date.getDay()];
                lastDay = currentDay;
            }
        } else {
            label = formatDateLabel(date, days, idx, sortedTimestamps.length);
        }
        
        alignedLabels.push(label);
        
        // Get values for this timestamp, or null if not available
        const berValue = berMap.get(ts);
        const oroValue = oroMap.get(ts);
        
        berAligned.push(berValue !== undefined ? { x: ts, y: berValue } : null);
        oroAligned.push(oroValue !== undefined ? { x: ts, y: oroValue } : null);
    });
    
    // Use aligned labels
    const labels = alignedLabels;
    
    try {
        new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Lake Berryessa',
                        data: berAligned,
                        borderColor: '#4A90E2',
                        backgroundColor: 'rgba(74, 144, 226, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'Lake Oroville',
                        data: oroAligned,
                        borderColor: '#5FB3B3',
                        backgroundColor: 'rgba(95, 179, 179, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: { size: 12 },
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 10,
                        titleFont: { size: 12 },
                        bodyFont: { size: 11 },
                        callbacks: {
                            title: function(context) {
                                const dataIndex = context[0].dataIndex;
                                const dataPoint = berAligned[dataIndex] || oroAligned[dataIndex];
                                if (dataPoint && typeof dataPoint === 'object' && dataPoint.x) {
                                    const date = new Date(dataPoint.x);
                                    const month = date.toLocaleString('en-US', { month: 'short' });
                                    const day = date.getDate();
                                    const hours = String(date.getHours()).padStart(2, '0');
                                    const minutes = String(date.getMinutes()).padStart(2, '0');
                                    return `${month} ${day} ${hours}h${minutes}`;
                                }
                                return context[0].label || '';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: days <= 7,
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            maxTicksLimit: days <= 7 ? 8 : 6,
                            font: { size: 10 },
                            callback: function(value, index) {
                                const label = labels[index];
                                return label || '';
                            }
                        }
                    },
                    y: {
                        display: true,
                        min: yMin,
                        max: yMax,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: { size: 10 },
                            stepSize: stepSize,
                            callback: function(value) {
                                if (metric === 'storage') {
                                    return (value / 1000000).toFixed(1);
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
    } catch (error) {
        console.error(`Error creating overlay chart for ${metric}:`, error);
        panel.innerHTML = '<p style="padding: 2rem; text-align: center; color: #d32f2f;">Error creating chart</p>';
    }
}

// Helper function to prepare chart data
function prepareChartData(dataPoints, metric, days, reservoirCode) {
    const values = [];
    const labels = [];
    const timestamps = [];
    let lastDay = -1;
    
    for (let i = 0; i < dataPoints.length; i++) {
        const d = dataPoints[i];
        let value = null;
        if (metric === 'storage') {
            value = d.storage !== null && d.storage !== undefined ? d.storage : null;
        } else {
            value = d.reservoir_elevation !== null && d.reservoir_elevation !== undefined ? d.reservoir_elevation : null;
        }
        
        if (value === null) continue;
        
        try {
            const date = new Date(d.timestamp);
            if (isNaN(date.getTime())) continue;
            
            let dateLabel = '';
            if (days <= 7) {
                const currentDay = date.getDate();
                const hours = date.getHours();
                const minutes = date.getMinutes();
                
                if ((hours === 0 && minutes === 0) || (currentDay !== lastDay && lastDay !== -1)) {
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    dateLabel = dayNames[date.getDay()];
                    lastDay = currentDay;
                } else if (i === 0) {
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    dateLabel = dayNames[date.getDay()];
                    lastDay = currentDay;
                }
            } else {
                dateLabel = formatDateLabel(date, days, values.length, dataPoints.length);
            }
            
            labels.push(dateLabel);
            values.push(value);
            timestamps.push(d.timestamp);
        } catch (e) {
            continue;
        }
    }
    
    return { values, labels, timestamps };
}

// Note: alignDataToLabels function removed - now using timestamp-based alignment in createOverlayChart

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadReservoirData();
    
    // Wait for Chart.js before creating charts
    waitForChartJS(() => {
        createCharts();
        createOverlayCharts();
        setupChartModals();
        
        // Set up time range selectors
        const reservoirs = ['BER', 'ORO'];
        reservoirs.forEach(code => {
            const select = document.getElementById(`time-range-${code}`);
            if (select) {
                select.addEventListener('change', () => {
                    createCharts(code);
                    createOverlayCharts(); // Update overlay charts too
                });
            }
        });
    });
    
    // Refresh data every 5 minutes
    setInterval(() => {
        loadReservoirData();
        if (typeof Chart !== 'undefined') {
            createCharts();
            createOverlayCharts();
        }
    }, 5 * 60 * 1000);
});

