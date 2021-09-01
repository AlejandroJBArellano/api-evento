const { Schema, model } = require("mongoose");

const QuestionSchema = new Schema({
    pregunta: String,
    respuesta_correcta: Boolean
}, {
    _id: false
})

const QuestionnaireSchema = new Schema({
    track: Number,
    preguntas: [QuestionSchema]
}, {
    versionKey: false
})

module.exports = model("Questionnaire", QuestionnaireSchema)