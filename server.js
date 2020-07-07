'use strict';

// Set up
// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');



// Application Setup
const DATABASE_URL = process.env.DATABASE_URL
const GEOCODE = process.env.GEOCODE_API_KEY
const weatherCode = process.env.WEATHER_API_KEY
const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
const client = new pg.Client(DATABASE_URL);

// Creating SQL query 
const SQL = 'INSERT INTO users (first_name, last_name) VALUES ($1, $2)';

// Starting up Server
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is up on port ${PORT}.`);
    });
  })
  .catch(err => {
    throw `PG startup error: ${err.message}`;
  })



// console.log('GEOCODE', GEOCODE)
// Weather route 
// app.get('/weather' , WeatherHandler);



// Location 

app.get('/location', (request, response) => {
  // Step 1 check database to see if city is cached, if it is there send to client 
  // Step 2 if city is not cached, do API call
  // Step 3 Add city to database 
  const city = request.query.city;
  console.log('message', city)
  const VALUES = [city]
  const SQL = `SELECT * from city_table WHERE city_name=$1;`;
  client.query(SQL, VALUES)
    .then(results => {
      if (results.rows.length === 0) {
        console.log('city not found')

        const queryParams = {
          key: process.env.GEOCODE_API_KEY,
          q: city,
          format: 'json',
          limit: 1,
        };
        const url = 'https://us1.locationiq.com/v1/search.php';

        superagent.get(url)
          .query(queryParams)
          .then(data => {
            // console.log('data', data)
            const geoData = data.body[0]; // first one ...
            const location = new Location(city, geoData);
            // console.log(location)
            response.send(location);
          })
          .catch(() => {
            errorHandler('So sorry, something went wrong.', request, response);
          });

      } else {
        console.log('city found', results.rows[0])
        response.status(200).json(results);

      }
      // console.log('++++++++++++++++++++++++++++++++++++++', results.rows[0])
    })
    .catch(error => { response.status(500).send(error) });
});


//     console.log('tempting to get location')
//     // Read in data that came from an external API
//     let data = require('./data/location.json');
//     // Adapt the data to match the contract
//     let actualData = new Location(data[0]);
//     // Send out the adapted data
//     response.status(200).json(actualData);
//      catch (error){
//     errorHandler('sorry about that' , request , response) }
// });



function Location(name, obj) {
  this.name = name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
  this.formatted_query = obj.display_name;
}

// Weather 
app.get('/weather', (request, response) => {
  // console.log('request delivered ', request.query)
  // try {
  let latitude = request.query.latitude
  let longitude = request.query.longitude
  // console.log('latitude', latitude);
  // console.log(request)

  const url = `https://api.weatherbit.io/v2.0/forecast/daily?key=${weatherCode}&lat=${latitude}&lon=${longitude}&days=8`

  superagent.get(url)
    .then(data => {
      let forecastArray = data.body.data
      let results = forecastArray.map(oneForecast => {
        return new Weather(oneForecast)

      })
      response.send(results);

      // Pass new forcast and date time to constructor.
      // let newForecast = data.body.data[0].weather.description
      // let newForecast2 = data.body.data[1].weather.description
      // console.log('newForecast',newForecast2)
      // let newTime = data.body.data[0].datetime
      // console.log('newTime', newTime)
      // console.log('newForecast',newForecast)

    })
    .catch((err) => {
      console.error(err)
    });



  // superagent.get(url) 
  // .then(data => {
  //   let jsonData = JSON.parse(data.text)
  //   console.log(jsonData.data[0].weather.description)
  // }) 





  // console.log('weather', weather)
  // response.status(200).json(weather);
  // }catch (error){
  //     errorHandler('sorry about that' , request , response)
  // }
});

//   const queryParams = {
//     // key: process.env.GEOCODE_API_KEY,
//     q: city,
//     format: 'json',
//     limit: 1,
//   };
//   superagent.get(url)
//   .query(queryParams) 
//   .then(data => {
//     console.log('data', data)
//     const weatherData = data.body[0]; // first one ...
//     const newWeather = new weather(weather, geoData);
//     response.send(location);
//   })
//   .catch(() => {
//     errorHandler('So sorry, something went wrong.', request, response);
//   });







function Weather(obj) {
  this.forecast = obj.weather.description;
  this.time = obj.datetime;


}


// Trails 
app.get('/trails', handleTrails)

