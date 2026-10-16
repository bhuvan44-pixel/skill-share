"use strict";

(() => {
  const {
    LISTINGS_KEY, PROFILE_KEY, VISITOR_KEY, read, write, makeId
  } = SkillBridgeCore;
  const $ = (selector) => document.querySelector(selector);
  const grid = $("#grid");
  const form = $("#skillForm");
  const modal = $("#detailModal");
  let listings = [];
  let profile = null;
  let visitorId;
  let typeFilter = "all";
  let categoryFilter = "all";
  let mineOnly = false;
  let searchTerm = "";
  let bannerTimer;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function showBanner(message) {
    $("#bannerText").textContent = message;
    $("#banner").hidden = false;
    window.clearTimeout(bannerTimer);
    bannerTimer = window.setTimeout(() => { $("#banner").hidden = true; }, 6500);
  }

  function saveListings() {
    try {
      write(LISTINGS_KEY, listings);
      return true;
    } catch (error) {
      showBanner(`Could not save listings in this browser: ${error.message}`);
      return false;
    }
  }

  function setError(id, message) {
    const field = $(`#${id}`);
    const error = $(`#err-${id}`);
    field.setAttribute("aria-invalid", message ? "true" : "false");
    error.textContent = message;
    error.hidden = !message;
  }

  function setContactError(message) {
    const email = $("#fEmail");
    const phone = $("#fPhone");
    email.setAttribute("aria-invalid", message ? "true" : "false");
    phone.setAttribute("aria-invalid", message ? "true" : "false");
    $("#err-contact").textContent = message;
    $("#err-contact").hidden = !message;
  }

  function validListing(item) {
    return item && typeof item.id === "string" && typeof item.skill === "string" &&
      typeof item.name === "string" && typeof item.category === "string" &&
      (item.type === "offering" || item.type === "lookingfor") &&
      typeof item.createdAt === "string" &&
      (typeof item.email === "string" || typeof item.phone === "string");
  }

  function filteredListings() {
    const query = searchTerm.trim().toLocaleLowerCase();
    const result = listings.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (mineOnly && item.ownerId !== visitorId) return false;
      if (!query) return true;
      return [item.skill, item.name, item.category, item.description]
        .some((value) => String(value || "").toLocaleLowerCase().includes(query));
    });
    const sort = $("#sortSelect").value;
    result.sort((a, b) => {
      if (sort === "oldest") return Date.parse(a.createdAt) - Date.parse(b.createdAt);
      if (sort === "skill") return a.skill.localeCompare(b.skill);
      if (sort === "category") return a.category.localeCompare(b.category);
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
    return result;
  }

  function renderStats() {
    const offering = listings.filter((item) => item.type === "offering").length;
    const looking = listings.length - offering;
    const stats = [
      [listings.length, "listings on this device"],
      [offering, "offering to teach"],
      [looking, "looking for a peer"]
    ];
    const strip = $("#statStrip");
    strip.replaceChildren();
    stats.forEach(([count, label]) => {
      const item = element("li");
      item.append(element("strong", "", String(count)), element("span", "", label));
      strip.append(item);
    });
    $("#liveCount").textContent = `${listings.length} ${listings.length === 1 ? "listing" : "listings"}`;
    $("#demandHint").hidden = looking === 0;
    $("#demandHint").textContent = looking ? `${looking} peer ${looking === 1 ? "is" : "are"} looking for help.` : "";
  }

  function renderProfile() {
    const bar = $("#profileBar");
    bar.hidden = !profile;
    if (!profile) return;
    $("#profileName").textContent = profile.name;
    $("#profileContact").textContent = profile.email || profile.phone;
    $("#profileAvatar").textContent = profile.name.trim().charAt(0).toLocaleUpperCase();
    $("#fName").value = profile.name;
    $("#fEmail").value = profile.email || "";
    $("#fPhone").value = profile.phone || "";
  }

  function renderChips() {
    const categories = [...new Set(listings.map((item) => item.category))].sort((a, b) => a.localeCompare(b));
    const row = $("#chipRow");
    row.replaceChildren();
    [["all", "All categories"], ...categories.map((category) => [category, category])].forEach(([value, label]) => {
      const chip = element("button", `chip-btn${categoryFilter === value ? " is-active" : ""}`, label);
      chip.type = "button";
      chip.setAttribute("aria-pressed", String(categoryFilter === value));
      chip.addEventListener("click", () => {
        categoryFilter = value;
        render();
      });
      row.append(chip);
    });
  }

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Recently" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
  }

  function renderCards() {
    const shown = filteredListings();
    grid.replaceChildren();
    shown.forEach((item) => {
      const card = element("article", "listing-card");
      const top = element("div", "card-top");
      const badge = element("span", `badge${item.type === "lookingfor" ? " badge--lookingfor" : ""}`, item.type === "offering" ? "Offering" : "Looking for");
      top.append(badge, element("span", "chip", item.category));
      card.append(top, element("h3", "card-title", item.skill));
      if (item.description) card.append(element("p", "card-desc", item.description));
      const meta = element("div", "card-meta");
      meta.append(element("span", "", `By ${item.name}`), element("span", "", "·"), element("span", "", formatDate(item.createdAt)));
      card.append(meta);
      const open = element("button", "btn btn-ghost btn-sm card-open", "View listing");
      open.type = "button";
      open.addEventListener("click", () => openListing(item.id));
      card.append(open);
      grid.append(card);
    });

    $("#resultsMeta").textContent = `Showing ${shown.length} of ${listings.length} ${listings.length === 1 ? "listing" : "listings"}`;
    $("#emptyState").hidden = shown.length > 0;
    $("#emptyTitle").textContent = listings.length ? "No matching listings" : "No listings yet";
    $("#emptySub").textContent = listings.length ? "Try changing your search or filters." : "Be the first to post a skill on this device.";
    $("#clearFilters").hidden = !listings.length || (!searchTerm && typeFilter === "all" && categoryFilter === "all" && !mineOnly);
    const ownCount = listings.filter((item) => item.ownerId === visitorId).length;
    $("#mineBtn").hidden = ownCount === 0;
    $("#mineBtn").setAttribute("aria-pressed", String(mineOnly));
  }

  function render() {
    renderStats();
    renderProfile();
    renderChips();
    renderCards();
  }

  function openListing(id) {
    const item = listings.find((listing) => listing.id === id);
    if (!item) return;
    $("#modalBadge").textContent = item.type === "offering" ? "Offering to teach" : "Looking for a peer";
    $("#modalBadge").className = `badge${item.type === "lookingfor" ? " badge--lookingfor" : ""}`;
    $("#modalTitle").textContent = item.skill;
    $("#modalCategory").textContent = item.category;
    $("#modalDesc").textContent = item.description || "No description provided.";
    $("#modalName").textContent = item.name;
    $("#modalDate").textContent = formatDate(item.createdAt);
    $("#modalContact").replaceChildren();
    $("#modalContact").hidden = true;
    $("#contactActions").hidden = true;
    $("#revealContact").hidden = false;
    $("#contactNote").hidden = false;
    $("#contactNote").textContent = "This poster’s contact details are hidden until you reveal them.";
    $("#modalPermalink").href = `#listing=${encodeURIComponent(item.id)}`;
    $("#revealContact").onclick = () => revealContact(item);
    if (!modal.open) modal.showModal();
  }

  function revealContact(item) {
    const block = $("#modalContact");
    block.replaceChildren();
    if (item.email) {
      const email = element("a", "", item.email);
      email.href = `mailto:${item.email}`;
      block.append(email);
    }
    if (item.phone) {
      const phone = element("a", "", item.phone);
      phone.href = `tel:${item.phone.replace(/[^\d+]/g, "")}`;
      block.append(phone);
    }
    block.hidden = false;
    $("#contactNote").hidden = true;
    $("#revealContact").hidden = true;
    $("#contactActions").hidden = false;
    $("#copyContact").onclick = async () => {
      const details = [item.email, item.phone].filter(Boolean).join(" · ");
      try {
        await navigator.clipboard.writeText(details);
        $("#copyNote").hidden = false;
      } catch (error) {
        showBanner(`Could not copy contact details: ${error.message}`);
      }
    };
    $("#hideContact").onclick = () => {
      block.replaceChildren();
      block.hidden = true;
      $("#contactActions").hidden = true;
      $("#copyNote").hidden = true;
      $("#contactNote").hidden = false;
      $("#revealContact").hidden = false;
    };
  }

  function validateForm() {
    const name = $("#fName").value.trim();
    const skill = $("#fSkill").value.trim();
    const category = $("#fCategory").value;
    const email = $("#fEmail").value.trim();
    const phone = $("#fPhone").value.trim();
    const description = $("#fDescription").value.trim();
    const validName = Boolean(name) && name.length <= 60;
    const validSkill = Boolean(skill) && skill.length <= 60;
    const validCategory = Boolean(category);
    const validPhone = !phone || /^\+?[\d\s().-]{7,20}$/.test(phone);
    const validContact = Boolean(email) !== Boolean(phone) &&
      (!email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && validPhone;
    setError("fName", validName ? "" : "Enter your name (up to 60 characters).");
    setError("fSkill", validSkill ? "" : "Enter a skill (up to 60 characters).");
    setError("fCategory", validCategory ? "" : "Choose a category.");
    setContactError(validContact ? "" : "Enter exactly one valid email address or phone number.");
    setError("fDescription", description.length <= 240 ? "" : "Keep the description within 240 characters.");
    return validName && validSkill && validCategory && validContact && description.length <= 240;
  }

  function submitForm(event) {
    event.preventDefault();
    if (!validateForm()) return;
    const data = new FormData(form);
    const name = String(data.get("name")).trim();
    const email = String(data.get("email")).trim();
    const phone = String(data.get("phone")).trim();
    const item = {
      id: makeId(),
      ownerId: visitorId,
      name,
      skill: String(data.get("skill")).trim(),
      type: String(data.get("type")),
      category: String(data.get("category")),
      email,
      phone,
      description: String(data.get("description")).trim(),
      createdAt: new Date().toISOString()
    };
    const previous = listings;
    listings = [item, ...listings];
    if (!saveListings()) {
      listings = previous;
      return;
    }
    profile = { name, email, phone };
    try {
      write(PROFILE_KEY, profile);
    } catch (error) {
      showBanner(`Listing saved, but the profile could not be saved: ${error.message}`);
    }
    form.reset();
    $("#descCounter").textContent = "0 / 240";
    render();
    showBanner("Your listing is saved in this browser and visible on this device only.");
    document.querySelector(".toolbar").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function exportListings() {
    const file = new Blob([JSON.stringify(listings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = element("a");
    link.href = url;
    link.download = "skillbridge-listings.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importListings(file) {
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed) || !parsed.every(validListing)) {
        throw new Error("The file must contain a JSON array of valid SkillBridge listings.");
      }
      const merged = new Map(listings.map((item) => [item.id, item]));
      parsed.forEach((item) => merged.set(item.id, item));
      const previous = listings;
      listings = [...merged.values()];
      if (!saveListings()) {
        listings = previous;
        return;
      }
      render();
      showBanner(`Imported ${parsed.length} listing${parsed.length === 1 ? "" : "s"}.`);
    } catch (error) {
      showBanner(`Could not import listings: ${error.message}`);
    }
  }

  $("#bannerClose").addEventListener("click", () => { $("#banner").hidden = true; });
  $("#resetForm").addEventListener("click", () => {
    form.reset();
    $("#descCounter").textContent = "0 / 240";
    form.querySelectorAll(".error").forEach((node) => { node.hidden = true; node.textContent = ""; });
    form.querySelectorAll("[aria-invalid]").forEach((node) => node.removeAttribute("aria-invalid"));
  });
  $("#editProfile").addEventListener("click", () => {
    if (!profile) return;
    $("#fName").value = profile.name;
    $("#fEmail").value = profile.email || "";
    $("#fPhone").value = profile.phone || "";
    profile = null;
    try {
      localStorage.removeItem(PROFILE_KEY);
    } catch (error) {
      showBanner(`Could not clear the saved profile: ${error.message}`);
    }
    renderProfile();
    $("#fName").focus();
  });
  $("#clearProfile").addEventListener("click", () => {
    profile = null;
    try {
      localStorage.removeItem(PROFILE_KEY);
    } catch (error) {
      showBanner(`Could not clear the saved profile: ${error.message}`);
    }
    $("#fName").value = "";
    $("#fEmail").value = "";
    $("#fPhone").value = "";
    renderProfile();
  });
  $("#fDescription").addEventListener("input", (event) => {
    $("#descCounter").textContent = `${event.target.value.length} / 240`;
  });
  $("#searchInput").addEventListener("input", (event) => {
    searchTerm = event.target.value;
    renderCards();
  });
  $("#sortSelect").addEventListener("change", renderCards);
  $("#mineBtn").addEventListener("click", () => {
    mineOnly = !mineOnly;
    renderCards();
  });
  $("#clearFilters").addEventListener("click", () => {
    searchTerm = "";
    typeFilter = "all";
    categoryFilter = "all";
    mineOnly = false;
    $("#searchInput").value = "";
    document.querySelectorAll(".filter-btn").forEach((button) => {
      const active = button.dataset.filter === "all";
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    render();
  });
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      typeFilter = button.dataset.filter;
      document.querySelectorAll(".filter-btn").forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle("is-active", active);
        candidate.setAttribute("aria-pressed", String(active));
      });
      renderCards();
    });
  });
  $("#exportBtn").addEventListener("click", exportListings);
  $("#importBtn").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (file) importListings(file);
    event.target.value = "";
  });
  $("#modalClose").addEventListener("click", () => modal.close());
  $("#modalDone").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });
  modal.addEventListener("close", () => {
    if (location.hash.startsWith("#listing=")) history.replaceState(null, "", `${location.pathname}${location.search}`);
  });
  form.addEventListener("submit", submitForm);

  document.querySelectorAll('.site-nav a[href="#mine"]').forEach((link) => {
    link.addEventListener("click", () => {
      if (!$("#mineBtn").hidden) mineOnly = true;
      window.setTimeout(renderCards, 0);
    });
  });
  window.addEventListener("hashchange", () => {
    if (location.hash.startsWith("#listing=")) {
      openListing(decodeURIComponent(location.hash.slice("#listing=".length)));
    }
  });

  try {
    const savedListings = read(LISTINGS_KEY, []);
    if (!Array.isArray(savedListings) || !savedListings.every(validListing)) {
      throw new Error("Saved listing data is invalid. Export a backup before clearing browser data.");
    }
    listings = savedListings;
    profile = read(PROFILE_KEY, null);
    visitorId = read(VISITOR_KEY, null);
    if (!visitorId) {
      visitorId = makeId();
      write(VISITOR_KEY, visitorId);
    }
  } catch (error) {
    listings = [];
    profile = null;
    visitorId = makeId();
    showBanner(`Could not load saved browser data: ${error.message}`);
  }
  render();
  if (location.hash.startsWith("#listing=")) {
    openListing(decodeURIComponent(location.hash.slice("#listing=".length)));
  }
})();
