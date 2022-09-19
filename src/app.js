const { Router } = require("express"),
app = Router();

const getExhibitors = require("./exportingDatabase/getExhibitors");
const getStores = require("./exportingDatabase/getStores");
const getUsers = require("./exportingDatabase/getUsers");
const ConfigEntrance = require("./models/ConfigEntrance");
const ConfigTags = require("./models/ConfigTags");
const Impresora = require("./models/Impresora");
const Lectora = require("./models/Lectora");
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

app.get("/config-tags", async (req, res) => {
    const config = await ConfigTags.find();
    res.json(config)
})

app.get("/new-user", (req, res) => {
    const hola = "Hola mundo"
    res.json(hola)
})

// Second sprint: post new User
app.post("/new-user", async (req, res) => {
    try {        
        console.log("New User: req.body",req.body)
        const newUser = new User(req.body)
        await newUser.validate()
        await newUser.save()
        res.json({message: "success", ...newUser._doc})
    } catch (error) {
        console.log(error);
        res.status(500).json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})

// Second sprint: find users by store and first letters of the last name

app.get("/region", async (req, res) => {
    try {
        const users = await User.find({
            "organization_role.region": req.query.region
        })
        console.log(req.query)
        const response = []
        try {
            if(req.query.users){
                users.forEach((e) => {
                    if(e.first_name.toLowerCase().startsWith(req.query.users) || 
                    e.last_name.toLowerCase().startsWith(req.query.users)) {
                        response.push(e)
                    }
                })
                res.json(response)
                return
            } else {
                res.json(users)
                return
            }
        } catch (error) {
            res.json(error)
            return
        }
    } catch (error) {
        console.log(error);
        res.json.status(500)({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})


app.get("/users", async (req, res) => {
    try {
        let query = {}
        if(req.query.user_id && req.query.user_id.length>0){
            query["_id"] = req.query.user_id
            console.log(query, query)
        }
        if(req.query.zona && req.query.zona.length>0){
            query["organization_role.zona"] = req.query.zona
            console.log('query',query)
        }
        if(req.query.distrito && req.query.distrito.length>0){
            query["organization_role.distrito"] = req.query.distrito
            console.log('query',query)
        }
        if(req.query.tienda && req.query.tienda.length>0){
            query["organization_role.pais"] = req.query.tienda
            console.log('query',query)
        }
        if(req.query.region && req.query.region.length>0){
            var regexp = new RegExp( req.query.region,'i');
            query["organization_role.region"] = regexp
            console.log('query at region',query)
        }
        if(req.query.first_name && req.query.first_name.length>0){
            var regexp = new RegExp(req.query.first_name,'i');
            query["first_name"] = regexp
            console.log('query',query)
        }
        if(req.query.last_name && req.query.last_name.length>0){
            var regexp = new RegExp( req.query.last_name,'i');
            query["last_name"] = regexp
            console.log('query',query)
        }
        const users = await User.find(query)
        const tag_ids = await UserTagId.find({}, "tag_id user_id")
        // console.log(tag_ids)
        const usersWithTagId = users.map(user => {
            return {
                ...user._doc,
                countTagId: tag_ids.filter(userTagId => {
                    return userTagId.user_id == user._id
                }).length
            }
        })
        console.log("users With Tag ID",usersWithTagId)
        console.log('req.query',req.query)
        // console.log('users',users)

        res.json(usersWithTagId)
        return
    } catch (error) {
        console.log(error);
        res.status(500).json({mensaje: "Ocurrió un error. Vuelve a intentarlo", error})
    }
})

// Second sprint: find users by store and first letters of the last name

app.get("/empresa", async (req, res) => {
    try {   

        try {   
            const users = await User.find({
                "organization_role.empresa": req.query.empresa
            }).sort(
                [
                    ['organization_role.zona',1],
                    ['organization_role.distrito',1],
                    ['user_role.role',-1],
                    ['organization_role.region',1],
                    ['organization_role.teinda',1]
                ]
            )

            const response = []
            
            if(req.query.users){
                users.forEach((e) => {
                    if(e.first_name.toLowerCase().startsWith(req.query.users) || 
                    e.last_name.toLowerCase().startsWith(req.query.users)) {
                        response.push(e)
                    }
                })
                res.json(response)
                return;
            } else {
                res.json(users)
                return;
            }
        } catch (error) {
            res.json(error)
            return;
        }   

    } catch (error) {
        console.log(error);
        res.status(500).json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})

// Second sprint: find user by id
app.get("/user/:id", async (req, res) => {
    try {
        
        const {id} = req.params
        const user = await User.findById(id)

        if(!user) {
            res.json({})
            return;
        }

        res.json(user)
        return;

    } catch (error) {
        console.log(error);
        res.status(500).json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})

app.put('/user/:id', async (req, res) => {
    try {        
        User.findByIdAndUpdate(req.params.id, req.body, {returnDocument: 'after'})
            .then(e => res.json(e).status(200))
            .catch(err => res.json(err).status(500))
    } catch (error) {
        res.json(error).status(500)
    }
})

// Third sprint: store registration
app.post("/new-store", async (req, res) => {
    try {        
        const newStore = new Store(req.body);
        await newStore.validate()
        await newStore.save()
        res.json({message: "Nueva tienda creada satisfactoriamente", ...newStore._doc})
    } catch (error) {
        res.json({message: "Ocurrió un error.", error})
    }
})

// Third sprint: get all stores and get stores by its zone, region or distrit
app.get("/stores", async (req, res) => {
    try {        
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
    } catch (error) {
        res.json(error)
        return;
    }
})

app.get("/tag_id-users/all", async (req, res) => {
    try {        
        if(Object.keys(req.query).length === 0) {

            const users = await UserTagId.find()
            res.json(users)
            return;

        } else {

            const { region, zona, distrito, tienda } = req.query
            let query = {}

            if(zona){
                query['organization_role.zona'] = zona
            }
            if(distrito){
                query['organization_role.distrito'] = distrito
            }
            if(region){
                query['organization_role.region'] = region
            }
            if(tienda){
                query['organization_role.tienda'] = tienda
            }

            const users = await UserTagId.find(query)
            console.log(users)
            res.json(users)
            return;

        }
    } catch (error) {
        res.json(error)
        return;
    }
})

// Fourth sprint: embed user and tag-id
app.post("/tag_id-user", async (req, res) => {
    const theUser = User.findById(req.body.id)
        .then(async (respuesta) => {
            if(respuesta){
                var target = {};
                //TODO: not user found
                for (var i in respuesta._doc) {
                    if (["_id"].indexOf(i) >= 0) continue;
                    if (!Object.prototype.hasOwnProperty.call(respuesta._doc, i)) continue;
                    target[i] = respuesta._doc[i];
                }
                const newUserTagId = new UserTagId({
                    tag_id: req.body.tag_id,
                    user_id:respuesta._id,
                    ...target
                })
                try{
                    await newUserTagId.save()
                    res.json(newUserTagId)
                }catch(err){
                    res.status(500).json({error:err});
                }
            } else {
                const respuesta = {
                    tag_id: req.body.tag_id,
                    registered_by_user_id: 0,
                    user_id: "_desconocido",
                    first_name: "_desconocido",
                    last_name: "_desconocido",
                    email: "",
                    identification_img_url: "",
                    identification_img_file_name: "",
                    mobile_number: "",
                    badge: "",
                    adminuser: "",
                    adminpassword: "",
                    adminsub: "",
                    arrivaldate: "",
                    accessdate: "",
                    limitdate: "",
                    user_role: {
                        role: "_desconocido"
                    },
                    organization_role: {
                        region: "_desconocido",
                        zona: "_desconocido",
                        distrito: "_desconocido",
                        tienda: "_desconocido"
                    }
                }
                try {
                    const newUserTagId = new UserTagId(respuesta);
                    await newUserTagId.save()
                    res.json(newUserTagId)
                    return;
                } catch (error) {
                    res.status(500).json(error)
                    return;
                }
            }
            
        })
})

app.put('/tag_id-user/:id', async (req, res) => {
    try {        
        UserTagId.findByIdAndUpdate(req.params.id, req.body, {returnDocument: 'after'})
            .then(e => res.json(e).status(200))
            .catch(err => res.json(err).status(500));
    } catch (error) {
        res.json(error).status(500)
    }
})

// Fourth sprint: get a user by giving it a tag_id
app.get("/tag_id-user", async (req, res) => {
    try {
        const user = await UserTagId.findOne({
            tag_id: req.query.tag_id
        })
        if(!user){
            res.json({})
            return;
        }
        res.json(user)
        return;
    } catch (error) {
        res.json(error)
        return;
    }
})

app.get("/tag-ids-by-user-id", async (req, res) => {
    try {
        const users = await UserTagId.find({
            user_id: req.query.user_id
        })

        res.json(users)
        console.log(users)
        return;

    } catch (error) {
        res.json(error)
        return;
    }
})


// Fifth sprint: create the entrance and get out
app.post("/new-entrance", (req, res) => {
    try {        
        const user = UserTagId.findOne({
            tag_id: req.body.tag_id
        }).then(async (response) => {
            if(response){
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
            } else {
                const target = {
                    tag_id: req.body.tag_id,
                    registered_by_user_id: 0,
                    user_id: "_desconocido",
                    first_name: "_desconocido",
                    last_name: "_desconocido",
                    email: "",
                    identification_img_url: "",
                    identification_img_file_name: "",
                    mobile_number: "",
                    badge: "",
                    adminuser: "",
                    adminpassword: "",
                    adminsub: "",
                    arrivaldate: "",
                    accessdate: "",
                    limitdate: "",
                    user_role: {
                        role: "_desconocido"
                    },
                    organization_role: {
                        region: "_desconocido",
                        zona: "_desconocido",
                        distrito: "_desconocido",
                        tienda: "_desconocido",

                    },
                    id_lectora: req.body.id_lectora,
                    event_type: req.body.event_type
                }
                const newEntrance = new EntranceControl(target);
                await newEntrance.save()
                res.json(newEntrance)
            }
        })
    } catch (error) {
        res.json(error)
        return;
    }
})

// Sixth sprint: get array of questionnaries
app.get("/questionnaries", async (req, res) => {
    try {        
        if (Object.keys(req.query).length >= 1) {
            const questionnaires = await Questionnaire.find(req.query);
            res.json(questionnaires)
            return;
        } const questionnaires = await Questionnaire.find();
        res.json(questionnaires)
        return;
    } catch (error) {
        res.json(error)
        return;
    }
})

// Sixth sprint: post questionnarie
app.post("/questionnarie",async (req, res) => {
    try {        
        const newQuestionnarie = new Questionnaire(req.body);
        await newQuestionnarie.save()
        res.json(newQuestionnarie)
        return;
    } catch (error) {
        res.status(500).json(error)
        return
    }
})

// Seventh sprint: post many admonitions
app.post("/admonitions", async (req, res) => {
    try {
        const funcion = req.body.map(async e => {
            const user = await UserTagId.findOne({tag_id: e.tag_id})
            if(user){
                delete user._id
                let target = {}
                for (var i in user) {
                    if (["_id"].indexOf(i) >= 0) continue;
                    if (!Object.prototype.hasOwnProperty.call(user._doc, i)) continue;
                    target[i] = user[i];
                }
                target.points = e.points
                target.id_lectora = e.id_lectora
                return target
            } else {
                const target = new Admonition({
                    tag_id: e.tag_id,
                    registered_by_user_id: 0,
                    user_id: "_desconocido",
                    first_name: "_desconocido",
                    last_name: "_desconocido",
                    email: "",
                    identification_img_url: "",
                    identification_img_file_name: "",
                    mobile_number: "",
                    badge: "",
                    adminuser: "",
                    adminpassword: "",
                    adminsub: "",
                    arrivaldate: "",
                    accessdate: "",
                    limitdate: "",
                    user_role: {
                        role: "_desconocido"
                    },
                    organization_role: {
                        region: "_desconocido",
                        zona: "_desconocido",
                        distrito: "_desconocido",
                        tienda: "_desconocido",

                    },
                    id_lectora: e.id_lectora,
                    points: e.points
                })
                return target
            }
            // * SOLVED
            //TODO: not tag id found
        })
        Promise.all(funcion).then(results => {
            Admonition.insertMany(results)
                .then(arr => res.json(arr))
            return;
        }).catch(e => console.log(e))
    } catch (error) {
        res.json(error)
        return;
    }
})

// Eighth sprint: post the answers
app.post("/answers", (req, res) => {
    try {        
        const arrayDe = req.body.map( (object, index) => {
            UserTagId.findOne({
                tag_id: req.body[index].tag_id
            }).then(async respuesta => {
                if(respuesta){
                    // * SOLVED
                    //TODO: not tag id found
                    const user = respuesta._doc
                    delete user._id
                    const newAnswer = new Answers({
                        track: req.body[index].track,
                        ...user,
                        preguntas: req.body[index].preguntas
                    });
                    newAnswer.correctas = 0;
                    newAnswer.incorrectas = 0;
                    const { preguntas } = req.body[index];
                    preguntas.forEach(e => {
                        if(e.respuesta_usuario === e.respuesta_correcta) {
                            newAnswer.correctas += 1
                        } else {
                            newAnswer.incorrectas += 1
                        }
                    })
                    const calificacion = newAnswer.correctas / preguntas.length 
                    newAnswer.calificacion = (calificacion * 100)
                    await newAnswer.save();
                    return newAnswer
                } else {
                    const target = new Answers({
                        track: req.body[index].track,
                        preguntas: req.body[index].preguntas,
                        tag_id: req.body[index].tag_id,
                        registered_by_user_id: 0,
                        user_id: "_desconocido",
                        first_name: "_desconocido",
                        last_name: "_desconocido",
                        email: "",
                        identification_img_url: "",
                        identification_img_file_name: "",
                        mobile_number: "",
                        badge: "",
                        adminuser: "",
                        adminpassword: "",
                        adminsub: "",
                        arrivaldate: "",
                        accessdate: "",
                        limitdate: "",
                        user_role: {
                            role: "_desconocido"
                        },
                        organization_role: {
                            region: "_desconocido",
                            zona: "_desconocido",
                            distrito: "_desconocido",
                            tienda: "_desconocido",
    
                        },
                    })
                    const { preguntas } = req.body[index];
                    target.correctas = 0;
                    target.incorrectas = 0;
                    preguntas.forEach(e => {
                        if(e.respuesta_usuario === e.respuesta_correcta) {
                            target.correctas += 1
                        } else {
                            target.incorrectas += 1
                        }
                    })
                    const calificacion = target.correctas / preguntas.length 
                    target.calificacion = (calificacion * 100)
                    await target.save();
                    return target
                }
            })
            return object
        })
        res.json(arrayDe)
        return;
    } catch (error) {
        res.json(error)
        return;
    }
});

app.get('/how-many-got-in', async (req, res) => {
    const user_ids = await EntranceControl.find().distinct("user_id")
    const users = await User.find({
        _id: {$in: user_ids}
    })
    res.json(users).status(200)
})

app.delete("/user_tag-id", async (req, res) => {
    await UserTagId.findOneAndDelete({
        tag_id: req.query.tag_id
    })
    res.json({
        success: true
    }).status(200)
});

app.get("/top-admonitions", async (req, res) => {
    const admonitions = await Admonition.aggregate([
        {
            $group: {
                _id: "$tag_id",
                totalPoints: {$sum: "$points"}
            }
        }
    ]).sort("-totalPoints").limit(10)
    res.json(admonitions).status(200)
})

// TODO: match By Tag ID and return whole points
app.get("/admonition-by-tag", async (req, res) => {
    const admonition = await Admonition.aggregate([
        {
            $group: {
                _id: "$tag_id",
                totalPoints: {$sum: "$points"}
            }
        }
    ]).sort("-totalPoints")
    userWithAdmonitions = admonition.find((value)=>{
        return value._id === req.query.tag_id
    })
    res.json(userWithAdmonitions).status(200)
})

app.get("/regiones", async(req, res) => {
    const regiones = await User.distinct('organization_role.region');
    res.json(regiones);
})

app.get('/config-entrance', async (req, res) => {
    const entrances = await ConfigEntrance.find();
    res.json(entrances)
});

app.get('/config-registro-en-sitio', async (req, res) => {
    const lectoras = await Lectora.find();
    const impresoras = await Impresora.find();
    res.json({
        lectoras,
        impresoras
    })
})

app.get('/insert-exhibitors', async (req, res) => {
    getExhibitors()
    res.json({
        message: "Exhibitors inserted"
    }).status(200)
})

app.get('/insert-stores', async (req, res) => {
    getStores()
    res.json({
        message: "Stores inserted"
    }).status(200)
})

app.get('/insert-users', async (req, res) => {
    getUsers()
    res.json({
        message: "Users inserted"
    }).status(200)
})


module.exports = app;