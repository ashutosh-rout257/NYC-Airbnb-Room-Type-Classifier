// Order must match the model's classes_ (alphabetical, as scikit-learn fits them)
const ROOM_TYPES = [
  { key: "Entire home/apt", short: "Entire home", var: "--accent-entire", glow: "--glow-entire" },
  { key: "Private room", short: "Private room", var: "--accent-private", glow: "--glow-private" },
  { key: "Shared room", short: "Shared room", var: "--accent-shared", glow: "--glow-shared" },
];

const WINDOWS_PER_BUILDING = 24;

const NEIGHBOURHOODS = {
  "Manhattan": ["Harlem", "Upper West Side", "East Village", "Chelsea", "Midtown"],
  "Brooklyn": ["Williamsburg", "Bushwick", "Park Slope", "Bedford-Stuyvesant", "Greenpoint"],
  "Queens": ["Astoria", "Long Island City", "Flushing", "Ridgewood"],
  "Bronx": ["Mott Haven", "Fordham", "Riverdale"],
  "Staten Island": ["St. George", "Tompkinsville"],
};

const form = document.getElementById("predictForm");
const predictBtn = document.getElementById("predictBtn");
const errorBanner = document.getElementById("errorBanner");
const skyline = document.getElementById("skyline");
const probBreakdown = document.getElementById("probBreakdown");
const predictedName = document.getElementById("predictedName");
const boroughSelect = document.getElementById("neighbourhood_group");
const neighbourhoodList = document.getElementById("neighbourhoodList");
const exampleBtn = document.getElementById("exampleBtn");
const themeToggle = document.getElementById("themeToggle");

// Point this at wherever your FastAPI server is running.
const API_BASE = "https://nyc-airbnb-room-type-classifier-213i.onrender.com";

/* ---------- Theme ---------- */

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try { localStorage.setItem("nightstay-theme", theme); } catch { /* ignore */ }
}

function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem("nightstay-theme"); } catch { /* ignore */ }
  if (saved === "light" || saved === "dark") {
    applyTheme(saved);
  } else {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

/* ---------- Skyline + probability breakdown ---------- */

function buildSkyline() {
  skyline.innerHTML = "";
  ROOM_TYPES.forEach((type) => {
    const building = document.createElement("div");
    building.className = "building";
    building.dataset.key = type.key;
    building.style.setProperty("--bcolor", `var(${type.glow})`);

    // Add building window elements
    for (let i = 0; i < WINDOWS_PER_BUILDING; i++) {
      const w = document.createElement("div");
      w.className = "window";
      building.appendChild(w);
    }

    // Attach building label directly under the vertical bar
    const label = document.createElement("div");
    label.className = "building-label";
    label.innerHTML = `<span class="label-name">${type.short}</span><span class="label-pct">0%</span>`;
    building.appendChild(label);

    skyline.appendChild(building);
  });
}

function buildProbBreakdown() {
  probBreakdown.innerHTML = "";
  ROOM_TYPES.forEach((type) => {
    const row = document.createElement("li");
    row.className = "prob-row";
    row.dataset.key = type.key;
    row.style.setProperty("--pcolor", `var(${type.var})`);
    row.innerHTML = `
      <span class="prob-line">
        <span class="prob-label"><span class="swatch"></span>${type.short}</span>
        <span class="prob-pct">—</span>
      </span>
      <span class="prob-track"><span class="prob-fill"></span></span>
    `;
    probBreakdown.appendChild(row);
  });
}

function populateNeighbourhoods(borough) {
  neighbourhoodList.innerHTML = "";
  (NEIGHBOURHOODS[borough] || []).forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    neighbourhoodList.appendChild(opt);
  });
}

function showError(message) {
  errorBanner.textContent = message;
  errorBanner.hidden = false;
}
function clearError() {
  errorBanner.hidden = true;
  errorBanner.textContent = "";
}

