"""
Configuration settings for Reservoir Dog application
"""
import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', f'sqlite:///{BASE_DIR}/data/reservoir_data.db')

# Data collection settings
COLLECTION_INTERVAL_MINUTES = 15  # Collect data every 15 minutes

# Reservoir configurations
RESERVOIRS = {
    'BER': {
        'name': 'Lake Berryessa',
        'dam_name': 'Monticello Dam',
        'station_id': 'BER',
        'cdec_metadata_url': 'https://cdec.water.ca.gov/dynamicapp/staMeta?station_id=BER',
        'cdec_storage_url': 'https://cdec.water.ca.gov/histPlot/DataPlotter.jsp?staid=ber&sensor_no=15&duration=D&start=01%2F01%2F1985+07%3A29&end=now&geom=Large',
        'cdec_query_url': 'https://cdec.water.ca.gov/dynamicapp/QueryF?s=BER',
    },
    'ORO': {
        'name': 'Lake Oroville',
        'dam_name': 'Oroville Dam',
        'station_id': 'ORO',
        'cdec_metadata_url': 'https://cdec.water.ca.gov/dynamicapp/staMeta?station_id=ORO',
        'cdec_storage_url': 'https://cdec.water.ca.gov/histPlot/DataPlotter.jsp?staid=ORO&sensor_no=15&duration=D&start=01%2F01%2F1985+07%3A29&end=now&geom=Large',
        'cdec_query_url': 'https://cdec.water.ca.gov/dynamicapp/QueryF?s=ORO',
        'cdec_resapp_url': 'https://cdec.water.ca.gov/resapp/ResDetail?resid=ORO',
    }
}

# USBR data source
USBR_URL = 'https://www.usbr.gov/mp/cvo/current.html'

# Environment detection
ENVIRONMENT = os.getenv('ENVIRONMENT', 'local')  # local, dev, prod

# Flask settings - environment-specific defaults
if ENVIRONMENT == 'dev':
    FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
    FLASK_PORT = int(os.getenv('FLASK_PORT', 45081))
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
elif ENVIRONMENT == 'prod':
    FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
    FLASK_PORT = int(os.getenv('FLASK_PORT', 45080))
    FLASK_DEBUG = False  # Never debug in production
else:
    FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

# Grafana settings (if using embedded Grafana)
GRAFANA_URL = os.getenv('GRAFANA_URL', 'http://localhost:3000')
GRAFANA_API_KEY = os.getenv('GRAFANA_API_KEY', '')

