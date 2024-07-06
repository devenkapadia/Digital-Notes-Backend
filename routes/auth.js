const express = require('express')
const User = require('../models/User')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const fetchuser = require('../middleware/fetchuser')
const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET

// Route 1:  user  using POST. No login required
router.post('/createUser', [
    body('name', 'Username must be atleast 3 character').isLength({ min: 3 }),
    body('email', 'Enter valid email').isEmail(),
    body('password', 'Password must be atleast 5 character ').isLength({ min: 5 }),
], async (req, res) => {
    let success = false
    const errors = validationResult(req);
    console.log("errors", errors);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }
    try {
        // Check weather the user exists or not
        let user = await User.findOne({ email: req.body.email })
        console.log("user", user);
        if (user) {
            return res.status(400).json({ "error": "Sorry a user already exists with this email" })
        } else {
            // Create User
            const salt = await bcrypt.genSalt(10);
            const secPass = await bcrypt.hash(req.body.password, salt)
            const userName = req.body.name
            user = User.create({
                name: userName,
                email: req.body.email,
                password: secPass
            })
            const data = {
                user: {
                    id: user.id
                }
            }
            success = true
            const authToken = jwt.sign(data, JWT_SECRET)
            console.log("user", userName);
            res.json({ success, authToken, userName })
        }
    } catch (error) {
        res.status(500).json({ success, "Internal Error": "Some internal error occured" })
        console.log(error.messege);
    }
})

// Route 2: Authinticate user :login
router.post('/login', [
    body('email', 'Enter valid email bro').isEmail(),
    body('password', 'Password cannot be blank').exists(),
], async (req, res) => {
    let success = false
    const errors = validationResult(req);
    console.log("errors", errors);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email })
        console.log("user", user);

        if (!user) {
            res.status(400).json({ success, "No user exists": "The email you have entered is not registered" })
        } else {
            const pwCompare = await bcrypt.compare(password, user.password)
            if (!pwCompare) {
                res.status(400).json({ success, error: "Please try to login with correct credentials" })
            } else {
                const userName = user.name
                const data = {
                    user: {
                        id: user.id
                    }
                }
                const authToken = jwt.sign(data, JWT_SECRET)
                success = true
                res.json({ success, authToken, userName })
            }
        }

    } catch (error) {
        res.status(500).json({ "Internal Error": "Some internal error occured" })
        console.log(error.messege);
    }
})

// Route 3:Get logged in user info. login required
router.post('/getuser', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password')
        res.send(user)
    } catch (error) {
        res.status(500).json({ "Internal Error": "Some internal error occured" })
        console.log(error.messege);
    }
})
module.exports = router
