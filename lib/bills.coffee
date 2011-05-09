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

  groupHack = {
    chris: "chris+liz"
    craig: "jon+craig"
    frances: "frances"
    helena: "helena"
    ivan: "ivan+letizia"
    jon: "jon+craig"
    letizia: "ivan+letizia"
    liz: "chris+liz"
    melissa: "mel+waldo"
    waldo: "mel+waldo"
  }

  for bill in bills
    groupedPayer = groupHack[bill.payer]
    res[groupedPayer] = {paid: 0, share: 0, owed: 0} unless res[groupedPayer]?
    amt = parseFloat bill.amount
    res[groupedPayer].paid += amt
    res[groupedPayer].owed += amt
    for payee in bill.payees
      groupedPayee = groupHack[payee]
      res[groupedPayee] = {paid: 0, share: 0, owed: 0} unless res[groupedPayee]?

      len = 1
      len = bill.payees.length unless typeof bill.payees == "string"

      share = parseFloat(bill.amount) / len
      res[groupedPayee].share += share
      res[groupedPayee].owed -= share
  
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
          amount: parseInt(amt*100)/100.0
          convertedAmount: parseInt(amt*0.92*100)/100.0
        pos.owed -= amt
        neg.owed += amt

  return {res: res, summary: summary}