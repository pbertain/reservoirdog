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

// Embed Grafana panels
function embedGrafanaPanels() {
    const panels = document.querySelectorAll('.grafana-panel, .grafana-panel-compact');
    
    panels.forEach(panel => {
        const panelId = panel.getAttribute('data-panel-id');
        const reservoirCode = panel.closest('.reservoir-card').getAttribute('data-reservoir');
        
        // Determine which metric this panel should show
        const isStorage = panelId.includes('storage');
        const metric = isStorage ? 'storage' : 'elevation';
        const isCompact = panel.classList.contains('grafana-panel-compact');
        
        // Create Grafana panel URL
        // Note: This requires Grafana to be set up with appropriate dashboards
        // For now, we'll create a placeholder that can be configured
        const grafanaUrl = `${GRAFANA_URL}/d-solo/reservoir-dashboard/reservoir-dog?orgId=1&panelId=${panelId}&from=now-30d&to=now&theme=light`;
        
        // For now, show a placeholder until Grafana is configured
        panel.innerHTML = `
            <div style="padding: ${isCompact ? '1rem' : '2rem'}; text-align: center; color: #5A6C7D;">
                <p style="font-size: ${isCompact ? '0.8rem' : '1rem'};">Chart placeholder</p>
                <p style="font-size: ${isCompact ? '0.7rem' : '0.9rem'}; margin-top: 0.5rem;">
                    ${isCompact ? 'Click to enlarge' : 'Configure Grafana dashboard'}
                </p>
            </div>
        `;
        
        // Uncomment when Grafana is ready:
        // const iframe = document.createElement('iframe');
        // iframe.src = grafanaUrl;
        // iframe.style.width = '100%';
        // iframe.style.height = isCompact ? '150px' : '400px';
        // iframe.style.border = 'none';
        // iframe.title = `${reservoirCode} ${metric} chart`;
        // panel.appendChild(iframe);
    });
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
            
            // Clone the panel content for the modal
            const originalPanel = document.getElementById(`grafana-${chartType}-${reservoirCode}`);
            const modalBody = document.getElementById('chart-modal-body');
            modalBody.innerHTML = `<div class="grafana-panel" data-panel-id="${panelId}"></div>`;
            
            // Embed the full-size chart in modal
            const modalPanel = modalBody.querySelector('.grafana-panel');
            const grafanaUrl = `${GRAFANA_URL}/d-solo/reservoir-dashboard/reservoir-dog?orgId=1&panelId=${panelId}&from=now-30d&to=now&theme=light`;
            
            modalPanel.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #5A6C7D;">
                    <p>Full-size chart will be displayed here</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">
                        Configure Grafana dashboard and update GRAFANA_URL in main.js
                    </p>
                </div>
            `;
            
            // Uncomment when Grafana is ready:
            // const iframe = document.createElement('iframe');
            // iframe.src = grafanaUrl;
            // iframe.style.width = '100%';
            // iframe.style.height = '600px';
            // iframe.style.border = 'none';
            // modalPanel.appendChild(iframe);
            
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
    embedGrafanaPanels();
    setupChartModals();
    
    // Refresh data every 5 minutes
    setInterval(loadReservoirData, 5 * 60 * 1000);
});

