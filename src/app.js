const { Router } = require("express"),
app = Router();

// Models
const User = require("./models/User"),
Store = require("./models/Store"),
UserTagId = require("./models/UserTagId"),
EntranceControl = require("./models/EntranceControl"),
Questionnaire = require("./models/Questionnaire"),
Admonition = require("./models/Admonition"),
Answers = require("./models/Answers");

// Messages
const message = "Success";

app.get("/new-user", (req, res) => {
    const hola = "Hola mundo"
    res.json(hola)
})

// Second sprint: post new User
app.post("/new-user", async (req, res) => {
    try {        
        const newUser = new User(req.body)
        await newUser.validate()
        await newUser.save()
        res.json({message: "success", ...newUser._doc})
    } catch (error) {
        console.log(error);
        res.json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})

// Second sprint: find users by store and first letters of the last name

app.get("/tienda", async (req, res) => {
    try {
        const users = await User.find({
            "organization_role.tienda": req.query.tienda
        })
        console.log(req.query);
        const response = []
        if(req.query.users){
            users.forEach((e) => {
                if(e.first_name.toLowerCase().startsWith(req.query.users) || 
                e.last_name.toLowerCase().startsWith(req.query.users)) {
                    response.push(e)
                }
            })
            res.json(response)
        } {
            res.json(users)
        }
    } catch (error) {
        console.log(error);
        res.json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})


// Second sprint: find users by store and first letters of the last name

app.get("/region", async (req, res) => {
    try {       
        const users = await User.find({
            "organization_role.region": req.query.region
        })
        const response = []
        if(req.query.users){
            users.forEach((e) => {
                if(e.first_name.toLowerCase().startsWith(req.query.users) || 
                e.last_name.toLowerCase().startsWith(req.query.users)) {
                    response.push(e)
                }
            })
            res.json(response)
        } else {
            res.json(users)
        }
    } catch (error) {
        console.log(error);
        res.json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})

// Second sprint: find user by id
app.get("/user/:id", async (req, res) => {
    const {id} = req.params
    const user = await User.findById(id)
    res.json(user)
})


// Third sprint: store registration
app.post("/new-store", async (req, res) => {
    try {        
        const newStore = new Store(req.body);
        await newStore.validate()
        await newStore.save()
        res.json({message: "New Store created successfully."})
    } catch (error) {
        console.log(error);
        res.json({message: "Ocurrió un error."})
    }
})

// Third sprint: get all stores and get stores by its zone, region or distrit
app.get("/stores", async (req, res) => {
    if(Object.keys(req.query).length === 0) {
        const stores = await Store.find()
        res.json(stores)
        return;
    } else {
        const { region, zona, distrito } = req.query
        const query = {}
        if(zona){
            query.zona = zona
        }
        if(distrito){
            query.distrito = distrito
        }
        if(region){
            query.region = region
        }
        const stores = await Store.find(query)
        res.json(stores)
        return;
    }
})


// Fourth sprint: embed user and tag-id
app.post("/tag_id-user", async (req, res) => {
    const theUser = User.findById(req.body.id)
        .then(async (respuesta) => {
            var target = {};
            for (var i in respuesta._doc) {
              if (["_id"].indexOf(i) >= 0) continue;
              if (!Object.prototype.hasOwnProperty.call(respuesta._doc, i)) continue;
              target[i] = respuesta._doc[i];
            }
            const newUserTagId = new UserTagId({
                tag_id: req.body.tag_id,
                ...target
            })
            await newUserTagId.save()
            res.json(newUserTagId)
        })
})


// Fourth sprint: get a user by giving it a tag_id
app.get("/tag_id-user", async (req, res) => {
    const user = await UserTagId.findOne({
        tag_id: req.query.tag_id
    })
    res.json(user)
    return;
})


// Fifth sprint: create the entrance and get out
app.post("/new-entrance", (req, res) => {
    const user = UserTagId.findOne({
        tag_id: req.body.tag_id
    }).then(async (response) => {
        var target = {};
        for (var i in response._doc) {
          if (["_id"].indexOf(i) >= 0) continue;
          if (!Object.prototype.hasOwnProperty.call(response._doc, i)) continue;
          target[i] = response._doc[i];
        }
        const newEntrance = new EntranceControl({
            ...target,
            id_lectora: req.body.id_lectora,
            event_type: req.body.event_type
        })
        await newEntrance.save()
        res.json(newEntrance)
    })
})

// Sixth sprint: get array of questionnaries
app.get("/questionnaries", async (req, res) => {
    if (req.query) {        
        const questionnaires = await Questionnaire.find(req.query);
        res.json(questionnaires)
        return;
    } const questionnaires = Questionnaire.find(req.query);
    res.json(questionnaires)
    return;
})

// Sixth sprint: post questionnarie
app.post("/questionnarie",async (req, res) => {
    const newQuestionnarie = new Questionnaire(req.body);
    await newQuestionnarie.save()
    res.json(newQuestionnarie)
    return;
})

// Seventh sprint: post many admonitions
app.post("/admonitions", async (req, res) => {
    const funcion = req.body.map(async e => {
        const user = await UserTagId.findOne({tag_id: e.tag_id})
        var target = {};
        for (var i in user._doc) {
          if (["_id"].indexOf(i) >= 0) continue;
          if (!Object.prototype.hasOwnProperty.call(user._doc, i)) continue;
          target[i] = user._doc[i];
        }
        target.points = e.points
        target.id_lectora = e.id_lectora
        return target;
    })
    Promise.all(funcion).then(results => {
        Admonition.insertMany(results)
            .then(arr => res.json(arr))
        return;
    }).catch(e => console.log(e))
})

// Eighth sprint: post the answers
app.post("/answers", async (req, res) => {
    const user = await UserTagId.findOne({
        tag_id: req.body.tag_id
    })
    const target = {}
    for (var i in user._doc) {
        if (["_id"].indexOf(i) >= 0) continue;
        if (!Object.prototype.hasOwnProperty.call(user._doc, i)) continue;
        target[i] = user._doc[i];
    }
    const newAnswer = new Answers({
        track: req.body.track,
        ...target,
        preguntas: req.body.preguntas
    });
    newAnswer.correctas = 0;
    newAnswer.incorrectas = 0;
    const { preguntas } = req.body;
    preguntas.forEach(e => {
        if(e.respuesta_usuario === e.respuesta_correcta) {
            newAnswer.correctas += 1
        } else {
            newAnswer.incorrectas += 1
        }
    })
    const calificacion = newAnswer.correctas / preguntas.length 
    newAnswer.calificacion = (calificacion * 100)
    newAnswer.save().then((respuesta) => res.json(respuesta))
    return;
})

module.exports = app;