const DEFAULT_PAGE = "home.md";

const state = {
  currentPage: DEFAULT_PAGE,
  sidebarEntries: []
};

const content = document.getElementById("content");
const sidebar = document.getElementById("sidebar");
const search = document.getElementById("search");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function tokenStore() {
  const tokens = [];
  return {
    put(html) {
      const key = `\u0000${tokens.length}\u0000`;
      tokens.push(html);
      return key;
    },
    restore(value) {
      return value.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
    }
  };
}

function renderInline(raw) {
  const tokens = tokenStore();
  let text = raw;

  text = text.replace(/`([^`]+)`/g, (_, code) => {
    return tokens.put(`<code>${escapeHtml(code)}</code>`);
  });

  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const safeHref = escapeHtml(href.trim());
    return tokens.put(`<a href="${safeHref}">${escapeHtml(label)}</a>`);
  });

  text = text.replace(/\*\*([^*]+)\*\*/g, (_, value) => {
    return tokens.put(`<strong>${escapeHtml(value)}</strong>`);
  });

  return tokens.restore(escapeHtml(text));
}

function slugify(text) {
  return encodeURIComponent(text.replace(/[#*`\[\]()]/g, "").trim());
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let listType = null;

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function closeList() {
    if (!listType) return;
    html.push(`</${listType}>`);
    listType = null;
  }

  function openList(type) {
    if (listType === type) return;
    closeList();
    html.push(`<${type}>`);
    listType = type;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      const title = heading[2].trim();
      html.push(`<h${level} id="${slugify(title)}">${renderInline(title)}</h${level}>`);
      continue;
    }

    const unordered = trimmed.match(/^-\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      openList("ul");
      html.push(`<li>${renderInline(unordered[1])}</li>`);
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      openList("ol");
      html.push(`<li>${renderInline(ordered[1])}</li>`);
      continue;
    }

    closeList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  closeList();
  return html.join("\n");
}

function cleanPagePath(path) {
  const clean = path.replace(/^#\/?/, "").replace(/^\//, "");
  if (!clean || clean === "#") return DEFAULT_PAGE;
  if (clean.includes("..") || clean.startsWith("http")) return DEFAULT_PAGE;
  return clean;
}

function resolveLink(href) {
  const [pathPart, hashPart] = href.split("#");
  const directory = state.currentPage.includes("/")
    ? state.currentPage.slice(0, state.currentPage.lastIndexOf("/") + 1)
    : "";
  const base = new URL(directory, "http://wiki.local/");
  const next = new URL(pathPart || state.currentPage, base);
  const path = next.pathname.replace(/^\//, "");
  return `${path}${hashPart ? `#${hashPart}` : ""}`;
}

function shouldRoute(href) {
  return href && !href.startsWith("#/") && !href.startsWith("http") && !href.startsWith("mailto:") && href.includes(".md");
}

async function loadPage() {
  const page = cleanPagePath(location.hash || DEFAULT_PAGE);
  state.currentPage = page.split("#")[0];
  content.innerHTML = `<p class="loading">正在载入...</p>`;

  try {
    const response = await fetch(state.currentPage);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    content.innerHTML = renderMarkdown(markdown);
    const title = content.querySelector("h1")?.textContent || "大明1914";
    document.title = `${title} - 大明1914`;
    updateActiveLink();
    window.scrollTo({ top: 0 });
  } catch (error) {
    content.innerHTML = `<h1>页面不存在</h1><p class="error">没有找到 <code>${escapeHtml(state.currentPage)}</code>。</p>`;
  }
}

function parseSidebar(markdown) {
  return markdown
    .split("\n")
    .map((line) => {
      const match = line.match(/^(\s*)\*\s+(?:\[([^\]]+)\]\(([^)]+)\)|(.+))$/);
      if (!match) return null;
      return {
        level: match[1].length > 0 ? 2 : 1,
        title: (match[2] || match[4] || "").trim(),
        href: match[3] || ""
      };
    })
    .filter(Boolean);
}

function renderSidebar(entries) {
  const items = entries.map((entry) => {
    if (!entry.href) {
      return `<li class="nav-section">${escapeHtml(entry.title)}</li>`;
    }
    const href = `#/${entry.href}`;
    const child = entry.level > 1 ? " child" : "";
    return `<li><a class="nav-link${child}" href="${escapeHtml(href)}" data-page="${escapeHtml(entry.href)}">${escapeHtml(entry.title)}</a></li>`;
  });

  sidebar.innerHTML = `<ul class="nav-list">${items.join("")}</ul>`;
  updateActiveLink();
}

function updateActiveLink() {
  sidebar.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.page === state.currentPage);
  });
}

async function loadSidebar() {
  const response = await fetch("_sidebar.md");
  const markdown = await response.text();
  state.sidebarEntries = parseSidebar(markdown);
  renderSidebar(state.sidebarEntries);
}

function filterSidebar(query) {
  const normalized = query.trim().toLowerCase();
  sidebar.querySelectorAll(".nav-link").forEach((link) => {
    link.parentElement.hidden = normalized && !link.textContent.toLowerCase().includes(normalized);
  });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;
  const href = link.getAttribute("href");
  if (!shouldRoute(href)) return;
  event.preventDefault();
  location.hash = `#/${resolveLink(href)}`;
});

window.addEventListener("hashchange", loadPage);
search.addEventListener("input", () => filterSidebar(search.value));

loadSidebar();
loadPage();
