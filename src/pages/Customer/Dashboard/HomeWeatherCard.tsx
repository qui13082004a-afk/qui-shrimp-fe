import React, { useEffect, useState } from "react";
import { CloudSun, Droplets, MapPin, ThermometerSun } from "lucide-react";

interface WeatherData {
  temp: number;
  humidity: number;
  description: string;
  locationName: string;
}

interface HomeWeatherCardProps {
  firstPondAddress: string | undefined;
}

export const HomeWeatherCard: React.FC<HomeWeatherCardProps> = ({ firstPondAddress }) => {
  const [weather, setWeather] = useState<WeatherData>({
    temp: 32,
    humidity: 65,
    description: "Nắng ráo",
    locationName: "H. Trần Đề",
  });

  const removeVietnameseTones = (str: string): string => {
    let result = str;
    result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    result = result.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    result = result.replace(/đ/g, "d");
    result = result.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    result = result.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    result = result.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    result = result.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    result = result.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    result = result.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    result = result.replace(/Đ/g, "D");
    return result.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  };

  const getLocationsFromAddress = (address: string | undefined) => {
    if (!address) return { district: "Tran De", province: "Soc Trang" };

    const parts = address.split(",");
    if (parts.length >= 2) {
      const district = parts[parts.length - 2]
        .replace(/(Huyện|Thị xã|Thành phố|Khu vực|Xã|Ấp)/gi, "")
        .trim();
      const province = parts[parts.length - 1].replace(/(Tỉnh|Thành phố)/gi, "").trim();
      return { district, province };
    }

    const cleanAddress = address
      .replace(/(Huyện|Thị xã|Thành phố|Khu vực|Xã|Ấp|Tỉnh)/gi, "")
      .trim();
    return { district: cleanAddress, province: cleanAddress };
  };

  useEffect(() => {
    const fetchWeather = async () => {
      const { district, province } = getLocationsFromAddress(firstPondAddress);
      const weatherApiKey = "9249da92a04d4482465e90056acc6b51";

      if (!weatherApiKey) return;

      try {
        const queryDistrict = removeVietnameseTones(district);

        let res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(queryDistrict)},VN&units=metric&lang=vi&appid=${weatherApiKey}`
        );
        let data = await res.json();

        if (data.cod === "404" || data.cod === 404 || !data.main) {
          const queryProvince = removeVietnameseTones(province);

          res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(queryProvince)},VN&units=metric&lang=vi&appid=${weatherApiKey}`
          );
          data = await res.json();

          if (data?.main) {
            setWeather({
              temp: Math.round(data.main.temp),
              humidity: data.main.humidity,
              description: data.weather[0].description,
              locationName: `Tỉnh ${province}`,
            });
            return;
          }
        }

        if (data?.main) {
          setWeather({
            temp: Math.round(data.main.temp),
            humidity: data.main.humidity,
            description: data.weather[0].description,
            locationName: firstPondAddress ? `H. ${district}` : "H. Trần Đề",
          });
        }
      } catch (error) {
        console.error("Lỗi kết nối API thời tiết:", error);
      }
    };

    fetchWeather();
  }, [firstPondAddress]);

  return (
    <div className="weather-box">
      <div className="weather-label">
        <CloudSun size={16} />
        <span>Thời tiết tại ao</span>
      </div>

      <div className="weather-main">
        <div className="weather-temp-wrap">
          <ThermometerSun size={24} />
          <div className="weather-temp">{weather.temp}°C</div>
        </div>
        <div className="weather-desc">
          <h5>{weather.description}</h5>
          <p>
            <Droplets size={14} /> Độ ẩm {weather.humidity}%
          </p>
          <p>
            <MapPin size={14} /> {weather.locationName}
          </p>
        </div>
      </div>

      <p className="weather-quote">
        {weather.temp > 30
          ? '"Thời tiết lý tưởng để cho tôm ăn."'
          : '"Nhiệt độ môi trường giảm, hãy giảm lượng thức ăn và tăng cường quạt khí Oxy."'}
      </p>
    </div>
  );
};
