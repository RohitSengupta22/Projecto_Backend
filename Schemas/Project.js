const mongoose = require('mongoose');
const { Schema } = mongoose;


const dataSchecma = new Schema({
    Project: String,
    Priority: {
        type: String,
        default: "Medium"
    },
    StoryId: String,
    Title: String,
    Description: String,
    Developer: String,
    Classification: String,
    Status: {
        type: String,
        default: "Not Started"
    },
    Date: String,
    Deadline: String

})

const accessSchema = new Schema({
    Email: String,
    Name: String
});

const projectSchema = new Schema({

    Admin : {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },

    Name : {
        type: String,
        required: true,
        
    },

    Description : {
        type: String
    },

    ProjectID : {
        type: String
    },

    Data : [dataSchecma],

    AccessedBy : [accessSchema],

    Date: String
    
  
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;