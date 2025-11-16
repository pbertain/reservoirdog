import requests
from bs4 import BeautifulSoup

# Make an HTTP GET request to the URL
url = "https://cdec.water.ca.gov/dynamicapp/QueryF?s=BER"
response = requests.get(url)

# Check if the request was successful (status code 200)
if response.status_code == 200:
    # Get the HTML content from the response
    html_content = response.text

    # Replace ^M (Windows-style newline) with \n (proper newline character)
    html_content = html_content.replace('\r\n', '\n')

    # Split the HTML content into lines and select the top 1839 lines
    lines = html_content.splitlines()[:1827]

    # Take the last 5 lines and filter only lines containing a td tag
    td_lines = [line for line in lines[-6:] if "<td" in line]

    # Create a BeautifulSoup object to parse the filtered HTML content
    soup = BeautifulSoup("\n".join(td_lines), 'html.parser')

    # Extract date-time stamp from line 1
    date_time_stamp = soup.find('td').get_text(strip=True)

    # Extract numeric values from lines 2 and 3
    numeric_values = [font.get_text(strip=True) for font in soup.find_all('font')]

    # Ensure that there are two numeric values extracted
    if len(numeric_values) == 2:
        # Convert the numeric values to the appropriate data types
        RES_ELE = float(numeric_values[0].replace(',', ''))  # Remove commas and convert to float
        STORAGE = int(numeric_values[1].replace(',', ''))   # Remove commas and convert to int

        # Print the extracted values
        print("Date-Time Stamp: %s    |    RES_ELE: %s    |    STORAGE: %s" % (date_time_stamp, RES_ELE, STORAGE))
    else:
        print("Error: Two numeric values were not found in the HTML.")
else:
    print("HTTP request to the URL failed with status code:", response.status_code)