function collectPayload() {
  return {
    latitude: parseFloat(document.getElementById("latitude").value),
    longitude: parseFloat(document.getElementById("longitude").value),
    price: parseFloat(document.getElementById("price").value),
    minimum_nights: parseInt(document.getElementById("minimum_nights").value, 10),
    number_of_reviews: parseInt(document.getElementById("number_of_reviews").value, 10),
    reviews_per_month: parseFloat(document.getElementById("reviews_per_month").value),
    calculated_host_listings_count: parseInt(document.getElementById("calculated_host_listings_count").value, 10),
    availability_365: parseInt(document.getElementById("availability_365").value, 10),
    neighbourhood_group: document.getElementById("neighbourhood_group").value,
    neighbourhood: document.getElementById("neighbourhood").value.trim(),
  };
}

function setLoading(isLoading) {
  predictBtn.disabled = isLoading;
  predictBtn.classList.toggle("loading", isLoading);
}

function animateCount(el, target) {
  const start = 0;
  const duration = 650;
  const startTime = performance.now();
  function step(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const value = Math.round(start + (target - start) * eased);
    el.textContent = `${value}%`;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function lightUpBuilding(key, probability, isWinner) {
  const building = skyline.querySelector(`.building[data-key="${CSS.escape(key)}"]`);
  const row = probBreakdown.querySelector(`.prob-row[data-key="${CSS.escape(key)}"]`);
  const windows = building.querySelectorAll(".window");
  const litCount = Math.round(probability * WINDOWS_PER_BUILDING);
  const color = getComputedStyle(building).getPropertyValue("--bcolor");
  const pct = Math.round(probability * 100);

  building.classList.toggle("winner", isWinner);
  row.classList.toggle("top", isWinner);
  animateCount(row.querySelector(".prob-pct"), pct);
  row.querySelector(".prob-fill").style.width = `${pct}%`;
  building.querySelector(".building-label .label-pct").textContent = `${pct}%`;

  windows.forEach((w) => {
    w.classList.remove("lit");
    w.style.removeProperty("--wcolor");
  });
  windows.forEach((w, i) => {
    if (i >= litCount) return;
    setTimeout(() => {
      w.style.setProperty("--wcolor", color);
      w.classList.add("lit");
    }, i * 22);
  });
}

async function handleSubmit(event) {
  event.preventDefault();
  clearError();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const payload = collectPayload();
  setLoading(true);
  predictedName.textContent = "Thinking…";

  try {
    const res = await fetch(API_BASE + "/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let detail = `Request failed (HTTP ${res.status}).`;
      try {
        const data = await res.json();
        if (Array.isArray(data.detail) && data.detail.length) {
          const first = data.detail[0];
          detail = `${first.loc?.slice(-1)[0] ?? "Field"}: ${first.msg}`;
        } else if (typeof data.detail === "string") {
          detail = data.detail;
        }
      } catch { /* ignore parse errors */ }
      throw new Error(detail);
    }

    const data = await res.json();
    const probs = data.Probability || [];
    const predicted = data.Predicted_room_type;

    ROOM_TYPES.forEach((type, i) => {
      lightUpBuilding(type.key, probs[i] ?? 0, type.key === predicted);
    });

    predictedName.textContent = predicted;
  } catch (err) {
    predictedName.textContent = "No result";
    if (err.message && err.message.includes("Failed to fetch")) {
      showError(`Couldn't reach the API at ${API_BASE}. Check that your FastAPI server is running there and that CORS is enabled.`);
    } else {
      showError(err.message || "Something went wrong while predicting.");
    }
  } finally {
    setLoading(false);
  }
}

function fillExample() {
  document.getElementById("latitude").value = 40.6892;
  document.getElementById("longitude").value = -73.9905;
  document.getElementById("neighbourhood_group").value = "Brooklyn";
  populateNeighbourhoods("Brooklyn");
  document.getElementById("neighbourhood").value = "Bushwick";
  document.getElementById("price").value = 85;
  document.getElementById("minimum_nights").value = 2;
  document.getElementById("number_of_reviews").value = 118;
  document.getElementById("reviews_per_month").value = 3.4;
  document.getElementById("calculated_host_listings_count").value = 1;
  document.getElementById("availability_365").value = 95;
}

boroughSelect.addEventListener("change", (e) => populateNeighbourhoods(e.target.value));
exampleBtn.addEventListener("click", fillExample);
form.addEventListener("submit", handleSubmit);

initTheme();
buildSkyline();
buildProbBreakdown();
populateNeighbourhoods(boroughSelect.value);