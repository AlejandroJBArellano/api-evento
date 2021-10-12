const { Schema, model } = require("mongoose")

const QuestionSchema = new Schema({
    pregunta: String,
    respuesta_correcta: Boolean,
    respuesta_usuario: Boolean
}, {
    _id: false
})

const AnswersSchema = new Schema({
    tag_id: String,
    track: Number,
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
        region: String,
        zona: String,
        distrito: String,
        tienda: String,
        area: String,
        role: String
    },
    preguntas: [QuestionSchema],
    correctas: Number,
    incorrectas: Number,
    calificacion: Number,
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    versionKey: false
});

module.exports = model("Answers", AnswersSchema)