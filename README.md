# Kamal Javed Portfolio

A responsive portfolio website with a scroll controlled portrait animation and a small built in inquiry backend.

## Run locally

Install Node.js, then run:

```sh
node serve.mjs 4177
```

Open `http://localhost:4177` in a browser.

The main page is `index.html`. Its styles are in `styles.css`, and the scroll animation and navigation are in `script.js`. The current animation uses the 240 WebP frames in `assets/cinematic-frames-final/`.

Visitors can send a project note from the contact section. Notes are stored in `data/inquiries.json` and appear in the password protected inbox at `/admin`. When SMTP is configured, each note is also emailed to `CONTACT_EMAIL`. If email is unavailable, the form says so and offers a direct email app link with the message filled in.

The first run creates a private `.env` file with the admin login. Add the SMTP settings from `.env.example` to that private file. For Gmail, use an app password created in the Google account that will send the email. Never commit `.env` or share the app password. `CONTACT_EMAIL` defaults to Kamal's portfolio email. The backend uses Node.js built in modules, so no package installation is needed. The inbox data stays on the machine running the server.
