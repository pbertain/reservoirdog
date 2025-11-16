# Quick Start Guide

## First Time Setup

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Initialize the database:**
```bash
python -c "from database import init_db; init_db()"
```

3. **Test data collection:**
```bash
python test_collector.py
```

This will test fetching data from CDEC for both reservoirs. If successful, you should see:
- ✓ Successfully collected data for BER
- ✓ Successfully collected data for ORO

## Running the Application

### Option 1: Use the helper script
```bash
./run.sh web        # Start web server
./run.sh collector  # Start data collector
./run.sh test       # Test data collection
```

### Option 2: Run manually

**Start the web server:**
```bash
python app.py
```
Then open http://localhost:5000 in your browser.

**Start the data collector (in a separate terminal):**
```bash
python scheduler.py
```

## Testing the URLs

The collector is configured to use these URLs:

### Lake Berryessa (BER)
- Current data: `https://cdec.water.ca.gov/dynamicapp/QueryF?s=BER`
- Historical: `https://cdec.water.ca.gov/histPlot/DataPlotter.jsp?staid=ber&sensor_no=15&duration=D&start=01%2F01%2F1985+07%3A29&end=now&geom=Large`

### Lake Oroville (ORO)
- Current data: `https://cdec.water.ca.gov/dynamicapp/QueryF?s=ORO`
- Historical: `https://cdec.water.ca.gov/histPlot/DataPlotter.jsp?staid=ORO&sensor_no=15&duration=D&start=01%2F01%2F1985+07%3A29&end=now&geom=Large`
- Interactive: `https://cdec.water.ca.gov/resapp/ResDetail?resid=ORO`

### USBR Data
- Current operations: `https://www.usbr.gov/mp/cvo/current.html`

**Note:** The USBR data collection is not yet fully implemented as the page structure needs to be analyzed. The CDEC endpoints should work immediately.

## Troubleshooting

### Data collection fails
- Check your internet connection
- Verify the CDEC URLs are accessible
- Check the HTML structure hasn't changed (the collector parses specific HTML elements)

### Database errors
- Make sure the `data/` directory exists and is writable
- Try deleting `data/reservoir_data.db` and reinitializing

### Web server won't start
- Check if port 5000 is already in use
- Change the port in `config.py` if needed

## Next Steps

1. **Collect some data:** Run the collector a few times to build up historical data
2. **Set up Grafana (optional):** See README.md for Grafana setup instructions
3. **Customize:** Edit `config.py` and the templates to match your preferences

