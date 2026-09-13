# valdkerpos-admin

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## Serving the public site (`app.valdker.web.id`)

The Cloudflare Tunnel sends `app.valdker.web.id` and `valdker.web.id` to
`http://localhost:5173` (see `~/.cloudflared/config.yml`).

Today that port is the **Vite dev server** (`npm run dev`), which reads the
working tree live. Anything that changes the working tree changes or breaks the
public site immediately. `git checkout` of another branch publishes that branch.
`npm install` / `npm ci` replace `node_modules` under the running process, and
has already taken the site down once.

Serving the built bundle with `vite preview` removes both risks: it serves
`dist/`, which only changes when you run a build. It uses `.env.production`, and
`preview.allowedHosts` in `vite.config.js` already admits both public hostnames
(other `Host` headers get `403`).

### Switching over

1. Build:

   ```sh
   npm run build
   ```

2. **Stop the dev server, then confirm nothing is listening on 5173.** Do not
   skip the check. On this Windows machine the dev server binds IPv4
   (`0.0.0.0:5173`) and `vite preview --host` can bind the same port on IPv6
   **alongside it without an error** — `strictPort` does not catch this.
   `localhost` resolves to `::1` first, so the tunnel would then send some
   traffic to one server and some to the other.

   ```powershell
   Get-NetTCPConnection -LocalPort 5173 -State Listen   # must print nothing
   ```

3. Start the preview server on the tunnel's port:

   ```sh
   npx vite preview --port 5173 --host
   # or: npm run preview -- --port 5173 --host
   ```

4. Open `https://app.valdker.web.id/` and a deep link such as
   `https://app.valdker.web.id/dashboard`. Deep links must load the app, not a
   404; `vite preview` serves `index.html` for unknown paths.

### Deploying after the switch

Run `npm run build` again. The preview server serves the new `dist/` at once;
there is no restart. `dist/` is replaced while it is being served, so requests
during the few seconds of the build can fail. Build at a quiet moment.

`npm install` and `git checkout` no longer affect the public site until the next
build, but the preview process itself still runs from `node_modules`. Avoid
reinstalling dependencies while it is serving, or restart it afterwards.

### Switching back

Stop the preview server, confirm port 5173 is free with the same command as
above, then run `npm run dev`.
