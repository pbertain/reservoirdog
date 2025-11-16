import requests
from bs4 import BeautifulSoup

def fetch_data_from_url(url, site):
    # Make an HTTP GET request to the URL
    response = requests.get(url)

    # Check if the request was successful (status code 200)
    if response.status_code == 200:
        # Get the HTML content from the response
        html_content = response.text

        match site.lower():
            case 'ber':
                head_lines = 1826
                tail_lines = 5
            case 'oro':
                head_lines = 1485
                tail_lines = 5
            case _:
                head_lines = 1826
                tail_lines = 5

        # Replace ^M (Windows-style newline) with \n (proper newline character)
        #html_content = html_content.replace('\r\n', '\n')

        # Split the HTML content into lines and select the top 1839 lines
        lines = html_content.splitlines()[:head_lines]

        # Take the last 5 lines and filter only lines containing a td tag
        td_lines = [line for line in lines[-tail_lines:] if "<td" in line]

        return td_lines

    else:
        return None

def extract_data(td_lines):
    # Create a BeautifulSoup object to parse the filtered HTML content
    soup = BeautifulSoup("\n".join(td_lines), 'html.parser')

    # Extract date-time stamp from line 1
    date_time_stamp = soup.find('td').get_text(strip=True)

    # Extract numeric values from lines 2 and 3
    numeric_values = [font.get_text(strip=True) for font in soup.find_all('font')]

    # Ensure that there are two numeric values extracted
    if len(numeric_values) == 2:
        # Convert the numeric values to the appropriate data types
        res_ele = float(numeric_values[0].replace(',', ''))  # Remove commas and convert to float
        storage = int(numeric_values[1].replace(',', ''))   # Remove commas and convert to int

        return date_time_stamp, res_ele, storage

    else:
        return None

if __name__ == "__main__":
    # Example usage
    sites = ['BER', 'ORO']

    url = "https://cdec.water.ca.gov/dynamicapp/QueryF?s="
    for site in sites:
        full_url = url + site
        td_lines = fetch_data_from_url(full_url, site)

        if td_lines:
            result = extract_data(td_lines)
            if result:
                date_time_stamp, res_ele, storage = result
                print("[%s] Date: %s - res_ele: %s - storage: %s" % (site, date_time_stamp, res_ele, storage))
            else:
                print("[%s] Error: Two numeric values were not found in the HTML." % site)
        else:
            print("HTTP request to the URL failed with status code:")#, response.status_code)
