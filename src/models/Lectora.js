const { Schema, model } = require("mongoose");

const LectoraSchema = new Schema({
    viewValue: String,
    value: String
})

module.exports = model("Lectora", LectoraSchema)
