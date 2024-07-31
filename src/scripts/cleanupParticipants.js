// // src/scripts/cleanupParticipants.js
// import mongoose from 'mongoose';
// import RoomParticipant from '../models/RoomParticipant.js';
// import User from '../models/User.js';
// import dotenv from 'dotenv';

// // Загрузка переменных окружения из файла .env
// dotenv.config({ path: '.env' }); // Убедитесь, что путь правильный относительно вашего файла .env

// // Проверка, что переменная окружения загружена
// if (!process.env.MONGODB_URI) {
//   throw new Error('MONGODB_URI is not defined in .env file');
// }

// // Подключение к базе данных
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => {
//   console.log('Connected to MongoDB');
// })
// .catch(err => {
//   console.error('Error connecting to MongoDB:', err);
//   process.exit(1);
// });

// async function cleanUpParticipants() {
//   try {
//     const participants = await RoomParticipant.find();
//     for (const participant of participants) {
//       const user = await User.findById(participant.userId);
//       if (!user) {
//         console.log(`Deleting participant with ID: ${participant._id} because user ${participant.userId} does not exist.`);
//         await RoomParticipant.findByIdAndDelete(participant._id);
//       }
//     }
//     console.log('Cleanup complete.');
//   } catch (err) {
//     console.error('Error during cleanup:', err);
//   } finally {
//     mongoose.connection.close();
//   }
// }

// cleanUpParticipants();
