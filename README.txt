# Mini Banner Training (Demo Skin)

This is a purely front-end, offline-friendly mock of three steps:

1. **Home (Application Navigator)** – Search or Direct Navigation. Type `SWADDER` to see a result and open it.
2. **SWADDER Key Block** – Enter a demo ID (see Excel). Press **Go**.
3. **SWADDER Form** – Key fields pre-populate from the fake dataset.

No data is persisted; the **Save** button only shows a toast.

## Demo IDs
See: `Fake-Students-for-Training.xlsx` in this folder. Examples include `T00031879`, `T00031880`, ... `T00031888`.

## How to host on GitHub Pages
- Create or open a repo (e.g. `mini-banner-training`).
- Copy these files into the root of that repo.
- Commit and push.
- In GitHub → **Settings → Pages**, select **Deploy from branch: main**, folder **/** (root).
- Your site will be available at: `https://<org-or-username>.github.io/<repo>/`.

## How to host on CampusPress (WordPress) – high-level
- In wp-admin, go to **Media → Add New** and upload the three files: `index.html`, `styles.css`, `app.js` and the `data/` folder (some installs may block `.json` uploads; if so, replace it with a `<script>` tag embedding the dataset and adjust `app.js` to read from `window.STUDENTS`).
- Create a **Page** and add a **Custom HTML** block containing:
  ```html
  <iframe src="https://your-site/path/mini-banner/index.html" style="width:100%;height:85vh;border:0;"></iframe>
  ```
- Or use a plugin that allows you to upload a folder and serve it statically (varies by CampusPress config).

