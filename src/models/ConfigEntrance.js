const { Schema, model } = require("mongoose");

const ConfigSchema = new Schema({
    topic: String,
    event: String,
    imgUrl: String
});

module.exports = model('ConfigEntrance', ConfigSchema);