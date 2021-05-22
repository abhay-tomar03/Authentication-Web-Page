    //jshint esversion:6
    

    const express = require('express');
    const bodyParser = require('body-parser');
    const ejs = require('ejs');
    const mongoose = require('mongoose');

    //---Requiring mongoose encyption-----------------
    

    const app = express();

    app.set('view engine','ejs');
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(express.static('piblic'));

    // Level-1 Security is just checking the email and password of the user for this we have to create mongoose database-------------

    mongoose.connect('mongodb://localhost:27017/userDB',({useNewUrlParser:true,useUnifiedTopology:true}));

    const userSchema = new mongoose.Schema({
        email: String,
        password:String
    });

  

   

    const User = new mongoose.model('User',userSchema);




    app.route('/')
    .get((req,res) => {
        res.render('home');

    });

    app.route('/register')
    .get((req,res) =>{
        res.render('register');
    })

    .post((req,res) => {

        const newUser = new User({
            email:req.body.username,
            password:req.body.password
        });

        newUser.save(err => {
            if(!err) {
                res.render('secrets')
            } else {
                console.log(err);
            }
        })
    })

    app.route('/login')
    .get((req,res) => {
        res.render('login');

    })

    .post((req,res) => {

        const username = req.body.username;
        const password = req.body.password;

        User.findOne({email:username},(err,foundUser) => {
            if(err) {
                console.log(err);
            } else {
                if (foundUser) {
                    if (foundUser.password === password) {
                        res.render('secrets')
                    }
                }
            }
        });
    });


    
    app.listen(3000,(req,res) => {
        console.log("Server is running at port 3000");
    });