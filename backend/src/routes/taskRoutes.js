import express from 'express';
import { query } from '../config/db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { projectId, filter } = req.query;
  const values = [req.user.id];
  let where = 'WHERE p.user_id = $1';

  if (projectId) {
    values.push(projectId);
    where += ` AND t.project_id = $${values.length}`;
  }

  if (filter === 'completed') {
    where += ' AND t.completed = true';
  }

  if (filter === 'active') {
    where += ' AND t.completed = false';
  }

  if (filter === 'today') {
    where += ' AND t.deadline = CURRENT_DATE';
  }

  const result = await query(
    `SELECT t.*, p.title AS project_title
     FROM tasks t
     INNER JOIN projects p ON p.id = t.project_id
     ${where}
     ORDER BY t.completed ASC, t.deadline ASC NULLS LAST, t.created_at DESC`,
    values
  );
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { project_id, title, description, priority, deadline } = req.body;

  if (!project_id || !title) {
    return res.status(400).json({ message: 'Выберите проект и введите название задачи' });
  }

  const project = await query('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [project_id, req.user.id]);
  if (project.rows.length === 0) {
    return res.status(404).json({ message: 'Проект не найден' });
  }

  const result = await query(
    `INSERT INTO tasks (project_id, title, description, priority, deadline)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [project_id, title.trim(), description || '', priority || 'medium', deadline || null]
  );

  res.status(201).json(result.rows[0]);
});

router.put('/:id', async (req, res) => {
  const { title, description, priority, deadline, completed } = req.body;

  const result = await query(
    `UPDATE tasks t
     SET title = COALESCE($1, t.title),
         description = COALESCE($2, t.description),
         priority = COALESCE($3, t.priority),
         deadline = $4,
         completed = COALESCE($5, t.completed)
     FROM projects p
     WHERE t.project_id = p.id AND t.id = $6 AND p.user_id = $7
     RETURNING t.*`,
    [title, description, priority, deadline || null, completed, req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Задача не найдена' });
  }
  res.json(result.rows[0]);
});

router.patch('/:id/toggle', async (req, res) => {
  const result = await query(
    `UPDATE tasks t
     SET completed = NOT completed
     FROM projects p
     WHERE t.project_id = p.id AND t.id = $1 AND p.user_id = $2
     RETURNING t.*`,
    [req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Задача не найдена' });
  }
  res.json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  const result = await query(
    `DELETE FROM tasks t
     USING projects p
     WHERE t.project_id = p.id AND t.id = $1 AND p.user_id = $2
     RETURNING t.id`,
    [req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Задача не найдена' });
  }
  res.json({ message: 'Задача удалена' });
});

export default router;
