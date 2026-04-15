"""
Scheduler for automated tasks in the Auto Salary System.
This module handles scheduled tasks like auto-checkout at company closing time.
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API base URL (adjust if needed)
API_BASE_URL = "http://localhost:5000"

def auto_checkout_task():
    """
    Task to automatically checkout employees at company closing time (7:00 PM).
    This runs daily at 19:00 (7:00 PM).
    """
    try:
        logger.info("Running auto-checkout task...")
        response = requests.post(f"{API_BASE_URL}/auto-checkout")
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"Auto-checkout successful: {data.get('msg')}")
            logger.info(f"Checked out {data.get('count', 0)} employee(s)")
        else:
            logger.error(f"Auto-checkout failed with status {response.status_code}")
            
    except Exception as e:
        logger.error(f"Error in auto-checkout task: {str(e)}")

def init_scheduler():
    """
    Initialize and start the background scheduler.
    Call this function when the Flask app starts.
    """
    scheduler = BackgroundScheduler()
    
    # Schedule auto-checkout at 7:00 PM every day
    scheduler.add_job(
        func=auto_checkout_task,
        trigger=CronTrigger(hour=19, minute=0),  # 19:00 = 7:00 PM
        id='auto_checkout_job',
        name='Auto checkout employees at closing time',
        replace_existing=True
    )
    
    # For testing: Also run at 7:01 PM in case 7:00 PM is missed
    scheduler.add_job(
        func=auto_checkout_task,
        trigger=CronTrigger(hour=19, minute=1),
        id='auto_checkout_backup_job',
        name='Auto checkout backup (7:01 PM)',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler initialized successfully")
    logger.info("Auto-checkout scheduled for 7:00 PM daily")
    
    return scheduler
