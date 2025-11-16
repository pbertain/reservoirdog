from flask import Flask
from prometheus_client import Gauge, generate_latest, CONTENT_TYPE_LATEST
from flask import Response

app = Flask(__name__)

# Create Prometheus metrics
res_ele_value = Gauge('res_ele_value', 'RES_ELE value')
storage_value = Gauge('storage_value', 'STORAGE value')

# Function to fetch RES_ELE and STORAGE data (modify as needed)
def fetch_data():
    # Replace this with logic to fetch RES_ELE and STORAGE data
    res_ele_value.set(100.0)
    storage_value.set(200)

@app.route('/metrics')
def metrics():
    fetch_data()
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
