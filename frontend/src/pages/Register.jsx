import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api.js';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/register', form);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось зарегистрироваться');
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="logo">TaskFlow</div>
        <h1>Регистрация</h1>
        <p>Создайте аккаунт, чтобы хранить свои проекты и задачи.</p>

        <form onSubmit={submit} className="form">
          <label>Имя</label>
          <input name="name" value={form.name} onChange={updateField} />

          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={updateField} />

          <label>Пароль</label>
          <input name="password" type="password" value={form.password} onChange={updateField} />

          {error && <div className="error">{error}</div>}

          <button className="primary-button">Создать аккаунт</button>
        </form>

        <span className="auth-link">Уже есть аккаунт? <Link to="/login">Войти</Link></span>
      </section>
    </main>
  );
}
