// Initialize Chart.js
const ctx = document.getElementById('monitoring-chart').getContext('2d');
const monitoringChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Vibration (Hz)',
                data: [],
                borderColor: '#3498db',
                tension: 0.4,
                fill: false
            },
            {
                label: 'Temperature (°C)',
                data: [],
                borderColor: '#e74c3c',
                tension: 0.4,
                fill: false
            },
            {
                label: 'Strain (με)',
                data: [],
                borderColor: '#2ecc71',
                tension: 0.4,
                fill: false
            },
            {
                label: 'Displacement (mm)',
                data: [],
                borderColor: '#f1c40f',
                tension: 0.4,
                fill: false
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true
            }
        },
        animation: {
            duration: 0
        },
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                mode: 'index',
                intersect: false
            }
        }
    }
});

// Sensor thresholds
let thresholds = {
    vibration: { warning: 5, critical: 10 },
    temperature: { warning: 35, critical: 45 },
    strain: { warning: 500, critical: 1000 },
    displacement: { warning: 2, critical: 5 }
};

// Store previous values for trend calculation
let previousValues = {
    vibration: [],
    temperature: [],
    strain: [],
    displacement: []
};

// DOM Elements
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const saveSettingsBtn = document.getElementById('save-settings');
const cancelSettingsBtn = document.getElementById('cancel-settings');
const darkModeToggle = document.getElementById('dark-mode');
const autoRefreshToggle = document.getElementById('auto-refresh');
const refreshBtn = document.getElementById('refresh-btn');
const clearAlertsBtn = document.getElementById('clear-alerts');
const exportBtn = document.getElementById('export-btn');
const chartTimeRange = document.getElementById('chart-time-range');

// Settings Panel Toggle
settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
    loadSettings();
});

// Save Settings
saveSettingsBtn.addEventListener('click', () => {
    saveSettings();
    settingsPanel.classList.add('hidden');
});

// Cancel Settings
cancelSettingsBtn.addEventListener('click', () => {
    settingsPanel.classList.add('hidden');
});

// Dark Mode Toggle
darkModeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', darkModeToggle.checked);
});

// Clear Alerts
clearAlertsBtn.addEventListener('click', () => {
    document.getElementById('alert-list').innerHTML = '';
});

// Export Data
exportBtn.addEventListener('click', () => {
    exportData();
});

// Chart Time Range Change
chartTimeRange.addEventListener('change', () => {
    updateChartTimeRange(chartTimeRange.value);
});

// Load Settings from Local Storage
function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('monitoringSettings')) || {};
    
    // Load thresholds
    Object.keys(thresholds).forEach(sensor => {
        const warningInput = document.getElementById(`${sensor}-warning`);
        if (warningInput && savedSettings[`${sensor}Warning`]) {
            warningInput.value = savedSettings[`${sensor}Warning`];
        }
    });
    
    // Load display settings
    darkModeToggle.checked = localStorage.getItem('darkMode') === 'true';
    autoRefreshToggle.checked = localStorage.getItem('autoRefresh') !== 'false';
    
    // Apply dark mode if enabled
    if (darkModeToggle.checked) {
        document.body.classList.add('dark-mode');
    }
}

// Save Settings to Local Storage
function saveSettings() {
    const settings = {};
    
    // Save thresholds
    Object.keys(thresholds).forEach(sensor => {
        const warningInput = document.getElementById(`${sensor}-warning`);
        if (warningInput) {
            settings[`${sensor}Warning`] = parseFloat(warningInput.value);
            thresholds[sensor].warning = parseFloat(warningInput.value);
        }
    });
    
    // Save display settings
    settings.darkMode = darkModeToggle.checked;
    settings.autoRefresh = autoRefreshToggle.checked;
    
    localStorage.setItem('monitoringSettings', JSON.stringify(settings));
}

