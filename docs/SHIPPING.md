# Shipping: auto-update & code signing

Installer product name remains **LMS PDF Downloader** (electron-builder). In-app brand is **LMS Study Pack**.

## Auto-update (GitHub Releases)

1. Add dependency (if not already): `npm install electron-updater --save`
2. Publish releases with electron-builder + GitHub token:

```bash
# Windows build machine
set GH_TOKEN=github_pat_...
npm run dist
# Then create a GitHub Release for tag vX.Y.Z and attach the Setup.exe + latest.yml
```

`electron-builder.yml` is configured to publish to GitHub when `GH_TOKEN` is set. The Electron main process checks for updates **only when packaged** (not in `ELECTRON_DEV`).

Students get: start app → optional “Update available” via the updater (log + dialog).

### Release checklist

1. Bump `version` in `package.json` (and Header badge if shown).
2. `npm run dist` on Windows.
3. Tag `vX.Y.Z`, create GitHub Release, upload `LMS PDF Downloader-*-Setup.exe` and `latest.yml` from `release/`.

## Code signing (Windows)

Unsigned builds show SmartScreen. To sign:

1. Obtain an **Authenticode** code signing certificate (EV preferred for reputation).
2. On the build machine:

```bash
set CSC_LINK=C:\path\to\cert.pfx
set CSC_KEY_PASSWORD=********
# Optional: remove CSC_IDENTITY_AUTO_DISCOVERY=false from dist script once signing works
npm run dist
```

3. In `electron-builder.yml`, you can re-enable:

```yaml
win:
  signAndEditExecutable: true
```

when a cert is present.

**Without a cert:** keep `signAndEditExecutable: false` and document “More info → Run anyway” for students.

## macOS notarization (later)

Requires Apple Developer ID + notarize credentials (`APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`). Build on macOS only.

## Privacy note

Updates download installers from **your** GitHub Releases. Session cookies and course files never leave the student’s machine for updates.
