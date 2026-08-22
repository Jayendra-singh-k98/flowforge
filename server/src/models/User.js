const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name : {type: String, required: true, trim: true, minlength: 2, maxlength: 50},
    email : {type: String, required: true, trim: true, unique: true, lowercase: true},
    passwordHash : {type: String, default: null},
    googleId : {type: String, default: null, unique: true, sparse: true},
    avatar : {type: String, default: null},
    authProvider : {type: String, enum: ['local', 'google'], default: 'local'},
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('User', userSchema); 