/* Evilance — pages Blog (liste) et Article */
(function () {
  "use strict";

  var CFG = window.EVILANCE_CONFIG || {};
  var DEFAULT = window.EVILANCE_DEFAULT || {};
  var T_POSTS = CFG.postsTable || "evilance_posts";
  var T_CONTENT = CFG.contentTable || "evilance_content";
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function frDate(iso) { try { return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return iso; } }
  function minutes(words) { return Math.max(1, Math.round((words || 0) / 220)); }
  function safeUrl(u) { u = String(u || "").trim(); return /^(https?:|mailto:|tel:|#|index\.html|blog\.html|article\.html|assets\/)/i.test(u) ? u : "#"; }
  function articleUrl(slug) { return "article.html?a=" + encodeURIComponent(slug); }

  function api(path) {
    if (!CFG.supabaseUrl || !CFG.supabaseKey) return Promise.reject(new Error("no-backend"));
    return fetch(CFG.supabaseUrl + "/rest/v1/" + path, { headers: { apikey: CFG.supabaseKey } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  /* --- En-tête commun --- */
  function initNav() {
    var burger = $("#burger"), links = $("#navLinks"), nav = $("#nav"), lastY = 0;
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") !== "true";
      burger.setAttribute("aria-expanded", String(open));
      links.classList.toggle("is-open", open);
    });
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      nav.classList.toggle("is-hidden", y > lastY && y > 300 && !links.classList.contains("is-open"));
      lastY = y;
    }, { passive: true });
    $$("[data-year]").forEach(function (n) { n.textContent = new Date().getFullYear(); });
    var booking = (DEFAULT.settings || {}).booking_url;
    function setBooking(u) { $$("[data-booking]").forEach(function (a) { a.href = safeUrl(u); }); }
    setBooking(booking);
    api(T_CONTENT + "?select=data&key=eq.settings").then(function (rows) {
      if (rows[0] && rows[0].data && rows[0].data.booking_url) setBooking(rows[0].data.booking_url);
    }).catch(function () {});
  }

  function card(p, i, feature) {
    var img = p.cover_url ? '<img src="' + esc(p.cover_url) + '" alt="" loading="' + (feature || i < 3 ? "eager" : "lazy") + '">' : "";
    return '<a class="card' + (feature ? " card--feature" : "") + '" href="' + articleUrl(p.slug) + '" style="--i:' + (i || 0) + '">' +
      '<div class="card__media">' + img + (feature ? "" : '<span class="card__cat">' + esc(p.category) + "</span>") + "</div>" +
      '<div class="card__body">' +
      (feature ? '<span class="card__new">Dernier article · ' + esc(p.category) + "</span>" : "") +
      '<h2 class="card__title">' + esc(p.title) + '</h2><p class="card__ex">' + esc(p.excerpt) + "</p>" +
      '<span class="card__meta"><span>' + esc(frDate(p.published_at)) + " · " + minutes(p.words) + ' min de lecture</span><span class="card__go">' + ARROW + "</span></span>" +
      "</div></a>";
  }

  /* ------------------------------------------------------------------ */
  /* Liste des articles                                                  */
  /* ------------------------------------------------------------------ */
  function initList() {
    var posts = [], state = { cat: "", q: "" };
    var params = new URLSearchParams(location.search);
    state.cat = params.get("theme") || ""; state.q = params.get("q") || "";
    $("#q").value = state.q;

    function draw() {
      var q = norm(state.q).trim();
      var list = posts.filter(function (p) {
        if (state.cat && p.category !== state.cat) return false;
        if (!q) return true;
        return norm(p.title + " " + p.excerpt + " " + p.category).indexOf(q) !== -1;
      });
      var filtered = !!(state.cat || q);
      $$(".chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.cat === state.cat)); });
      $("#count").textContent = list.length + (list.length > 1 ? " articles" : " article") + (filtered ? " trouvé" + (list.length > 1 ? "s" : "") : "");
      $("#featured").innerHTML = !filtered && list.length ? card(list[0], 0, true) : "";
      $("#grid").innerHTML = (filtered ? list : list.slice(1)).map(function (p, i) { return card(p, i); }).join("");
      $("#empty").hidden = list.length > 0;
      var u = new URL(location.href);
      state.cat ? u.searchParams.set("theme", state.cat) : u.searchParams.delete("theme");
      state.q ? u.searchParams.set("q", state.q) : u.searchParams.delete("q");
      history.replaceState(null, "", u);
    }

    function drawChips() {
      var counts = {};
      posts.forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });
      var cats = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b, "fr"); });
      $("#chips").innerHTML = ['<button class="chip" type="button" data-cat="">Tous<span class="chip__n">' + posts.length + "</span></button>"]
        .concat(cats.map(function (c) { return '<button class="chip" type="button" data-cat="' + esc(c) + '">' + esc(c) + '<span class="chip__n">' + counts[c] + "</span></button>"; })).join("");
    }

    $("#chips").addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      state.cat = b.dataset.cat; draw();
    });
    var t;
    $("#q").addEventListener("input", function (e) { clearTimeout(t); t = setTimeout(function () { state.q = e.target.value; draw(); }, 120); });
    $("#reset").addEventListener("click", function () { state.cat = ""; state.q = ""; $("#q").value = ""; draw(); });

    $("#count").textContent = "Chargement des articles…";
    api(T_POSTS + "?select=slug,title,excerpt,category,cover_url,published_at,words&published=eq.true&order=published_at.desc")
      .catch(function () {
        return ((DEFAULT.blog || {}).posts || []).map(function (p) { return { slug: (p.url || "").split("a=")[1] || "", title: p.title, excerpt: p.excerpt, category: p.category, cover_url: "", published_at: p.date, words: 0 }; });
      })
      .then(function (rows) { posts = rows; drawChips(); draw(); });
  }

  /* ------------------------------------------------------------------ */
  /* Article                                                             */
  /* ------------------------------------------------------------------ */
  function sanitize(html) {
    var t = document.createElement("template");
    t.innerHTML = html;
    var ok = { P: 1, H2: 1, H3: 1, H4: 1, STRONG: 1, EM: 1, A: 1, UL: 1, OL: 1, LI: 1, BR: 1, BLOCKQUOTE: 1, SUP: 1, IMG: 1 };
    (function walk(node) {
      $$(":scope > *", node).forEach(function (n) {
        walk(n);
        if (!ok[n.tagName]) { n.replaceWith.apply(n, Array.prototype.slice.call(n.childNodes)); return; }
        Array.prototype.slice.call(n.attributes).forEach(function (a) {
          var keep = (n.tagName === "A" && a.name === "href") || (n.tagName === "IMG" && (a.name === "src" || a.name === "alt"));
          if (!keep) n.removeAttribute(a.name);
        });
        if (n.tagName === "A") {
          var h = safeUrl(n.getAttribute("href"));
          n.setAttribute("href", h);
          if (/^https?:/.test(h)) { n.setAttribute("target", "_blank"); n.setAttribute("rel", "noopener"); }
        }
        if (n.tagName === "IMG") { if (!/^https:\/\//.test(n.getAttribute("src") || "")) n.remove(); else n.setAttribute("loading", "lazy"); }
      });
    })(t.content);
    return t.innerHTML;
  }

  function slugify(s) { return norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60); }

  function setMeta(p) {
    document.title = p.title + " · Le blog Evilance";
    var d = $('meta[name="description"]'); if (d) d.content = p.excerpt;
    var ot = $('meta[property="og:title"]'); if (ot) ot.content = p.title;
    var ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title, description: p.excerpt, image: p.cover_url || undefined, datePublished: p.published_at, dateModified: (p.updated_at || "").slice(0, 10) || p.published_at, author: { "@type": "Person", name: p.author || "Evilance" }, publisher: { "@type": "Organization", name: "Evilance" } });
    document.head.appendChild(ld);
  }

  function notFound() {
    $("#article").removeAttribute("aria-busy");
    $("#aTitle").textContent = "Article introuvable";
    $("#aMeta").textContent = "";
    $("#aCoverWrap").hidden = true;
    $(".aside").hidden = true;
    $("#aCat").textContent = "Tous les articles";
    $("#aBody").innerHTML = '<div class="anotfound"><p>Cet article n’existe pas ou n’est plus en ligne.</p><a class="btn btn--dark" href="blog.html">Voir tous les articles</a></div>';
    document.title = "Article introuvable · Le blog Evilance";
  }

  function initArticle() {
    var slug = new URLSearchParams(location.search).get("a") || "";
    if (!/^[a-z0-9-]{1,120}$/.test(slug)) { notFound(); return; }
    api(T_POSTS + "?select=*&slug=eq." + encodeURIComponent(slug) + "&limit=1").then(function (rows) {
      var p = rows[0];
      if (!p) { notFound(); return; }
      $("#article").removeAttribute("aria-busy");
      setMeta(p);
      $("#aTitle").textContent = p.title;
      var cat = $("#aCat"); cat.textContent = p.category; cat.href = "blog.html?theme=" + encodeURIComponent(p.category);
      $("#aMeta").innerHTML = "<span>" + esc(frDate(p.published_at)) + "</span><span>" + minutes(p.words) + " min de lecture</span><span>Par " + esc(p.author || "Evilance") + "</span>";
      if (p.cover_url) { $("#aCover").src = p.cover_url; } else { $("#aCoverWrap").hidden = true; }

      var body = $("#aBody");
      body.innerHTML = sanitize(p.content);

      // Sommaire à partir des intertitres
      var used = {};
      var heads = $$("h2", body);
      if (heads.length < 2) {
        // anciens articles : intertitres écrits en paragraphes gras
        $$("p", body).forEach(function (para) {
          var only = para.children.length === 1 && para.firstElementChild.tagName === "STRONG" && para.textContent.trim() === para.firstElementChild.textContent.trim();
          if (only && para.textContent.length < 90 && para !== body.lastElementChild) {
            var h = document.createElement("h3"); h.innerHTML = para.firstElementChild.innerHTML; para.replaceWith(h);
          }
        });
        heads = $$("h2", body).length >= 2 ? $$("h2", body) : $$("h3", body);
      }
      $("#toc").innerHTML = heads.map(function (h) {
        var id = slugify(h.textContent) || "partie"; while (used[id]) id += "-2"; used[id] = 1; h.id = id;
        return '<li><a href="#' + id + '">' + esc(h.textContent.replace(/[\u{1F300}-\u{1FAFF}☀-➿️]/gu, "").trim()) + "</a></li>";
      }).join("");
      if (!heads.length) { $("#toc").hidden = true; $(".aside__label").hidden = true; }

      // Partage
      var url = location.href.split("#")[0];
      $("#shareLinkedin").href = "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url);
      $("#shareMail").href = "mailto:?subject=" + encodeURIComponent(p.title) + "&body=" + encodeURIComponent(p.excerpt + "\n\n" + url);
      $("#shareCopy").addEventListener("click", function () {
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { $("#shareOk").textContent = "Lien copié."; }, function () { $("#shareOk").textContent = url; });
      });

      initReading(heads);
      loadRelated(p);
    }).catch(notFound);
  }

  function initReading(heads) {
    var bar = $("#progress"), body = $("#aBody"), links = $$("#toc a");
    function onScroll() {
      var r = body.getBoundingClientRect();
      var total = r.height - window.innerHeight * 0.6;
      var pr = Math.min(1, Math.max(0, (-r.top + window.innerHeight * 0.3) / Math.max(1, total)));
      if (!REDUCED) bar.style.transform = "scaleX(" + pr.toFixed(4) + ")";
      var current = null;
      heads.forEach(function (h) { if (h.getBoundingClientRect().top < 140) current = h.id; });
      links.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + current); });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    $("#toc").addEventListener("click", function (e) {
      var a = e.target.closest("a"); if (!a) return;
      e.preventDefault();
      var t = document.getElementById(a.getAttribute("href").slice(1));
      if (t) { window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 96, behavior: REDUCED ? "auto" : "smooth" }); history.replaceState(null, "", "#" + t.id); }
    });
  }

  function loadRelated(p) {
    api(T_POSTS + "?select=slug,title,excerpt,category,cover_url,published_at,words&published=eq.true&slug=neq." + encodeURIComponent(p.slug) + "&order=published_at.desc&limit=40")
      .then(function (rows) {
        var same = rows.filter(function (r) { return r.category === p.category; });
        var pick = same.concat(rows.filter(function (r) { return r.category !== p.category; })).slice(0, 3);
        if (!pick.length) return;
        $("#related").innerHTML = pick.map(function (r, i) { return card(r, i); }).join("");
        $("#relatedWrap").hidden = false;
      }).catch(function () {});
  }

  initNav();
  if (document.body.classList.contains("page-blog")) initList();
  if (document.body.classList.contains("page-article")) initArticle();
})();
