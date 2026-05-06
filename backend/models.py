from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String)
    devices = relationship("DeviceDB", back_populates="owner")


class DeviceDB(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    mac_address = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    owner = relationship("UserDB", back_populates="devices")
    measurements = relationship("MeasurementDB", back_populates="device")


class MeasurementDB(Base):
    __tablename__ = "measurements"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id", ondelete="CASCADE"))
    timestamp = Column(DateTime, default=datetime.utcnow)


    temperature = Column(Float)
    humidity = Column(Float)
    pm25 = Column(Integer)
    co2 = Column(Integer)
    voc = Column(Integer, default=0)

    device = relationship("DeviceDB", back_populates="measurements")