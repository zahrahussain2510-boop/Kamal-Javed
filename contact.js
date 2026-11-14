const contactForm = document.querySelector('#project-form');
if (contactForm) {
  const emailFallback = (status, values, explanation) => {
    const subject = 'Project enquiry for Kamal Javed';
    const body = `Name: ${values.name}\nEmail: ${values.email}\n\n${values.message}`;
    const link = document.createElement('a');
    link.href = `mailto:kamaljaved78@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    link.textContent = 'Open your email app to send it directly.';
    link.className = 'email-fallback';
    status.replaceChildren(document.createTextNode(`${explanation} `), link);
  };

  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = contactForm.querySelector('button[type="submit"]');
    const status = contactForm.querySelector('[role="status"]');
    submit.disabled = true;
    status.textContent = 'Sending your note…';
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(contactForm))) });
      const result = await response.json();
      if (!response.ok) {
        if (result.saved) {
          emailFallback(status, Object.fromEntries(new FormData(contactForm)), result.error);
          return;
        }
        throw new Error(result.error || 'Your note could not be sent.');
      }
      contactForm.reset();
      status.textContent = result.message;
    } catch (error) {
      if (error instanceof TypeError) {
        emailFallback(status, Object.fromEntries(new FormData(contactForm)), 'The website inbox is unavailable.');
      } else status.textContent = error.message || 'Connection issue. Please email Kamal directly.';
    }
    finally { submit.disabled = false; }
  });
}
