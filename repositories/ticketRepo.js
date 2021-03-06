var Ticket = require('../models/ticket');

async function createTicket(req) {
    var ticket = new Ticket({
        flightNumber: req.body.flightNumber,
        ticketNumber: req.body.ticketNumber,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        dob: req.body.dob,
        passportNumber: req.body.passportNumber,
        seatQuantity: req.body.seatQuantity,
        emailAddress: req.body.emailAddress,
        seats: req.body.seats
    });
    ticket.save(function (err) {
        if (err) return err
    });
    return 201;
}

async function getTicketById(ticketNumber) {
    return await Ticket.findOne({ticketNumber:String(ticketNumber)});
}

module.exports.createTicket = createTicket;
module.exports.getTicketById = getTicketById;