import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, username, password } = req.body;

    // Проверка, существует ли пользователь с таким же email или username
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        message: 'Email или username уже существуют',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const doc = new User({
      firstName,
      lastName,
      email,
      username,
      password: hash,
    });

    const user = await doc.save();

    const token = jwt.sign(
      {
        _id: user._id,
      },
      'secret123',
      {
        expiresIn: '30d',
      }
    );

    res.status(201).json({
      user,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Не удалось зарегистрироваться',
    });
  }
};

export const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        message: "неверный логин либо пароль",
      });
    }

    const isValidPass = await bcrypt.compare(req.body.password, user.password);

    if (!isValidPass) {
      return res.status(404).json({
        message: "неверный логин либо пароль",
      });
    }

    const token = jwt.sign(
      {
        _id: user._id,
      },
      "secret123",
      {
        expiresIn: '30d',
      }
    );

    res.json({
      token,
      user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'не удалось войти',
    });
  }
};

export const getMe = async (req, res) => {
  try {
    console.log("User ID from request:", req.userId); // Лог для проверки userId
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "пользователь не нашелся",
      });
    }

    const { passwordHash, ...userData } = user._doc;
    res.json(userData);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'нет доступа',
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Не удалось получить пользователей',
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('profile');

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.status(200).json(user.profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Не удалось получить профиль пользователя',
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Не удалось получить профиль пользователя',
    });
  }
};

// export const updateUserProfile
export const posirtion = async (req, res) => {
  const { position, preferredFoot, strengths, weaknesses, height, weight } = req.body;
  // Дальнейшая логика для обработки позиции
};
