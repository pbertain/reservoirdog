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
            
            html_content = response.text
            
            # Determine line counts based on reservoir
            if reservoir_code == 'BER':
                head_lines = 1826
                tail_lines = 5
            elif reservoir_code == 'ORO':
                head_lines = 1485
                tail_lines = 5
            else:
                head_lines = 1826
                tail_lines = 5
            
            lines = html_content.splitlines()[:head_lines]
            td_lines = [line for line in lines[-tail_lines:] if "<td" in line]
            
            if not td_lines:
                logger.warning(f"No data found in HTML for {reservoir_code}")
                return None
            
            soup = BeautifulSoup("\n".join(td_lines), 'html.parser')
            
            # Extract date-time stamp
            date_td = soup.find('td')
            if not date_td:
                return None
            
            date_time_stamp_str = date_td.get_text(strip=True)
            
            # Parse timestamp - format varies, try multiple patterns
            timestamp = self._parse_timestamp(date_time_stamp_str)
            
            # Extract numeric values
            numeric_values = [font.get_text(strip=True) for font in soup.find_all('font')]
            
            if len(numeric_values) >= 2:
                try:
                    res_ele = float(numeric_values[0].replace(',', ''))
                    storage = float(numeric_values[1].replace(',', ''))
                    return (timestamp, res_ele, storage)
                except (ValueError, IndexError) as e:
                    logger.error(f"Error parsing numeric values for {reservoir_code}: {e}")
                    return None
            
            return None
            
        except Exception as e:
            logger.error(f"Error collecting CDEC query data for {reservoir_code}: {e}")
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

