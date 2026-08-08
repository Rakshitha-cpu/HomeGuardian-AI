// Shared frontend auth helper — used by index.html, dashboard.html, login.html, register.html
const API_BASE = window.API_BASE || 'http://localhost:4000';

const HGAuth = {
  getToken() { return localStorage.getItem('hg_token'); },
  getUser() {
    try { return JSON.parse(localStorage.getItem('hg_user') || 'null'); } catch { return null; }
  },
  setSession(token, user) {
    localStorage.setItem('hg_token', token);
    localStorage.setItem('hg_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('hg_token');
    localStorage.removeItem('hg_user');
  },
  isLoggedIn() { return !!this.getToken(); },
  async authFetch(path, options = {}) {
    const token = this.getToken();
    const headers = Object.assign({}, options.headers || {}, token ? { Authorization: 'Bearer ' + token } : {});
    return fetch(API_BASE + path, Object.assign({}, options, { headers }));
  },
  reflectNav() {
    const link = document.getElementById('navAuthLink');
    if (!link) return;
    const user = this.getUser();
    if (user) {
      link.innerHTML = '<a href="#" id="logoutLink">Log out (' + user.name.split(' ')[0] + ')</a>';
      document.getElementById('logoutLink').addEventListener('click', (e) => {
        e.preventDefault();
        HGAuth.clearSession();
        window.location.href = 'index.html';
      });
    } else {
      link.innerHTML = '<a href="login.html">Login</a>';
    }
  },
};

document.addEventListener('DOMContentLoaded', () => HGAuth.reflectNav());
