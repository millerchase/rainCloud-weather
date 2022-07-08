// refs
const citySearchInputEl = document.querySelector('#search-city');
const searchBtn = document.querySelector('#search-btn');
const searchFormEl = document.querySelector('#search-form');

// luxon date wrapper setup
const DateTime = luxon.DateTime;

// grab the date (option to add how many days from current)
const getDate = numDays => {
  const dt = DateTime.now();

  if (numDays) {
    // return adjusted date if needed
    return dt.plus({ days: numDays }).toLocaleString();
  }

  return dt.toLocaleString();
};

// search for city latitude and longitude (for overcoming current weather onecall query issues)
const searchCityGeoLoc = city => {
  // remove any text after city (search won't work with it)
  if (city.includes(' ')) {
    city = city.split(' ')[0];
    console.log(city);
  }
  // geo services API setup
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Host': 'geo-services-by-mvpc-com.p.rapidapi.com',
      'X-RapidAPI-Key': '32e9f51d38mshf0b78320df8dcbap15c225jsn975d5508e897'
    }
  };

  // set fetch url using the inputed city
  const url = `https://geo-services-by-mvpc-com.p.rapidapi.com/cities/findcitiesfromtext?q=${city}&sort=population%2Cdesc&language=en`;

  // wrap API request in promise to be able to use in a chain
  return new Promise((rs, rj) => {
    rs(
      fetch(url, options)
        .then(response => response.json())
        .then(response => {
          if (response['data'].length) {
            data = response['data'];
            // seperate lat and long into search result
            const searchResults = {
              name: data[0]['name'],
              lat: data[0]['latitude'],
              long: data[0]['longitude']
            };

            return searchResults;
          } else {
            // if search results return false
            return false;
          }
        })
        .catch(err => rj(err))
    );
  });
};

// Open weather calls
const searchCurrentWeather = city => {
  const key = '347d8731de2da6ee2f8084e5c4386031';

  // create promise chain to manipulate response
  return new Promise((rs, rj) => {
    rs(
      // get lat and long for city searched
      searchCityGeoLoc(city).then(location => {
        return new Promise((rs, rj) => {
          rs(
            fetch(
              `https://api.openweathermap.org/data/2.5/onecall?lat=${location.lat}&lon=${location.long}&exclude=minutely,hourly,daily&units=imperial&appid=${key}`
            )
              .then(weatherData => weatherData.json())
              .then(data => {
                let currentWeather = {
                  location: location.name,
                  date: getDate(),
                  icon: data['current']['weather'][0]['icon'],
                  temp: `${data['current']['temp']}°f`,
                  wind: `${data['current']['wind_speed']} MPH`,
                  humidity: `${data['current']['humidity']}%`,
                  uvi: data['current']['uvi']
                };
                return currentWeather;
              })
              .catch(err => rj(err))
          );
        });
      })
    );
  });
};

const searchFiveDayForecast = city => {
  const key = '347d8731de2da6ee2f8084e5c4386031';

  // format city if state is also entered
  if (city.includes(' ') && !city.includes(',')) {
    city = city.split(' ').join(',');
  } else if (city.includes(', ')) {
    city = city.split(' ').join('');
  }

  return new Promise((rs, rj) => {
    rs(
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=imperial&appid=${key}`
      )
        .then(weatherData => weatherData.json())
        .then(data => {
          // grab full list of 3hr updates over 5 day period
          const fullWeatherList = data.list;

          // filter for time slots marked 00:00:00 which appears to hold the new day's average
          const fiveDayList = fullWeatherList.filter(timeSlot =>
            timeSlot.dt_txt.includes('00:00:00')
          );

          // array to add future weather objects to
          const fiveDayForecast = [];

          // create weather objects for fiveDayForecast from fiveDayList
          for (let i = 0; i < fiveDayList.length; i++) {
            const daysWeather = fiveDayList[i];
            const daysFromToday = i + 1;
            const weatherObj = {
              date: getDate(daysFromToday),
              icon: daysWeather['weather'][0]['icon'],
              temp: daysWeather['main']['temp'],
              wind: daysWeather['wind']['speed'],
              humidity: daysWeather['main']['humidity']
            };
            fiveDayForecast.push(weatherObj);
          }

          return fiveDayForecast;
        })
        .catch(err => rj(err))
    );
  });
};

const displayCurrentWeather = weatherData => {
  const currentCity = document.querySelector('#current-city');
  const currentDate = document.querySelector('#current-date');
  const weatherIcon = document.querySelector('#current-icon');
  const currentTemp = document.querySelector('#current-temp');
  const currentWind = document.querySelector('#current-wind');
  const currentHumidity = document.querySelector('#current-humidity');
  const uvIndex = document.querySelector('#current-uv');

  if (!weatherData) {
    currentCity.innerText = 'Search for a city';
    currentDate.innerText = `${getDate()}`;
    weatherIcon.innerText = '';
    currentTemp.innerText = 'Search for a city';
    currentWind.innerText = 'Search for a city';
    currentHumidity.innerText = `Search for a city`;
    uvIndex.innerText = `Search for a city`;
    return;
  }

  currentCity.innerText = weatherData.location;
  currentDate.innerText = weatherData.date;
  weatherIcon.innerText = weatherData.icon;
  currentTemp.innerText = `Temp: ${weatherData.temp} °F`;
  currentWind.innerText = `Wind: ${weatherData.wind} MPH`;
  currentHumidity.innerText = `Humidity: ${weatherData.humidity}`;
  uvIndex.innerText = `UV index: ${weatherData.uvi}`;
};

const displayFiveDayForecast = weatherDataList => {
  const forecastListEl = document.querySelector('#forecast-list');

  // clear previous forecast list if exists
  forecastListEl.innerText = '';
  // create card for each day's weather data
  weatherDataList.forEach(weatherData => {
    const forecastCardEl = document.createElement('div');

    // add date
    const forecastDate = document.createElement('h3');
    forecastDate.innerText = weatherData.date;
    forecastDate.classList.add('date');
    forecastCardEl.appendChild(forecastDate);

    // add icon
    const forecastIcon = document.createElement('p');
    forecastIcon.innerText = weatherData.icon;
    forecastCardEl.appendChild(forecastIcon);

    // add temp
    const forecastTemp = document.createElement('p');
    forecastTemp.innerText = `Temp: ${weatherData.temp} °F`;
    forecastTemp.classList.add('temp');
    forecastCardEl.appendChild(forecastTemp);

    // add wind speed
    const forecastWind = document.createElement('p');
    forecastWind.innerText = `Wind: ${weatherData.wind} MPH`;
    forecastWind.classList.add('wind');
    forecastCardEl.appendChild(forecastWind);

    // add humidity
    const forecastHumidity = document.createElement('p');
    forecastHumidity.innerText = `Humidity: ${weatherData.humidity} %`;
    forecastHumidity.classList.add('humidity');
    forecastCardEl.appendChild(forecastHumidity);

    forecastListEl.appendChild(forecastCardEl);
  });
};

// click listeners
searchFormEl.addEventListener('submit', () => {
  event.preventDefault();

  // assign city if input is a string, set to null otherwise
  let city = isNaN(citySearchInputEl.value) ? citySearchInputEl.value : null;

  // validate city was recieved
  if (!city) {
    console.log('input not a string');
    return;
  }

  // get current weather
  searchCurrentWeather(city).then(weatherData => {
    console.log(weatherData);
    displayCurrentWeather(weatherData);
  });

  searchFiveDayForecast(city).then(weatherDataList =>
    displayFiveDayForecast(weatherDataList)
  );
});

displayCurrentWeather();
