util = require "util"

db = null
bson = null

exports.setup = (dbObj, bsonParam) ->
  db = dbObj
  bson = bsonParam

collection = (callback) ->
  db.collection "bills", (err, bill_collection) ->
    callback bill_collection

exports.findAll = (callback) ->
  collection (bill_collection) ->
    bill_collection.find (err, cursor) ->
      cursor.toArray (err, results) ->
        callback results

exports.findById = (id, callback) ->
  collection (bill_collection) ->
    bill_collection.findOne bson.ObjectID.createFromHexString(id), {}, (err, result) ->
      if err
        console.error "findById err: " + util.inspect(err, true)
        callback err, null
      else
        callback null, result

exports.deleteById = (id, callback) ->
  collection (bill_collection) ->
    bill_collection.remove "_id": bson.ObjectID.createFromHexString(id), {}, (err, result) ->
      if err
        callback err, null
      else
        callback null, result

exports.save = (bills, callback) ->
  collection (bill_collection) ->
    if not bills.length?
      bills = [bills]

    for bill in bills
      bill.created_at = new Date()

      if bill.payees is undefined
        bill.payees = []

      for payee in bill.payees
        payee.created_at = new Date()

    bill_collection.insert bills, () ->
      callback null, bills