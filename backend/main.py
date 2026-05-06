from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import uvicorn
from _datetime import datetime

from . import models, schemas
from .database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AirCheck")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



def analyze_air_quality(temp: float, hum: float, co2: int, pm25: int, voc: int) -> dict:
    recommendations = []
    status_levels = []

    # Аналіз температури
    if temp < 18:
        recommendations.append("rec_cold")
        status_levels.append(1)
    elif temp > 28:
        recommendations.append("rec_hot")
        status_levels.append(1)

    # Аналіз вологості
    if hum < 30:
        recommendations.append("rec_dry")
        status_levels.append(1)
    elif hum > 70:
        recommendations.append("rec_humid")
        status_levels.append(1)

    # Аналіз CO2
    if co2 > 1200:
        recommendations.append("rec_co2_crit")
        status_levels.append(2)
    elif co2 > 800:
        recommendations.append("rec_co2_high")
        status_levels.append(1)

    # Аналіз пилу (PM2.5)
    if pm25 > 50:
        recommendations.append("rec_dust_crit")
        status_levels.append(2)
    elif pm25 > 25:
        recommendations.append("rec_dust_high")
        status_levels.append(1)

    # Аналіз летючих органічних сполук (VOC)
    if voc > 500:
        recommendations.append("rec_voc")
        status_levels.append(2)

    max_risk = max(status_levels) if status_levels else 0

    final_status = "Excellent"
    if max_risk == 1:
        final_status = "Warning"
    elif max_risk == 2:
        final_status = "Danger"

    if not recommendations:
        recommendations.append("rec_ok")

    return {
        "status": final_status,  # Це ключ для t('Excellent'), t('Warning') тощо
        "summary": "real_time",   # Це ключ для t('real_time')
        "recommendations": recommendations  # Список ключів: ["rec_cold", "rec_co2_high"]
    }



@app.post("/api/v1/devices/{mac}/data", response_model=schemas.MeasurementResponse)
def create_measurement(mac: str, data: schemas.MeasurementCreate, db: Session = Depends(get_db)):
    device = db.query(models.DeviceDB).filter(models.DeviceDB.mac_address == mac).first()

    if not device:

        first_user = db.query(models.UserDB).first()

        if not first_user:
            first_user = models.UserDB(email="admin@aircheck.com", username="Default Admin")
            db.add(first_user)
            db.commit()
            db.refresh(first_user)
            print(f"Created default user: {first_user.email} (ID: {first_user.id})")

        device = models.DeviceDB(mac_address=mac, user_id=first_user.id)

        db.add(device)
        db.commit()
        db.refresh(device)

    new_measure = models.MeasurementDB(device_id=device.id, **data.dict())
    db.add(new_measure)
    db.commit()
    db.refresh(new_measure)
    return new_measure

@app.get("/api/v1/devices/{mac}/analysis", response_model=schemas.AirQualityAnalysis)
def get_analysis(mac: str, db: Session = Depends(get_db)):
    device = db.query(models.DeviceDB).filter(models.DeviceDB.mac_address == mac).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    latest = db.query(models.MeasurementDB)\
        .filter(models.MeasurementDB.device_id == device.id)\
        .order_by(models.MeasurementDB.timestamp.desc())\
        .first()

    if not latest:
        return {
            "avg_temp": 0, "avg_humidity": 0, "max_co2": 0, "max_pm25": 0, "max_voc": 0,
            "status": "No Data", "summary": "Waiting for data", "recommendations": []
        }

    # Використовуємо логіку аналізу для поточних даних
    logic = analyze_air_quality(
        temp=latest.temperature,
        hum=latest.humidity,
        co2=latest.co2,
        pm25=latest.pm25,
        voc=latest.voc or 0
    )

    return {
        "avg_temp": round(latest.temperature, 1),
        "avg_humidity": round(latest.humidity, 1),
        "max_co2": latest.co2,
        "max_pm25": latest.pm25,
        "max_voc": latest.voc or 0,
        "status": logic["status"],
        "summary": "Дані в реальному часі",
        "recommendations": logic["recommendations"]
    }

