const {Schema, model} = require("mongoose");
const { UserSchema } = require("./User");

const ReplacementReasonSchema = new Schema({
    reason: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        required: true
    }
}, {
    timestamps: true
}).add(UserSchema)

module.exports = model("ReplacementReason", ReplacementReasonSchema)