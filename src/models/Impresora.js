const { Schema, model } = require("mongoose");

const ImpresoraSchema = new Schema({
    viewValue: String,
    value: String
})

module.exports = model("Impresora", ImpresoraSchema)
