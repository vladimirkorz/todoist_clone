import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool, query } from './config/db.js';

dotenv.config();

async function seed() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(120) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      description TEXT DEFAULT '',
      priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
      deadline DATE,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const users = [
    ['Demo User', 'demo@mail.com', '123456'],
    ['Student User', 'student@mail.com', '123456'],
    ['Manager User', 'manager@mail.com', '123456']
  ];

  for (const [name, email, password] of users) {
    const passwordHash = await bcrypt.hash(password, 10);
    await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      [name, email, passwordHash]
    );
  }

  const demo = await query('SELECT id FROM users WHERE email = $1', ['demo@mail.com']);
  const demoId = demo.rows[0].id;

  const projectResult = await query(
    `INSERT INTO projects (user_id, title)
     VALUES ($1, $2), ($1, $3), ($1, $4)
     RETURNING id, title`,
    [demoId, 'Учёба', 'Работа', 'Личное']
  ).catch(async () => {
    return await query('SELECT id, title FROM projects WHERE user_id = $1', [demoId]);
  });

  const study = projectResult.rows.find((project) => project.title === 'Учёба');
  if (study) {
    await query(
      `INSERT INTO tasks (project_id, title, description, priority, deadline, completed)
       VALUES
       ($1, 'Подготовить отчет по практике', 'Заполнить разделы отчета и добавить ссылки', 'high', CURRENT_DATE, false),
       ($1, 'Сделать ERD', 'Нарисовать схему Users, Projects, Tasks', 'medium', CURRENT_DATE + INTERVAL '1 day', false),
       ($1, 'Проверить деплой', 'Открыть сайт в режиме инкогнито', 'low', CURRENT_DATE + INTERVAL '2 days', true)
       ON CONFLICT DO NOTHING`,
      [study.id]
    );
  }

  console.log('Seed completed. Test login: demo@mail.com / 123456');
  await pool.end();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
