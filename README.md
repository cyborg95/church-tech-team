# Sound & Service — Church Tech Team

A small web app for a church technical department. It includes a team overview, serving schedule, service timetable, instructions, and member list. Team data is stored in Supabase and shared between people using the same passcode.

## Important access and privacy notes

- Anyone who knows the shared passcode can view, add, change, and delete team data. Use a long, unique passphrase and share it only with the team.
- The passcode is checked by a Supabase Edge Function and is kept in Supabase secrets, not in the website source. The browser remembers it for the current tab session only.
- This is a basic shared-passcode setup, not individual accounts or a full audit trail. Avoid sensitive personal information. Rotate the passcode in Supabase if it is shared too widely.

## Configure the shared database

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. In the Supabase SQL Editor, run the contents of [`supabase/schema.sql`](./supabase/schema.sql). The table denies direct access from normal browser roles; reads and changes go through the Edge Function.
3. In the VS Code terminal, make sure you are in this project folder. Install the Supabase CLI as a local development tool, then sign in:

   ```sh
   npm install --save-dev supabase
   npx supabase login
   ```

   `npm install` updates the local `package.json` and lockfile. Use `npx supabase` for the remaining CLI commands; the plain `supabase` command may still not be available globally.
4. Find your project ref under **Project Settings → General** in Supabase, then link this folder and deploy the function:

   ```sh
   npx supabase link --project-ref YOUR-PROJECT-REF
   npx supabase functions deploy team-data
   ```

5. In the Supabase dashboard, open **Edge Functions → Secrets** (sometimes shown under **Project Settings → Edge Functions**) and add a secret:
   - Name: `TEAM_SHARED_PASSCODE`
   - Value: choose a private passphrase of at least 12 characters. Share it only with your team.

   Click **Save**. Supabase provides the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions automatically. Never copy the service-role key into `config.js`, the website, or a message. If you already deployed the function, saving the secret should make it available to the function; if Supabase reports otherwise, redeploy it with `npx supabase functions deploy team-data`.
6. In project settings, copy the project URL and publishable key. Set them in [`config.js`](./config.js):

   ```js
   window.APP_CONFIG = {
     functionUrl: 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/team-data',
     publishableKey: 'YOUR_SUPABASE_PUBLISHABLE_KEY'
   };
   ```

   The publishable key is intended for browser use. The database stays protected by the Edge Function and its server-side passcode check.

The first successful connection adds example content to an empty team database. The FOH, singer monitor, and pastor/interpreter guides are also added to existing team databases the first time the updated function is deployed and opened. Existing guide edits are preserved. You can edit or delete the examples in the app.

To deploy a future change to the Supabase function, run `npx supabase functions deploy team-data` again. Website changes are published separately by pushing to GitHub.

## Publish with GitHub Pages

1. Create a GitHub repository, for example `church-tech-team`.
2. In a terminal at this project folder, stage and push the project. If you have not yet connected this folder to GitHub, follow GitHub's instructions to create a repository and add it as `origin` first.

   ```sh
   git add index.html styles.css app.js config.js README.md .gitignore .github/workflows/deploy.yml supabase
   git commit -m "Add shared team data"
   git push
   ```

3. In the GitHub repository, open **Settings → Pages** and choose **GitHub Actions** as the deployment source if needed.
4. Open **Actions**, wait for **Deploy to GitHub Pages** to finish, then use the URL shown in the Pages settings.

The Pages workflow publishes only the static website files, not the Supabase function source. Push future website changes to `main` to publish them.

## Run locally

After configuring `config.js` and deploying the Supabase function, serve this folder using a local web server (for example `python3 -m http.server 8000`) and open `http://localhost:8000`. Browsers may block the shared-data requests if you open `index.html` directly as a `file:` URL.
