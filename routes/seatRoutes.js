var express = require('express');
var router = express.Router();

//require controller
var seatsController = require('../controllers/seatsController');

//update the number of available seats on a flight
router.put('/seat', seatsController.updateAvailableSeats);

//GET the reserved seats
router.get('/reserved/:flightNumber', seatsController.getReservedSeats);

module.exports = router;