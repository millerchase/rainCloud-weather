// refs
const citySearchInputEl = document.querySelector('#search-city');
const searchBtn = document.querySelector('#search-btn');
const searchFormEl = document.querySelector('#search-form');
const searchHistoryListEl = document.querySelector('#search-history');

// luxon date wrapper setup
const DateTime = luxon.DateTime;

// make searchHistory global for loading and saving
let searchHistory = [];

// grab the date (option to add how many days from current)
const getDate = numDays => {
  const dt = DateTime.now();

  if (numDays) {
    // return adjusted date if needed
    return dt.plus({ days: numDays }).toLocaleString();
  }

  return dt.toLocaleString();
};

// handler for assigning class to UV Index for color coding
const uviHandler = uvi => {
  switch (true) {
    case uvi >= 11:
      return 'extreme';
    case uvi >= 8:
      return 'very-high';
    case uvi >= 6:
      return 'high';
    case uvi >= 3:
      return 'moderate';
    case uvi >= 0:
      return 'low';
    default:
      console.log('Error in UVI handler');
      break;
  }
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
                  temp: `${data['current']['temp']}`,
                  wind: `${data['current']['wind_speed']}`,
                  humidity: `${data['current']['humidity']}`,
                  uvi: data['current']['uvi']
                };

                saveSearchHistory(currentWeather.location);
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

          // filter for time slots marked 00:00:00 which to holds the new day's average
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

// Displays
const displayCurrentWeather = weatherData => {
  const currentCity = document.querySelector('#current-city');
  const currentDate = document.querySelector('#current-date');
  const currentIcon = document.querySelector('#current-icon');
  const currentTemp = document.querySelector('#current-temp');
  const currentWind = document.querySelector('#current-wind');
  const currentHumidity = document.querySelector('#current-humidity');
  const uvIndex = document.querySelector('#current-uvi');

  if (!weatherData) {
    currentCity.innerText = 'City not found';
    currentDate.innerText = `${getDate()}`;
    currentIcon.innerText = '';
    currentTemp.innerText = 'City not found';
    currentWind.innerText = 'City not found';
    currentHumidity.innerText = `City not found`;
    uvIndex.innerText = `City not found`;
    return;
  }

  currentCity.innerText = weatherData.location;
  currentDate.innerText = `( ${weatherData.date} )`;
  currentIcon.setAttribute(
    'src',
    `http://openweathermap.org/img/w/${weatherData.icon}.png`
  );
  currentTemp.innerText = weatherData.temp;
  currentWind.innerText = weatherData.wind;
  currentHumidity.innerText = weatherData.humidity;
  uvIndex.innerText = weatherData.uvi;
  uvIndex.className = uviHandler(weatherData.uvi);
};

const displayFiveDayForecast = weatherDataList => {
  const forecastListEl = document.querySelector('#forecast-list');

  // clear previous forecast list if exists
  forecastListEl.innerText = '';

  if (!weatherDataList) {
    forecastListEl.innerHTML = '<h3 class="no-city-found"> No City Found </h3>';
    return;
  }

  // create card for each day's weather data
  weatherDataList.forEach(weatherData => {
    const forecastCardEl = document.createElement('div');
    forecastCardEl.classList.add('weather-card');

    // add date
    const forecastDate = document.createElement('h3');
    forecastDate.innerText = weatherData.date;
    forecastDate.classList.add('date');
    forecastCardEl.appendChild(forecastDate);

    // add icon
    const forecastIcon = document.createElement('img');
    forecastIcon.setAttribute(
      'src',
      `http://openweathermap.org/img/w/${weatherData.icon}.png`
    );
    forecastIcon.classList.add('weather-icon');
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

const displaySearchHistory = () => {
  const searchHistoryListEl = document.querySelector('#search-history');
  searchHistoryListEl.innerText = '';
  searchHistory.forEach(location => {
    // create the button
    const searchButtonEl = document.createElement('button');
    searchButtonEl.setAttribute('id', `${location}-btn`);
    searchButtonEl.classList.add('history-btn', 'btn');
    searchButtonEl.innerText = `${location}`;

    searchHistoryListEl.appendChild(searchButtonEl);
  });
};

// save search to history for quick search if valid
const saveSearchHistory = location => {
  console.log(location);
  // make sure only save searches that work
  if (!location) {
    return false;
  }

  // check if location is already in history
  // if so move remove duplicate to move search to top
  if (searchHistory.includes(location)) {
    // filter out the duplicate
    searchHistory = searchHistory.filter(dup => dup !== location);
  }

  // save location to the beginning of searchHistory
  searchHistory.unshift(location);
  console.log(searchHistory.length);

  // limit searchHistory to last eight searches
  if (searchHistory.length > 8) {
    searchHistory.pop();
  }

  localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
};

// load search history into buttons for quick search
const loadSearchHistory = () => {
  searchHistory = JSON.parse(localStorage.getItem('searchHistory'));

  if (!searchHistory) {
    searchHistory = [];
    return;
  }

  displaySearchHistory();
};

// click listeners
searchFormEl.addEventListener('submit', () => {
  event.preventDefault();

  // assign city if input is a string, set to null otherwise
  let city = isNaN(citySearchInputEl.value) ? citySearchInputEl.value : null;

  // validate city was received
  if (!city) {
    console.log('input not a string');
    return;
  }

  // get current weather
  searchCurrentWeather(city).then(weatherData =>
    displayCurrentWeather(weatherData)
  );

  // get five day forecast
  searchFiveDayForecast(city).then(weatherDataList =>
    displayFiveDayForecast(weatherDataList)
  );

  citySearchInputEl.value = '';
  citySearchInputEl.blur();

  // short time out for search history to get sorted
  setTimeout(displaySearchHistory, 1000);
});

searchHistoryListEl.addEventListener('click', event => {
  if (event.target.classList.contains('history-btn')) {
    const city = event.target.innerText;

    // get current weather
    searchCurrentWeather(city).then(weatherData =>
      displayCurrentWeather(weatherData)
    );

    // get five day forecast
    searchFiveDayForecast(city).then(weatherDataList =>
      displayFiveDayForecast(weatherDataList)
    );

    // short time out for search history to get sorted
    setTimeout(displaySearchHistory, 1000);
  }
});

// Startup Code
(init = () => {
  loadSearchHistory();
  if (searchHistory.length) {
    // get current weather
    searchCurrentWeather(searchHistory[0]).then(weatherData =>
      displayCurrentWeather(weatherData)
    );

    // get five day forecast
    searchFiveDayForecast(searchHistory[0]).then(weatherDataList =>
      displayFiveDayForecast(weatherDataList)
    );
  } else {
    displayCurrentWeather();
    displayFiveDayForecast();
  }
})();
