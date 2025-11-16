import sys

# Define the static dictionary
my_dict = {
    'ber': 'Lake Berryessa - Montecello Dam',
    'oro': 'Oroville Dam',
}

def get_available_keys():
    return list(my_dict.keys())

def main():
    # Check if the script was invoked with the -h argument
    if len(sys.argv) == 2 and sys.argv[1] == '-h':
        available_keys = get_available_keys()
        print("Available keys in the dictionary:")
        for key in available_keys:
            print(key)
    elif len(sys.argv) == 2:
        argument = sys.argv[1]
        # Check if the argument is in the dictionary
        if argument in my_dict:
            print(my_dict[argument])
        else:
            print(f"'{argument}' not found in the dictionary.")
    else:
        print("Usage: python script.py [-h] [key]")

if __name__ == "__main__":
    main()
