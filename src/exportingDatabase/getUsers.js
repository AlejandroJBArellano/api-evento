const mysql = require("mysql2"),
{User} = require("../models/User"),
keys = require("./keys");

const getUsers = () => {
    try {
        const connection = mysql.createConnection(keys);
        
        const getUsers = `SELECT registration.*
        FROM registration WHERE id > 28935;`
        
        connection.query(getUsers, (err, results, fields) => {
            if(err) {
                connection.end();
                console.log(err);
                return;
            }
            const users = results.map(e => {
                e.user_role = {
                    role: e.user_role
                }
                e.organization_role = {
                    region: e.organization_role_region,
                    zona: e.organization_role_zona,
                    distrito: e.organization_role_distrito,
                    tienda: e.organization_role_tienda,
                    area: e.organization_role_area,
                    role: e.organization_role_role
                }
                delete e.organization_role_region
                delete e.organization_role_zona
                delete e.organization_role_distrito
                delete e.organization_role_tienda
                delete e.organization_role_area
                delete e.organization_role_role
                return e
            })
            User.insertMany(users).then(arr => {
                connection.end()
                console.log("All of the users have been downloaded successfully");
            }).catch(e => {
                connection.end()
                console.log(e);
            })
        })
        
    } catch (error) {
        console.log(error);
    }
}

module.exports = getUsers