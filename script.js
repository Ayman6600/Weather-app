class WeatherApp {
  constructor() {
    this.API_KEY = "7b1b0ae5b5aaf0bc3fbf75c812f26d5e";
    this.currentWeatherData = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.getUserLocation();
    this.initTheme();
  }

  setupEventListeners() {
    const searchBtn = document.getElementById("searchBtn");
    const locationInput = document.getElementById("locationInput");
    const themeToggle = document.getElementById("themeToggle");
    const quickBtns = document.querySelectorAll(".quick-btn");

    searchBtn.addEventListener("click", () => this.handleSearch());
    locationInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleSearch();
    });

    themeToggle.addEventListener("click", () => this.toggleTheme());

    quickBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const city = btn.dataset.city;
        document.getElementById("locationInput").value = city;
        this.searchWeather(city);
      });
    });

    // Auto-refresh every 10 minutes
    setInterval(() => {
      if (this.currentWeatherData) {
        this.refreshWeatherData();
      }
    }, 600000);
  }

  async handleSearch() {
    const location = document.getElementById("locationInput").value.trim();
    if (!location) {
      this.showError("Please enter a location");
      return;
    }
    await this.searchWeather(location);
  }

  async searchWeather(location) {
    this.showLoading(true);
    this.hideError();

    try {
      // Check if input is coordinates
      const coordPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
      let weatherData;

      if (coordPattern.test(location)) {
        const [lat, lon] = location.split(",");
        weatherData = await this.getWeatherByCoords(lat, lon);
      } else {
        weatherData = await this.getWeatherByCity(location);
      }

      const forecastData = await this.getForecast(
        weatherData.coord.lat,
        weatherData.coord.lon
      );

      this.currentWeatherData = weatherData;
      this.displayWeather(weatherData);
      this.displayForecast(forecastData);
      this.updateWeatherAnimation(weatherData.weather[0].main);
    } catch (error) {
      console.error("Weather fetch error:", error);
      this.showError(
        "Unable to fetch weather data. Please check the location and try again."
      );
    } finally {
      this.showLoading(false);
    }
  }

  async getWeatherByCity(city) {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
      )}&appid=${this.API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error("Weather data not found");
    return await response.json();
  }

  async getWeatherByCoords(lat, lon) {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error("Weather data not found");
    return await response.json();
  }

  async getForecast(lat, lon) {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error("Forecast data not found");
    return await response.json();
  }

  displayWeather(data) {
    // Update main weather display
    document.getElementById("temperature").textContent = `${Math.round(
      data.main.temp
    )}°C`;
    document.getElementById(
      "locationName"
    ).textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById("weatherDescription").textContent =
      this.capitalizeWords(data.weather[0].description);
    document.getElementById("dateTime").textContent =
      new Date().toLocaleString();

    // Update weather icon
    this.updateWeatherIcon(data.weather[0].main, data.weather[0].icon);

    // Update details
    document.getElementById("visibility").textContent = `${(
      data.visibility / 1000
    ).toFixed(1)} km`;
    document.getElementById("humidity").textContent = `${data.main.humidity}%`;
    document.getElementById("windSpeed").textContent = `${(
      data.wind.speed * 3.6
    ).toFixed(1)} km/h`;
    document.getElementById("feelsLike").textContent = `${Math.round(
      data.main.feels_like
    )}°C`;
    document.getElementById(
      "pressure"
    ).textContent = `${data.main.pressure} hPa`;
    document.getElementById("uvIndex").textContent = "N/A";

    // Update sun times
    document.getElementById("sunrise").textContent = new Date(
      data.sys.sunrise * 1000
    ).toLocaleTimeString();
    document.getElementById("sunset").textContent = new Date(
      data.sys.sunset * 1000
    ).toLocaleTimeString();

    // Update location details
    document.getElementById("country").textContent = data.sys.country;
    document.getElementById("timezone").textContent = `UTC${
      data.timezone >= 0 ? "+" : ""
    }${data.timezone / 3600}`;
    document.getElementById(
      "coordinates"
    ).textContent = `${data.coord.lat.toFixed(2)}, ${data.coord.lon.toFixed(
      2
    )}`;

    document.getElementById("weatherContent").classList.remove("hidden");
  }

  displayForecast(data) {
    const container = document.getElementById("forecastContainer");
    container.innerHTML = "";

    // Get daily forecasts (every 8th item for daily data)
    const dailyForecasts = data.list
      .filter((item, index) => index % 8 === 0)
      .slice(0, 7);

    dailyForecasts.forEach((forecast) => {
      const card = document.createElement("div");
      card.className = "forecast-card";

      const date = new Date(forecast.dt * 1000);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      card.innerHTML = `
                <h4>${dayName}</h4>
                <p>${dateStr}</p>
                <div style="font-size: 2rem; margin: 10px 0;">
                    ${this.getWeatherEmoji(forecast.weather[0].main)}
                </div>
                <p><strong>${Math.round(
                  forecast.main.temp_max
                )}°</strong> / ${Math.round(forecast.main.temp_min)}°</p>
                <p style="font-size: 0.9rem; opacity: 0.8;">${this.capitalizeWords(
                  forecast.weather[0].description
                )}</p>
                <p style="font-size: 0.8rem; margin-top: 5px;">
                    <i class="fas fa-tint"></i> ${forecast.main.humidity}%
                </p>
            `;

      container.appendChild(card);
    });
  }

  updateWeatherIcon(weatherMain, icon) {
    const iconElement = document.getElementById("weatherIcon");
    iconElement.innerHTML = `<div style="font-size: 4rem;">${this.getWeatherEmoji(
      weatherMain
    )}</div>`;
  }

  getWeatherEmoji(weatherMain) {
    const weatherEmojis = {
      Clear: "☀️",
      Clouds: "☁️",
      Rain: "🌧️",
      Drizzle: "🌦️",
      Thunderstorm: "⛈️",
      Snow: "❄️",
      Mist: "🌫️",
      Smoke: "💨",
      Haze: "🌫️",
      Dust: "💨",
      Fog: "🌫️",
      Sand: "💨",
      Ash: "💨",
      Squall: "💨",
      Tornado: "🌪️",
    };
    return weatherEmojis[weatherMain] || "🌤️";
  }

  updateWeatherAnimation(weatherMain) {
    const snowElement = document.getElementById("snow");
    snowElement.classList.add("hidden");

    if (weatherMain === "Snow") {
      snowElement.classList.remove("hidden");
      this.createSnowAnimation();
    }
  }

  createSnowAnimation() {
    const snowContainer = document.getElementById("snow");
    snowContainer.innerHTML = "";

    for (let i = 0; i < 50; i++) {
      const snowflake = document.createElement("div");
      snowflake.className = "snowflake";
      snowflake.innerHTML = "❄";
      snowflake.style.left = Math.random() * 100 + "%";
      snowflake.style.animationDuration = Math.random() * 3 + 2 + "s";
      snowflake.style.animationDelay = Math.random() * 2 + "s";
      snowContainer.appendChild(snowflake);
    }
  }

  async getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await this.searchWeather(`${latitude},${longitude}`);
        },
        () => {
          // Default to New York if geolocation fails
          this.searchWeather("New York,US");
        }
      );
    } else {
      this.searchWeather("New York,US");
    }
  }

  async refreshWeatherData() {
    if (this.currentWeatherData) {
      const { lat, lon } = this.currentWeatherData.coord;
      await this.searchWeather(`${lat},${lon}`);
    }
  }

  toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector("#themeToggle i");

    body.classList.toggle("light-mode");
    const isLight = body.classList.contains("light-mode");
    themeIcon.className = isLight ? "fas fa-sun" : "fas fa-moon";

    // Save preference
    localStorage.setItem("theme", isLight ? "light" : "dark");
  }

  initTheme() {
    const theme = localStorage.getItem("theme");
    const themeIcon = document.querySelector("#themeToggle i");
    if (theme === "light") {
      document.body.classList.add("light-mode");
      themeIcon.className = "fas fa-sun";
    } else {
      document.body.classList.remove("light-mode");
      themeIcon.className = "fas fa-moon";
    }
  }

  showLoading(show) {
    const loading = document.getElementById("loading");
    const content = document.getElementById("weatherContent");

    if (show) {
      loading.classList.remove("hidden");
      content.classList.add("hidden");
    } else {
      loading.classList.add("hidden");
      content.classList.remove("hidden");
    }
  }

  showError(message) {
    const errorElement = document.getElementById("error");
    errorElement.querySelector("p").textContent = message;
    errorElement.classList.remove("hidden");
  }

  hideError() {
    const errorElement = document.getElementById("error");
    errorElement.classList.add("hidden");
  }

  capitalizeWords(str) {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new WeatherApp();
});
