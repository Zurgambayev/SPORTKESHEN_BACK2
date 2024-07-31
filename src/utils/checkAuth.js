import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();

const checkAuth = (req, res, next) => {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, ''); 

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
            req.userId = decoded._id;
            req.user = decoded; // Устанавливаем req.user
            console.log('Пользователь аутентифицирован:', req.user);
            next();
        } catch (e) {
            console.error('Ошибка верификации токена:', e);
            return res.status(403).json({
                message: 'нет доступа'
            });
        }
    } else {
        console.error('Токен не предоставлен');
        return res.status(403).json({
            message: 'нет доступа'
        });
    }
};

export default checkAuth;
