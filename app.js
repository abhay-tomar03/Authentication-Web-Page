            //jshint esversion:6
            require('dotenv').config()
            

            const express = require('express');
            const bodyParser = require('body-parser');
            const ejs = require('ejs');
            const mongoose = require('mongoose');
            const session = require('express-session');
            const passport = require('passport');

            const passportLocalMongoose = require('passport-local-mongoose');

            const GoogleStrategy = require('passport-google-oauth20').Strategy;

            const findOrCreate = require('mongoose-findorcreate')

            const app = express();

            app.set('view engine','ejs');
            app.use(bodyParser.urlencoded({extended:true}));
            app.use(express.static('public'));

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
                password:String,
                googleId:String,
                secret:String
            });

            userSchema.plugin(passportLocalMongoose);
            userSchema.plugin(findOrCreate)

            
            const User = new mongoose.model('User',userSchema);
            passport.use(User.createStrategy());


        

            passport.serializeUser(function(user, done) {
                done(null, user);
            });
            
            passport.deserializeUser(function(user, done) {
                done(null, user);
            });


            passport.use(new GoogleStrategy({
                clientID: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                callbackURL: "http://localhost:3000/auth/google/secrets",
                userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"

            },

            function(accessToken, refreshToken, profile, cb) {
                console.log(profile);
                User.findOrCreate({ googleId: profile.id }, function (err, user) {
                return cb(err, user);
                });
            }
            ));





//--------------authenticative with google --------------------------


            app.get('/auth/google',
            passport.authenticate('google', { scope: ['profile'] })
            
            );

            app.get('/auth/google/secrets', 
               passport.authenticate('google', { failureRedirect: '/login' }),


               function(req, res) {
            //   Successful authentication, redirect secrets.

            res.redirect('/secrets');
        });

//-------------home route------------------------------------------



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
                User.find({"secret":{$ne:null}},(err,foundUser) => {
                    if(err){
                        console.log(err);

                    } else {
                        if(foundUser) {
                            res.render('secrets',{userWithSecrets:foundUser})
                        }
                    }
                })
            });


    //-----------------Submit route--------------------------------------

    app.route('/submit')
    .get((req,res) => {
        if (req.isAuthenticated()) {
            res.render('submit')
        } else {
            res.redirect('/login')
        }
    })

    .post((req,res) => {

        const submittedSecret = req.body.secrets;

        console.log(req.user._id);

        User.findById(req.user._id,(err,foundUser) => {

            if(err) {
                console.log(err);
            } else {
                if(foundUser) {
                    foundUser.secret = submittedSecret;
                    foundUser.save(() => {
                        res.redirect('/secrets')
                    })
                };
            };
        });
    
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