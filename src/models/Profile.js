import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
    goals: {
        type: Number,
        default: 0
    },
    games: {
        type: Number,
        default: 0
    },
    bestPlayerNominations: {
        type: Number,
        default: 0
    },
    profilePhoto: {
        type: String,
        default: ''
    }
}, {
    _id: false
});

export default profileSchema;
