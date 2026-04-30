from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class MeasurementCreate(BaseModel):
    temperature: float
    humidity: float
    pm25: int
    co2: int
    voc: int = 0


class MeasurementResponse(BaseModel):
    id: int
    temperature: float
    humidity: float
    co2: int
    pm25: int
    voc: int
    timestamp: datetime
    device_id: int

    class Config:
        from_attributes = True

class DeviceResponse(BaseModel):
    id: int
    mac_address: str
    user_id: int

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: str
    username: str


class UserResponse(UserCreate):
    id: int

    class Config:
        from_attributes = True


class AirQualityAnalysis(BaseModel):
    avg_temp: float
    avg_humidity: float
    max_co2: int
    max_pm25: int
    max_voc: int

    status: str
    summary: str
    recommendations: List[str]