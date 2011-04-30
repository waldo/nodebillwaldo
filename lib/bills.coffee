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

      if not bill.payees?
        bill.payees = []

      if typeof bill.payees == "string"
        bill.payees = [bill.payees]

      for payee in bill.payees
        payee.created_at = new Date()

    bill_collection.insert bills, () ->
      callback null, bills

exports.calculate = (bills) ->
  res = {}
  for bill in bills
    res[bill.payer] = {paid: 0, share: 0, owed: 0} unless res[bill.payer]?
    res[bill.payer].paid += parseFloat bill.amount
    res[bill.payer].owed = res[bill.payer].paid - res[bill.payer].share  
    for payee in bill.payees
      res[payee] = {paid: 0, share: 0, owed: 0} unless res[payee]?

      len = 1
      len = bill.payees.length unless typeof bill.payees == "string"

      res[payee].share += parseFloat(bill.amount) / len
      res[payee].owed = res[payee].paid - res[payee].share  
  
  summary = []
  
  compare = (a, b) ->
    return -1 if a.owed > b.owed
    return 1 if a.owed < b.owed
    return 0
  
  positives = ({name: name, owed: val.owed} for name, val of res when val.owed > 0).sort(compare)
  negatives = ({name: name, owed: val.owed} for name, val of res when val.owed < 0).sort(compare).reverse()
  
  for neg in negatives
    for pos in positives
      if Math.abs(neg.owed) > 0.01 and Math.abs(pos.owed) > 0.01
        amt = pos.owed
        amt = Math.abs(neg.owed) if Math.abs(neg.owed) < pos.owed
        summary.push
          payer: neg.name
          recipient: pos.name
          amount: amt
        pos.owed -= amt
        neg.owed += amt

  return {res: res, summary: summary}