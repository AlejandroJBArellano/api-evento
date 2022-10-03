const { Schema, model } = require("mongoose");
const { UserSchema } = require("./User");

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
    preguntas: [QuestionSchema],
    correctas: Number,
    incorrectas: Number,
    calificacion: Number,
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    versionKey: false,
    timestamps: false,
    strict: false
}).add(UserSchema);

module.exports = model("Answers", AnswersSchema)