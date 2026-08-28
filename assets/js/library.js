/* COS Advocacy Hub — resource library search + filter.
 *
 * Progressive enhancement over server-rendered cards: every card is in the
 * DOM already; this only shows/hides them. Four pieces of client state, no
 * persistence, no fetching:
 *   { q, topics[], agencies[], formats[] }
 * Within a filter group chips are OR'd; across groups they're AND'd. A card
 * passes the ask filter if ANY of its topics is selected. Empty group = no
 * constraint. Search is a case-insensitive substring match against
 * title + agency + blurb + format + topic labels.
 */
(function () {
  "use strict";

  var searchInput = document.getElementById("library-search");
  var clearBtn = document.getElementById("clear-all");
  var resultLabel = document.getElementById("result-label");
  var grid = document.getElementById("results-grid");
  var emptyState = document.getElementById("empty-state");
  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
  var pillarCtas = Array.prototype.slice.call(document.querySelectorAll(".pillar__cta"));

  if (!grid) return;

  var state = { q: "", topics: [], agencies: [], formats: [] };

  // Precompute a haystack per card: title + agency + blurb + format + topic labels.
  var cards = Array.prototype.slice.call(grid.querySelectorAll(".card")).map(function (el) {
    var tagText = Array.prototype.slice
      .call(el.querySelectorAll(".tag"))
      .map(function (t) { return t.textContent; })
      .join(" ");
    var haystack = [
      el.querySelector(".card__title").textContent,
      el.dataset.agency,
      el.querySelector(".card__blurb").textContent,
      el.dataset.format,
      tagText
    ].join(" ").toLowerCase();

    return {
      el: el,
      agency: el.dataset.agency,
      format: el.dataset.format,
      topics: el.dataset.topics ? el.dataset.topics.split(" ") : [],
      haystack: haystack
    };
  });

  var TOTAL = cards.length;

  function toggle(group, value) {
    var arr = state[group];
    var i = arr.indexOf(value);
    if (i === -1) arr.push(value);
    else arr.splice(i, 1);
  }

  function matches(card) {
    if (state.topics.length && !card.topics.some(function (t) { return state.topics.indexOf(t) !== -1; })) return false;
    if (state.agencies.length && state.agencies.indexOf(card.agency) === -1) return false;
    if (state.formats.length && state.formats.indexOf(card.format) === -1) return false;
    var needle = state.q.trim().toLowerCase();
    if (needle && card.haystack.indexOf(needle) === -1) return false;
    return true;
  }

  function apply() {
    var shown = 0;
    cards.forEach(function (card) {
      var ok = matches(card);
      card.el.hidden = !ok;
      if (ok) shown++;
    });

    var empty = shown === 0;
    grid.hidden = empty;
    emptyState.hidden = !empty;
    resultLabel.textContent = shown === TOTAL ? TOTAL + " documents" : shown + " of " + TOTAL;

    chips.forEach(function (chip) {
      var active = state[chip.dataset.group].indexOf(chip.dataset.value) !== -1;
      chip.classList.toggle("chip--active", active);
      chip.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function reset() {
    state.q = "";
    state.topics = [];
    state.agencies = [];
    state.formats = [];
    if (searchInput) searchInput.value = "";
  }

  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      state.q = e.target.value;
      apply();
    });
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      toggle(chip.dataset.group, chip.dataset.value);
      apply();
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      reset();
      apply();
    });
  }

  pillarCtas.forEach(function (btn) {
    btn.addEventListener("click", function () {
      reset();
      state.topics = [btn.dataset.topic];
      apply();
      var library = document.getElementById("library");
      if (library) {
        window.scrollTo({
          top: library.getBoundingClientRect().top + window.scrollY - 8,
          behavior: "smooth"
        });
      }
    });
  });

  // Auto-populate whole-collection counts (not affected by filtering).
(function populateCounts() {
  var setText = function (id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  var uniq = function (key) {
    var seen = {};
    cards.forEach(function (c) { if (c[key]) seen[c[key]] = true; });
    return Object.keys(seen).length;
  };

  setText("stat-documents", TOTAL);
  setText("stat-agencies", uniq("agency"));

  pillarCtas.forEach(function (btn) {
    var topic = btn.dataset.topic;
    var n = cards.filter(function (c) { return c.topics.indexOf(topic) !== -1; }).length;
    var slot = btn.querySelector(".pillar__cta-count");
    if (slot) slot.textContent = n;
  });
})();

  apply();
})();
