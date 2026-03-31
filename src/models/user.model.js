const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please fill a valid email address"],
        unique: [true, "Email already exists"]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"],
        select: false
    },
    name: {
        type: String,
        required: [true, "Name is required"],
        unique: [true, "Name already exists"]
    },
    systemUser: {
        type: Boolean,
        default: false,
        immutable: true
    }
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return
    }
    this.password = await bcrypt.hash(this.password, 10);
    return
})
userSchema.method('comparePassword', function (password) {
    return bcrypt.compare(password, this.password);
})

module.exports = mongoose.model('User', userSchema);