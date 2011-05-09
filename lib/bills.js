(function() {
  var bson, collection, db, util;
  util = require("util");
  db = null;
  bson = null;
  exports.setup = function(dbObj, bsonParam) {
    db = dbObj;
    return bson = bsonParam;
  };
  collection = function(callback) {
    return db.collection("bills", function(err, bill_collection) {
      return callback(bill_collection);
    });
  };
  exports.findAll = function(callback) {
    return collection(function(bill_collection) {
      return bill_collection.find(function(err, cursor) {
        return cursor.toArray(function(err, results) {
          return callback(results);
        });
      });
    });
  };
  exports.findById = function(id, callback) {
    return collection(function(bill_collection) {
      return bill_collection.findOne(bson.ObjectID.createFromHexString(id), {}, function(err, result) {
        if (err) {
          console.error("findById err: " + util.inspect(err, true));
          return callback(err, null);
        } else {
          return callback(null, result);
        }
      });
    });
  };
  exports.deleteById = function(id, callback) {
    return collection(function(bill_collection) {
      return bill_collection.remove({
        "_id": bson.ObjectID.createFromHexString(id)
      }, {}, function(err, result) {
        if (err) {
          return callback(err, null);
        } else {
          return callback(null, result);
        }
      });
    });
  };
  exports.save = function(bills, callback) {
    return collection(function(bill_collection) {
      var bill, payee, _i, _j, _len, _len2, _ref;
      if (!(bills.length != null)) {
        bills = [bills];
      }
      for (_i = 0, _len = bills.length; _i < _len; _i++) {
        bill = bills[_i];
        bill.created_at = new Date();
        if (!(bill.payees != null)) {
          bill.payees = [];
        }
        if (typeof bill.payees === "string") {
          bill.payees = [bill.payees];
        }
        _ref = bill.payees;
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          payee = _ref[_j];
          payee.created_at = new Date();
        }
      }
      return bill_collection.insert(bills, function() {
        return callback(null, bills);
      });
    });
  };
  exports.calculate = function(bills) {
    var amt, bill, compare, groupHack, groupedPayee, groupedPayer, len, name, neg, negatives, payee, pos, positives, res, share, summary, val, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref;
    res = {};
    groupHack = {
      chris: "chris+liz",
      craig: "jon+craig",
      frances: "frances",
      helena: "helena",
      ivan: "ivan+letizia",
      jon: "jon+craig",
      letizia: "ivan+letizia",
      liz: "chris+liz",
      melissa: "mel+waldo",
      waldo: "mel+waldo"
    };
    for (_i = 0, _len = bills.length; _i < _len; _i++) {
      bill = bills[_i];
      groupedPayer = groupHack[bill.payer];
      if (res[groupedPayer] == null) {
        res[groupedPayer] = {
          paid: 0,
          share: 0,
          owed: 0
        };
      }
      amt = parseFloat(bill.amount);
      res[groupedPayer].paid += amt;
      res[groupedPayer].owed += amt;
      _ref = bill.payees;
      for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
        payee = _ref[_j];
        groupedPayee = groupHack[payee];
        if (res[groupedPayee] == null) {
          res[groupedPayee] = {
            paid: 0,
            share: 0,
            owed: 0
          };
        }
        len = 1;
        if (typeof bill.payees !== "string") {
          len = bill.payees.length;
        }
        share = parseFloat(bill.amount) / len;
        res[groupedPayee].share += share;
        res[groupedPayee].owed -= share;
      }
    }
    summary = [];
    compare = function(a, b) {
      if (a.owed > b.owed) {
        return -1;
      }
      if (a.owed < b.owed) {
        return 1;
      }
      return 0;
    };
    positives = ((function() {
      var _results;
      _results = [];
      for (name in res) {
        val = res[name];
        if (val.owed > 0) {
          _results.push({
            name: name,
            owed: val.owed
          });
        }
      }
      return _results;
    })()).sort(compare);
    negatives = ((function() {
      var _results;
      _results = [];
      for (name in res) {
        val = res[name];
        if (val.owed < 0) {
          _results.push({
            name: name,
            owed: val.owed
          });
        }
      }
      return _results;
    })()).sort(compare).reverse();
    for (_k = 0, _len3 = negatives.length; _k < _len3; _k++) {
      neg = negatives[_k];
      for (_l = 0, _len4 = positives.length; _l < _len4; _l++) {
        pos = positives[_l];
        if (Math.abs(neg.owed) > 0.01 && Math.abs(pos.owed) > 0.01) {
          amt = pos.owed;
          if (Math.abs(neg.owed) < pos.owed) {
            amt = Math.abs(neg.owed);
          }
          summary.push({
            payer: neg.name,
            recipient: pos.name,
            amount: parseInt(amt * 100) / 100.0,
            convertedAmount: parseInt(amt * 0.92 * 100) / 100.0
          });
          pos.owed -= amt;
          neg.owed += amt;
        }
      }
    }
    return {
      res: res,
      summary: summary
    };
  };
}).call(this);
