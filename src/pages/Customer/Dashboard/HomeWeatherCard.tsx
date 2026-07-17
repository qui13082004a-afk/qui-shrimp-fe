import React, { useEffect, useMemo, useState } from "react";
import { CloudSun, Droplets, MapPin, ThermometerSun } from "lucide-react";
import {
  cleanAdministrativeName,
  findProvinceInText,
  getLastAddressPart,
  removeVietnameseTones,
} from "../../../utils/address";

interface WeatherData {
  temp: number;
  humidity: number;
  description: string;
  locationName: string;
}

interface HomeWeatherCardProps {
  userAddress?: string | null;
  userProvince?: string | null;
  fallbackPondAddress?: string | null;
  fallbackPondProvince?: string | null;
}

const DEFAULT_WEATHER: WeatherData = {
  temp: 32,
  humidity: 65,
  description: "Nắng ráo",
  locationName: "Khu vực: Chưa cập nhật",
};

const getWeatherLocation = ({
  userAddress,
  userProvince,
  fallbackPondAddress,
  fallbackPondProvince,
}: HomeWeatherCardProps) => {
  const provinceFromUser =
    findProvinceInText(userProvince) || cleanAdministrativeName(userProvince || "");
  const provinceFromAddress =
    findProvinceInText(userAddress) || getLastAddressPart(userAddress);
  const provinceFromPond =
    findProvinceInText(fallbackPondProvince) ||
    cleanAdministrativeName(fallbackPondProvince || "") ||
    findProvinceInText(fallbackPondAddress) ||
    getLastAddressPart(fallbackPondAddress);

  const location = provinceFromAddress || provinceFromUser || provinceFromPond || "";

  return {
    query: location,
    display: location ? `Khu vực: ${location}` : "Khu vực: Chưa cập nhật",
  };
};

export const HomeWeatherCard: React.FC<HomeWeatherCardProps> = ({
  userAddress,
  userProvince,
  fallbackPondAddress,
  fallbackPondProvince,
}) => {
  const [weather, setWeather] = useState<WeatherData>(DEFAULT_WEATHER);

  const weatherLocation = useMemo(
    () =>
      getWeatherLocation({
        userAddress,
        userProvince,
        fallbackPondAddress,
        fallbackPondProvince,
      }),
    [userAddress, userProvince, fallbackPondAddress, fallbackPondProvince]
  );

  useEffect(() => {
    const fetchWeather = async () => {
      const weatherApiKey = "9249da92a04d4482465e90056acc6b51";
      const query = removeVietnameseTones(weatherLocation.query);

      if (!weatherApiKey || !query) {
        setWeather((current) => ({
          ...current,
          locationName: weatherLocation.display,
        }));
        return;
      }

      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
            query
          )},VN&units=metric&lang=vi&appid=${weatherApiKey}`
        );
        const data = await res.json();

        setWeather((current) => ({
          temp: data?.main ? Math.round(data.main.temp) : current.temp,
          humidity: data?.main?.humidity || current.humidity,
          description: data?.weather?.[0]?.description || current.description,
          locationName: weatherLocation.display,
        }));
      } catch (error) {
        console.error("Lỗi kết nối API thời tiết:", error);
        setWeather((current) => ({
          ...current,
          locationName: weatherLocation.display,
        }));
      }
    };

    void fetchWeather();
  }, [weatherLocation]);

  return (
    <div className="weather-box">
      <div className="weather-label">
        <CloudSun size={16} />
        <span>Thời tiết theo địa chỉ của bạn</span>
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
          ? '"Thời tiết hiện tại thuận lợi cho việc theo dõi ao nuôi."'
          : '"Nhiệt độ giảm, nên theo dõi lượng thức ăn và oxy trong ao."'}
      </p>
    </div>
  );
};
