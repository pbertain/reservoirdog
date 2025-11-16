#!/bin/bash
# Helper script to run Reservoir Dog

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Reservoir Dog - Starting Services${NC}\n"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
if [ ! -f ".deps_installed" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
    touch .deps_installed
fi

# Initialize database if it doesn't exist
if [ ! -f "data/reservoir_data.db" ]; then
    echo "Initializing database..."
    python -c "from database import init_db; init_db()"
    echo -e "${GREEN}Database initialized${NC}"
fi

# Check command line argument
case "${1:-web}" in
    web)
        echo -e "${GREEN}Starting web server...${NC}"
        echo "Access the dashboard at: http://localhost:5000"
        python app.py
        ;;
    collector)
        echo -e "${GREEN}Starting data collector scheduler...${NC}"
        python scheduler.py
        ;;
    test)
        echo -e "${GREEN}Testing data collection...${NC}"
        python test_collector.py
        ;;
    *)
        echo "Usage: $0 [web|collector|test]"
        echo "  web      - Start web server (default)"
        echo "  collector - Start data collection scheduler"
        echo "  test     - Test data collection"
        exit 1
        ;;
esac

