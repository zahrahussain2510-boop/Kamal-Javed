# Kamal Javed Portfolio

A responsive portfolio website with a scroll controlled portrait animation and a small built in inquiry backend.

## Run locally

Install Node.js, then run:

```sh
node serve.mjs 4175
```

Open `http://127.0.0.1:4175` in a browser.

The main page is `index.html`. Its styles are in `styles.css`, and the scroll animation and navigation are in `script.js`. The current animation uses the 240 WebP frames in `assets/cinematic-frames-final/`.

Visitors can send a project note from the contact section. Notes are stored locally in `data/inquiries.json` and are available from the password protected inbox at `/admin`. The first run creates a local `.env` file with the admin login. Keep `.env` private and do not commit it. The backend uses Node.js built in modules, so no package installation is needed. The inbox and stored inquiries stay on the machine running this server.
