import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentRoom', required: true },
    captainId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teamName: { type: String, required: true },
    maxPlayers: { type: Number, required: true },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RoomParticipant' }] 
})

const Team = mongoose.model('Team', teamSchema);
export default Team