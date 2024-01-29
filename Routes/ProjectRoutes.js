require('dotenv').config();
const express = require('express');
const User = require('../Schemas/User.js');
const Project = require('../Schemas/Project.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const nodemailer = require('nodemailer');
const shortid = require('shortid');
const fetchUser = require('../Middleware/FetchUser.js');

router.post('/createproject', fetchUser, async (req, res) => { //create a project
    try {
        const { Name, Description } = req.body;
        const userId = req.id;
        const id = shortid.generate(2);
        const createdDate = new Date();
        const updDate = createdDate.toLocaleDateString();
        const project = new Project({
            Admin: userId,
            Name,
            Description,
            ProjectID: `PRJ-${id}`,
            Date: updDate
        });

        const savedProject = await project.save();
        await User.findByIdAndUpdate(userId, { $push: { CreatedProjects: savedProject._id } }, { new: true });
        res.status(200).json({ savedProject });
    } catch (e) {
        // Handle the error appropriately
        res.status(500).json({ error: e.message });
    }
});

router.get('/projects', fetchUser, async (req, res) => { // fetch projects created by the user
    try {
        const userId = req.id;
        const projectsCreatedByTheUser = await Project.find({ Admin: userId });
        res.status(200).json({ projectsCreatedByTheUser });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/project/:id', async (req, res) => { // fetch a project details using its projectId
    try {

        const projectId = req.params.id;
        const project = await Project.findById(projectId)
        res.status(200).json({ project })

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
})

router.post('/addUser/:projectId', fetchUser, async (req, res) => { //Add contributor to a project
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);
    const loggedInUser = req.id;
    const user = await User.findById(loggedInUser)
    const userEmail = user.Email;
    const { Email } = req.body;
    const contributor = await User.findOne({ Email })
    const contributorName = contributor ? contributor.Name : null;

    if (!contributor) {
        res.status(200).send("No such user found in the Projecto App")
    }


    if (userEmail !== Email && contributor.RoProjects.includes(projectId) === false) {

        try {


            const user = await User.findOne({ Email });


            if (!user) {
                res.status(200).send("No such user found within project");
            } else {
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    port: 465,
                    secure: true,
                    debug: true, // for debugging purposes
                    auth: {
                        user: 'chints.rsg@gmail.com',
                        pass: 'xlvn gmlw mgry txiu' // replace with your app password
                    }
                });

                var mailOptions = {
                    from: '"Contact Support Projecto" <chints.rsg@gmail.com>',
                    to: Email,
                    subject: 'Added To New Project',
                    text: `Dear ${user.Name},
                We are excited to inform you that you have been added to a new project ${project.Name}. The project description is: ${project.Description}.
                
                Your participation and contribution to this project will be highly valued. We believe your expertise and skills will greatly benefit the team.
                
                Kindly, login to your Projecto App to see the project details.
                
                Thank you for your cooperation.
                
                Best Regards,
                Projecto Support`
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.error(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });

                const contributorObj = {
                    Email: Email,
                    Name: contributorName
                }

                await User.findByIdAndUpdate(user._id, { $push: { RoProjects: projectId } }, { new: true })
                await Project.findByIdAndUpdate(projectId, { $push: { AccessedBy: contributorObj } }, { new: true })
            }

            res.status(200).send("Contributor Added To The Project")
        } catch (e) {
            // Handle the error appropriately
            console.error(e);
            res.status(500).json({ error: e.message });
        }

    } else {
        res.status(200).send("This Contributor is already added to this project")
    }


});



router.get('/stories/:projectId', fetchUser, async (req, res) => { //fetch stories for a project
    const projectId = req.params.projectId;
    const projects = await Project.findById(projectId)
    const stories = projects.Data
    res.status(200).json({ stories })

})

