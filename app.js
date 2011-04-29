(function() {
  var app, billA, billB, bills, bson, connection, creds, dbConn, dummyData, express, info, jqtpl, less, localInfo, mongo, payees, port, pub, pubScripts, sys, userPass, util;
  require.paths.unshift("./node_modules");
  express = require("express");
  jqtpl = require("jqtpl");
  less = require("less");
  sys = require("sys");
  util = require("util");
  bills = require("./lib/bills");
  app = module.exports = express.createServer();
  pub = __dirname + "/public";
  pubScripts = pub + "/javascripts";
  mongo = require("mongodb");
  connection = mongo.Connection;
  bson = mongo.BSONPure;
  info = JSON.parse(process.env.VCAP_SERVICES || "0");
  localInfo = {
    hostname: "localhost",
    port: connection.DEFAULT_PORT,
    db: "billwaldo"
  };
  creds = info ? info["mongodb-1.8"][0]["credentials"] : localInfo;
  userPass = creds["username"] ? creds["username"] + ":" + creds["password"] + "@" : "";
  port = creds["port"] ? port = ":" + creds["port"] : "";
  dbConn = "mongo://" + userPass + creds["hostname"] + port + "/" + creds["db"];
  console.error("dbConn: " + util.inspect(dbConn, true));
  payees = ["Jon", "Mel", "Ivan", "Craig"];
  billA = {
    payer: "Jon",
    description: "Car hire",
    amount: 729.75,
    payees: payees
  };
  billB = {
    payer: "Jon",
    description: "Car hire",
    amount: 729.75,
    payees: payees
  };
  dummyData = [billA, billB];
  mongo.connect(dbConn, function(err, dbObj) {
    if (err) {
      console.error("err: " + util.inspect(err, true));
      console.error("dbObj: " + util.inspect(dbObj, true));
    }
    bills.setup(dbObj, bson);
    return bills.findAll(function(b) {
      if (b === void 0 || b.length === 0) {
        return bills.save(dummyData, function(err, b) {
          console.error("b err: " + util.inspect(err, true));
          return console.error("b: " + util.inspect(b, true));
        });
      }
    });
  });
  app.configure(function() {
    app.set("views", __dirname + "/views");
    app.set("view engine", "html");
    app.register(".html", require("jqtpl").express);
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({
      secret: "your secret here"
    }));
    app.use(app.router);
    app.use(express.compiler({
      src: pub,
      enable: ["less"]
    }));
    app.use(express.compiler({
      src: pubScripts,
      dest: pubScripts,
      enable: ["coffeescript"]
    }));
    app.use(express.static(pub));
    return app.use(express.errorHandler({
      dump: true,
      stack: true
    }));
  });
  app.configure("development", function() {
    return app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });
  app.configure("production", function() {
    return app.use(express.errorHandler());
  });
  app.get("/", function(req, res) {
    return bills.findAll(function(bills) {
      return res.render("bills/index", {
        title: "bills",
        bills: bills,
        util: util
      });
    });
  });
  app.get("/bills/:id", function(req, res) {
    return bills.findById(req.params.id, function(err, bill) {
      if (err) {
        return res.redirect("/");
      } else {
        return res.render("bills/view", {
          title: bill.description,
          bill: bill
        });
      }
    });
  });
  app.get("/new", function(req, res) {
    return res.render("bills/new", {
      title: "add a bill"
    });
  });
  app.post("/new", function(req, res) {
    if (req.xhr) {
      return bills.save(req.param("bill"), function(error, docs) {
        return res.partial("bills/view", {
          bill: docs[0]
        });
      });
    } else {
      return bills.save(req.param("bill"), function(error, docs) {
        return res.redirect("/");
      });
    }
  });
  app.post("/bills/:id/delete", function(req, res) {
    return bills.deleteById(req.params.id, function(err, bill) {
      if (err) {
        res.redirect("/");
        return req.flash("error", "Couldn\'t delete that bill :(");
      } else {
        res.redirect("/");
        return req.flash("info", "Deleted!");
      }
    });
  });
  if (!module.parent) {
    app.listen(process.env.VMC_APP_PORT || 3000);
    console.log("Express server listening on port %d", app.address().port);
  }
}).call(this);
