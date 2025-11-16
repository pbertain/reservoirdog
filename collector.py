"""
Data collector for reservoir levels from CDEC and USBR
"""
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import re
import logging
from database import ReservoirData, SessionLocal
import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ReservoirCollector:
    """Collects reservoir data from various sources"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
    
    def collect_cdec_query(self, reservoir_code):
        """
        Collect data from CDEC QueryF endpoint (current data)
        Returns: (timestamp, reservoir_elevation, storage) or None
        """
        try:
            reservoir_config = config.RESERVOIRS.get(reservoir_code)
            if not reservoir_config:
                logger.error(f"Unknown reservoir code: {reservoir_code}")
                return None
            
            url = reservoir_config['cdec_query_url']
            response = self.session.get(url, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"Failed to fetch CDEC data for {reservoir_code}: {response.status_code}")
                return None
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find all tables - the data is typically in the last table
            tables = soup.find_all('table')
            if not tables:
                logger.warning(f"No tables found in HTML for {reservoir_code}")
                return None
            
            # Get the last table (most recent data)
            data_table = tables[-1]
            rows = data_table.find_all('tr')
            
            if not rows:
                logger.warning(f"No rows found in table for {reservoir_code}")
                return None
            
            # Find the last row with valid data (not '--')
            for row in reversed(rows):
                cells = row.find_all('td')
                if len(cells) >= 3:
                    timestamp_str = cells[0].get_text(strip=True)
                    elevation_str = cells[1].get_text(strip=True)
                    storage_str = cells[2].get_text(strip=True)
                    
                    # Skip rows with missing data
                    if elevation_str == '--' or storage_str == '--':
                        continue
                    
                    try:
                        # Parse timestamp
                        timestamp = self._parse_timestamp(timestamp_str)
                        
                        # Parse numeric values
                        res_ele = float(elevation_str.replace(',', ''))
                        storage = float(storage_str.replace(',', ''))
                        
                        logger.info(f"Successfully parsed data for {reservoir_code}: {timestamp_str}, elevation={res_ele}, storage={storage}")
                        return (timestamp, res_ele, storage)
                    except (ValueError, Exception) as e:
                        logger.debug(f"Skipping row due to parse error: {e}")
                        continue
            
            logger.warning(f"No valid data rows found for {reservoir_code}")
            return None
            
        except Exception as e:
            logger.error(f"Error collecting CDEC query data for {reservoir_code}: {e}")
            import traceback
            logger.debug(traceback.format_exc())
            return None
    
    def collect_cdec_historical(self, reservoir_code):
        """
        Collect historical data from CDEC DataPlotter
        This returns a plot page, so we'd need to parse the data differently
        For now, we'll focus on the QueryF endpoint for current data
        """
        # TODO: Implement historical data collection if needed
        pass
    
    def collect_usbr_data(self):
        """
        Collect data from US Bureau of Reclamation
        Returns: dict mapping reservoir codes to data
        """
        try:
            response = self.session.get(config.USBR_URL, timeout=30)
            if response.status_code != 200:
                logger.error(f"Failed to fetch USBR data: {response.status_code}")
                return {}
            
            soup = BeautifulSoup(response.text, 'html.parser')
            # USBR page structure needs to be analyzed
            # For now, return empty dict - will need to implement based on actual page structure
            logger.info("USBR data collection not yet implemented - page structure analysis needed")
            return {}
            
        except Exception as e:
            logger.error(f"Error collecting USBR data: {e}")
            return {}
    
    def _parse_timestamp(self, timestamp_str):
        """Parse various timestamp formats from CDEC"""
        # Try multiple date formats
        formats = [
            '%m/%d/%Y %H:%M',
            '%m/%d/%Y %H:%M:%S',
            '%Y-%m-%d %H:%M:%S',
            '%m/%d/%Y',
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(timestamp_str, fmt)
            except ValueError:
                continue
        
        # If all fail, return current time
        logger.warning(f"Could not parse timestamp: {timestamp_str}, using current time")
        return datetime.utcnow()
    
    def save_data(self, reservoir_code, timestamp, reservoir_elevation, storage, data_source='CDEC'):
        """Save collected data to database"""
        db = SessionLocal()
        try:
            # Calculate storage percentage if we have capacity data
            storage_percent = None
            # TODO: Get capacity from metadata table
            
            # Check if data already exists for this timestamp
            existing = db.query(ReservoirData).filter(
                ReservoirData.reservoir_code == reservoir_code,
                ReservoirData.timestamp == timestamp
            ).first()
            
            if existing:
                logger.debug(f"Data already exists for {reservoir_code} at {timestamp}")
                return existing
            
            data = ReservoirData(
                reservoir_code=reservoir_code,
                timestamp=timestamp,
                reservoir_elevation=reservoir_elevation,
                storage=storage,
                storage_percent=storage_percent,
                data_source=data_source
            )
            
            db.add(data)
            db.commit()
            db.refresh(data)
            logger.info(f"Saved data for {reservoir_code}: elevation={reservoir_elevation}, storage={storage}")
            return data
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving data for {reservoir_code}: {e}")
            return None
        finally:
            db.close()
    
    def collect_all(self):
        """Collect data for all configured reservoirs"""
        results = {}
        for code in config.RESERVOIRS.keys():
            logger.info(f"Collecting data for {code}...")
            data = self.collect_cdec_query(code)
            if data:
                timestamp, res_ele, storage = data
                saved = self.save_data(code, timestamp, res_ele, storage)
                results[code] = saved
            else:
                logger.warning(f"No data collected for {code}")
                results[code] = None
        
        # Also try USBR data
        usbr_data = self.collect_usbr_data()
        if usbr_data:
            for code, data in usbr_data.items():
                # Save USBR data if available
                pass
        
        return results


if __name__ == '__main__':
    # Test collection
    collector = ReservoirCollector()
    results = collector.collect_all()
    print(f"Collection results: {results}")