router.post('/removeUser/:projectId', fetchUser, async (req, res) => { //remove contributor from a project
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);
    const loggedInUser = req.id;
    const { Email } = req.body;
    const contributor = await User.find({ Email })
    const contributorName = contributor.Name

    if (!project.Data.some((story) => story.Developer == Email)) {

        try {


            const user = await User.findOne({ Email });


            if (!user) {
                res.status(200).send("No such user found within project");
            } else {
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    port: 465,
                    secure: true,
                    debug: true, // for debugging purposes
                    auth: {
                        user: 'chints.rsg@gmail.com',
                        pass: 'xlvn gmlw mgry txiu' // replace with your app password
                    }
                });

                var mailOptions = {
                    from: '"Contact Support Projecto" <chints.rsg@gmail.com>',
                    to: Email,
                    subject: 'Removed from the Project',
                    text: `Dear ${user.Name},
          You have been removed from the " ${project.Name}". 
          
          Regards,
          Projecto Support`
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.error(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });


                await User.findByIdAndUpdate(user._id, { $pull: { RoProjects: projectId } }, { new: true })
                await Project.findByIdAndUpdate(projectId, { $pull: { AccessedBy: { Email: Email } } }, { new: true });
            }

            res.status(200).send("Contributor removed from the project")
        } catch (e) {
            // Handle the error appropriately
            console.error(e);
            res.status(500).json({ error: e.message });
        }

    } else {
        res.status(200).send("You cannot remove this contributor as he/she is already assigned to a story")
    }


});

router.get('/addedprojects', fetchUser, async (req, res) => { // fetch projects where you have been added
    try {
        const userId = req.id;
        const user = await User.findById(userId);
        const addedProjectsIds = user.RoProjects;
        const addedProjects = await Project.find({ _id: { $in: addedProjectsIds } });

        if (addedProjects.length === 0) {
            res.status(200).send("You are not added to any project yet");
        } else {
            res.status(200).json({ addedProjects }); // Send the actual projects
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


router.patch('/projectdata/:projectId', fetchUser, async (req, res) => { // Create a story
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);
    const loggedInUser = req.id;
    const projectInitials = project.Name.substring(0, 2)

    if (loggedInUser == project.Admin) {
        try {

            const { Title, Description, Developer, Classification, Status, Deadline } = req.body;
            const newDate = new Date();
            const createdDate = newDate.toLocaleDateString();

            const newData = {
                Project: projectId,
                StoryId: `${projectInitials}-${project.Data.length + 1}`,
                Title,
                Description,
                Developer,
                Classification,
                Status,
                Date: createdDate,
                Deadline
            }

            project.Data.push(newData);

            await project.save()

            res.status(200).json({ newData })


        } catch (e) {

            console.error(e);
            res.status(500).json({ error: e.message });

        }
    } else {

        res.status(400).send("You are not the project admin, hence cannot add stories")

    }
})

router.patch('/project/:projectId', fetchUser, async (req, res) => { //edit project details
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);
    const loggedInUser = req.id;

    if (loggedInUser == project.Admin) {
        try {

            const { Name, Description } = req.body;

            if (Name) {
                project.Name = Name
            }

            if (Description) {
                project.Description = Description
            }
            await project.save()

            res.status(200).json({ project })

        } catch (e) {

            res.status(500).json({ error: e.message });
        }
    } else {
        res.status(400).send("You are not the project admin, hence cannot edit project details")
    }


})

router.delete('/project/:projectId', fetchUser, async (req, res) => { //delete project 
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);
    const loggedInUser = req.id;

    if (loggedInUser == project.Admin) {
        try {

            const savedProjects = await Project.findByIdAndDelete(projectId)
            await User.findByIdAndUpdate(loggedInUser, { $pull: { CreatedProjects: projectId } }, { new: true })
            await User.updateMany(
                { RoProjects: projectId },
                { $pull: { RoProjects: projectId } },
                { new: true }
            );
            res.status(200).json({ savedProjects })


        } catch (e) {

            res.status(500).json({ error: e.message });


        }
    } else {
        res.status(400).send("You are not the project admin, hence cannot delete project")
    }


})

router.patch('/project/:projectId/:storyId', fetchUser, async (req, res) => { //edit project story
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);



    try {

        const storyId = req.params.storyId
        const index = project.Data.findIndex((story) => story._id == storyId)
        const { Title, Description, Developer, Classification, Status, Priority } = req.body;


        project.Data[index].Title = Title || project.Data[index].Title;
        project.Data[index].Description = Description || project.Data[index].Description;
        project.Data[index].Developer = Developer || project.Data[index].Developer;
        project.Data[index].Classification = Classification || project.Data[index].Classification;
        project.Data[index].Status = Status || project.Data[index].Status;
        project.Data[index].Priority = Priority || project.Data[index].Priority;
        const story = project.Data[index]


        await project.save()

        res.status(200).json({ story })

    } catch (e) {

        res.status(500).json({ error: e.message });
    }



})