@app.post("/admin/users/create", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.UserDB).filter(models.UserDB.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = models.UserDB(email=user.email, username=user.username)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.get("/admin/users/all", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.UserDB).all()





import json
from fastapi.responses import JSONResponse


@app.get("/admin/export")
def export_data(db: Session = Depends(get_db)):
    users = db.query(models.UserDB).all()
    devices = db.query(models.DeviceDB).all()
    measurements = db.query(models.MeasurementDB).all()

    data = {
        "users": [schemas.UserResponse.from_orm(u).dict() for u in users],
        "devices": [{"id": d.id, "mac": d.mac_address, "user_id": d.user_id} for d in devices],
        "measurements": [schemas.MeasurementResponse.from_orm(m).dict() for m in measurements]
    }
    return JSONResponse(content=json.loads(json.dumps(data, default=str)))


@app.post("/admin/import")
def import_data(data: dict, db: Session = Depends(get_db)):
    # 1. Імпорт Користувачів
    if "users" in data:
        for u in data["users"]:
            existing = db.query(models.UserDB).filter(models.UserDB.email == u["email"]).first()
            if not existing:
                new_user = models.UserDB(username=u["username"], email=u["email"])
                db.add(new_user)
        db.commit()

    # 2. Імпорт Пристроїв
    if "devices" in data:
        for d in data["devices"]:
            # Перевіряємо обидва варіанти ключа: 'mac' або 'mac_address'
            mac = d.get("mac") or d.get("mac_address")
            if not mac: continue

            existing_dev = db.query(models.DeviceDB).filter(models.DeviceDB.mac_address == mac).first()
            if not existing_dev:
                new_device = models.DeviceDB(mac_address=mac, user_id=d["user_id"])
                db.add(new_device)
        db.commit()

    # 3. Імпорт Замірів
    if "measurements" in data:
        from datetime import datetime  # Локальний імпорт про всяк випадок
        for m in data["measurements"]:
            ts = m["timestamp"]
            # Перетворюємо рядок на об'єкт datetime
            if isinstance(ts, str):
                try:
                    ts = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                except:
                    ts = datetime.utcnow()

            new_m = models.MeasurementDB(
                temperature=m["temperature"],
                humidity=m["humidity"],
                co2=m["co2"],
                pm25=m["pm25"],
                voc=m.get("voc", 0),
                device_id=m["device_id"],
                timestamp=ts
            )
            db.add(new_m)
        db.commit()

    return {"status": "success"}

@app.get("/admin/devices/all")
def get_all_devices(db: Session = Depends(get_db)):
    return db.query(models.DeviceDB).all()

@app.get("/admin/measurements/all")
def get_all_measurements(db: Session = Depends(get_db)):
    return db.query(models.MeasurementDB).order_by(models.MeasurementDB.timestamp.desc()).limit(50).all()

@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.UserDB).filter(models.UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"status": "success"}

@app.delete("/admin/measurements/{m_id}")
def delete_measurement(m_id: int, db: Session = Depends(get_db)):
    measure = db.query(models.MeasurementDB).filter(models.MeasurementDB.id == m_id).first()
    if measure:
        db.delete(measure)
        db.commit()
    return {"status": "deleted"}


@app.delete("/admin/devices/{id}")
def delete_device(id: int, db: Session = Depends(get_db)):
    print(f"DEBUG: Намагаємось видалити девайс з ID: {id}")

    db.query(models.MeasurementDB).filter(models.MeasurementDB.device_id == id).delete()

    result = db.query(models.DeviceDB).filter(models.DeviceDB.id == id).delete()
    db.commit()

    if result == 0:
        return {"error": "Not found in DB"}
    return {"ok": True}
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)