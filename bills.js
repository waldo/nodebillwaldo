var util = require('util');

var db = null;
var bson = null;


exports.setup = function(dbObj, bsonX) {
  db = dbObj;
  bson = bsonX;
}

collection = function(callback) {
  db.collection('bills', function(err, bill_collection) {
    callback(bill_collection);
  });
};

exports.findAll = function(callback){
  collection(function(bill_collection) {
    bill_collection.find(function(err, cursor) {
      cursor.toArray(function(err, results) {
        callback(results);
      });
    });
  });
};

exports.findById = function(id, callback){
  collection(function(bill_collection) {
    bill_collection.findOne(bson.ObjectID.createFromHexString(id), {}, function(err, result) {
      if (err) {
        console.error('findById err: ' + util.inspect(err, true));
        callback(err, null)
      }
      else {
        callback(null, result);
      }
    });
  });
};

exports.deleteById = function(id, callback){
  collection(function(bill_collection) {
    bill_collection.remove({'_id': bson.ObjectID.createFromHexString(id)}, {}, function(err, result) {
      if (err) {
        callback(err, null);
      }
      else {
        callback(null, result);
      }
    });
  });
};

exports.save = function(bills, callback){
  collection(function(bill_collection){
    if (typeof(bills.length)=="undefined") {
      bills = [bills];
    }

      for (var i = 0; i < bills.length; i++) {
        bill = bills[i];
        bill.created_at = new Date();
        if (bill.payees === undefined) {
          bill.payees = [];
        }
        for(var j =0;j< bill.payees.length; j++) {
          bill.payees[j].created_at = new Date();
        }
      }

      bill_collection.insert(bills, function() {
        callback(null, bills);
      });
  });
};