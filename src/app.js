const { Router } = require("express"),
app = Router();

// Models
const User = require("./models/User");

app.get("/new-user", (req, res) => {
    const hola = "Hola mundo"
    res.json(hola)
})

// Second print: post new User
app.post("/new-user", async (req, res) => {
    try {        
        const newUser = new User(req.body)
        await newUser.validate()
        await newUser.save()
        res.json({message: "success", ...newUser})
    } catch (error) {
        console.log(error);
        res.json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})

// Second print: find users by store and first letters of the last name
app.get("/tienda/:store", async(req,res) => {
    try {
        const {store} = req.params
        const users = await User.find({
            "organization_role.tienda": store
        })
        if(users.length === 0){
            res.json({mensaje: "No se encontró la tienda"})
            return;
        }
        res.json(users)
    } catch (error) {
        console.log(error);
        res.json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})

app.get("/tienda/:storeName?/user/:name?", async (req, res) => {
    try {        
        const { storeName, name } = req.params
        const founded = await User.find({
            "organization_role.tienda": storeName
        });
        if(founded.length === 0){
            res.json({mensaje: "No se encontró la tienda"})
            return;
        }
        let respuesta = [];
        founded.forEach(e => {
            if(e.first_name.toLowerCase().startsWith(name) || e.last_name.toLowerCase().startsWith(name)){
                respuesta.push(e)
            }
        })
        if(respuesta.length === 0) {
            res.json({mensaje: "No se encontró ningún usuario en esta tienda que coincida con la búsqueda."})
            return;
        }
        res.json(respuesta)
    } catch (error) {
        console.log(error);
        res.json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})


// Second print: find users by store and first letters of the last name
app.use("/region/:regionName?", async (req, res) => {
    try {        
        const users = await User.find({
            "organization_role.region": req.params.regionName
        })
        if(users.length === 0){
            res.json({mensaje: "No se encontró la región"})
            return;
        }
        res.json(users)
    } catch (error) {
        console.log(error);
        res.json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})

app.get("/region/:regionName?/user/:name?", async (req, res) => {
    try {        
        const { regionName, name } = req.params
        const founded = await User.find({
            "organization_role.region": regionName
        });
        if(founded.length === 0){
            res.json({mensaje: "No se encontró la región"})
            return;
        }
        let respuesta = [];
        founded.forEach(e => {
            if(e.first_name.toLowerCase().startsWith(name) || e.last_name.toLowerCase().startsWith(name)){
                respuesta.push(e)
            }
        })
        if(respuesta.length === 0) {
            res.json({mensaje: "No se encontró ningún usuario en esta tienda que coincida con la búsqueda."})
            return;
        }
        res.json(respuesta)
    } catch (error) {
        console.log(error);
        res.json({mensaje: "Ocurrió un error. Vuelve a intentarlo"})
    }
})

// Second print: find user by id
app.get("/user/:id", async (req, res) => {
    const {id} = req.params
    const user = await User.findById(id)
    res.json(user)
})

module.exports = app;