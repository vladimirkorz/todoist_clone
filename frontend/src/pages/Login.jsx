import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api.js';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'demo@mail.com', password: '123456' });
  const [error, setError] = useState('');

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', form);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось войти');
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="logo">Journal</div>
        <h1>Вход в аккаунт</h1>

        <form onSubmit={submit} className="form">
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={updateField} />

          <label>Пароль</label>
          <input name="password" type="password" value={form.password} onChange={updateField} />

          {error && <div className="error">{error}</div>}

          <button className="primary-button">Войти</button>
        </form>

        <span className="auth-link">Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></span>
      </section>
    </main>
  );
}
