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
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

    // Update timestamp
    const timestampEl = document.getElementById(`timestamp-${code}`);
    if (timestampEl) {
        timestampEl.textContent = formatDate(data.timestamp);
    }
}

// Embed Grafana panels
function embedGrafanaPanels() {
    const panels = document.querySelectorAll('.grafana-panel');
    
    panels.forEach(panel => {
        const panelId = panel.getAttribute('data-panel-id');
        const reservoirCode = panel.closest('.reservoir-card').getAttribute('data-reservoir');
        
        // Determine which metric this panel should show
        const isStorage = panelId.includes('storage');
        const metric = isStorage ? 'storage' : 'elevation';
        
        // Create Grafana panel URL
        // Note: This requires Grafana to be set up with appropriate dashboards
        // For now, we'll create a placeholder that can be configured
        const grafanaUrl = `${GRAFANA_URL}/d-solo/reservoir-dashboard/reservoir-dog?orgId=1&panelId=${panelId}&from=now-30d&to=now&theme=light`;
        
        // Create iframe for Grafana panel
        const iframe = document.createElement('iframe');
        iframe.src = grafanaUrl;
        iframe.style.width = '100%';
        iframe.style.height = '400px';
        iframe.style.border = 'none';
        iframe.title = `${reservoirCode} ${metric} chart`;
        
        // For now, show a placeholder until Grafana is configured
        panel.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #5A6C7D;">
                <p>Grafana panel will be embedded here</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">
                    Configure Grafana dashboard and update GRAFANA_URL in main.js
                </p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem; font-style: italic;">
                    Panel ID: ${panelId}
                </p>
            </div>
        `;
        
        // Uncomment when Grafana is ready:
        // panel.appendChild(iframe);
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
    
    // Refresh data every 5 minutes
    setInterval(loadReservoirData, 5 * 60 * 1000);
});