// Export Data
function exportData() {
    const data = {
        timestamp: new Date().toISOString(),
        sensors: {
            vibration: previousValues.vibration,
            temperature: previousValues.temperature,
            strain: previousValues.strain,
            displacement: previousValues.displacement
        },
        thresholds: thresholds
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-data-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Update sensor values and check thresholds
function updateSensorValues() {
    const sensors = ['vibration', 'temperature', 'strain', 'displacement'];
    
    sensors.forEach(sensor => {
        // Generate random values for demonstration
        const value = Math.random() * thresholds[sensor].critical * 1.2;
        const formattedValue = value.toFixed(2);
        
        // Update display
        document.getElementById(sensor).textContent = 
            `${formattedValue} ${getUnit(sensor)}`;
        
        // Update gauge
        const gauge = document.getElementById(`${sensor}-gauge`);
        const percentage = (value / thresholds[sensor].critical) * 100;
        gauge.style.setProperty('--gauge-width', `${Math.min(percentage, 100)}%`);
        
        // Update trend
        updateTrend(sensor, value);
        
        // Check thresholds and create alerts
        checkThresholds(sensor, value);
        
        // Update chart
        updateChart(sensor, value);
    });
    
    // Update last update time
    document.getElementById('last-update').textContent = 
        new Date().toLocaleTimeString();
}

// Update trend indicator
function updateTrend(sensor, value) {
    previousValues[sensor].push(value);
    if (previousValues[sensor].length > 5) {
        previousValues[sensor].shift();
    }
    
    const trendElement = document.getElementById(`${sensor}-trend`);
    if (previousValues[sensor].length < 2) return;
    
    const currentValue = previousValues[sensor][previousValues[sensor].length - 1];
    const previousValue = previousValues[sensor][previousValues[sensor].length - 2];
    const trend = currentValue - previousValue;
    
    let trendIcon = '';
    let trendClass = '';
    
    if (Math.abs(trend) < 0.1) {
        trendIcon = '→';
        trendClass = 'neutral';
    } else if (trend > 0) {
        trendIcon = '↑';
        trendClass = 'up';
    } else {
        trendIcon = '↓';
        trendClass = 'down';
    }
    
    trendElement.innerHTML = `<span class="trend-${trendClass}">${trendIcon} ${Math.abs(trend).toFixed(2)}</span>`;
}

// Get unit for each sensor
function getUnit(sensor) {
    const units = {
        vibration: 'Hz',
        temperature: '°C',
        strain: 'με',
        displacement: 'mm'
    };
    return units[sensor];
}

// Check sensor values against thresholds
function checkThresholds(sensor, value) {
    const threshold = thresholds[sensor];
    const alertList = document.getElementById('alert-list');
    
    if (value >= threshold.critical) {
        createAlert(sensor, value, 'critical');
    } else if (value >= threshold.warning) {
        createAlert(sensor, value, 'warning');
    }
}

// Create alert message
function createAlert(sensor, value, level) {
    const alertList = document.getElementById('alert-list');
    const alert = document.createElement('div');
    alert.className = `alert-item ${level}`;
    
    const message = `${sensor.charAt(0).toUpperCase() + sensor.slice(1)}: ${value.toFixed(2)} ${getUnit(sensor)} - ${level.toUpperCase()} LEVEL`;
    alert.innerHTML = `
        <span>${message}</span>
        <button class="control-btn" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    alertList.insertBefore(alert, alertList.firstChild);
    
    // Remove old alerts if more than 5
    while (alertList.children.length > 5) {
        alertList.removeChild(alertList.lastChild);
    }
}

// Update chart with new data
function updateChart(sensor, value) {
    const datasets = monitoringChart.data.datasets;
    const sensorIndex = ['vibration', 'temperature', 'strain', 'displacement'].indexOf(sensor);
    
    // Add new data point
    datasets[sensorIndex].data.push(value);
    
    // Keep only last 20 data points
    if (datasets[sensorIndex].data.length > 20) {
        datasets[sensorIndex].data.shift();
    }
    
    // Update labels
    const now = new Date().toLocaleTimeString();
    monitoringChart.data.labels.push(now);
    if (monitoringChart.data.labels.length > 20) {
        monitoringChart.data.labels.shift();
    }
    
    monitoringChart.update();
}

// Update chart time range
function updateChartTimeRange(range) {
    // Implementation for different time ranges
    // This would typically involve fetching historical data
    console.log(`Updating chart time range to: ${range}`);
}

// Initialize the system
function init() {
    loadSettings();
    updateSensorValues();
    
    // Set up auto-refresh if enabled
    if (autoRefreshToggle.checked) {
        setInterval(updateSensorValues, 1000);
    }
    
    // Manual refresh button
    refreshBtn.addEventListener('click', updateSensorValues);
}

// Start the system
init(); 