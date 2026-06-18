const RELEASES_API = "https://api.github.com/repos/impleotv/stview-app-release/releases?per_page=100";
const RELEASES_URL = "https://github.com/impleotv/stview-app-release/releases";

const platforms = [
  {
    id: "windows",
    label: "Windows",
    icon: "assets/platform-windows.svg",
    description: "MSI installer for Windows x64.",
    pattern: /windows-x64\.msi$/i,
    unavailableLatest: "Coming soon",
    unavailableHistory: "Not available for this version",
  },
  {
    id: "macos",
    label: "macOS",
    icon: "assets/platform-macos.svg",
    description: "DMG package for Apple Silicon and supported macOS builds.",
    pattern: /macos-.*\.dmg$/i,
    unavailableLatest: "Coming soon",
    unavailableHistory: "Not available for this version",
  },
  {
    id: "linux",
    label: "Linux",
    icon: "assets/platform-linux.svg",
    description: "DEB package for Debian and Ubuntu compatible distributions.",
    pattern: /linux-.*\.deb$/i,
    unavailableLatest: "Coming soon",
    unavailableHistory: "Not available for this version",
  },
];

const latestVersion = document.querySelector("[data-latest-version]");
const latestDate = document.querySelector("[data-latest-date]");
const latestNotes = document.querySelector("[data-latest-notes]");
const downloadGrid = document.querySelector("[data-download-grid]");
const versionRows = document.querySelector("[data-version-rows]");
const statusMessage = document.querySelector("[data-status-message]");

init();

async function init() {
  try {
    const response = await fetch(RELEASES_API, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub returned HTTP ${response.status}`);
    }

    const releases = await response.json();
    const stableReleases = releases.filter((release) => !release.draft && !release.prerelease);

    if (!stableReleases.length) {
      renderEmptyState("No stable STView releases have been published yet.");
      return;
    }

    const [latest, ...older] = stableReleases;
    renderLatest(latest);
    renderDownloads(latest);
    renderHistory(older.length ? older : stableReleases);
  } catch (error) {
    console.error(error);
    renderEmptyState("Could not load GitHub releases. Open the GitHub releases page to download STView.");
  }
}

function renderLatest(release) {
  latestVersion.textContent = release.tag_name || release.name || "Latest release";
  latestDate.textContent = formatDate(release.published_at);
  latestNotes.href = release.html_url || RELEASES_URL;
}

function renderDownloads(release) {
  const assets = getPlatformAssets(release);
  downloadGrid.innerHTML = platforms.map((platform) => renderDownloadCard(platform, assets[platform.id])).join("");
  statusMessage.textContent = `Showing packages from ${release.tag_name}.`;
}

function renderDownloadCard(platform, asset) {
  const safeLabel = escapeHtml(platform.label);
  const action = asset
    ? `<a class="download-button" href="${escapeAttribute(asset.browser_download_url)}">Download ${safeLabel}</a>`
    : `<span class="unavailable">${platform.unavailableLatest}</span>`;
  const size = asset ? `<p class="asset-size">${escapeHtml(asset.name)} - ${formatBytes(asset.size)}</p>` : "";

  return `
    <article class="download-card">
      <img class="card-icon" src="${escapeAttribute(platform.icon)}" alt="" width="56" height="56">
      <h3>${safeLabel}</h3>
      <p>${escapeHtml(platform.description)}</p>
      ${size}
      ${action}
    </article>
  `;
}

function renderHistory(releases) {
  versionRows.innerHTML = releases.map((release) => {
    const assets = getPlatformAssets(release);
    const assetLinks = platforms
      .map((platform) => renderHistoryAssetLink(platform, assets[platform.id]))
      .join("");

    return `
      <tr>
        <td>
          <span class="version-name">${escapeHtml(release.tag_name || release.name || "Release")}</span>
        </td>
        <td>${escapeHtml(formatDate(release.published_at))}</td>
        <td><div class="asset-links">${assetLinks}</div></td>
        <td><a class="text-link" href="${escapeAttribute(release.html_url || RELEASES_URL)}">Release notes</a></td>
      </tr>
    `;
  }).join("");
}

function renderHistoryAssetLink(platform, asset) {
  if (!asset) {
    return `<span class="asset-link muted" title="${escapeAttribute(platform.unavailableHistory)}">${escapeHtml(platform.label)} unavailable</span>`;
  }

  return `<a class="asset-link" href="${escapeAttribute(asset.browser_download_url)}">${escapeHtml(platform.label)}</a>`;
}

function renderEmptyState(message) {
  latestVersion.textContent = "Unavailable";
  latestDate.textContent = "GitHub releases could not be loaded";
  latestNotes.href = RELEASES_URL;
  downloadGrid.innerHTML = platforms.map((platform) => renderDownloadCard(platform, null)).join("");
  statusMessage.textContent = message;
  versionRows.innerHTML = `
    <tr>
      <td colspan="4">
        ${escapeHtml(message)}
        <a class="text-link" href="${RELEASES_URL}">Open GitHub releases</a>
      </td>
    </tr>
  `;
}

function getPlatformAssets(release) {
  const result = {};

  for (const platform of platforms) {
    result[platform.id] = (release.assets || []).find((asset) => platform.pattern.test(asset.name));
  }

  return result;
}

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatBytes(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "Unknown size";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
