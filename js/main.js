/* ==========================================================================
   StudentStay — site behaviour
   Shared: mobile navigation, footer year, saved listings.
   Page-specific code runs based on <body data-page="...">.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Site settings ---------- */
  // Contact form messages are sent to this number (international format, no + or spaces).
  // 033 982076 in Sierra Leone = +232 33 982076
  const STUDENTSTAY_PHONE = "23233982076";

  // Phone verification on the contact form.
  // DEMO_SMS = true: the code is shown on screen as a text-message notification (no SMS service needed).
  // To send real texts, connect an SMS provider (e.g. Firebase Phone Auth, Twilio, Africa's Talking)
  // inside sendVerificationCode() below and set DEMO_SMS to false.
  const DEMO_SMS = true;
  const CODE_LIFETIME_MS = 5 * 60 * 1000;   // code valid for 5 minutes
  const RESEND_WAIT_S = 30;                 // seconds before "Resend code" works again
  const MAX_ATTEMPTS = 3;                   // wrong tries before a new code is needed

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const formatPrice = (n) => "SLE " + n.toLocaleString("en-GB");
  const escapeHTML = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Small inline icon set (used in generated markup) ---------- */
  const ICONS = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
    bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 18V6M3 12h18v6M21 18v-4a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="10" r="1.6"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>',
    heart: '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 6a5 5 0 0 1 9.2 5c-2.2 4.6-9.2 9-9.2 9z"/></svg>'
  };

  /* ---------- Saved listings (stored in the browser) ---------- */
  const SAVE_KEY = "studentstay_saved";
  const Saved = {
    get() {
      let ids = [];
      try { ids = JSON.parse(localStorage.getItem(SAVE_KEY)) || []; } catch (e) { ids = []; }
      // Ignore saved IDs for listings that no longer exist
      return ids.filter((id) => LISTINGS.some((l) => l.id === id));
    },
    set(ids) {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(ids)); } catch (e) { /* storage unavailable */ }
      updateSavedCount();
    },
    has(id) { return this.get().includes(id); },
    toggle(id) {
      const ids = this.get();
      const i = ids.indexOf(id);
      if (i > -1) ids.splice(i, 1); else ids.push(id);
      this.set(ids);
      return i === -1;
    }
  };

  function updateSavedCount() {
    const n = Saved.get().length;
    $$("[data-saved-count]").forEach((el) => { el.textContent = n ? "(" + n + ")" : ""; });
  }

  function saveButton(id, small) {
    const on = Saved.has(id);
    return `<button type="button" class="btn btn--outline save-btn${small ? " btn--sm" : ""}" data-save="${id}" aria-pressed="${on}">
      ${ICONS.heart}<span>${on ? "Saved" : "Save"}</span></button>`;
  }

  // One delegated handler for every Save button on any page
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-save]");
    if (!btn) return;
    const nowSaved = Saved.toggle(btn.dataset.save);
    $$(`[data-save="${btn.dataset.save}"]`).forEach((b) => {
      b.setAttribute("aria-pressed", String(nowSaved));
      $("span", b).textContent = nowSaved ? "Saved" : "Save";
    });
    if (document.body.dataset.page === "saved") renderCompare();
  });

  /* ---------- Mobile navigation ---------- */
  const toggle = $(".nav-toggle");
  const nav = $("#main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        toggle.focus();
      }
    });
  }

  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  updateSavedCount();

  /* ---------- Form validation helpers ---------- */
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = (v) => v.replace(/\D/g, "").length >= 8;

  // rules: { fieldId: [testFn, "message"] }
  function validate(form, rules) {
    let firstBad = null;
    Object.entries(rules).forEach(([id, [test, msg]]) => {
      const field = $("#" + id, form);
      const error = $("#" + id + "-error", form);
      const ok = test(field.value.trim(), field);
      field.setAttribute("aria-invalid", String(!ok));
      if (error) error.textContent = ok ? "" : msg;
      if (!ok && !firstBad) firstBad = field;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  function showAlert(el, text) {
    el.textContent = text;
    el.hidden = false;
  }

  function storePush(key, item) {
    try {
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      arr.push(item);
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (e) { /* storage unavailable */ }
  }

  function fillSelect(select, values) {
    if (!select) return;
    values.forEach((v) => select.add(new Option(v, v)));
  }

  /* ---------- Shared listing markup ---------- */
  function cardHTML(l) {
    return `<article class="card listing-card">
      <img src="${l.image}" alt="${escapeHTML(l.alt)}" width="1200" height="800" loading="lazy">
      <div class="body">
        <h3>${escapeHTML(l.name)}</h3>
        <p class="meta"><span class="price">${formatPrice(l.price)}</span> / month · ${escapeHTML(l.location)}</p>
      </div>
      <a class="btn btn--block" href="listing.html?id=${l.id}">View Details</a>
    </article>`;
  }

  function resultHTML(l) {
    return `<li class="card result">
      <img src="${l.image}" alt="${escapeHTML(l.alt)}" width="1200" height="800" loading="lazy">
      <div>
        <h3><a href="listing.html?id=${l.id}">${escapeHTML(l.name)}</a> <span class="badge">${escapeHTML(l.type)}</span></h3>
        <ul class="facts">
          <li>${ICONS.pin}<strong>Location:</strong> ${escapeHTML(l.location)}</li>
          <li>${ICONS.tag}<strong>Price:</strong> ${formatPrice(l.price)} / month</li>
          <li>${ICONS.list}<strong>Facilities:</strong> ${l.facilities.join(", ")}</li>
        </ul>
      </div>
      <div class="result-actions">
        <a class="btn" href="listing.html?id=${l.id}">View Details</a>
        ${saveButton(l.id)}
      </div>
    </li>`;
  }

  /* ======================================================================
     PAGE: Home
     ====================================================================== */
  function initHome() {
    fillSelect($("#home-location"), LOCATIONS);
    fillSelect($("#home-type"), ROOM_TYPES);
    const grid = $("#featured-grid");
    if (grid) grid.innerHTML = LISTINGS.filter((l) => l.featured).map(cardHTML).join("");
  }

  /* ======================================================================
     PAGE: Accommodation search results
     ====================================================================== */
  function initSearch() {
    const form = $("#filter-form");
    const list = $("#result-list");
    const count = $("#results-count");
    const chips = $("#active-filters");
    const sort = $("#sort");

    fillSelect($("#f-location"), LOCATIONS);
    fillSelect($("#f-type"), ROOM_TYPES);
    $("#f-facilities").innerHTML = FACILITIES.map(
      (f) => `<label class="check"><input type="checkbox" name="facility" value="${f}"> ${f}</label>`
    ).join("");

    // Pre-fill filters from the home page search (URL query string)
    const params = new URLSearchParams(location.search);
    if (params.get("location")) form.location.value = params.get("location");
    if (params.get("type")) form.type.value = params.get("type");
    if (params.get("min")) form.min.value = params.get("min");
    if (params.get("max")) form.max.value = params.get("max");

    function readFilters() {
      return {
        location: form.location.value,
        type: form.type.value,
        min: parseInt(form.min.value, 10) || 0,
        max: parseInt(form.max.value, 10) || Infinity,
        facilities: $$('input[name="facility"]:checked', form).map((i) => i.value)
      };
    }

    function render() {
      const f = readFilters();
      let results = LISTINGS.filter((l) =>
        (!f.location || l.location === f.location) &&
        (!f.type || l.type === f.type) &&
        l.price >= f.min && l.price <= f.max &&
        f.facilities.every((fac) => l.facilities.includes(fac))
      );

      if (sort.value === "price-asc") results.sort((a, b) => a.price - b.price);
      if (sort.value === "price-desc") results.sort((a, b) => b.price - a.price);
      if (sort.value === "name") results.sort((a, b) => a.name.localeCompare(b.name));

      count.textContent = results.length === 1 ? "1 place found" : results.length + " places found";

      list.innerHTML = results.length
        ? results.map(resultHTML).join("")
        : `<li class="card empty-state">
             <h2>No places match these filters</h2>
             <p>Try a wider price range or remove a facility.</p>
             <button type="button" class="btn" data-clear>Clear all filters</button>
           </li>`;

      // Active filter chips: each one removes its own filter when clicked
      const active = [];
      if (f.location) active.push(["location", f.location]);
      if (f.type) active.push(["type", f.type]);
      if (form.min.value) active.push(["min", "From " + formatPrice(f.min)]);
      if (form.max.value) active.push(["max", "Up to " + formatPrice(f.max)]);
      f.facilities.forEach((fac) => active.push(["facility:" + fac, fac]));
      chips.innerHTML = active.map(
        ([key, label]) => `<button type="button" class="chip" data-remove="${key}" aria-label="Remove filter: ${label}">${label} <span aria-hidden="true">×</span></button>`
      ).join("");
    }

    function clearAll() {
      form.reset();
      history.replaceState(null, "", location.pathname);
      render();
    }

    form.addEventListener("submit", (e) => { e.preventDefault(); render(); });
    form.addEventListener("change", render);
    sort.addEventListener("change", render);
    $("#clear-filters").addEventListener("click", clearAll);

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-clear]")) clearAll();
      const chip = e.target.closest("[data-remove]");
      if (!chip) return;
      const key = chip.dataset.remove;
      if (key.startsWith("facility:")) {
        const box = $(`input[name="facility"][value="${key.slice(9)}"]`, form);
        if (box) box.checked = false;
      } else {
        form[key].value = "";
      }
      render();
    });

    render();
  }

  /* ======================================================================
     PAGE: Listing details
     ====================================================================== */
  function initListing() {
    const id = new URLSearchParams(location.search).get("id");
    const l = LISTINGS.find((x) => x.id === id);
    const root = $("#listing-root");

    if (!l) {
      root.innerHTML = `<div class="card empty-state">
        <h1>Listing not found</h1>
        <p>This place may have been rented or removed.</p>
        <a class="btn" href="accommodation.html">Browse all accommodation</a></div>`;
      return;
    }

    document.title = l.name + " | StudentStay";
    $("#crumb-name").textContent = l.name;

    root.innerHTML = `
      <div class="detail-layout">
        <div>
          <figure class="detail-media" style="margin:0">
            <img src="${l.image}" alt="${escapeHTML(l.alt)}" width="1200" height="800">
          </figure>
          <h1 style="margin-top:1.25rem;text-transform:none">${escapeHTML(l.name)}</h1>
          <p>${ICONS.pin.replace("<svg", '<svg style="width:16px;height:16px;vertical-align:-2px;color:var(--navy)"')} ${escapeHTML(l.location)}, ${escapeHTML(l.distance)}</p>
          <h2>About this place</h2>
          <p>${escapeHTML(l.description)}</p>
          <h2>Facilities</h2>
          <ul class="amenities">${l.facilities.map((f) => `<li>${ICONS.check}${f}</li>`).join("")}</ul>
        </div>

        <aside class="card detail-side" aria-labelledby="enquire-title">
          <p class="detail-price">${formatPrice(l.price)} <small>/ month</small></p>
          <dl class="spec-list">
            <div><dt>Room type</dt><dd>${escapeHTML(l.type)}</dd></div>
            <div><dt>Beds</dt><dd>${l.beds}</dd></div>
            <div><dt>Bathroom</dt><dd>${escapeHTML(l.bathroom)}</dd></div>
            <div><dt>Available</dt><dd>${escapeHTML(l.available)}</dd></div>
          </dl>
          <div class="form-actions" style="margin-bottom:1.25rem">
            ${saveButton(l.id)}
            <a class="btn btn--outline" href="saved.html">Compare saved <span data-saved-count></span></a>
          </div>

          <h2 id="enquire-title" style="font-size:1.15rem">Request this room</h2>
          <div class="alert alert--success" id="request-success" role="status" hidden></div>
          <form id="request-form" class="form-grid" novalidate>
            <div class="field">
              <label for="r-name">Full name</label>
              <input id="r-name" name="name" type="text" autocomplete="name" placeholder="Enter your name" aria-describedby="r-name-error">
              <p class="field-error" id="r-name-error"></p>
            </div>
            <div class="field">
              <label for="r-email">Email</label>
              <input id="r-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" aria-describedby="r-email-error">
              <p class="field-error" id="r-email-error"></p>
            </div>
            <div class="field">
              <label for="r-phone">Phone</label>
              <input id="r-phone" name="phone" type="tel" autocomplete="tel" placeholder="+232 ..." aria-describedby="r-phone-error">
              <p class="field-error" id="r-phone-error"></p>
            </div>
            <div class="field">
              <label for="r-date">Preferred move-in date</label>
              <input id="r-date" name="date" type="date" aria-describedby="r-date-error">
              <p class="field-error" id="r-date-error"></p>
            </div>
            <button class="btn btn--block" type="submit">Send request</button>
          </form>

          <div class="provider">
            <p><strong>Provider:</strong> ${escapeHTML(l.provider)}</p>
            <p><strong>Phone:</strong> <a href="tel:${l.phone.replace(/\s/g, "")}">${escapeHTML(l.phone)}</a></p>
          </div>
        </aside>
      </div>

      <section aria-labelledby="similar-title" style="margin-top:3rem">
        <h2 id="similar-title" class="section-title">Similar places</h2>
        <div class="card-grid card-grid--3">
          ${LISTINGS.filter((x) => x.id !== l.id && (x.type === l.type || x.location === l.location)).slice(0, 3).map(cardHTML).join("")}
        </div>
      </section>`;

    updateSavedCount();

    const today = new Date().toISOString().slice(0, 10);
    $("#r-date").min = today;

    $("#request-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.target;
      const ok = validate(form, {
        "r-name": [(v) => v.length >= 2, "Enter your full name."],
        "r-email": [isEmail, "Enter an email address like name@example.com."],
        "r-phone": [isPhone, "Enter a phone number with at least 8 digits."],
        "r-date": [(v) => !!v && v >= today, "Choose a move-in date from today onwards."]
      });
      if (!ok) return;
      storePush("studentstay_requests", {
        listing: l.id, name: form.name.value, email: form.email.value,
        phone: form.phone.value, date: form.date.value, sent: new Date().toISOString()
      });
      form.hidden = true;
      showAlert($("#request-success"),
        `Request sent for ${l.name}. ${l.provider} will contact you at ${form.email.value} within 24 hours.`);
    });
  }

  /* ======================================================================
     PAGE: Saved / compare
     ====================================================================== */
  function renderCompare() {
    const root = $("#compare-root");
    const items = Saved.get().map((id) => LISTINGS.find((l) => l.id === id)).filter(Boolean);

    if (!items.length) {
      root.innerHTML = `<div class="card empty-state">
        <h2>No saved places yet</h2>
        <p>Tap <strong>Save</strong> on any listing to add it here and compare it side by side.</p>
        <a class="btn" href="accommodation.html">Find accommodation</a></div>`;
      return;
    }

    const cheapest = Math.min(...items.map((l) => l.price));
    const most = Math.max(...items.map((l) => l.facilities.length));
    const row = (label, fn) => `<tr><th scope="row">${label}</th>${items.map((l) => `<td>${fn(l)}</td>`).join("")}</tr>`;

    root.innerHTML = `
      <p>${items.length} saved ${items.length === 1 ? "place" : "places"}. Swipe sideways on small screens to see every column.</p>
      <div class="table-scroll card">
        <table class="compare-table">
          <caption class="visually-hidden">Comparison of saved accommodation</caption>
          <thead><tr><th scope="col">Listing</th>${items.map((l) => `<th scope="col">
            <img src="${l.image}" alt="" width="1200" height="800">
            <a href="listing.html?id=${l.id}">${escapeHTML(l.name)}</a></th>`).join("")}</tr></thead>
          <tbody>
            ${row("Price / month", (l) => `<span class="${l.price === cheapest ? "best" : ""}">${formatPrice(l.price)}${l.price === cheapest && items.length > 1 ? " (lowest)" : ""}</span>`)}
            ${row("Location", (l) => escapeHTML(l.location))}
            ${row("Room type", (l) => escapeHTML(l.type))}
            ${row("Bathroom", (l) => escapeHTML(l.bathroom))}
            ${row("Facilities", (l) => `<span class="${l.facilities.length === most && items.length > 1 ? "best" : ""}">${l.facilities.length} of 5</span><br>${l.facilities.join(", ")}`)}
            ${row("Available", (l) => escapeHTML(l.available))}
            ${row("", (l) => saveButton(l.id, true))}
          </tbody>
        </table>
      </div>`;
  }

  /* ======================================================================
     PAGE: Contact
     ====================================================================== */
  /* ---------- Phone numbers (Sierra Leone first) ---------- */
  // Returns "+23233982076" style, or "" if the number is not valid.
  function normalisePhone(raw) {
    const hasPlus = raw.trim().startsWith("+");
    const d = raw.replace(/\D/g, "");
    if (!hasPlus && d.length === 9 && d.startsWith("0")) return "+232" + d.slice(1); // 033 982076
    if (!hasPlus && d.length === 8) return "+232" + d;                                // 33 982076
    if (d.startsWith("232") && d.length === 11) return "+" + d;                       // 232 33 982076
    if (hasPlus && d.length >= 8 && d.length <= 15) return "+" + d;                   // other countries
    return "";
  }
  function prettyPhone(p) {
    return p.startsWith("+232") ? `+232 ${p.slice(4, 6)} ${p.slice(6)}` : p;
  }

  function makeCode() {
    const n = new Uint32Array(1);
    crypto.getRandomValues(n);
    return String(n[0] % 1000000).padStart(6, "0");
  }

  // Sends the code. Demo mode shows it as an on-screen text message.
  function sendVerificationCode(phone, code) {
    if (DEMO_SMS) {
      const toast = $("#sms-toast");
      $("#sms-to").textContent = prettyPhone(phone);
      $("#sms-code").textContent = code;
      toast.hidden = false;
      toast.classList.remove("is-in");
      void toast.offsetWidth; // restart the slide-in animation
      toast.classList.add("is-in");
      clearTimeout(sendVerificationCode.t);
      sendVerificationCode.t = setTimeout(() => { toast.hidden = true; }, 30000);
      return Promise.resolve();
    }
    // Real SMS: call your provider here (through a server or cloud function, never with a secret key in this file).
    return Promise.reject(new Error("No SMS service connected"));
  }

  /* ======================================================================
     PAGE: Contact (step 1: details, step 2: verify phone, then send)
     ====================================================================== */
  function initContact() {
    const form = $("#contact-form");
    const step2 = $("#verify-step");
    const verifyForm = $("#verify-form");
    const codeInput = $("#v-code");
    const panel = $("#contact-send");
    const resendBtn = $("#resend-code");
    const timerEl = $("#resend-timer");
    let pending = null;   // { name, email, phone, message, code, expires, attempts }
    let countdown = null;

    const params = new URLSearchParams(location.search);
    const about = LISTINGS.find((l) => l.id === params.get("listing"));
    if (about) form.message.value = `Hello, I would like to ask about "${about.name}" in ${about.location}.`;

    function startResendTimer() {
      let left = RESEND_WAIT_S;
      resendBtn.disabled = true;
      timerEl.textContent = `(${left}s)`;
      clearInterval(countdown);
      countdown = setInterval(() => {
        left -= 1;
        timerEl.textContent = left > 0 ? `(${left}s)` : "";
        if (left <= 0) { clearInterval(countdown); resendBtn.disabled = false; }
      }, 1000);
    }

    function issueCode() {
      pending.code = makeCode();
      pending.expires = Date.now() + CODE_LIFETIME_MS;
      pending.attempts = 0;
      codeInput.value = "";
      codeInput.removeAttribute("aria-invalid");
      $("#v-code-error").textContent = "";
      return sendVerificationCode(pending.phone, pending.code)
        .then(() => { startResendTimer(); codeInput.focus(); })
        .catch(() => {
          $("#v-code-error").textContent = "We couldn't send a text right now. Please try again shortly.";
        });
    }

    function showStep(which) {
      form.hidden = which !== 1;
      step2.hidden = which !== 2;
      panel.hidden = which !== 3;
    }

    // Step 1 → check details, send code
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = validate(form, {
        "c-name": [(v) => v.length >= 2, "Enter your name."],
        "c-email": [isEmail, "Enter an email address like name@example.com."],
        "c-phone": [(v) => !!normalisePhone(v), "Enter a phone number like 033 982076 or +232 33 982076."],
        "c-message": [(v) => v.length >= 10, "Write a message of at least 10 characters."]
      });
      if (!ok) return;
      pending = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: normalisePhone(form.phone.value),
        message: form.message.value.trim()
      };
      $("#verify-phone").textContent = prettyPhone(pending.phone);
      showStep(2);
      issueCode();
    });

    // Keep only digits in the code box
    codeInput.addEventListener("input", () => {
      codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 6);
    });

    // Step 2 → check the code
    verifyForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const err = $("#v-code-error");
      const entered = codeInput.value;
      const fail = (msg) => { codeInput.setAttribute("aria-invalid", "true"); err.textContent = msg; codeInput.focus(); };

      if (!pending || !pending.code) return fail("Tap Resend code to get a new code.");
      if (entered.length !== 6) return fail("Enter all 6 digits of the code.");
      if (Date.now() > pending.expires) { pending.code = null; return fail("This code has expired. Tap Resend code to get a new one."); }
      if (entered !== pending.code) {
        pending.attempts += 1;
        const left = MAX_ATTEMPTS - pending.attempts;
        if (left <= 0) { pending.code = null; resendBtn.disabled = false; clearInterval(countdown); timerEl.textContent = ""; return fail("Too many wrong tries. Tap Resend code to get a new one."); }
        return fail(`That code is not right. ${left} ${left === 1 ? "try" : "tries"} left.`);
      }

      // Verified: prepare the message to the owner
      $("#sms-toast").hidden = true;
      clearInterval(countdown);
      const text = `StudentStay contact form\nName: ${pending.name}\nEmail: ${pending.email}\nPhone: ${prettyPhone(pending.phone)} (verified)\n\n${pending.message}`;
      const encoded = encodeURIComponent(text);
      $("#send-whatsapp").href = `https://wa.me/${STUDENTSTAY_PHONE}?text=${encoded}`;
      $("#send-sms").href = `sms:+${STUDENTSTAY_PHONE}?&body=${encoded}`;
      storePush("studentstay_messages", {
        name: pending.name, email: pending.email, phone: pending.phone, verified: true,
        message: pending.message, sent: new Date().toISOString()
      });
      pending = null;
      showStep(3);
      $("#send-whatsapp").focus();
    });

    resendBtn.addEventListener("click", () => { if (pending) issueCode(); });

    $("#change-number").addEventListener("click", () => {
      clearInterval(countdown);
      $("#sms-toast").hidden = true;
      showStep(1);
      $("#c-phone").focus();
      $("#c-phone").select();
    });

    $("#sms-close").addEventListener("click", () => { $("#sms-toast").hidden = true; });

    $("#new-message").addEventListener("click", () => {
      form.reset();
      showStep(1);
      $("#c-name").focus();
    });
  }

  /* ======================================================================
     PAGE: List your property (register/login, add listing, dashboard)
     ====================================================================== */
  function initListProperty() {
    const OWNER_KEY = "studentstay_owner";
    const OWNER_LISTINGS = "studentstay_owner_listings";
    const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
    const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };

    const tabs = $$('[role="tab"]');
    tabs.forEach((tab) => tab.addEventListener("click", () => selectTab(tab)));
    $(".tabs").addEventListener("keydown", (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        selectTab(next); next.focus();
      }
    });
    function selectTab(tab) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        $("#" + t.getAttribute("aria-controls")).hidden = !on;
      });
    }

    fillSelect($("#p-location"), LOCATIONS);
    fillSelect($("#p-type"), ROOM_TYPES);
    $("#p-facilities").innerHTML = FACILITIES.map(
      (f) => `<label class="check"><input type="checkbox" name="p-facility" value="${f}"> ${f}</label>`
    ).join("");

    const STATUS_CLASS = { "Under review": "review", "Live": "live", "Rented": "rented", "Paused": "paused" };

    // Older saved listings may lack newer fields: fill them in
    function getMine() {
      return read(OWNER_LISTINGS, []).map((m, i) => ({
        id: m.id || "own-" + i,
        status: "Under review",
        description: "",
        facilities: [],
        type: ROOM_TYPES[0],
        created: null,
        ...m
      }));
    }

    function cell(i, field, content, label) {
      return `<td><button type="button" class="cell-btn" data-open="${i}" data-field="${field}" aria-label="${escapeHTML(label)}">${content}</button></td>`;
    }

    function refresh() {
      const owner = read(OWNER_KEY, null);
      const mine = getMine();
      $("#account-area").hidden = !!owner;
      $("#owner-area").hidden = !owner;
      $("#step-account").classList.toggle("is-done", !!owner);
      $("#step-listing").classList.toggle("is-done", mine.length > 0);
      if (!owner) return;
      $("#owner-name").textContent = owner.name;

      const live = mine.filter((m) => m.status === "Live").length;
      $("#dash-summary").textContent = mine.length
        ? `${mine.length} ${mine.length === 1 ? "listing" : "listings"} · ${live} live`
        : "";

      $("#dashboard-body").innerHTML = mine.length
        ? mine.map((m, i) => `<tr class="dash-row">
            ${cell(i, "e-title", `<span class="cell-title">${escapeHTML(m.title)}</span><span class="cell-sub">${escapeHTML(m.type)}</span>`, `${m.title}: view and edit listing`)}
            ${cell(i, "e-location", escapeHTML(m.location), `${m.title}: change location, currently ${m.location}`)}
            ${cell(i, "e-price", formatPrice(m.price), `${m.title}: change rent, currently ${formatPrice(m.price)}`)}
            ${cell(i, "e-status", `<span class="status status--${STATUS_CLASS[m.status] || "review"}">${escapeHTML(m.status)}</span>`, `${m.title}: change status, currently ${m.status}`)}
          </tr>`).join("")
        : `<tr><td colspan="4" class="dash-empty">No listings yet. Use the form to add your first room.</td></tr>`;
    }

    /* ----- View / edit dialog ----- */
    const dialog = $("#listing-dialog");
    const editForm = $("#edit-form");
    let editing = -1;
    let lastTrigger = null;

    fillSelect($("#e-location"), LOCATIONS);
    fillSelect($("#e-type"), ROOM_TYPES);
    $("#e-facilities").innerHTML = FACILITIES.map(
      (f) => `<label class="check"><input type="checkbox" name="e-facility" value="${f}"> ${f}</label>`
    ).join("");

    function openListing(i, fieldId, trigger) {
      const m = getMine()[i];
      if (!m) return;
      editing = i;
      lastTrigger = trigger;
      editForm["e-title"].value = m.title;
      editForm["e-location"].value = m.location;
      editForm["e-type"].value = m.type;
      editForm["e-price"].value = m.price;
      editForm["e-status"].value = m.status;
      editForm["e-description"].value = m.description;
      $$('input[name="e-facility"]', editForm).forEach((c) => { c.checked = m.facilities.includes(c.value); });
      $$("[aria-invalid]", editForm).forEach((el) => el.removeAttribute("aria-invalid"));
      $$(".field-error", editForm).forEach((el) => { el.textContent = ""; });
      $("#dlg-title").textContent = m.title;
      $("#dlg-submitted").textContent = m.created
        ? "Submitted " + new Date(m.created).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
        : "";
      dialog.showModal();
      const field = $("#" + fieldId);
      if (field) { field.focus(); if (field.select && field.type !== "number") field.select(); }
    }

    function closeDialog() {
      dialog.close();
      if (lastTrigger && document.body.contains(lastTrigger)) lastTrigger.focus();
    }

    function flash(text) {
      const a = $("#dash-alert");
      a.textContent = text;
      a.hidden = false;
      clearTimeout(flash.t);
      flash.t = setTimeout(() => { a.hidden = true; }, 4000);
    }

    $("#dashboard-body").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-open]");
      if (btn) openListing(+btn.dataset.open, btn.dataset.field, btn);
    });
    $$("[data-close]", dialog).forEach((b) => b.addEventListener("click", closeDialog));
    dialog.addEventListener("click", (e) => { if (e.target === dialog) closeDialog(); }); // click on backdrop

    editForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = validate(editForm, {
        "e-title": [(v) => v.length >= 4, "Give the listing a short title."],
        "e-location": [(v) => !!v, "Choose a location."],
        "e-price": [(v) => +v >= 100, "Enter the monthly rent in SLE (100 or more)."],
        "e-description": [(v) => v === "" || v.length >= 20, "Describe the room in at least 20 characters, or leave it empty."]
      });
      if (!ok) return;
      const mine = getMine();
      Object.assign(mine[editing], {
        title: editForm["e-title"].value.trim(),
        location: editForm["e-location"].value,
        type: editForm["e-type"].value,
        price: +editForm["e-price"].value,
        status: editForm["e-status"].value,
        description: editForm["e-description"].value.trim(),
        facilities: $$('input[name="e-facility"]:checked', editForm).map((c) => c.value)
      });
      write(OWNER_LISTINGS, mine);
      refresh();
      closeDialog();
      flash(`Saved changes to ${mine[editing].title}.`);
    });

    $("#delete-listing").addEventListener("click", () => {
      const mine = getMine();
      const m = mine[editing];
      if (!m || !confirm(`Delete "${m.title}"? This cannot be undone.`)) return;
      mine.splice(editing, 1);
      write(OWNER_LISTINGS, mine);
      dialog.close();
      refresh();
      flash(`Deleted ${m.title}.`);
    });

    $("#register-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target;
      const ok = validate(f, {
        "reg-name": [(v) => v.length >= 2, "Enter your full name."],
        "reg-email": [isEmail, "Enter an email address like name@example.com."],
        "reg-phone": [isPhone, "Enter a phone number with at least 8 digits."],
        "reg-password": [(v) => v.length >= 8, "Use at least 8 characters."]
      });
      if (!ok) return;
      write(OWNER_KEY, { name: f["reg-name"].value.trim(), email: f["reg-email"].value.trim() });
      refresh();
      $("#owner-area").scrollIntoView({ behavior: "smooth" });
    });

    $("#login-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target;
      const ok = validate(f, {
        "login-email": [isEmail, "Enter the email you registered with."],
        "login-password": [(v) => v.length >= 8, "Passwords are at least 8 characters."]
      });
      if (!ok) return;
      const email = f["login-email"].value.trim();
      write(OWNER_KEY, { name: email.split("@")[0], email });
      refresh();
    });

    $("#listing-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target;
      const ok = validate(f, {
        "p-title": [(v) => v.length >= 4, "Give the listing a short title."],
        "p-location": [(v) => !!v, "Choose a location."],
        "p-type": [(v) => !!v, "Choose a room type."],
        "p-price": [(v) => +v >= 100, "Enter the monthly rent in SLE (100 or more)."],
        "p-description": [(v) => v.length >= 20, "Describe the room in at least 20 characters."]
      });
      if (!ok) return;
      const mine = read(OWNER_LISTINGS, []);
      mine.push({
        id: "own-" + Date.now(),
        title: f["p-title"].value.trim(), location: f["p-location"].value, type: f["p-type"].value,
        price: +f["p-price"].value,
        facilities: $$('input[name="p-facility"]:checked', f).map((i) => i.value),
        description: f["p-description"].value.trim(),
        status: "Under review",
        created: new Date().toISOString()
      });
      write(OWNER_LISTINGS, mine);
      f.reset();
      showAlert($("#listing-success"), "Listing submitted. Tap it in your dashboard to view or edit it.");
      refresh();
    });

    $("#sign-out").addEventListener("click", () => {
      try { localStorage.removeItem(OWNER_KEY); } catch (e) { /* ignore */ }
      refresh();
    });

    refresh();
  }

  /* ---------- Router ---------- */
  const page = document.body.dataset.page;
  if (page === "home") initHome();
  if (page === "search") initSearch();
  if (page === "listing") initListing();
  if (page === "saved") renderCompare();
  if (page === "contact") initContact();
  if (page === "list-property") initListProperty();
})();