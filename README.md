# Sound & Service — Church Tech Team

A small, static web app for a church technical department. It includes a team overview, serving schedule, service timetable, instructions, and member list.

## Run it locally

Open `index.html` in a browser. The app saves changes in that browser's local storage.

## Publish with GitHub Pages

1. On GitHub, create a new repository. You can name it `church-tech-team`. Leave **Add a README file** unchecked.
2. In a terminal, go to this project folder and run the following commands. Replace `YOUR-USERNAME` and `YOUR-REPOSITORY` with your GitHub username and repository name.

   ```sh
   git init -b main
   git add index.html styles.css app.js README.md .github/workflows/deploy.yml
   git commit -m "Create church tech team app"
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```

3. Make sure the account that owns the repository allows GitHub Actions to manage Pages. The workflow requests the `pages: write` permission and enables Pages automatically on its first run. If your repository or organization restricts this, open **Settings → Pages** and select **GitHub Actions** as the build and deployment source.
4. Open the **Actions** tab and wait for **Deploy to GitHub Pages** to finish. The published address will be shown in the Pages settings and in the completed workflow run. It is usually `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.

Later, push changes to the `main` branch to publish an update.

## Important data note

This version has no login or shared database. Changes are saved only in the current browser on the current device; other team members will not see them. Do not enter private member information until secure sign-in and shared storage are added.