function handleTrails(request, response) {
  const coordinates = {
    lat: request.query.latitude,
    lon: request.query.longitude,
  };
  const API = `https://www.hikingproject.com/data/get-trails?lat=${request.query.latitude}&lon=${request.query.longitude}&key=${process.env.TRAIL_API_KEY}`;

  superagent
    .get(API)
    .then((dataResults) => {
      let results = dataResults.body.trails.map((result) => {
        return new Trail(result);
      });
      response.status(200).json(results);
    })
    .catch((err) => {
      console.error(" wrong trail", err);
    });
}



function Trail(obj) {
  this.name = obj.name;
  this.location = obj.location;
  this.length = obj.length;
  this.stars = obj.stars;
  this.star_votes = obj.star_votes;
  this.summary = obj.summary;
  this.trail_url = obj.url;
  this.conditions = obj.conditionDetails;
  this.condition_date = obj.conditionDate.slice(0, 10);
  this.condition_time = obj.conditionDate.slice(11, 19);
  // console.log(this.condition_time)
  // console.log(this.condition_date)
}

// Movies 

app.get('/movies', (request, response) => {
    const movieQuery = request.query.name;
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${movieQuery}`;
console.log(url)
    superagent.get(url).then(resultsFromSuperAgent => {
      const data = resultsFromSuperAgent.body.results;
      console.log('movies', data)
      const movieResults = data.map(value => new Movie(value));
      response.status(200).send(movieResults);

    })

      .catch((err) => {
      response.status(500).send('Sorry, looks like you have to read instead');

    });
   
});
function Movie (obj) {
  this.title = obj.title;
  this.overview = obj.overview;
  this.average_votes = obj.vote_average;
  this.total_votes = obj.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500${obj.poster_path}`;
  this.popularity = obj.popularity;
  this.released_on = obj.release_date
}


// Yelp
app.get('/yelp', (request, response) => {
  let queryLatitude = request.query.latitude
  let queryLongitude = request.query.longitude;
  const url = 'https://api.yelp.com/v3/businesses/search'; 

// Pagination 
  const yelpQuery = request.query.page;
  const numPerPage = 5;
  const start = (yelpQuery -1) * numPerPage;


superagent.get(url)
.set('Authorization' , `Bearer ${process. envYELP_API_KEY}`)
.query(queryParams)
.then(data => {
  const restaurantArray = data.body.businesses;
  console.log(data);
  const yelpResults = data.map(value => new Yelp(value));
  console.log(yelpResults);
  response.status(200).send(yelpResults);
}

)

.catch((err) => {
response.status(500).send('Sorry, looks like you have to eat at home tonight');

});})

function Yelp(obj){
this.name = obj.name;
this.image_url = obj.image_url;
this.price = obj.price;
this.rating = obj.rating;
this.url = obj.url;
}

  // }


// app.get('/', (request, response) => {
//   response.send('Home Page!');
// });

// app.get('/tombrady', (request, response) => {
//     response.send('I miss Tom Brady!');
//   });

// Error Message
// }
app.get('/bad', (request, response) => {
  throw new Error('poo');
});

// The callback can be a separate function. Really makes things readable
// app.get('/about', aboutUsHandler);

function aboutUsHandler(request, response) {
  response.status(200).send('About Us Page');
}

// API Routes
// app.get('/location', handleLocation);
// app.get('/restaurants', handleRestaurants);

// app.use('*', notFoundHandler);
// app.use(errorHandler);

// HELPER FUNCTIONS

// function handleLocation(request, response) {
//   try {
//     const geoData = require('./data/location.json');
//     const city = request.query.city;
//     const locationData = new Location(city, geoData);
//     response.send(locationData);
//   }
//   catch (error) {
//     errorHandler('So sorry, something went wrong.', request, response);
//   }
// }

// function Location(city, geoData) {
//   this.search_query = city;
//   this.formatted_query = geoData[0].display_name;
//   this.latitude = geoData[0].lat;
//   this.longitude = geoData[0].lon;
// }

// function handleRestaurants(request, response) {
//   try {
//     const data = require('./data/restaurants.json');
//     const restaurantData = [];
//     data.nearby_restaurants.forEach(entry => {
//       restaurantData.push(new Restaurant(entry));
//     });
//     response.send(restaurantData);
//   }
//   catch (error) {
//     errorHandler('So sorry, something went wrong.', request, response);
//   }
// }

// function Restaurant(entry) {
//   this.restaurant = entry.restaurant.name;
//   this.cuisines = entry.restaurant.cuisines;
//   this.locality = entry.restaurant.location.locality;
// }

function notFoundHandler(request, response) {
  response.status(404).send('nope?');
}

function errorHandler(error, request, response) {
  response.status(500).send(error);
}



//  Server is listening for the requests
app.listen(PORT, () => console.log(`App is listening on ${PORT}`));

// Test test test test 