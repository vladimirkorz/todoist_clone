import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Заполните имя, email и пароль' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, passwordHash]
    );

    const user = created.rows[0];
    const token = createToken(user);

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка регистрации' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Введите email и пароль' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, created_at: user.created_at };
    const token = createToken(safeUser);

    res.json({ user: safeUser, token });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка входа' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  const result = await query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.user.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }
  res.json(result.rows[0]);
});

export default router;
