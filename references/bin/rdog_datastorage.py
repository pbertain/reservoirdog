from flask import Flask
from prometheus_metrics_exporter import PrometheusMetricsExporter
import rdog_collector

app = Flask(__name__)
metrics = PrometheusMetricsExporter(app)
base_url = "https://cdec.water.ca.gov/dynamicapp/QueryF?s="
dam_list = [BER ORV]
td_lines = fetch_data_from_url(url)

# Function to fetch RES_ELE and STORAGE data (modify as needed)
def fetch_data():
    # Replace this with logic to fetch RES_ELE and STORAGE data
    res_ele_value = 100.0
    storage_value = 200

    return res_ele_value, storage_value

@app.route('/metrics')
def metrics_endpoint():
    res_ele_value, storage_value = fetch_data()
    
    # Expose RES_ELE and STORAGE data as Prometheus metrics
    metrics.gauge('res_ele_value', 'RES_ELE value', value=res_ele_value)
    metrics.gauge('storage_value', 'STORAGE value', value=storage_value)

    return metrics.export()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)


