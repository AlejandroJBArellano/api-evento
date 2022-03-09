const { Schema, model } = require("mongoose");

const CumtomPropertieSchema = new Schema({
    name: String,
    value: Schema.Types.Mixed
}, {_id: false, versionKey: false})

const EntranceControl = new Schema({
    tag_id: String,
    registered_by_user_id: Number,
    email: String,
    first_name: String,
    identification_img_url: String,
    identification_img_file_name: String,
    last_name: String,
    mobile_number: String,
    badge: String,
    adminuser: String,
    adminpassword: String,
    adminsub: String,
    arrivaldate: String,
    accessdate: String,
    limitdate: String,
    user_role: {
        role: {
            type: String,
            required: true
        }
    },
    organization_role: {  
        empresa: String,
        titulo: String,
        pais: String,
        estado: String,
        localidad: String,
        attendance_type: String
    },
    custom_properties: [CumtomPropertieSchema],
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