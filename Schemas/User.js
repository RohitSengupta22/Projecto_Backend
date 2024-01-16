const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    Email : {
        type: String,
        required: true,
        unique: true
    },

    Name: {
        type: String,
        required: true
    },

    Password: {
        type: String,
        required: true
    },

    CreatedProjects : [{   //Created Projects
        type: Schema.Types.ObjectId,
        ref: 'Project'
    }],

    RoProjects: [{   //Read Only Projects
        type: Schema.Types.ObjectId,
        ref: 'Project'
    }]
  
});

const User = mongoose.model('User', userSchema);
module.exports = User;