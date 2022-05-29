const openWeatherKey = '347d8731de2da6ee2f8084e5c4386031';

const options = {
	method: 'GET',
	headers: {
		'X-RapidAPI-Host': 'geo-services-by-mvpc-com.p.rapidapi.com',
		'X-RapidAPI-Key': '32e9f51d38mshf0b78320df8dcbap15c225jsn975d5508e897'
	}
};

const city = "Austin";

// search for city zip code via string
const searchCityGeoLoc = city => {
    return new Promise((rs, rj) => {
        rs (
            fetch(`https://geo-services-by-mvpc-com.p.rapidapi.com/cities/findcitiesfromtext?q=${city}&sort=population%2Cdesc&language=en`, options)
                .then(response => response.json())
                .then(response => {
                    if (response['data']) {
                        // seperate lat and long into search results to return
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
                .catch(err => rj (err))

        )

    })
};

searchCityGeoLoc(city)
    .then(res => console.log(res['lat'], res['long']));