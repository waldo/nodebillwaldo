require.paths.unshift('./node_modules')

// Module dependencies.
var express = require('express');
var jqtpl = require("jqtpl");
var less = require('less');
var bills = require('./bills');
var sys = require('sys');
var util = require('util');

var app = module.exports = express.createServer();
var pub = __dirname + '/public';

// set-up database
var mongo = require('mongodb');
var connection = mongo.Connection;
var bson = mongo.BSONPure;

var info = JSON.parse(process.env.VCAP_SERVICES || "0");
var creds = info ? info['mongodb-1.8'][0]['credentials'] : { 
  hostname: 'localhost',
  port: connection.DEFAULT_PORT,
  db: 'billwaldo'
};

var userPass = '';
if (creds['username']) {
  userPass = creds['username'] + ':' + creds['password'] + '@';
}
var port = '';
if (creds['port']) {
  port = ':' + creds['port'];
}

var dbConn = 'mongo://' + userPass + creds['hostname'] + port + '/' + creds['db'];
// mongo://[username:password@]host1[:port1]/db

console.error('dbConn: ' + util.inspect(dbConn, true));

mongo.connect(dbConn, function(err, dbObj){
  if (err) {
    console.error('err: ' + util.inspect(err, true));
    console.error('dbObj: ' + util.inspect(dbObj, true));
  }

  bills.setup(dbObj, bson);

  // Dummy data
  bills.findAll(function(b){
    if (b === undefined || b.length == 0) {
      bills.save([
          { payer: 'Jon', description: 'Car hire', amount: 729.75, payees:[
            { name: 'Jon' },
            { name: 'Mel' },
            { name: 'Ivan' }
          ]},
          { payer: 'Jon', description: 'Car hire', amount: 729.75, payees:[
            { name: 'Jon' },
            { name: 'Mel' },
            { name: 'Waldo' },
            { name: 'Craig'}
          ]},
        ],
        function(err, b){
          console.error('b err: ' + util.inspect(err, true));
          console.error('b: ' + util.inspect(b, true));
        }
      );
    }
  });
});

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set("view engine", "html");
  app.register(".html", require("jqtpl").express);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(app.router);
  app.use(express.compiler({ src: pub, enable: ['less'] }));
  app.use(express.static(pub));
  app.use(express.errorHandler({ dump: true, stack: true }));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
app.get('/', function(req, res){
  bills.findAll(function(bills){
    res.render('bills/index', {
      title: "bills",
      bills: bills,
      util: util
    });
  });
});

app.get('/bills/:id', function(req, res){
  bills.findById(req.params.id, function(err, bill) {
    if (err) {
      res.redirect('/');
    }
    else {
      res.render('bills/view', {
        title: bill.description,
        bill: bill
      });
    }
  });
});

app.get('/new', function(req, res){
  res.render('bills/new', {
    title: "add a bill"
  });
});

app.post('/new', function(req, res){
  if(req.xhr) {
    bills.save(req.param('bill'), function(error, docs) {
      res.partial('bills/view', { bill: docs[0] });
    });
  }
  else {
    bills.save(req.param('bill'), function(error, docs) {
      res.redirect('/');
    });
  }
});

// Only listen on $ node app.js
if (!module.parent) {
  app.listen(process.env.VMC_APP_PORT || 3000);
  console.log("Express server listening on port %d", app.address().port);
}