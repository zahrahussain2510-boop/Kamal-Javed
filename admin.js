const loginPanel = document.querySelector('#login-panel');
const inboxPanel = document.querySelector('#inbox-panel');
const loginForm = document.querySelector('#login-form');
const loginMessage = document.querySelector('#login-message');
const logoutButton = document.querySelector('#logout');
const list = document.querySelector('#inquiries');
const count = document.querySelector('#message-count');

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Something went wrong.');
  return body;
}

function showInbox() {
  loginPanel.hidden = true;
  inboxPanel.hidden = false;
  logoutButton.hidden = false;
  loadInquiries();
}

async function loadInquiries() {
  try {
    const { inquiries } = await api('/api/admin/inquiries');
    count.textContent = `${inquiries.length} ${inquiries.length === 1 ? 'NOTE' : 'NOTES'}`;
    if (!inquiries.length) {
      list.innerHTML = '<p class="empty">No project notes yet. New messages will appear here.</p>';
      return;
    }
    list.replaceChildren(...inquiries.map(item => {
      const article = document.createElement('article');
      article.className = 'inquiry';
      const identity = document.createElement('div');
      const title = document.createElement('h2');
      title.textContent = item.name;
      const email = document.createElement('a');
      email.href = `mailto:${item.email}`;
      email.textContent = item.email;
      const delivery = document.createElement('span');
      delivery.className = `delivery-status${item.emailSent ? ' is-sent' : ''}`;
      delivery.textContent = item.emailSent ? 'EMAIL SENT' : 'SAVED IN INBOX';
      identity.append(title, email, delivery);
      const date = document.createElement('time');
      date.dateTime = item.createdAt;
      date.textContent = new Date(item.createdAt).toLocaleString();
      const message = document.createElement('p');
      message.textContent = item.message;
      const status = document.createElement('select');
      status.setAttribute('aria-label', `Status for ${item.name}`);
      for (const option of ['new', 'read', 'archived']) {
        const choice = document.createElement('option');
        choice.value = option;
        choice.textContent = option.toUpperCase();
        choice.selected = item.status === option;
        status.append(choice);
      }
      status.addEventListener('change', async () => {
        try { await api(`/api/admin/inquiries/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status: status.value }) }); }
        catch { status.value = item.status; }
      });
      article.append(identity, date, message, status);
      return article;
    }));
  } catch {
    loginPanel.hidden = false;
    inboxPanel.hidden = true;
    logoutButton.hidden = true;
  }
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  loginMessage.textContent = 'Signing in…';
  const values = Object.fromEntries(new FormData(loginForm));
  try {
    await api('/api/admin/login', { method: 'POST', body: JSON.stringify(values) });
    loginForm.reset();
    loginMessage.textContent = '';
    showInbox();
  } catch (error) { loginMessage.textContent = error.message; }
});

logoutButton.addEventListener('click', async () => {
  await api('/api/admin/logout', { method: 'POST', body: '{}' }).catch(() => {});
  inboxPanel.hidden = true;
  loginPanel.hidden = false;
  logoutButton.hidden = true;
});

api('/api/admin/inquiries').then(showInbox).catch(() => {});
