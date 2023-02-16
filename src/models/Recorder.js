const { Schema, model } = require("mongoose");

const Recorder = new Schema({
    name: {
        required: true, 
        type: String,
    },
    pronouns: {
        type: String,
        enum: ["he", "she", "it"]
    },
    pin: {
        type: String,
        length: 4,
    }
});

module.exports = model("Recorder", Recorder)