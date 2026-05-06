import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  ua: {
    translation: {
      title: "AirCheck",
      user_view: "Моніторинг",
      admin_view: "Адмін",
      real_time: "Дані в реальному часі",
      recommendations: "Рекомендації",
      temp: "Температура",
      hum: "Вологість",
      users_table: "Користувачі",
      status_label: "Статус",
      delete: "Видалити",
      "Excellent": "Відмінно",
      "Warning": "Увага",
      "Danger": "Небезпека",
      "rec_cold": "Холодно. Увімкніть обігрів.",
      "rec_hot": "Спекотно. Увімкніть кондиціонер.",
      "rec_dry": "Повітря сухе. Увімкніть зволожувач.",
      "rec_humid": "Висока вологість! Ризик плісняви.",
      "rec_co2_crit": "Критичний CO2. Негайно відкрийте вікна!",
      "rec_co2_high": "Рівень CO2 підвищений. Провітріть.",
      "rec_dust_crit": "Багато пилу. Одягніть маску/фільтр.",
      "rec_dust_high": "Повітря запилене. Закрийте вікна.",
      "rec_voc": "Виявлено хімічні випари (VOC)!",
      "rec_ok": "Всі показники в нормі.",
devices_table: "Реєстр пристроїв",
measurements_table: "Журнал замірів",
import_btn: "Імпорт JSON",
export_btn: "Експорт JSON"    }
  },
  en: {
    translation: {
      title: "AirCheck",
      user_view: "Monitoring",
      admin_view: "Admin",
      real_time: "Real-time data",
      recommendations: "Recommendations",
      temp: "Temperature",
      hum: "Humidity",
      users_table: "User Registry",
      status_label: "Status",
      delete: "Delete",
      "Excellent": "Excellent",
      "Warning": "Warning",
      "Danger": "Danger",
      "rec_cold": "Cold. Turn on the heating.",
      "rec_hot": "Hot. Turn on the air conditioning.",
      "rec_dry": "Air is dry. Turn on the humidifier.",
      "rec_humid": "High humidity! Risk of mold.",
      "rec_co2_crit": "Critical CO2 level. Open windows immediately!",
      "rec_co2_high": "CO2 level is elevated. Ventilate.",
      "rec_dust_crit": "High dust level. Use a mask/filter.",
      "rec_dust_high": "Dusty air. Close the windows.",
      "rec_voc": "Chemical vapors detected (VOC)!",
      "rec_ok": "All indicators are normal.",
        import_btn: "Import JSON", export_btn: "Export JSON",
        devices_table: "Device Registry", measurements_table: "Measurement Logs"

    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: "ua",
  interpolation: { escapeValue: false }
});

export default i18n;