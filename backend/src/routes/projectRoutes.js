import express from 'express';
import { query } from '../config/db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const result = await query(
    `SELECT p.*, COUNT(t.id)::int AS tasks_count
     FROM projects p
     LEFT JOIN tasks t ON t.project_id = p.id
     WHERE p.user_id = $1
     GROUP BY p.id
     ORDER BY p.created_at ASC`,
    [req.user.id]
  );
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { title } = req.body;
  if (!title || title.trim().length < 2) {
    return res.status(400).json({ message: 'Название проекта должно быть не короче 2 символов' });
  }

  const result = await query(
    'INSERT INTO projects (user_id, title) VALUES ($1, $2) RETURNING *',
    [req.user.id, title.trim()]
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', async (req, res) => {
  const { title } = req.body;
  const result = await query(
    'UPDATE projects SET title = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [title, req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Проект не найден' });
  }
  res.json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  const result = await query(
    'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Проект не найден' });
  }
  res.json({ message: 'Проект удален' });
});

export default router;
