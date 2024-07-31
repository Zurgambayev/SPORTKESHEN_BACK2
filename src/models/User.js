import mongoose from 'mongoose';
import profileSchema from './profile.js'; // Импортируем схему профиля
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, trim: true, unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Please fill a valid email address'] },
    username: { type: String, required: true, trim: true, unique: true, minlength: 3, maxlength: 30 },
    password: { type: String, required: true, minlength: 5, validate: { validator: function (v) { return /(?=.*\d).{5,}/.test(v); }, message: props => `${props.value} is not a valid password! Password must contain at least one number and be at least 5 characters long.` } },
    profile: { type: profileSchema, default: () => ({}) }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
