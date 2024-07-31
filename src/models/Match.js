import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentRoom' },
    teamA: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    teamB: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    scoreA: { type: Number, default: 0 },
    scoreB: { type: Number, default: 0 },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    round: { type: String }  // "1/16", "1/8", "1/4", "1/2", "final"
})

const Match = mongoose.model('Match',matchSchema);
export default Match;

