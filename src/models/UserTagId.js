const { Schema, model } = require("mongoose");

const UserTagIdSchema = new Schema({
    tag_id: {
        type: String,
        required: true,
        unique: true
    },
    user_id: {
        type: Schema.Types.ObjectId, 
        ref: 'User'
    }
}, {
    versionKey: false
})

module.exports = model("UserTagId", UserTagIdSchema)
