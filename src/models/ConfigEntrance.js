const { Schema, model } = require("mongoose");

const ConfigSchema = new Schema({
    topic: String,
    event: String
});

module.exports = model('ConfigEntrance', ConfigSchema);