document.addEventListener("DOMContentLoaded", () => {
  const cityInput = document.getElementById("city-input");
  const weatherBtn = document.getElementById("get-weather");
  const weatherInfo = document.getElementById("weather-info");
  const nameDisplay = document.getElementById("city-name");
  const dateTimeDisplay = document.getElementById("date-time");
  const tempDisplay = document.getElementById("temp");
  const descriptionDisplay = document.getElementById("description");
  const humidityDisplay = document.getElementById("humidity");
  const windSpeedDisplay = document.getElementById("wind-speed");
  const weatherIcon = document.getElementById("weather-icon");
  const forecastContainer = document.getElementById("forecast-container");
  const forecastSection = document.getElementById("forecast");
  const errorMsg = document.getElementById("error-message");
  const toggleThemeBtn = document.getElementById("toggle-theme");
  const API_KEY = "7b1b0ae5b5aaf0bc3fbf75c812f26d5e";

  weatherBtn.addEventListener("click", async () => {
    const city = cityInput.value.trim();
    if (city === "") {
      errorMsg.textContent = "Please enter a city name";
      errorMsg.classList.remove("hidden");
      return;
    }

    try {
      const weather = await fetchWeather(city);
      const forecast = await fetchForecast(city);
      displayWeather(weather);
      displayForecast(forecast);
    } catch (error) {
      showError();
    }
  });

  toggleThemeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
  });

  async function fetchWeather(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("City not found");
    }
    const data = await response.json();
    return data;
  }

  async function fetchForecast(city) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("City not found");
    }
    const data = await response.json();
    return data;
  }

  function displayWeather(data) {
    const { name, main, weather, wind, dt } = data;
    nameDisplay.textContent = name;
    dateTimeDisplay.textContent = new Date(dt * 1000).toLocaleString();
    tempDisplay.textContent = `Temperature: ${main.temp}°C`;
    descriptionDisplay.textContent = `Description: ${weather[0].description}`;
    humidityDisplay.textContent = `Humidity: ${main.humidity}%`;
    windSpeedDisplay.textContent = `Wind Speed: ${wind.speed} m/s`;
    weatherIcon.src = `http://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
    weatherInfo.classList.remove("hidden");
    errorMsg.classList.add("hidden");
  }

  function displayForecast(data) {
    forecastContainer.innerHTML = "";
    const forecastList = data.list.filter((item, index) => index % 8 === 0);
    forecastList.forEach((item) => {
      const forecastItem = document.createElement("div");
      forecastItem.classList.add("forecast-item");
      forecastItem.innerHTML = `
  <p>${new Date(item.dt * 1000).toLocaleDateString()}</p>
  <img src="http://openweathermap.org/img/wn/${
    item.weather[0].icon
  }@2x.png" alt="Weather Icon" class="forecast-icon">
  <p>${item.main.temp}°C</p>
  <p>${item.weather[0].description}</p>
`;
      forecastContainer.appendChild(forecastItem);
    });
    forecastSection.classList.remove("hidden");
  }

  function showError() {
    weatherInfo.classList.add("hidden");
    forecastSection.classList.add("hidden");
    errorMsg.classList.remove("hidden");
  }
});
