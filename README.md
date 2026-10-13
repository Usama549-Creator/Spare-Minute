# SpareMinute

**Find a useful task that fits the time and energy you have right now.**

SpareMinute is a small, local-first task picker. Add a few things you want to do, choose how much time and energy you have, and get a ranked list of tasks that fit your moment.

## What it does

- Add, edit, complete, reopen, and remove tasks.
- Give each task an estimated duration and an effort level: Low, Medium, or High.
- Filter by available time and current energy.
- See the closest time fit first, with completed tasks kept in a separate list.
- Keep your list in this browser without creating an account.

## Run it

SpareMinute has no build step or package dependencies. Serve this folder as static files. If Python is installed, open a terminal in the project folder and run:

```sh
python -m http.server 8000
```

Then visit <http://localhost:8000> in your browser.

## How matching works

A task appears when it is unfinished, its estimated duration is within your available time, and its effort is no higher than your selected energy level. For example, Medium energy includes Low- and Medium-effort tasks. The longest task that still fits appears first.

## Your data

Task data is stored in this browser's `localStorage`. It is not sent to a server or synced to another device. Browser storage is not encrypted, is shared with anyone using the same browser profile, and may be removed when site data is cleared. Avoid putting sensitive information in task titles.

## Contributing

The app uses plain HTML, CSS, and JavaScript. You can make changes directly to `index.html`, `styles.css`, or `app.js`; no dependency installation is needed. Please keep task titles rendered as text, keep the app usable by keyboard, and avoid adding external services that transmit task data.

## License

Released under the MIT License. See [`LICENSE`](LICENSE). 