router.delete('/project/:projectId/:storyId', fetchUser, async (req, res) => { //delete project story
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);
    const loggedInUser = req.id;

    if (loggedInUser == project.Admin) {
        try {

            const storyId = req.params.storyId


            const updatedProject = await Project.findByIdAndUpdate(
                projectId,
                { $pull: { Data: { _id: storyId } } },
                { new: true }
            );

            await updatedProject.save();



            res.status(200).json({ updatedProject })

        } catch (e) {

            res.status(500).json({ error: e.message });
        }
    } else {
        res.status(400).send("You are not the project admin, hence cannot delete a story")
    }


})

router.get('/story/:projectId/:storyId', async (req, res) => { // fetch a story using its ID
    try {
        const projectId = req.params.projectId;
        const storyId = req.params.storyId;
        const projects = await Project.findById(projectId);

        for (let story of projects.Data) {
            if (story._id == storyId) {
                res.status(200).json({ story });
                return; // exit the loop once the story is found
            }
        }

        // If the loop completes without finding the story
        res.status(404).json({ error: "Story not found" });
    } catch (e) {
        console.log(e.message);
        res.status(500).json({ error: e.message });
    }
});

router.post('/comment/:projectId/:storyId', fetchUser, async (req, res) => { //create a comment in a story
    try {

        const userId = req.id;
        const user = await User.findById(userId)
        const username = user.Email
        const projectId = req.params.projectId;
        const project = await Project.findById(projectId);
        const storyId = req.params.storyId;
        const { comment } = req.body;
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }
        
        const story = project.Data.find((story) => {
            if (story._id == storyId) {
                return story;
            }
        });
        
        // Check if the story exists
        if (!story) {
            return res.status(404).json({ error: "Story not found" });
        }

        const currentDateTime = new Date();
        const year = currentDateTime.getFullYear();
        const month = currentDateTime.getMonth() + 1; // Note: Month is zero-based, so we add 1
        const day = currentDateTime.getDate();
        const hours = currentDateTime.getHours();
        const minutes = currentDateTime.getMinutes();
        const seconds = currentDateTime.getSeconds();

      


        story.Comments.push({
            user: username,
            commentText: comment,
            DateTime: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`

        })

        await project.save()
        res.status(200).json({story})



    } catch (e) {
        console.log(e.message);
        res.status(500).json({ error: e.message });
    }
})

router.delete('/comment/:projectId/:storyId/:commentId', fetchUser, async (req, res) => {
    try {
        const userId = req.id;
        const projectId = req.params.projectId;
        const storyId = req.params.storyId;
        const commentId = req.params.commentId;

        // Find the project using the provided projectId
        const project = await Project.findById(projectId);

        // Check if the project exists
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        // Find the story within the project
        const story = project.Data.find((story) => story._id == storyId);

        // Check if the story exists
        if (!story) {
            return res.status(404).json({ error: "Story not found" });
        }

        // Filter out the comment based on commentId
        story.Comments = story.Comments.filter((comment) => comment._id != commentId);

        // Save the updated project
        await project.save();

        // Respond with the updated story
        res.status(200).json({ story });
    } catch (e) {
        console.log(e.message);
        res.status(500).json({ error: e.message });
    }
});


router.get('/admin/:projectId', async (req, res) => {
    try {
        // Extract projectId from the request parameters
        const projectId = req.params.projectId;

        // Find the project using the provided projectId and populate the 'Admin' field
        const project = await Project.findById(projectId).populate('Admin');

        // Check if the project exists
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        // Extract admin details from the populated 'Admin' field
        const admin = project.Admin;

        // Check if admin details are available
        if (!admin) {
            return res.status(404).json({ error: "Admin not found for the project" });
        }

        // Return the admin details
        res.status(200).json({ project });
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: e.message });
    }
});

router.get('/created/:userId', async (req, res) => {
    try {
        // Extract userId from the request parameters
        const userId = req.params.userId;

        // Find the user using the provided userId and populate the 'CreatedProjects' field
        const user = await User.findById(userId).populate('CreatedProjects');

        // Check if the user exists
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Extract created projects details from the populated 'CreatedProjects' field
        const createdProjects = user.CreatedProjects;

        // Return the created projects details
        res.status(200).json({ createdProjects });
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: e.message });
    }
});

router.get('/roprojects', fetchUser, async (req, res) => { // fetch Read only projects
    try {
        // Extract userId from the request parameters
        const userId = req.id;

        // Find the user using the provided userId and populate the 'CreatedProjects' field
        const user = await User.findById(userId).populate('RoProjects');

        // Check if the user exists
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Extract created projects details from the populated 'CreatedProjects' field


        // Return the created projects details
        res.status(200).json({ user });
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: e.message });
    }
});





module.exports = router;
