const { Schema, model } = require("mongoose");

const EntranceControl = new Schema({
    tag_id: String,
    user_id: {
        type: Schema.Types.ObjectId, 
        ref: 'User'
    },
    id_lectora: String,
    event_type: String,
    created: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: false,
    versionKey: false
});

module.exports = model("EntranceControl", EntranceControl)