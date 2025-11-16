# Reservoir Dog

A modern, dynamic web application for monitoring historical and current reservoir levels for Lake Berryessa and Lake Oroville in California.

## Features

- **Real-time Data Collection**: Automatically collects data from CDEC (California Data Exchange Center) and US Bureau of Reclamation
- **Time-Series Storage**: SQLite database for efficient storage of historical data
- **Modern Web Interface**: Water-themed, responsive design with real-time updates
- **Grafana Integration**: Embedded Grafana charts for beautiful visualizations
- **RESTful API**: JSON API endpoints for accessing reservoir data

## Project Structure

```
reservoirdog/
├── app.py              # Flask web application
├── collector.py        # Data collection from CDEC/USBR
├── database.py         # Database models and setup
├── scheduler.py        # Periodic data collection service
├── config.py           # Configuration settings
├── requirements.txt    # Python dependencies
├── templates/          # HTML templates
│   └── index.html
├── static/             # Static files (CSS, JS)
│   ├── css/
│   │   └── main.css
│   └── js/
│       └── main.js
└── data/               # Database storage (created automatically)
```

## Installation

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

2. **Initialize the database:**
```bash
python -c "from database import init_db; init_db()"
```

3. **Test data collection:**
```bash
python collector.py
```

## Usage

### Running the Web Application

Start the Flask web server:
```bash
python app.py
```

The application will be available at `http://localhost:5000`

### Running the Data Collector Scheduler

In a separate terminal, start the scheduler to collect data periodically:
```bash
python scheduler.py
```

By default, data is collected every 60 minutes. This can be configured in `config.py`.

### Manual Data Collection

You can also run the collector manually:
```bash
python collector.py
```

## Data Sources

The application collects data from:

1. **CDEC (California Data Exchange Center)**
   - Current data: `https://cdec.water.ca.gov/dynamicapp/QueryF?s={STATION_ID}`
   - Historical data: `https://cdec.water.ca.gov/histPlot/DataPlotter.jsp?staid={STATION_ID}&sensor_no=15&duration=D&start=01%2F01%2F1985+07%3A29&end=now&geom=Large`
   - Metadata: `https://cdec.water.ca.gov/dynamicapp/staMeta?station_id={STATION_ID}`

2. **US Bureau of Reclamation**
   - Current operations: `https://www.usbr.gov/mp/cvo/current.html`

## API Endpoints

- `GET /` - Main dashboard page
- `GET /api/reservoirs` - List of all reservoirs
- `GET /api/reservoir/<code>/latest` - Latest data for a reservoir
- `GET /api/reservoir/<code>/data?days=30` - Time-series data (default: 30 days)
- `GET /api/reservoir/<code>/stats` - Statistics for a reservoir

## Grafana Setup

To use Grafana charts:

1. **Install Grafana:**
```bash
# Using Docker
docker run -d -p 3000:3000 --name=grafana grafana/grafana

# Or install locally
# See: https://grafana.com/docs/grafana/latest/setup-grafana/installation/
```

2. **Configure Grafana:**
   - Access Grafana at `http://localhost:3000`
   - Default login: admin/admin
   - Add SQLite as a data source (may require a plugin)
   - Create dashboards for each reservoir
   - Update `GRAFANA_URL` in `static/js/main.js`

3. **Alternative: Use Chart.js**
   If you prefer not to use Grafana, you can modify `static/js/main.js` to use Chart.js or another charting library.

## Configuration

Edit `config.py` to customize:
- Database location
- Collection interval
- Flask server settings
- Grafana URL and API key

## Data Notes

- **Lake Berryessa**: Data before 1997 is sporadic
- Data is collected hourly by default
- Historical data can be backfilled by running the collector multiple times or implementing a historical data fetcher

## Development

### Testing Data Collection

Test the collector for a specific reservoir:
```python
from collector import ReservoirCollector

collector = ReservoirCollector()
data = collector.collect_cdec_query('BER')
print(data)
```

### Database Queries

Query the database directly:
```python
from database import SessionLocal, ReservoirData
from sqlalchemy import desc

db = SessionLocal()
latest = db.query(ReservoirData).filter(
    ReservoirData.reservoir_code == 'BER'
).order_by(desc(ReservoirData.timestamp)).first()
print(latest.storage, latest.reservoir_elevation)
```

## Future Enhancements

- [ ] Historical data backfill from CDEC
- [ ] USBR data parsing implementation
- [ ] Grafana dashboard templates
- [ ] Email/SMS alerts for low water levels
- [ ] Additional reservoirs
- [ ] Mobile app
- [ ] Export data to CSV/JSON

## License

MIT License

