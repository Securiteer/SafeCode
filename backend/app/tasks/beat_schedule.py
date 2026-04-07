"""
Celery beat schedule configuration.
"""
from celery.schedules import crontab  # type: ignore
from app.core.celery_app import celery_app

celery_app.conf.beat_schedule = {
    'discover-new-repos-every-15-minutes': {
        'task': 'app.tasks.scanner.discover_and_dispatch',
        'schedule': crontab(minute='*/15'),
    },
}
