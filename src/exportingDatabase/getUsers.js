const mysql = require("mysql2"),
User = require("../models/User"),
keys = require("./keys");

try {
    const connection = mysql.createConnection(keys);
    
    const getUsers = `SELECT \`registration\`.\`registered_by_user_id\`,
    \`registration\`.\`email\`,
    \`registration\`.\`first_name\`,
    \`registration\`.\`identification_img_url\`,
    \`registration\`.\`identification_img_file_name\`,
    \`registration\`.\`last_name\`,
    \`registration\`.\`mobile_number\`,
    \`registration\`.\`badge\`,
    \`registration\`.\`adminuser\`,
    \`registration\`.\`adminpassword\`,
    \`registration\`.\`adminsub\`,
    \`registration\`.\`arrivaldate\`,
    \`registration\`.\`accessdate\`,
    \`registration\`.\`limitdate\`,
    \`registration\`.\`user_role\`,
    \`registration\`.\`organization_role_region\`,
    \`registration\`.\`organization_role_zona\`,
    \`registration\`.\`organization_role_distrito\`,
    \`registration\`.\`organization_role_tienda\`,
    \`registration\`.\`organization_role_area\`,
    \`registration\`.\`organization_role_role\`
    FROM \`registration_db\`.\`registration\` WHERE id >= 12306;`
    
    connection.query(getUsers, (err, results, fields) => {
        if(err) {
            connection.end();
            console.log(err);
            return;
        }
        results.forEach(e => {
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
        })
        User.insertMany(results).then(arr => {
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
