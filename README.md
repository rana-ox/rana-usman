# university
tips and trick about our university and notes
# BS IR Resources Website

A simple static website to share semester-wise notes, opportunities, and hacks for BS International Relations students.

## Features
- Semester filter and keyword search for notes
- Separate pages for opportunities and hacks
- Easy content updates via JSON files
- Mobile-friendly, dark theme

## How to use
1. **Clone or create the repo**
   - Create a new GitHub repository.
   - Add these files (keep the folder structure).

2. **Update content**
   - Edit `assets/data/notes.json` to add your courses/notes.
   - Edit `assets/data/opportunities.json` and `assets/data/hacks.json`.
   - For large files, upload to Google Drive and paste share links under `link`.

3. **Preview locally (optional)**
   - Use a simple static server (e.g., VS Code Live Server) or any HTTP server.
   - Opening `index.html` directly may block `fetch()` for JSON due to browser rules.

4. **Publish with GitHub Pages**
   - Go to `Settings` → `Pages`.
   - Under **Build and deployment**, choose **Deploy from a branch**.
   - Select your default branch and `/root` (or `/docs` if you place files inside `docs/`).
   - Save. Your site will be live at `https://<username>.github.io/<repository>/`.

5. **Customize**
   - Change colors in `assets/css/styles.css`.
   - Add a logo in `assets/img/` and reference it in headers if you want.
   - Create more pages by copying an HTML file and adjusting the JS rendering.

## Tips
- Keep file names consistent and avoid spaces in links.
- Use descriptive tags in JSON for better search results.
- Back up PDFs and slides in Drive/OneDrive and set link sharing to “Anyone with the link”.

