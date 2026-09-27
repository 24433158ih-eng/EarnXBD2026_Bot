# HTML Hosting Studio — GitHub Pages

This project is a client-side HTML/CSS/JS project manager designed to run on GitHub Pages.

## Features

- Upload `.html` / `.htm`
- Paste complete HTML/CSS/JS
- Preview/run
- Save multiple projects in `localStorage`
- Generate a project URL
- Copy URL
- Delete projects with a custom confirmation dialog
- Mobile-friendly UI

## Important limitation

This is a static GitHub Pages project. Saved project source is stored in the browser's `localStorage`.

Therefore:

- A generated URL works on the same browser/device where that project was saved.
- Opening the same URL on another device will not retrieve the project.
- GitHub Pages does not provide a database or server-side upload API.

For public, cross-device hosted links, add a backend/database (for example Firebase) and store project source there.

## Deploy on GitHub Pages

1. Create a GitHub repository.
2. Upload `index.html`, `style.css`, and `app.js`.
3. Open **Settings → Pages**.
4. Select **Deploy from a branch**.
5. Choose the branch containing these files and the `/root` folder.
6. Save and open the GitHub Pages URL.

Example:

`https://USERNAME.github.io/REPOSITORY/`
