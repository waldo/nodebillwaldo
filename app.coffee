require.paths.unshift "./node_modules"

# modules
express = require "express"
jqtpl = require "jqtpl"
less = require "less"
sys = require "sys"
util = require "util"

# lib modules
bills = require "./lib/bills"

app = module.exports = express.createServer()
pub = __dirname + "/public"
pubScripts = pub + "/javascripts"

# set-up database
mongo = require "mongodb"
connection = mongo.Connection
bson = mongo.BSONPure

info = JSON.parse process.env.VCAP_SERVICES or "0"
localInfo =
  hostname: "localhost"
  port: connection.DEFAULT_PORT
  db: "billwaldo"

creds = if info then info["mongodb-1.8"][0]["credentials"] else localInfo

userPass = if creds["username"] then creds["username"] + ":" + creds["password"] + "@" else ""

port = if creds["port"] then port = ":" + creds["port"] else ""

dbConn = "mongo://" + userPass + creds["hostname"] + port + "/" + creds["db"]
# mongo://[username:password@]host1[:port1]/db

console.error "dbConn: " + util.inspect(dbConn, true)

payees = [
  "Jon"
  "Mel"
  "Ivan"
  "Craig"
]

billA = 
  payer: "Jon"
  description: "Car hire"
  amount: 729.75
  payees: payees

billB = 
  payer: "Jon"
  description: "Car hire"
  amount: 729.75
  payees: payees
  
dummyData = [billA, billB]

mongo.connect dbConn, (err, dbObj) ->
  if err
    console.error "err: " + util.inspect(err, true)
    console.error "dbObj: " + util.inspect(dbObj, true)

  bills.setup dbObj, bson

# Dummy data
  bills.findAll (b) ->
    if b is undefined or b.length is 0
      bills.save dummyData, 
        (err, b) ->
          console.error "b err: " + util.inspect(err, true)
          console.error "b: " + util.inspect(b, true)

# Configuration
app.configure () ->
  app.set "views", __dirname + "/views"
  app.set "view engine", "html"
  app.register ".html", require("jqtpl").express
  app.use express.bodyParser()
  app.use express.methodOverride()
  app.use express.cookieParser()
  app.use express.session(secret: "your secret here")
  app.use app.router
  app.use express.compiler(src: pub, enable: ["less"])
  app.use express.compiler(src: pubScripts, dest: pubScripts, enable: ["coffeescript"])
  app.use express.static(pub)
  app.use express.errorHandler(dump: true, stack: true)

app.configure "development", () ->
  app.use express.errorHandler(dumpExceptions: true, showStack: true)

app.configure "production", () ->
  app.use express.errorHandler()

# Routes
app.get "/", (req, res) ->
  bills.findAll (b) ->
    calc = bills.calculate b
    res.render "bills/index",
      title: "bills"
      bills: b
      util: util
      calc: calc

app.get "/bills/:id", (req, res) ->
  bills.findById req.params.id, (err, bill) ->
    if err
      res.redirect "/"
    else
      res.render "bills/view",
        title: bill.description
        bill: bill

app.get "/new", (req, res) ->
  res.render "bills/new",
    title: "add a bill"

app.post "/new", (req, res) ->
  if req.xhr
    bills.save req.param("bill"), (error, docs) ->
      res.partial "bills/view", bill: docs[0]
  else
    bills.save req.param("bill"), (error, docs) ->
      res.redirect "/"

app.post "/bills/:id/delete", (req, res) ->
  bills.deleteById req.params.id, (err, bill) ->
    if err
      res.redirect "/"
      req.flash "error", "Couldn\'t delete that bill :("
    else
      res.redirect "/"
      req.flash "info", "Deleted!"

# Only listen on $ node app.js
if not module.parent
  app.listen process.env.VMC_APP_PORT or 3000
  console.log "Express server listening on port %d", app.address().port