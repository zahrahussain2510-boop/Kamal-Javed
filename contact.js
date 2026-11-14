const contactForm = document.querySelector('#project-form');
if (contactForm) {
  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = contactForm.querySelector('button[type="submit"]');
    const status = contactForm.querySelector('[role="status"]');
    submit.disabled = true;
    status.textContent = 'Sending your note…';
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(contactForm))) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Your note could not be sent.');
      contactForm.reset();
      status.textContent = result.message;
    } catch (error) { status.textContent = error.message || 'Connection issue. Please email Kamal directly.'; }
    finally { submit.disabled = false; }
  });
}
