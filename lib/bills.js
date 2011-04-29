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
        if (bill.payees === void 0) {
          bill.payees = [];
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
}).call(this);
