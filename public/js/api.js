// Shared API helpers

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function showAlert(containerId, message, type = 'error') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 4000);
}

function gradeBadge(grade) {
  if (!grade) return '<span class="badge badge-gray">—</span>';
  if (['A','A-','B+','B'].includes(grade)) return `<span class="badge badge-green">${grade}</span>`;
  if (['B-','C+','C'].includes(grade)) return `<span class="badge badge-yellow">${grade}</span>`;
  if (['F','W'].includes(grade)) return `<span class="badge badge-red">${grade}</span>`;
  return `<span class="badge badge-blue">${grade}</span>`;
}

function seatsBadge(available, max) {
  if (available === 0) return `<span class="badge badge-red">Full</span>`;
  if (available <= 5) return `<span class="badge badge-yellow">${available}/${max}</span>`;
  return `<span class="badge badge-green">${available}/${max}</span>`;
}

async function checkAuth(expectedRole) {
  try {
    const user = await apiFetch('/api/auth/me');
    if (user.role !== expectedRole) {
      window.location.href = '/';
    }
    return user;
  } catch {
    window.location.href = '/';
  }
}

async function logout() {
  await apiFetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/';
}
