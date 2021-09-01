const { Schema, model } = require("mongoose");

const AdmonitionSchema = new Schema({
    tag_id: {
        type: String
    },
    points: Number,
    id_lectora: String
}, {
    versionKey: false
});

module.exports = model("Admonition", AdmonitionSchema)