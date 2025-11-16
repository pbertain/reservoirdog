"""
Database models and setup for Reservoir Dog
"""
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import config

Base = declarative_base()


class ReservoirData(Base):
    """Time-series data for reservoir levels"""
    __tablename__ = 'reservoir_data'
    
    id = Column(Integer, primary_key=True)
    reservoir_code = Column(String(10), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    reservoir_elevation = Column(Float)  # feet above sea level
    storage = Column(Float)  # acre-feet
    storage_percent = Column(Float)  # percentage of capacity
    data_source = Column(String(50))  # 'CDEC', 'USBR', etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Composite index for efficient time-series queries
    __table_args__ = (
        Index('idx_reservoir_timestamp', 'reservoir_code', 'timestamp'),
    )


class ReservoirMetadata(Base):
    """Metadata about reservoirs"""
    __tablename__ = 'reservoir_metadata'
    
    id = Column(Integer, primary_key=True)
    reservoir_code = Column(String(10), unique=True, nullable=False)
    name = Column(String(100))
    dam_name = Column(String(100))
    capacity_acre_feet = Column(Float)
    max_elevation = Column(Float)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Deployment(Base):
    """Deployment tracking"""
    __tablename__ = 'deployments'
    
    id = Column(Integer, primary_key=True)
    environment = Column(String(20), nullable=False, index=True)  # dev, prod
    deployed_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    commit_sha = Column(String(40), nullable=False)
    commit_message = Column(String(500))
    branch = Column(String(50))
    deployed_by = Column(String(100))  # GitHub Actions, manual, etc.
    version = Column(String(50))  # Optional version tag


# Database setup
engine = create_engine(config.DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(engine)


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

