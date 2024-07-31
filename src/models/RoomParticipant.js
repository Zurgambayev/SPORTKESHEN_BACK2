import mongoose from "mongoose";

// import { type } from "os";

const roomParticipantSchema = new mongoose.Schema({
    userId : {type:mongoose.Schema.Types.ObjectId, ref: 'User'},
    roomId : {type:mongoose.Schema.Types.ObjectId, ref: 'TournamentRoom'},
    position: String,
    preferredFoot: String,
    strengths: String,
    weaknesses: String,
    height: Number,
    weight: Number,
    isCaptain: {type: Boolean, default:false},
    teamNumber: { type: Number, default:null},
    // profile: {type: mongoose.Schema.Types.ObjectId,ref:'User'},

},{timestamps:true})

const RoomParticipant = mongoose.model('RoomParticipant', roomParticipantSchema);
export default RoomParticipant;
