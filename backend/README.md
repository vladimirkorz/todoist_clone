# TaskFlow — Todoist Clone

TaskFlow — учебный веб-проект для управления задачами и проектами. Приложение позволяет регистрироваться, входить в аккаунт, создавать проекты, добавлять задачи, редактировать их, удалять и отмечать выполненными.

## Стек

- Frontend: React, Vite, JavaScript, CSS
- Backend: Node.js, Express, JavaScript
- Database: PostgreSQL
- Auth: JWT, bcryptjs

## Возможности

- Регистрация и авторизация пользователя
- JWT-защита API
- CRUD для проектов
- CRUD для задач
- Отметка задачи как выполненной
- Фильтры: все задачи, сегодня, активные, выполненные
- Минималистичный синий интерфейс

## Тестовые данные

```text
login: demo@mail.com
password: 123456
```

## Локальный запуск

### 1. База данных

Создайте базу данных PostgreSQL:

```sql
CREATE DATABASE todoist_clone;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:seed
npm run dev
```

Backend будет доступен на `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend будет доступен на `http://localhost:5173`.

## API

- `POST /api/auth/register` — регистрация
- `POST /api/auth/login` — вход
- `GET /api/auth/me` — данные текущего пользователя
- `GET /api/projects` — список проектов
- `POST /api/projects` — создание проекта
- `PUT /api/projects/:id` — редактирование проекта
- `DELETE /api/projects/:id` — удаление проекта
- `GET /api/tasks` — список задач
- `POST /api/tasks` — создание задачи
- `PUT /api/tasks/:id` — редактирование задачи
- `PATCH /api/tasks/:id/toggle` — переключение статуса задачи
- `DELETE /api/tasks/:id` — удаление задачи

## Структура

```text
backend/   Express API
frontend/  React + Vite interface
database/  SQL schema
```
