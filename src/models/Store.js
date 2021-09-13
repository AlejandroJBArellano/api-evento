const { Schema, model } = require("mongoose");

const Store = new Schema({
    region: String,
    zona: String,
    distrito: String,
    tienda:String
}, {
    versionKey: false
})

module.exports = model("Store", Store)