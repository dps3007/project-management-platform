import mongoose, {Schema} from "mongoose";
import brcypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";


const userSchema = new Schema({
    avatar: {
        type: {
            url: String,
            localPath: String,
        },
        default: {
            url: 'https://placehold.co/200x200/png',
            localPath: ''
        },
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String,
        default: null
    },
    forgetPasswordToken: {
        type: String,
        default: null
    },
    forgetPasswordTokenExpiry: {
        type: Date,
        default: null
    },
    emailVerificationToken: {
        type: String,
        default: null
    },
    emailVerificationTokenExpiry: {
        type: Date,
        default: null
    },

}, 
{timestamps: true}
);

// hash password with pre hook
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        // Hash the password before saving
        this.password = await brcypt.hash(this.password, 10);
    }
    next();
});

//methods
userSchema.methods.isPasswordMatch = async function (password) {
    return await brcypt.compare(password, this.password);
};

//jwt
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({ _id: this._id ,
        email: this.email,
        username: this.username
    }, process.env.ACCESS_TOKEN_SECRET, 
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });
};

// crpyto
userSchema.methods.generateTemporaryToken = function () {
    const unhashedToken = crypto.randomBytes(20).toString('hex');

    const hashedToken = crypto.createHash('sha256').update(unhashedToken).digest('hex');

    const tokenExpiry = Date.now() + 20 * 60 * 1000; // 20 minutes
    return { unhashedToken, hashedToken, tokenExpiry };
}

export const User = mongoose.model('User', userSchema);