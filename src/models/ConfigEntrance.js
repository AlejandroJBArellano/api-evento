const { Schema, model } = require("mongoose");

const BadgeSchema = new Schema({
    badge: String,
    message: String,
    img: {
        type: String,
        required: false
    },
    fontColor: String,
})

const ConfigSchema = new Schema({
    topic: String,
    event: String,
    imgUrl: String,
    allowedBadges: [BadgeSchema],
    deniedBadges: [BadgeSchema],
    terminalTitle: String,
    shortDescription: String,
    fontColor: String
});

module.exports = model('ConfigEntrance', ConfigSchema);