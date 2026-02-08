"use strict";

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsEl = document.getElementById("results");

function escapeHTML(text) {
  return String(text ?? "").replace(/[&<>"']/g, (ch) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[ch];
  });
}

function formatNumber(n) {
  try {
    return new Intl.NumberFormat("en-US").format(n);
  } catch {
    return String(n ?? "");
  }
}

function showResults() {
  resultsEl.classList.remove("hidden");
}

function hideResults() {
  resultsEl.classList.add("hidden");
  resultsEl.innerHTML = "";
}

function renderMessage(msg) {
  showResults();
  resultsEl.innerHTML = `<div class="message">${escapeHTML(msg)}</div>`;
}

function renderCountries(list) {
  showResults();

  const html = list.map((c) => {
    const name = c?.name?.common ?? "Unknown";
    const capital = Array.isArray(c?.capital) && c.capital.length ? c.capital.join(", ") : "—";
    const region = c?.region ?? "—";
    const population = formatNumber(c?.population ?? 0);
    const flag = c?.flags?.png || c?.flags?.svg || "";

    return `
      <article class="countryCard">
        <div>
          ${flag ? `<img class="flag" src="${flag}" alt="${escapeHTML(name)} flag" />` : ""}
        </div>

        <div>
          <p class="name">${escapeHTML(name)}</p>
          <p class="meta">Capital: ${escapeHTML(capital)} • Region: ${escapeHTML(region)}</p>
        </div>

        <div class="badge">Pop: ${escapeHTML(population)}</div>
      </article>
    `;
  }).join("");

  resultsEl.innerHTML = html;
}

async function searchCountries() {
  const q = searchInput.value.trim();

  if (!q) {
    hideResults(); // heç nə yazılmayıbsa: nəticə görünməsin
    return;
  }

  searchBtn.disabled = true;
  renderMessage("Loading...");

  try {
    // name endpoint: axtarışa görə ölkə qaytarır
    const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(q)}`;

    const res = await fetch(url);
    if (!res.ok) {
      // 404 -> country not found
      if (res.status === 404) {
        renderMessage("Nəticə tapılmadı.");
        return;
      }
      throw new Error(`HTTP error: ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      renderMessage("Nəticə tapılmadı.");
      return;
    }

    // Səliqə üçün ada görə sort
    data.sort((a, b) => (a?.name?.common || "").localeCompare(b?.name?.common || ""));

    renderCountries(data);
  } catch (err) {
    console.error(err);
    renderMessage("Xəta baş verdi. Console-a bax.");
  } finally {
    searchBtn.disabled = false;
  }
}

searchBtn.addEventListener("click", searchCountries);

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchCountries();
});

// input boşaldılanda nəticəni gizlət
searchInput.addEventListener("input", () => {
  if (!searchInput.value.trim()) hideResults();
});
