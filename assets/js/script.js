// refs
const citySearchInputEl = document.querySelector('#search-city');
const searchBtn = document.querySelector("#search-btn");
const searchFormEl = document.querySelector('#search-form');

// luxon date wrapper setup
const DateTime = luxon.DateTime;

// grab the date (option to add how many days from current)
const getDate = numDays => {
    const dt = DateTime.now();

    if (numDays) {
        // return adjusted date if needed
        return dt.plus({ days: numDays }).toLocaleString();
    };

    return dt.toLocaleString();
}

// search for city zip code via string
const searchCityGeoLoc = city => {
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
                        // seperate lat and long into search result
                        const searchResults = {
                            lat: response['data'][0]['latitude'],
                            long: response['data'][0]['longitude']
                        };

                        return searchResults;

                    } else {
                        // if search results return false
                        return false;
                    }
                })
                .catch(err => rj(err))

        )

    })
};

// setup open weather 
const searchCurrentWeather = (city) => {

    const openWeatherKey = '347d8731de2da6ee2f8084e5c4386031';
    
    return new Promise((rs, rj) => {
        rs(
            searchCityGeoLoc(city).then(res => {
                return new Promise((rs, rj) => {
                    rs(
                        fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${res.lat}&lon=${res.long}&exclude=minutely,hourly,daily&units=imperial&appid=${openWeatherKey}`)
                            .then(res => res.json())
                            .then(data => {
                                console.log(data);
                                
                                let weather = {
                                    date: getDate(),
                                    temp: `${data['current']['temp']}°f`,
                                    wind: `${data['current']['wind_speed']} MPH`,
                                    humidity: `${data['current']['humidity']}%`
                                }
                                return weather
                            })
                            .catch(err => rj(err))
                    )   
                })
            })
        )
    })
}

// click listeners
searchFormEl.addEventListener('submit', () => {
    event.preventDefault();

    // assign city if input is a string, set to null otherwise
    let city =  isNaN(citySearchInputEl.value) ? citySearchInputEl.value: null;

    if (city) {
        searchCityGeoLoc(city)
            .then(res => {
                if (res) {
                    console.log(res['lat'], res['long']);
                }
            })
    } else {
        console.log("input not a string");
    }
});


searchCurrentWeather('Austin')
    .then(res => console.log(res))