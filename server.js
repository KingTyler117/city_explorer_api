'use strict';

// Set up
// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');

// Application Setup
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());


// Location 
app.get('/location', (request, response) => {
    try{
    console.log('tempting to get location')
    // Read in data that came from an external API
    let data = require('./data/location.json');
    // Adapt the data to match the contract
    let actualData = new Location(data[0]);
    // Send out the adapted data
    response.status(200).json(actualData);
    } catch (error){
    errorHandler('sorry about that' , request , response) }
});

function Location(obj) {
    this.latitude = obj.lat;
    this.longitude = obj.lon;
    this.formatted_query = obj.display_name;
}

// Weather 
app.get('/weather', (request, response) => {
    try {
        let weatherdata = require('./xdata/weather.json')
        let allWeather = [];
        weatherdata.data.forEach(restObject => {
            let weather = new Weather(restObject);
            allWeather.push(weather);

        })
        console.log(allWeather)
        response.status(200).json(allWeather);
    }catch (error){
        errorHandler('sorry about that' , request , response)
    }
  });


function Weather(obj) {
    this.forecast = obj.weather.description;
    this.time = obj.datetime;

}


// app.get('/', (request, response) => {
//   response.send('Home Page!');
// });

// app.get('/tombrady', (request, response) => {
//     response.send('I miss Tom Brady!');
//   });

// Error Message

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