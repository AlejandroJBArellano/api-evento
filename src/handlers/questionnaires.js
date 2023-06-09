const Questionnaire = require("../models/Questionnaire");

const questionnairesMethods = {
    get: async (req, res) => {
        try {        
            const questionnaires = await Questionnaire.find(req.query);
            res.status(200).json(questionnaires)
            return;
        } catch (error) {
            res.json(error)
            return;
        }
    },
    create: async (req, res) => {
        try {        
            const newQuestionnaire = new Questionnaire(req.body);
            await newQuestionnaire.save()
            res.status(200).json(newQuestionnaire)
            return;
        } catch (error) {
            res.status(500).json(error)
            return
        }
    }
}

module.exports = questionnairesMethods;