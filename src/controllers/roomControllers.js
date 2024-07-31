import axios from 'axios';
import RoomParticipant from "../models/RoomParticipant.js";
import TournamentRoom from "../models/TournamentRoom.js";
import User from "../models/User.js";
import OpenAI from 'openai';
import Team from '../models/Team.js';
// import { Route53RecoveryControlConfig } from 'aws-sdk';
import { message } from 'antd';

const openaiApiKey = process.env.OPEN_AI_KEY; // Замените на ваш API ключ

export const createRoom = async (req, res) => {
    const { name,gameTime, tournamentType, formatPlay, tournamentAiOr } = req.body;

    if (!req.user || !req.user._id) {
        return res.status(403).json({ message: 'Необходима аутентификация пользователя' });
    }

    const room = new TournamentRoom({
        name,
        gameTime,
        admin_id: req.user._id,
        tournamentType,
        tournamentAiOr,
        formatPlay
    });

    try {
        await room.save();
        if (tournamentAiOr === "ИИ") {
            res.status(200).json({ roomId: room.id });
        } else {
            res.status(200).json({ message: 'Комната для турнира успешно создана', room });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const closeRoom = async(req,res)=> {
    const { roomId } = req.params
    try{
        const room = await TournamentRoom.findById(roomId)

        if (!room) {
            return res.status(404).json({ message: 'Турнир не найден' });
        }
         
        if(room.admin_id.toString() !== req.user._id.toString()){
            return res.status(403).json({ message: 'Доступ запрещен' });
        }

        room.isClosed = true;
        await room.save()
        res.status(200).json({message:'Закрыт открыт'})
    }catch(error){
        res.status(500).json({ error: error.message });
    }
}


export const openRoom = async (req, res) => {
    const { roomId } = req.params;
    try {
        const room = await TournamentRoom.findById(roomId);

        if (!room) {
            return res.status(404).json({ message: 'Турнир не найден' });
        }
         
        if (room.admin_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Доступ запрещен' });
        }

        room.isClosed = false;
        await room.save();
        res.status(200).json({ message: 'Турнир открыт' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const removeParticipant = async (req, res) => {
    const { roomId, userId } = req.params;
    console.log('Параметры запроса:', req.params);
    console.log('Аутентифицированный пользователь:', req.user);

    try {
        const room = await TournamentRoom.findById(roomId);
        if (!room) {
            console.log('Турнир не найден');
            return res.status(404).json({ message: 'Турнир не найден' });
        }

        if (room.admin_id.toString() !== req.user._id.toString()) {
            console.log('Доступ запрещен. Пользователь не является администратором');
            return res.status(403).json({ message: 'Доступ запрещен' });
        }

        await RoomParticipant.deleteOne({ roomId: roomId, userId: userId });

        room.allPlayers = room.allPlayers.filter(playerId => playerId.toString() !== userId);
        await room.save();

        console.log('Участник удален из турнира');
        res.status(200).json({ message: 'Участник удален из турнира' });
    } catch (error) {
        console.error('Ошибка при удалении участника:', error);
        res.status(500).json({ error: error.message });
    }
};


export const getAllParticipants = async (req, res) => {
    console.log('hello')
    try {
        const participants = await RoomParticipant.find().populate('userId', 'firstName lastName email').populate('roomId', 'name');
        res.status(200).json(participants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createTeamsWithAI = async (req, res) => {
    const roomId = req.params.roomId;
    console.log(roomId);

    try {
        const room = await TournamentRoom.findById(roomId).populate('admin_id', 'firstName lastName email');
        console.log(room.allPlayers.length, 10);
        if (!room) {
            return res.status(404).json({ message: 'Турнир не найден' });
        }

        const participants = await RoomParticipant.find({ roomId: room._id }).populate('userId', 'name email');
        const playerProfiles = participants.map(participant => ({
            id: participant._id.toString(),
            position: participant.position,
            preferredFoot: participant.preferredFoot,
            strengths: participant.strengths,
            weaknesses: participant.weaknesses,
            height: participant.height,
            weight: participant.weight
        }));
        console.log(playerProfiles)
        const teamSize = room.formatPlay === "5x5" ? 5 : 6;
        const numberOfTeams = Math.ceil(playerProfiles.length / teamSize);
        const prompt = `Распредели даже если мало данных. Распредели следующих игроков по ${numberOfTeams} равным по силе командам. В одном комнаде ${teamSize} если остинься игроки которым не хватила команд присоедени их дркгим созданым команд. Учти их сильные и слабые стороны, рост, вес, предпочитаемую позицию и удобную ногу. Все команды должны быть равны по силе
        после рапределения по командам и определи каждому своего соперника:
        Игроки:
        ${playerProfiles.map(player => `
        ID: ${player.id}
        Позиция: ${player.position}
        Удобная нога: ${player.preferredFoot}
        Сильные стороны: ${player.strengths}
        Слабые стороны: ${player.weaknesses}
        Рост: ${player.height} см
        Вес: ${player.weight} кг
        `).join('')}
        Пожалуйста, верни команды в формате JSON с разделением по ID игроков.
        Пример формата:
        [
          {
            "team": 1,
            "players": ["ID1:вратрь", "ID2:защитник", "ID3:нападающии"]
          },
          {
            "team": 2,
            "players": ["ID4:вртарь", "ID5:нападющии", "ID6:защитник"]
          }
        ]`;

        console.log("Prompt:", prompt);
        const openaiModel = new OpenAI({apiKey: openaiApiKey})
        const response = await openaiModel.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are an AI assistant that helps organize tournament teams.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.1,
        });

        console.log("OpenAI Full Response:", response.choices[0].message);

        if (response.choices && response.data.choices.length > 0) {
            const responseText = response.data.choices[0].message.content.trim();
            console.log("OpenAI Response Text:", responseText);

            try {
                const teams = JSON.parse(responseText);
                res.status(200).json({ message: 'Команды успешно созданы', teams });
            } catch (jsonError) {
                res.status(500).json({ error: 'Ошибка при обработке ответа от OpenAI', details: responseText });
            }
        } else {
            res.status(500).json({ error: 'Unexpected response format from OpenAI API', details: response.data });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const updateUserProfile = async (req, res) => {

    try {
        const { userId, profilePhoto }  = req.body

        const user = User.findById(userId)
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        user.profile.profilePhoto = profilePhoto;
        await user.save();

        res.send({ message: 'Profile photo updated successfully', profilePhoto });
    } catch (error) {
        res.status(500).send({ message: 'Error updating profile photo', error });
    }
}


export const setTeamCount = async (req,res) => {
    const {roomId,teamsCount} = req.body

    if (!req.user || !req.user._id) {
        return res.status(403).json({ message: 'Необходима аутентификация пользователя' });
    }
    try{
        const room = await TournamentRoom.findById(roomId)
        if(!room){
            return res.status(404).json({ message: 'Турнир не найден' });
        }

        if(room.admin_id.toString() !== req.user._id.toString()){
            return res.status(403).json({ message: 'У вас нет прав для выполнения этого действия' });
        }
        
        room.teamCount = teamsCount
        await room.save()
        res.status(200).json({ message: 'Количество команд успешно установлено', room });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
} 


// export const getAllRoom = async (req, res) => {
//     const rooms = await TournamentRoom.find();
//     res.status(200).json({ rooms });
    
// }

export const getAllRooms = async (req, res) => {
    try {
      const rooms = await TournamentRoom.find().populate('admin_id').populate('allPlayers');
      res.status(200).json({ rooms });
    } catch (error) {
      res.status(500).json({ message: 'Ошибка при получении данных турниров', error });
    }
  };
  
  export const getRoomById = async (req, res) => {
    try {
      const room = await TournamentRoom.findById(req.params.id).populate('admin_id').populate('allPlayers');
      if (!room) {
        return res.status(404).json({ message: 'Турнир не найден' });
      }
      res.status(200).json(room);
    } catch (error) {
      res.status(500).json({ message: 'Ошибка при получении данных турнира', error });
    }
  };
export const joinTournament = async (req, res) => {
    const { name, position, preferredFoot, strengths, weaknesses,height ,weight} = req.body;
    try {
        const room = await TournamentRoom.findOne({ name })

        if (!room) {
            return res.status(404).json({ error: 'турнир не найден' });
        }

        const participant = new RoomParticipant({
            userId: req.user._id,
            roomId: room._id,
            position,
            preferredFoot,
            strengths,
            weaknesses,
            height,
            weight
        });

        await participant.save();

        res.status(200).json({ message: 'Пользователь успешно зашел в турнир', participant });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const getTournamentParticipantsByName = async (req, res) => {
    const { name } = req.params;
    try {
        console.log('Поиск турнира по имени:', name);

        // Найдите комнату по имени
        const room = await TournamentRoom.findOne({ name }).populate('admin_id', 'firstName lastName email');
        if (!room) {
            console.log('Турнир не найден');
            return res.status(404).json({ message: 'Турнир не найден' });
        }

        console.log('Найден турнир:', room);

        // Найдите всех участников по roomId
        const participants = await RoomParticipant.find({ roomId: room._id }).populate('userId', 'firstName lastName email'); // Укажите нужные поля
        if (!participants.length) {
            console.log('Участники для этого турнира не найдены');
            return res.status(404).json({ message: 'Участники для этого турнира не найдены' });
        }

        console.log('Найдены участники:', participants);

        // Подготовка данных участников с проверкой наличия userId
        const detailedParticipants = participants.map(participant => {
            if (!participant.userId) {
                return {
                    ...participant.toObject(),
                    userId: {
                        firstName: 'Неизвестно',
                        lastName: 'Пользователь',
                        email: 'Неизвестно'
                    }
                };
            }
            return participant;
        });

        // Проверка наличия admin_id
        const admin = room.admin_id ? {
            firstName: room.admin_id.firstName,
            lastName: room.admin_id.lastName,
            email: room.admin_id.email
        } : {
            firstName: 'Неизвестно',
            lastName: 'Администратор',
            email: 'Неизвестно'
        };

        res.status(200).json({
            admin,
            participants: detailedParticipants
        });
    } catch (error) {
        console.error('Ошибка при получении участников турнира:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getTournamentParticipantsByRoomId = async (req, res) => {
    const { id } = req.params;
    try {
      const room = await TournamentRoom.findById(id).populate('admin_id', 'firstName lastName email');
  
      if (!room) {
        return res.status(404).json({ message: 'Турнир не найден' });
      }
  
      const participants = await RoomParticipant.find({ roomId: room._id }).populate('userId', 'name email');
  
      res.status(200).json({
        admin: {
          firstName: room.admin_id.firstName,
          lastName: room.admin_id.lastName,
          email: room.admin_id.email
        },
        participants
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

export const assignTeamCaptain = async (req,res)=> { 
    const {roomId,userId} = req.body
    // console.log("happy")
    try{
        const room = await TournamentRoom.findById(roomId)
        if(!room){
            return res.status(404).json({ message: 'Турнир не найден' });
        }

        if(room.admin_id.toString() !== req.user._id.toString()){
            return res.status(403).json({ message: 'У вас нет прав для выполнения этого действия' });
        }
        
        const participant = await RoomParticipant.findOne({roomId,userId})
        if (!participant) {
            return res.status(404).json({ message: 'Участник не найден' });
        }

        participant.isCaptain = true;
        await participant.save();
        res.status(200).json({ message: 'Капитан команды успешно назначен', participant });
    }catch(err){
        res.status(500).json({ error: error.message });
    }
}


export const createTeam = async (req,res) => {
    const {roomId,teamName,maxPlayers} = req.body; 

    if(!req.user || !req.user._id){
        return res.status(403).json({ message: 'Необходима аутентификация пользователя' });
    }

    try{
        const room = await TournamentRoom.findById(roomId)
        if(!room){
            return res.status(404).json({ message: 'Турнир не найден' });
        }

        const captain = await RoomParticipant.findOne({ roomId, userId: req.user._id, isCaptain: true });
        if (!captain) {
            return res.status(403).json({ message: 'Только капитан может создавать команду' });
        }
        const team = new Team({
            roomId,
            captainId: req.user._id,
            teamName,
            maxPlayers,
            players: []
        });
        await team.save();

        res.status(200).json({ message: 'Команда успешно создана', team });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const addPlayerToTeam = async (req, res) => {
    const { teamId, participantId } = req.body;

    if (!req.user || !req.user._id) {
        return res.status(403).json({ message: 'Необходима аутентификация пользователя' });
    }

    try {
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Команда не найдена' });
        }

        const captain = await RoomParticipant.findOne({ roomId: team.roomId, userId: req.user._id, isCaptain: true });
        if (!captain) {
            return res.status(403).json({ message: 'Только капитан может добавлять игроков в команду' });
        }

        if (team.players.length >= team.maxPlayers) {
            return res.status(400).json({ message: 'Команда уже заполнена' });
        }

        const participant = await RoomParticipant.findById(participantId);
        if (!participant || participant.roomId.toString() !== team.roomId.toString()) {
            return res.status(404).json({ message: 'Участник не найден или не принадлежит этому турниру' });
        }

        team.players.push(participantId);
        await team.save();

        res.status(200).json({ message: 'Игрок успешно добавлен в команду', team });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Другие методы ...

// export const chooseTeamMember = async (req, res) => {
//     const { roomId, participantId, teamNumber } = req.body;

//     if (!req.user || !req.user._id) {
//         return res.status(403).json({ message: 'Необходима аутентификация пользователя' });
//     }
    

//     try {
//         // const room = await TournamentRoom.findById(roomId);
//         const room = await TournamentRoom.findById(roomId);
//         if (!room) {
//             return res.status(404).json({ message: 'Турнир не найден' });
//         }

//         const captain = await RoomParticipant.findOne({ roomId, userId: req.user._id, isCaptain: true });
//         if (!captain) {
//             return res.status(403).json({ message: 'Только капитан может выбирать участников' });
//         }

//         const participant = await RoomParticipant.findById(participantId);
//         if (!participant || participant.roomId.toString() !== roomId) {
//             return res.status(404).json({ message: 'Участник не найден или не принадлежит этому турниру' });
//         }

//         participant.teamNumber = teamNumber;
//         await participant.save();

//         res.status(200).json({ message: 'Участник успешно выбран в команду', participant });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// export const createTeam = async(res,req) => {

// }


// export const getTournamentParticipants = async (req, res) => {
//     const { roomId } = req.params;

//     try {
//         const participants = await RoomParticipant.find({ roomId }).populate('userId', 'name email'); // Укажите нужные поля

//         if (!participants.length) {
//             return res.status(404).json({ message: 'Участники для этого турнира не найдены' });
//         }

//         res.status(200).json({ participants });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };