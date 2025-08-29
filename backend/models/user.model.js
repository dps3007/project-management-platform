import mongoose, {Schema} from "mongoose";


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

export const User = mongoose.model('User', userSchema);