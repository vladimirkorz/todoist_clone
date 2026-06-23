import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api.js';

const filters = [
  { key: 'all', label: 'Все задачи' },
  { key: 'today', label: 'Сегодня' },
  { key: 'active', label: 'Активные' },
  { key: 'completed', label: 'Выполненные' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [filter, setFilter] = useState('all');
  const [projectTitle, setProjectTitle] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectTitle, setEditingProjectTitle] = useState('');
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', deadline: '' });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [message, setMessage] = useState('');

  async function loadProjects() {
    const response = await api.get('/projects');
    setProjects(response.data);
    if (!selectedProjectId && response.data.length > 0) {
      setSelectedProjectId(String(response.data[0].id));
    }
  }

  async function loadTasks() {
    const params = {};
    if (selectedProjectId) params.projectId = selectedProjectId;
    if (filter !== 'all') params.filter = filter;
    const response = await api.get('/tasks', { params });
    setTasks(response.data);
  }

  useEffect(() => {
    loadProjects().catch(() => logout());
  }, []);

  useEffect(() => {
    loadTasks().catch(() => setMessage('Не удалось загрузить задачи'));
  }, [selectedProjectId, filter]);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  async function createProject(event) {
    event.preventDefault();
    if (!projectTitle.trim()) return;
    const response = await api.post('/projects', { title: projectTitle });
    setProjectTitle('');
    await loadProjects();
    setSelectedProjectId(String(response.data.id));
  }

  async function updateProject(event) {
    event.preventDefault();
    await api.put(`/projects/${editingProjectId}`, { title: editingProjectTitle });
    setEditingProjectId(null);
    setEditingProjectTitle('');
    await loadProjects();
  }

  async function deleteProject(id) {
    if (!confirm('Удалить проект вместе с задачами?')) return;
    await api.delete(`/projects/${id}`);
    if (String(id) === selectedProjectId) setSelectedProjectId('');
    await loadProjects();
    await loadTasks();
  }

  function startEditProject(project) {
    setEditingProjectId(project.id);
    setEditingProjectTitle(project.title);
  }

  async function submitTask(event) {
    event.preventDefault();
    if (!selectedProjectId || !taskForm.title.trim()) return;

    const payload = { ...taskForm, project_id: Number(selectedProjectId) };

    if (editingTaskId) {
      await api.put(`/tasks/${editingTaskId}`, payload);
      setEditingTaskId(null);
    } else {
      await api.post('/tasks', payload);
    }

    setTaskForm({ title: '', description: '', priority: 'medium', deadline: '' });
    await loadTasks();
    await loadProjects();
  }

  function startEditTask(task) {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      deadline: task.deadline ? task.deadline.slice(0, 10) : ''
    });
  }

  async function toggleTask(id) {
    await api.patch(`/tasks/${id}/toggle`);
    await loadTasks();
    await loadProjects();
  }

  async function deleteTask(id) {
    await api.delete(`/tasks/${id}`);
    await loadTasks();
    await loadProjects();
  }

  const selectedProject = projects.find((project) => String(project.id) === selectedProjectId);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">T</div>
          <div>
            <strong>Journal</strong>
            <span>{user.name || 'Пользователь'}</span>
          </div>
        </div>

        <nav className="filter-list">
          {filters.map((item) => (
            <button key={item.key} className={filter === item.key ? 'active' : ''} onClick={() => setFilter(item.key)}>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-title">Проекты</div>
        <div className="project-list">
          {projects.map((project) => (
            <div className={`project-item ${String(project.id) === selectedProjectId ? 'selected' : ''}`} key={project.id}>
              {editingProjectId === project.id ? (
                <form onSubmit={updateProject} className="inline-form">
                  <input value={editingProjectTitle} onChange={(e) => setEditingProjectTitle(e.target.value)} />
                  <button>OK</button>
                </form>
              ) : (
                <>
                  <button className="project-button" onClick={() => setSelectedProjectId(String(project.id))}>
                    <span>{project.title}</span>
                    <small>{project.tasks_count}</small>
                  </button>
                  <div className="project-actions">
                    <button onClick={() => startEditProject(project)}>✎</button>
                    <button onClick={() => deleteProject(project.id)}>×</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={createProject} className="new-project-form">
          <input placeholder="Новый проект" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
          <button>+</button>
        </form>

        <button className="logout-button" onClick={logout}>Выйти</button>
      </aside>

      <section className="content">
        <header className="content-header">
          <div>
            <span className="eyebrow">Рабочая область</span>
            <h1>{selectedProject ? selectedProject.title : 'Все проекты'}</h1>
          </div>
          <div className="counter">{tasks.length} задач</div>
        </header>

        <section className="task-form-card">
          <h2>{editingTaskId ? 'Редактирование задачи' : 'Новая задача'}</h2>
          <form onSubmit={submitTask} className="task-form">
            <input placeholder="Название задачи" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
            <input placeholder="Описание" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
            <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
            <input type="date" value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })} />
            <button className="primary-button">{editingTaskId ? 'Сохранить' : 'Добавить'}</button>
          </form>
        </section>

        {message && <div className="error">{message}</div>}

        <section className="task-list">
          {tasks.map((task) => (
            <article className={`task-card ${task.completed ? 'done' : ''}`} key={task.id}>
              <button className="checkbox" onClick={() => toggleTask(task.id)}>{task.completed ? '✓' : ''}</button>
              <div className="task-main">
                <h3>{task.title}</h3>
                {task.description && <p>{task.description}</p>}
                <div className="task-meta">
                  <span className={`priority ${task.priority}`}>{task.priority}</span>
                  {task.deadline && <span>до {new Date(task.deadline).toLocaleDateString('ru-RU')}</span>}
                  <span>{task.project_title}</span>
                </div>
              </div>
              <div className="task-actions">
                <button onClick={() => startEditTask(task)}>Редактировать</button>
                <button onClick={() => deleteTask(task.id)}>Удалить</button>
              </div>
            </article>
          ))}

          {tasks.length === 0 && <div className="empty-state">Здесь пока нет задач. Добавьте первую задачу выше.</div>}
        </section>
      </section>
    </main>
  );
}
