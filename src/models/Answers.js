const { Schema, model } = require("mongoose")

const QuestionSchema = new Schema({
    pregunta: String,
    respuesta_correcta: Boolean,
    respuesta_usuario: Boolean
}, {
    _id: false
})

const AnswersSchema = new Schema({
    track: Number,
    user_id: {
        type: Schema.Types.ObjectId, 
        ref: 'User'
    },
    preguntas: [QuestionSchema],
    correctas: Number,
    incorrectas: Number,
    calificacion: Number
}, {
    versionKey: false
});

module.exports = model("Answers", AnswersSchema)