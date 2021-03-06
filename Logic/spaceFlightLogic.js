var SpaceFlightRepo = require('../repositories/spaceFlightRepo');
var SpaceshipLogic = require('../Logic/spaceshipLogic');

var SpaceFlightVM = require('../models/flightVM');
var SpaceFlight = require('../models/flight');

//create a flight
function createSpaceFlight(req) {
    return SpaceFlightRepo.createSpaceFlight(req);
}

//get all flights
async function getAllSpaceFlights() {
        var flights = await SpaceFlightRepo.getSpaceFlights();
        var flightsVM = [];

        for (let flight of flights) {
            shipId = flight.ship;
            ship = await SpaceshipLogic.getSpaceshipById(shipId);
            flightsVM.push(createSpaceFlightVM(ship, flight));
        }

        return flightsVM;
    }

function createSpaceFlightVM(ship, flight) {
    var vm = new SpaceFlightVM(ship, flight.arrivalDate,
        flight.departureDate, flight.gate, flight.flightNumber, flight.leavingLocation,
        flight.destination, flight.availableSeats);
    return vm;
}

function updateFlightSeats(flight, numberOfSeats) {
    return SpaceFlightRepo.updateFlightSeats(flight, numberOfSeats);
}

async function deleteSpaceFlight(flightNumber) {
    return await SpaceFlightRepo.deleteSpaceFlight(flightNumber);
}

module.exports.deleteSpaceFlight = deleteSpaceFlight;
module.exports.updateFlightSeats = updateFlightSeats;
module.exports.createSpaceFlightVM = createSpaceFlightVM;
module.exports.createSpaceFlight = createSpaceFlight;
module.exports.getAllSpaceFlights = getAllSpaceFlights;

