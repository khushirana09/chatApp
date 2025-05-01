const mongoose = require("mongoose");

//define a schema for the user collection
const UserSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true // no duplicate usernames
    },
    password:{
        type: String,
        unique: true
    },
    email:{
        type: String,
        unique: true
    }
});

//export the modal to use in routes
module.exports = mongoose.model("User" , UserSchema);