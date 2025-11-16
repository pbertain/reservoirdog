import sys
import rdog_collector

accepted_sites = ['oro', 'ber']
url = "https://cdec.water.ca.gov/dynamicapp/QueryF?s="

def main():
    if len(sys.argv) != 5:
        print("Usage: python script.py [-m|--metric <res_ele|storage>] [-s|--site <ORO|BER>]")
        sys.exit(1)

    metric = None
    site = None

    for i in range(len(sys.argv)):
        if sys.argv[i] in ('-m', '--metric'):
            if i + 1 < len(sys.argv):
                metric = sys.argv[i + 1]
                break

    for i in range(len(sys.argv)):
        if sys.argv[i] in ('-s', '--site'):
            if i + 1 < len(sys.argv):
                site = sys.argv[i + 1].upper() if sys.argv[i + 1].lower() in accepted_sites else sys.argv[i + 1]
                break

    if metric not in ['res_ele', 'storage']:
        print("Invalid argument for --metric. Please use 'res_ele' or 'storage'.")
        sys.exit(1)

    if site.lower() not in accepted_sites:
        print("Invalid argument for --site. Please use 'ORO' or 'BER'.")
        sys.exit(1)

    full_url = url + site

    raw_data = rdog_collector.fetch_data_from_url(full_url, site)
    if raw_data:
        result = rdog_collector.extract_data(raw_data)
        if result:
            if metric == 'res_ele':
                print(result[1])
                #print(result)
            elif metric == 'storage':
                print(result[2])
        else:
            print ("No results")
    else:
        print ("No results")

if __name__ == "__main__":
    main()
