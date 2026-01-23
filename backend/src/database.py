"""
Database Layer for Historical Traffic Data
Provides SQLAlchemy models and connection management for storing and querying traffic history.

Features:
- SQLite for MVP (easy to migrate to PostgreSQL later)
- Async database operations
- Automatic data retention
- Indexed queries for performance
"""

import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from pathlib import Path

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Base class for models
Base = declarative_base()


class TrafficHistory(Base):
    """
    Historical traffic data model.
    Stores traffic measurements at each junction over time.
    """
    __tablename__ = 'traffic_history'
    
    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Time and location
    timestamp = Column(DateTime, nullable=False, index=True)
    junction_id = Column(String(10), nullable=False, index=True)
    direction = Column(String(10), nullable=False)  # north, south, east, west
    
    # Traffic measurements
    vehicle_counts = Column(JSON, nullable=False)  # {"car": 10, "bus": 2, ...}
    total_pcu = Column(Float, nullable=False)
    queue_length = Column(Integer, default=0)
    waiting_time_avg = Column(Float, default=0.0)
    
    # Signal timing applied
    signal_timing = Column(JSON, nullable=True)  # {"cycle_length": 90, "green_time": 35}
    
    # Context data
    weather = Column(String(20), default='unknown')
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    hour = Column(Integer, nullable=False)  # 0-23
    
    # Composite indexes for common queries
    __table_args__ = (
        Index('idx_junction_time', 'junction_id', 'timestamp'),
        Index('idx_junction_day_hour', 'junction_id', 'day_of_week', 'hour'),
    )
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for API responses."""
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat(),
            'junction_id': self.junction_id,
            'direction': self.direction,
            'vehicle_counts': self.vehicle_counts,
            'total_pcu': self.total_pcu,
            'queue_length': self.queue_length,
            'waiting_time_avg': self.waiting_time_avg,
            'signal_timing': self.signal_timing,
            'weather': self.weather,
            'day_of_week': self.day_of_week,
            'hour': self.hour
        }


class DatabaseManager:
    """
    Manages database connections and operations.
    Singleton pattern to ensure single connection pool.
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        # Database path (SQLite file)
        db_dir = Path(__file__).parent.parent.parent / "data"
        db_dir.mkdir(exist_ok=True)
        self.db_path = db_dir / "traffic_history.db"
        
        # Create engine
        self.engine = create_engine(
            f'sqlite:///{self.db_path}',
            connect_args={'check_same_thread': False},
            poolclass=StaticPool,
            echo=False  # Set to True for SQL debugging
        )
        
        # Create session factory
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )
        
        # Create tables
        Base.metadata.create_all(bind=self.engine)
        
        self._initialized = True
        print(f"[OK] Database initialized at: {self.db_path}")
    
    def get_session(self) -> Session:
        """Get a new database session."""
        return self.SessionLocal()
    
    def close(self):
        """Close database connection."""
        self.engine.dispose()


