import rdog_collector

sites = ['BER', 'ORO']
url = "https://cdec.water.ca.gov/dynamicapp/QueryF?s="

for site in sites:
    full_url = url + site
    td_lines = rdog_collector.fetch_data_from_url(full_url, site)

    if td_lines:
        result = rdog_collector.extract_data(td_lines)
        if result:
            date_time_stamp, res_ele, storage = result
            print("[%s] Date: %s - res_ele: %s - storage: %s" % (site, date_time_stamp, res_ele, storage))
        else:
            print("[%s] Error: Two numeric values were not found in the HTML." % site)
    else:
        print("HTTP request to the URL failed with status code:")#, response.status_code)
