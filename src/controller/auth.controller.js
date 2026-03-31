const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const emailService = require('../services/email.service');

async function register(req, res) {
    const { email, password, name } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(422).json({ message: "Email already exists" });
        }
        const user = await User.create({ name, email, password });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token);

        res.status(201).json({
            message: "User registered successfully", user: {
                id: user._id,
                email: user.email,
                name: user.name
            }, token
        });
        await emailService.sendRegistrationEmail(user.email, user.name);
    } catch (error) {
        res.status(400).json({ message: "Registration failed", error: error.message });
    }
}
async function login(req, res) {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(404).json({ message: "Invalid credentials" });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token);

        res.status(200).json({
            message: "Login successful", user: {
                id: user._id,
                email: user.email,
                name: user.name
            }, token
        });
    } catch (error) {
        res.status(400).json({ message: "Login failed", error: error.message });
    }
}

module.exports = { register, login };