class TrafficDataStore:
    """
    High-level interface for storing and querying traffic data.
    """
    
    def __init__(self):
        self.db = DatabaseManager()
    
    def store_traffic_data(
        self,
        junction_id: str,
        direction: str,
        vehicle_counts: Dict[str, int],
        total_pcu: float,
        queue_length: int = 0,
        waiting_time_avg: float = 0.0,
        signal_timing: Optional[Dict] = None,
        weather: str = 'unknown',
        timestamp: Optional[datetime] = None
    ) -> int:
        """
        Store a single traffic measurement.
        
        Args:
            junction_id: Junction identifier
            direction: Traffic direction (north/south/east/west)
            vehicle_counts: Dict of vehicle counts by type
            total_pcu: Total PCU value
            queue_length: Queue length in vehicles
            waiting_time_avg: Average waiting time in seconds
            signal_timing: Applied signal timing
            weather: Weather condition
            timestamp: Measurement time (defaults to now)
        
        Returns:
            Record ID
        """
        if timestamp is None:
            timestamp = datetime.now()
        
        session = self.db.get_session()
        try:
            record = TrafficHistory(
                timestamp=timestamp,
                junction_id=junction_id,
                direction=direction,
                vehicle_counts=vehicle_counts,
                total_pcu=total_pcu,
                queue_length=queue_length,
                waiting_time_avg=waiting_time_avg,
                signal_timing=signal_timing,
                weather=weather,
                day_of_week=timestamp.weekday(),
                hour=timestamp.hour
            )
            session.add(record)
            session.commit()
            record_id = record.id
            return record_id
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    def store_batch(self, records: List[Dict]) -> int:
        """
        Store multiple traffic measurements in a batch.
        More efficient than individual inserts.
        
        Args:
            records: List of traffic data dictionaries
        
        Returns:
            Number of records inserted
        """
        session = self.db.get_session()
        try:
            traffic_records = []
            for data in records:
                timestamp = data.get('timestamp', datetime.now())
                if isinstance(timestamp, str):
                    timestamp = datetime.fromisoformat(timestamp)
                
                record = TrafficHistory(
                    timestamp=timestamp,
                    junction_id=data['junction_id'],
                    direction=data['direction'],
                    vehicle_counts=data['vehicle_counts'],
                    total_pcu=data['total_pcu'],
                    queue_length=data.get('queue_length', 0),
                    waiting_time_avg=data.get('waiting_time_avg', 0.0),
                    signal_timing=data.get('signal_timing'),
                    weather=data.get('weather', 'unknown'),
                    day_of_week=timestamp.weekday(),
                    hour=timestamp.hour
                )
                traffic_records.append(record)
            
            session.bulk_save_objects(traffic_records)
            session.commit()
            return len(traffic_records)
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    def get_history(
        self,
        junction_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        direction: Optional[str] = None,
        limit: int = 1000
    ) -> List[Dict]:
        """
        Query historical traffic data.
        
        Args:
            junction_id: Junction to query
            start_time: Start of time range (defaults to 24 hours ago)
            end_time: End of time range (defaults to now)
            direction: Filter by direction (optional)
            limit: Maximum records to return
        
        Returns:
            List of traffic records as dictionaries
        """
        if end_time is None:
            end_time = datetime.now()
        if start_time is None:
            start_time = end_time - timedelta(hours=24)
        
        session = self.db.get_session()
        try:
            query = session.query(TrafficHistory).filter(
                TrafficHistory.junction_id == junction_id,
                TrafficHistory.timestamp >= start_time,
                TrafficHistory.timestamp <= end_time
            )
            
            if direction:
                query = query.filter(TrafficHistory.direction == direction)
            
            query = query.order_by(TrafficHistory.timestamp.desc()).limit(limit)
            
            records = query.all()
            return [record.to_dict() for record in records]
        finally:
            session.close()
    
    def get_average_by_time(
        self,
        junction_id: str,
        day_of_week: int,
        hour: int,
        direction: Optional[str] = None,
        days_back: int = 30
    ) -> Optional[Dict]:
        """
        Get historical average for a specific time pattern.
        
        Args:
            junction_id: Junction to query
            day_of_week: Day of week (0=Monday, 6=Sunday)
            hour: Hour of day (0-23)
            direction: Filter by direction (optional)
            days_back: How many days of history to include
        
        Returns:
            Average traffic metrics or None if no data
        """
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        session = self.db.get_session()
        try:
            from sqlalchemy import func
            
            query = session.query(
                func.avg(TrafficHistory.total_pcu).label('avg_pcu'),
                func.avg(TrafficHistory.queue_length).label('avg_queue'),
                func.avg(TrafficHistory.waiting_time_avg).label('avg_wait'),
                func.count(TrafficHistory.id).label('sample_count')
            ).filter(
                TrafficHistory.junction_id == junction_id,
                TrafficHistory.day_of_week == day_of_week,
                TrafficHistory.hour == hour,
                TrafficHistory.timestamp >= cutoff_date
            )
            
            if direction:
                query = query.filter(TrafficHistory.direction == direction)
            
            result = query.first()
            
            if result and result.sample_count > 0:
                return {
                    'avg_pcu': float(result.avg_pcu) if result.avg_pcu else 0.0,
                    'avg_queue_length': float(result.avg_queue) if result.avg_queue else 0.0,
                    'avg_waiting_time': float(result.avg_wait) if result.avg_wait else 0.0,
                    'sample_count': result.sample_count,
                    'day_of_week': day_of_week,
                    'hour': hour
                }
            return None
        finally:
            session.close()
    
    def cleanup_old_data(self, days_to_keep: int = 90) -> int:
        """
        Delete data older than specified days.
        
        Args:
            days_to_keep: Number of days to retain
        
        Returns:
            Number of records deleted
        """
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        
        session = self.db.get_session()
        try:
            deleted = session.query(TrafficHistory).filter(
                TrafficHistory.timestamp < cutoff_date
            ).delete()
            session.commit()
            return deleted
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    def get_record_count(self, junction_id: Optional[str] = None) -> int:
        """Get total number of records in database."""
        session = self.db.get_session()
        try:
            query = session.query(TrafficHistory)
            if junction_id:
                query = query.filter(TrafficHistory.junction_id == junction_id)
            return query.count()
        finally:
            session.close()


# Global instance
traffic_store = TrafficDataStore()
