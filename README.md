STView release artifacts and download website.

The GitHub Pages site is a plain static page. It fetches public release data
from GitHub at runtime and renders download links for the latest stable release
plus older versions.

## Release process

The local `stview-app` release command creates and pushes matching `vX.Y.Z` tags
in both `impleotv/stview-app` and `impleotv/stview-core` before publishing a
release in this repository. When a release is published here, the workflow
dispatches a build event to `impleotv/stview-app`, where the source code lives.
The source repository builds Linux amd64 and macOS arm64 packages, then uploads
the `.deb` and `.dmg` assets back to this release.

The Windows MSI and signed `stview-update.json` / `stview-update.json.sig`
manifest are still produced by the local Windows release flow. The GitHub
Actions workflow only appends Linux and macOS package assets and does not
regenerate or replace update manifests.

Configure a repository secret named `STVIEW_APP_DISPATCH_TOKEN` with permission
to create repository dispatch events in `impleotv/stview-app`. The build
workflow in `impleotv/stview-app` owns source checkout and package upload.

macOS packages built by GitHub Actions are unsigned for now. Users may see
Gatekeeper warnings when opening downloaded DMGs.
