"""
Scheduler service for periodic data collection
"""
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging
from collector import ReservoirCollector
import config

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def collect_data_job():
    """Job function to collect reservoir data"""
    logger.info("Starting scheduled data collection...")
    collector = ReservoirCollector()
    results = collector.collect_all()
    logger.info(f"Data collection completed. Results: {results}")


def run_scheduler():
    """Run the scheduler"""
    scheduler = BlockingScheduler()
    
    # Schedule data collection
    trigger = IntervalTrigger(minutes=config.COLLECTION_INTERVAL_MINUTES)
    scheduler.add_job(
        collect_data_job,
        trigger=trigger,
        id='collect_reservoir_data',
        name='Collect Reservoir Data',
        replace_existing=True
    )
    
    logger.info(f"Scheduler started. Collecting data every {config.COLLECTION_INTERVAL_MINUTES} minutes.")
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped.")


if __name__ == '__main__':
    run_scheduler()

