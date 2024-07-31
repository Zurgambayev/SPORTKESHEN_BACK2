import mongoose from "mongoose";

const tournamentRoomSchema = new mongoose.Schema({
    // const { name,tournamentType,tournamentAiOr,formatPlay} = req.body;
    name: String,
    // gameType: String,
    // division: String,
    gameTime: String,
    admin_id:{type: mongoose.Schema.Types.ObjectId,ref:'User'},
    tournamentType:{type:String,enum:["на выбывание", "лига"],require:true}, 
    formatPlay: { type: String, enum: ["5x5", "6x6"], required: true },
    tournamentAiOr: {type:String, enum:["ИИ", "Без ИИ"]},
    teamCount: {type:Number,default:0},
    allPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RoomParticipant' }],
    isClosed: {type:Boolean, default:false}
},{timestamps:true});

const TournamentRoom =  mongoose.model('TournamentRoom',tournamentRoomSchema);
export default TournamentRoom;




