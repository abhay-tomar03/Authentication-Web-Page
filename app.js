        //jshint esversion:6
        require('dotenv').config()
        

        const express = require('express');
        const bodyParser = require('body-parser');
        const ejs = require('ejs');
        const mongoose = require('mongoose');
        const session = require('express-session');
        const passport = require('passport');

        const passportLocalMongoose = require('passport-local-mongoose');

        const app = express();

        app.set('view engine','ejs');
        app.use(bodyParser.urlencoded({extended:true}));
        app.use(express.static('piblic'));

        app.use(session({
            secret:"My important Secret",
            resave:false,
            saveUninitialized:false
        }));

        app.use(passport.initialize());
        app.use(passport.session());



        mongoose.connect('mongodb://localhost:27017/userDB',({useNewUrlParser:true,useUnifiedTopology:true}));
        mongoose.set('useCreateIndex',true);

        const userSchema = new mongoose.Schema({
            email: String,
            password:String
        });

        userSchema.plugin(passportLocalMongoose);

        
        const User = new mongoose.model('User',userSchema);
        passport.use(User.createStrategy());


      

        passport.serializeUser(function(user, done) {
            done(null, user);
          });
          
          passport.deserializeUser(function(user, done) {
            done(null, user);
          });

        



        app.route('/')
        .get((req,res) => {
            res.render('home');

        });


      
//----register route----------------------------------------------------

        app.route('/register')
        .get((req,res) =>{
            res.render('register');
        })

        .post((req,res) => {
            User.register({username: req.body.username},req.body.password,(err,user) => {

                if(err) {
                    console.log(err);
                    res.redirect('/register')
                } else {

                    passport.authenticate('local')(req,res,function() {

                        res.redirect('/secrets')
                    })
                          
                }
            })
        });

//------------Secrets route---------------------------------------------



        app.route('/secrets')
        .get((req,res) => {
            if (req.isAuthenticated()) {
                res.render('secrets')
            } else {
                res.redirect('/login')
            }
        });

 //----------------Login route---------------------------------


        app.route('/login')
        .get((req,res) => {


            res.render('login');

        })

        .post((req,res) => {

            const user = new User({
                email:req.body.username,
                password:req.body.password
            });

            req.login(user,(err) => {
                if (err) {
                    console.log(err);
                    res.redirect('/register')
                } else {
                    passport.authenticate('local')(req,res,function() {

                        res.redirect('/secrets')
                    })
               

                }
            })          
        });

//-----logout route----------------------------------------------

       
        app.route('/logout')
        .get((req,res) => {
            req.logout();
            res.redirect('/');
        });

        app.listen(3000,(req,res) => {
            console.log("Server is running at port 3000");
        });