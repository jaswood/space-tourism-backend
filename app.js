var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var bodyParser = require('body-parser');
var debug = require('debug')('space-tourism-api:server');
var socketIO = require('socket.io');
var http = require('http');


var indexRouter = require('./routes/index');
var spaceshipRouter = require('./routes/spaceshipRoutes');
var spaceFlightRouter = require('./routes/spaceFlightRoutes');
var seatRouter = require('./routes/seatRoutes');
var ticketRouter = require('./routes/ticketRoutes');

var app = express();

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/spaceship', spaceshipRouter);
app.use('/flights', spaceFlightRouter);
app.use('/seats', seatRouter);
app.use('/tickets', ticketRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

//create server
var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
 //=============================================================================================================================================
var io = socketIO(server);
var AuctionLogic = require('./Logic/auctionLogic');
var Auctions = []; //currently active auctions

io.on('connection', function (socket) {
  console.log('client connected');
  let previousId;
  const safeJoin = currentId => {
      socket.leave(previousId);
      socket.join(currentId);
      previousId = currentId;
  }
  var auctionLogic = new AuctionLogic('');
  var flight;

  //register for the auction
  socket.on('registerForFlightAuction', flightNumber => {
    safeJoin(flightNumber); //join room
    flight = flightNumber;

    alreadyCreated = Auctions.findIndex((auction) => { //if the auctionLogic/house for that flight is already set up
      return (auction.flightNumber == flightNumber);
    });

    if(alreadyCreated > -1)
    { 
      auctionLogic = Auctions[alreadyCreated];
    } else {
      auctionLogic = new AuctionLogic(flightNumber);
      Auctions.push(auctionLogic);
    }
    auctionLogic.addParticipants();
  });

  socket.on('joinedAuction', () => {
    io.in(flight).emit('noOfBidders', auctionLogic.participants);
  })

  socket.on('reservingSeats', (seats) => {
    socket.to(flight).emit('seatsBeingReserved', seats);
  })

  socket.on('unreservingSeats', (seat) => {
    socket.to(flight).emit('unreserveSeat', seat);
  })

  socket.on('readyToAuction', () => {
    auctionLogic.addReadyParticipants();

    //if all players are ready or not
    if(!auctionLogic.ready()){
      socket.to(flight).emit('otherPlayersReady', true);
    }
    else{
      io.in(flight).emit('beginAuction', true);
      auctionLogic.beginTimer(io, flight);
    }  
  });

  socket.on('bid', amount => {
    auctionLogic.setHighestBid(amount, io);
  });

  //wipe the current auction
  socket.on('clearAuctionHouse', () => {
    console.log(`closing auction ${flight}`);
    clearAuctionInstance(auctionLogic)
  })

  //if someone leaves an auction prematurely
  socket.on('closeAuctionDisconnect', () => {
    auctionLogic.removeParticipants();
    socket.leave(flight);

    io.in(flight).emit('noOfBidders', auctionLogic.participants); //update bidders

    if(auctionLogic.participants == 0){
      clearAuctionInstance(auctionLogic);
    }
    console.log('client disconnected');
  });

  //if the socket disconnects then follow these directions
  socket.on('disconnect', () => {
    auctionLogic.removeParticipants();
    socket.leave(flight);

    io.in(flight).emit('noOfBidders', auctionLogic.participants);

    if(auctionLogic.participants == 0){
      clearAuctionInstance(auctionLogic);
    }
    console.log('client disconnected');
  })
});

function clearAuctionInstance(auctionLogic){
  auctionLogic.closeAuction();
  let set = new Set(Auctions);
  set.delete(auctionLogic);
  Auctions = Array.from(set);
}

module.exports = app;
