const { Schema, model } = require("mongoose");

const Store = new Schema({
    region: {
        type: String,
        required: true
    },
    zona: {
        type: String,
        required: true
    },
    distrito: {
        type: String,
        required: true
    },
    tienda: {
        type: String,
        required: true
    }
}, {
    versionKey: false
})

module.exports = model("Store", Store)