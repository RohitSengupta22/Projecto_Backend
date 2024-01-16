const jwt = require('jsonwebtoken');
require('dotenv').config();
const secret = process.env.SECRET;

const fetchUser = async (req,res,next) =>{

    const token = req.header('auth-token')
    if(!token){
        res.status(401).send("authentication failed")
    }

    try{

        const data = jwt.verify(token,secret)
        req.id = data.id
        next();

    }catch(error){
        console.log(error)
    }

}

module.exports = fetchUser;