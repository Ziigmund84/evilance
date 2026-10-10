/* Evilance — rendu du contenu + animations de défilement */
(function () {
  "use strict";

  var CFG = window.EVILANCE_CONFIG || {};
  var DEFAULT = window.EVILANCE_DEFAULT;
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ */
  /* Utilitaires                                                         */
  /* ------------------------------------------------------------------ */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function get(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function merge(base, extra) {
    var out = JSON.parse(JSON.stringify(base));
    Object.keys(extra || {}).forEach(function (k) {
      if (extra[k] && typeof extra[k] === "object" && !Array.isArray(extra[k])) out[k] = Object.assign({}, out[k] || {}, extra[k]);
      else out[k] = extra[k];
    });
    return out;
  }
  function safeUrl(u) {
    u = String(u || "").trim();
    return /^(https?:|mailto:|tel:|#|assets\/|blog\.html|article\.html|index\.html)/i.test(u) ? u : "#";
  }
  function frDate(iso) {
    try { return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); }
    catch (e) { return iso; }
  }

  /* ------------------------------------------------------------------ */
  /* Chargement du contenu (Supabase si configuré, sinon défaut)          */
  /* ------------------------------------------------------------------ */
  function loadContent() {
    if (!CFG.supabaseUrl || !CFG.supabaseKey) return Promise.resolve(DEFAULT);
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 3500);
    function get(path) {
      return fetch(CFG.supabaseUrl + "/rest/v1/" + path, { headers: { apikey: CFG.supabaseKey }, signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    }
    var content = get((CFG.contentTable || "evilance_content") + "?select=key,data").catch(function () { return []; });
    var posts = get((CFG.postsTable || "evilance_posts") + "?select=slug,title,excerpt,category,cover_url,published_at&published=eq.true&order=published_at.desc&limit=60").catch(function () { return null; });
    return Promise.all([content, posts]).then(function (res) {
      clearTimeout(timer);
      var remote = {};
      res[0].forEach(function (row) { remote[row.key] = row.data; });
      var c = merge(DEFAULT, remote);
      if (res[1] && res[1].length) {
        c.blog = Object.assign({}, c.blog);
        c.blog.posts = res[1].slice(0, 6).map(function (p) {
          return { title: p.title, date: p.published_at, category: p.category, excerpt: p.excerpt, url: "article.html?a=" + p.slug, cover: p.cover_url };
        });
        var cats = [];
        res[1].forEach(function (p) { if (p.category && cats.indexOf(p.category) === -1) cats.push(p.category); });
        if (cats.length) c.blog.categories = cats;
        c.blog.total = res[1].length;
      }
      return c;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Rendu                                                               */
  /* ------------------------------------------------------------------ */
  var ICONS = {
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    ruler: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
    pin: '<path d="M12 22s7-7.2 7-12a7 7 0 0 0-14 0c0 4.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/>',
    leaf: '<path d="M5 20c0-9 6-15 15-15 0 9-6 15-15 15z"/><path d="M5 20 13 12"/>',
    key: '<circle cx="7.5" cy="12" r="4.5"/><path d="M12 12h10M18 12v4M21 12v3"/>',
    hand: '<path d="M7 11V6a2 2 0 0 1 4 0v4M11 10V4a2 2 0 0 1 4 0v6M15 10V6a2 2 0 0 1 4 0v8a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.4L3 14a2 2 0 0 1 3.4-2L7 13"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14.5a5 5 0 0 0 8 0M9 9.5h.01M15 9.5h.01"/>',
    shield: '<path d="M12 3 5 6v6c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6z"/><path d="m9 12 2 2 4-4"/>'
  };
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function render(c) {
    window.__EVILANCE_CONTENT = c;

    $$("[data-bind]").forEach(function (el) {
      var v = get(c, el.getAttribute("data-bind"));
      if (v != null) el.textContent = v;
    });
    $$("[data-bind-href]").forEach(function (el) {
      var v = get(c, el.getAttribute("data-bind-href"));
      if (v) el.setAttribute("href", safeUrl(v));
    });
    $$("[data-bind-src]").forEach(function (el) {
      var v = get(c, el.getAttribute("data-bind-src"));
      if (v) el.setAttribute("src", v);
    });
    $$("[data-bind-html]").forEach(function (el) {
      var v = get(c, el.getAttribute("data-bind-html"));
      if (v != null) el.innerHTML = sanitize(v);
    });

    var s = c.settings || {};
    var mail = $("#mailLink"); if (mail) mail.href = "mailto:" + (s.email || "");
    var tel = $("#telLink"); if (tel) tel.href = "tel:" + String(s.phone || "").replace(/[^\d+]/g, "").replace(/^0/, "+33");
    var map = $("#mapLink"); if (map) map.href = "https://www.openstreetmap.org/search?query=" + encodeURIComponent(s.address || "");
    if (s.meta_description) { var md = $('meta[name="description"]'); if (md) md.content = s.meta_description; }

    // Titre du hero découpé en lignes (une par phrase)
    var ht = $(".hero__title");
    var parts = String(get(c, "hero.title") || "").split(/(?<=[.!?])\s+/);
    ht.innerHTML = parts.map(function (p) { return '<span class="line"><span class="word">' + esc(p) + "</span></span>"; }).join("");
    ht.setAttribute("aria-label", get(c, "hero.title") || "");

    // Manifeste : un span par mot
    var mf = $("#manifesto");
    mf.innerHTML = String(get(c, "manifesto.text") || "").split(/\s+/).map(function (w) {
      var key = /cl[ée]s?\b|confian|humaine|nôtre/i.test(w);
      return '<span class="w' + (key ? " is-key-word" : "") + '">' + esc(w) + "</span>";
    }).join(" ");

    // Trousseau d'étiquettes
    var tasks = get(c, "gestion.tasks") || [];
    $("#tags").innerHTML = tasks.map(function (t, i) {
      return '<li class="tag"><div class="tag__card"><span class="tag__no">' + (i + 1 < 10 ? "0" : "") + (i + 1) + '</span><span class="tag__label">' + esc(t) + "</span></div></li>";
    }).join("");

    // Avantages
    var adv = get(c, "gestion.advantages") || [];
    $("#advantages").innerHTML = adv.map(function (a) {
      return '<div class="adv__item"><dt>' + esc(a.title) + "</dt><dd><ul>" + (a.points || []).map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></dd></div>";
    }).join("");

    // Pourquoi nous choisir
    var why = get(c, "why.items") || [];
    $("#whyList").innerHTML = why.map(function (w) {
      return '<article class="why__item"><div class="why__icon"><svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[w.icon] || ICONS.key) +
        '</svg></div><div><h3 class="h3">' + esc(w.title) + "</h3><p>" + esc(w.text) + "</p></div></article>";
    }).join("");

    // Offres
    renderOffers(c.offers || {});

    // Blog
    var b = c.blog || {};
    var posts = (b.posts || []).map(function (p) {
      var ext = /^https?:/.test(p.url || "");
      return '<a class="post" href="' + esc(safeUrl(p.url)) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" +
        (p.cover ? '<span class="post__img"><img src="' + esc(p.cover) + '" alt="" loading="lazy"></span>' : "") +
        (p.category ? '<span class="post__cat">' + esc(p.category) + "</span>" : "") +
        '<h3 class="post__title">' + esc(p.title) + '</h3><p class="post__excerpt">' + esc(p.excerpt) + "</p>" +
        '<span class="post__meta"><time datetime="' + esc(p.date) + '">' + esc(frDate(p.date)) + '</time><span class="post__arrow">' + ARROW + "</span></span></a>";
    });
    if (b.all_url) posts.push('<a class="post post--all" href="' + esc(safeUrl(b.all_url)) + '"><h3 class="post__title">Tous les articles</h3><span class="post__meta"><span>' + (b.total ? b.total + " articles à lire" : "Le blog complet") + '</span><span class="post__arrow">' + ARROW + "</span></span></a>");
    $("#blogTrack").innerHTML = posts.join("");
    var cats = (b.categories || []).map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("");
    $("#cats").innerHTML = cats + cats;

    $("#year").textContent = new Date().getFullYear();
  }

  function renderOffers(o) {
    var sec = $("#offres");
    var end = o.end_date ? new Date(o.end_date + "T23:59:59") : null;
    var expired = end && end < new Date();
    if (!o.enabled || expired || !(o.items || []).length) { sec.hidden = true; return; }
    sec.hidden = false;
    $("#offersUntil").textContent = end ? "Jusqu’au " + end.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";
    $("#offerTickets").innerHTML = o.items.map(function (it) {
      return '<div class="ticket"><p class="ticket__title">' + esc(it.title) + '</p><div class="ticket__stub"><a class="btn btn--dark" href="#contact" data-offer="' + esc(it.title) + '">' + esc(it.cta || "Cela m’intéresse") + "</a></div></div>";
    }).join("");
    var cd = $("#countdown");
    if (!end) { cd.hidden = true; return; }
    function tick() {
      var ms = Math.max(0, end - new Date());
      var d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
      cd.innerHTML = [[d, d > 1 ? "jours" : "jour"], [h, "heures"], [m, "minutes"]].map(function (x) {
        return '<div class="countdown__cell"><span class="countdown__n">' + String(x[0]).padStart(2, "0") + '</span><span class="countdown__l">' + x[1] + "</span></div>";
      }).join("");
    }
    tick(); clearInterval(window.__cdTimer); window.__cdTimer = setInterval(tick, 30000);
  }

  // Nettoyage HTML minimal pour le texte des mentions légales
  function sanitize(html) {
    var t = document.createElement("template");
    t.innerHTML = html;
    var allowed = { H3: 1, H4: 1, P: 1, BR: 1, STRONG: 1, EM: 1, UL: 1, OL: 1, LI: 1, A: 1 };
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 1) {
          if (!allowed[n.tagName]) { n.replaceWith(document.createTextNode(n.textContent)); return; }
          Array.prototype.slice.call(n.attributes).forEach(function (a) {
            if (!(n.tagName === "A" && a.name === "href")) n.removeAttribute(a.name);
          });
          if (n.tagName === "A") { n.setAttribute("href", safeUrl(n.getAttribute("href"))); n.setAttribute("rel", "noopener"); }
          walk(n);
        } else if (n.nodeType !== 3) n.remove();
      });
    })(t.content);
    return t.innerHTML;
  }

  /* ------------------------------------------------------------------ */
  /* Interactions de base                                                */
  /* ------------------------------------------------------------------ */
  var lenis = null;

  function scrollToHash(hash) {
    var target = hash === "#accueil" ? 0 : $(hash);
    if (target == null) return;
    if (lenis) lenis.scrollTo(target, { offset: hash === "#accueil" ? 0 : -70, duration: 1.4 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: "smooth" });
    else target.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
  }

  // Mise à l'échelle de la scène 3D de la serrure
  function fitLock() {
    var wrap = $("#lockWrap"), stage = $(".hero__stage");
    if (!wrap || !stage) return;
    var mobile = window.innerWidth <= 860;
    var cs = getComputedStyle(stage);
    var inner = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var w = mobile ? inner : inner * 0.5;
    var h = window.innerHeight * (mobile ? 0.48 : 0.8);
    wrap.style.setProperty("--k", Math.min(1, w / 760, h / 560).toFixed(3));
  }

  function initUi() {
    fitLock();
    window.addEventListener("resize", fitLock);
    var burger = $("#burger"), links = $("#navLinks");
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") !== "true";
      burger.setAttribute("aria-expanded", String(open));
      links.classList.toggle("is-open", open);
      if (lenis) open ? lenis.stop() : lenis.start();
    });

    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var hash = a.getAttribute("href");
      if (hash.length < 2) return;
      e.preventDefault();
      if (links.classList.contains("is-open")) { burger.click(); }
      if (a.dataset.offer) {
        var subj = $('#contactForm [name="subject"]');
        if (subj) subj.value = "Offre : " + a.dataset.offer;
      }
      scrollToHash(hash);
    });

    // En-tête : masqué en descendant, visible en remontant
    var nav = $("#nav"), lastY = 0;
    function onScroll() {
      var y = window.scrollY;
      nav.classList.toggle("is-solid", y > 40);
      nav.classList.toggle("is-hidden", y > lastY && y > 400 && !links.classList.contains("is-open"));
      lastY = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Lien actif dans le menu
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          $$(".nav__links a").forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id); });
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      $$("main section[id]").forEach(function (s) { io.observe(s); });
    }

    // Mentions légales
    var dlg = $("#legal");
    $$("[data-open-legal]").forEach(function (b) {
      b.addEventListener("click", function () { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); if (lenis) lenis.stop(); });
    });
    dlg.addEventListener("close", function () { if (lenis) lenis.start(); });
    if (location.hash === "#mentions") setTimeout(function () { $("[data-open-legal]").click(); }, 400);
    $(".legal__close").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });

    initForm();
  }

  function initForm() {
    var form = $("#contactForm"), status = $("#formStatus");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.className = "form__status";
      var fd = new FormData(form);
      if (fd.get("website")) return; // pot de miel anti-robots
      if (!form.checkValidity()) {
        status.textContent = "Renseignez votre nom, un e-mail valide et votre message.";
        status.classList.add("is-err");
        var bad = form.querySelector(":invalid"); if (bad) bad.focus();
        return;
      }
      var payload = {
        last_name: fd.get("last_name"), first_name: fd.get("first_name"), email: fd.get("email"),
        phone: fd.get("phone"), profile: fd.get("profile"), subject: fd.get("subject"), message: fd.get("message")
      };
      var btn = form.querySelector(".form__submit");
      btn.disabled = true; status.textContent = "Envoi en cours…";

      var send;
      if (CFG.supabaseUrl && CFG.supabaseKey) {
        send = fetch(CFG.supabaseUrl + "/rest/v1/" + (CFG.messagesTable || "evilance_messages"), {
          method: "POST",
          headers: { apikey: CFG.supabaseKey, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify(payload)
        }).then(function (r) { if (!r.ok) throw new Error(r.status); });
      } else {
        send = Promise.reject(new Error("no-backend"));
      }
      send.then(function () {
        form.reset();
        status.textContent = "Message envoyé. Nous revenons vers vous très vite.";
        status.classList.add("is-ok");
      }).catch(function () {
        var s = (window.__EVILANCE_CONTENT || DEFAULT).settings;
        var body = encodeURIComponent((payload.message || "") + "\n\n" + [payload.first_name, payload.last_name].join(" ") + "\n" + (payload.phone || ""));
        status.innerHTML = "L’envoi n’a pas abouti. Écrivez-nous directement à <a href=\"mailto:" + esc(s.email) + "?subject=" + encodeURIComponent(payload.subject || "Demande") + "&body=" + body + "\">" + esc(s.email) + "</a>.";
        status.classList.add("is-err");
      }).then(function () { btn.disabled = false; });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Animations                                                          */
  /* ------------------------------------------------------------------ */
  function initMotion() {
    if (REDUCED || !window.gsap || !window.ScrollTrigger) return;
    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);
    if (window.DrawSVGPlugin) gsap.registerPlugin(window.DrawSVGPlugin);

    if (window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on("scroll", ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    /* --- 1. Ouverture : titre, serrure, la clé arrive de la gauche --- */
    var key = $("#key3d"), keyIn = $("#keyInner");
    gsap.set(key, { x: -120, z: 2, rotationY: 0, transformOrigin: "452px 75px" });
    gsap.set(keyIn, { transformOrigin: "50% 50%" });
    var intro = gsap.timeline({ defaults: { ease: "expo.out" } });
    intro
      .from(".hero__title .word", { yPercent: 110, duration: 1.3, stagger: 0.12 })
      .from(".lock__plate", { y: 40, opacity: 0, duration: 1.3 }, 0.25)
      .from("#plateEdge", { drawSVG: "50% 50%", duration: 1.5, ease: "power3.inOut" }, 0.3)
      .from(".lock__halo", { scale: 0.7, opacity: 0, duration: 1.6, stagger: 0.15 }, 0.4)
      .from(keyIn, { x: -260, opacity: 0, duration: 1.5 }, 0.7)
      .from(".hero__hint", { opacity: 0, y: 10, duration: 0.8 }, 1.1);

    /* --- 2. Scroll : la clé pivote dans la serrure, s'enfonce, tourne sur elle-même, la porte s'ouvre --- */
    var stage = $(".hero__stage"), hole = $("#keyhole"), reveal = $("#heroReveal");
    function holeGeom() {
      var s = stage.getBoundingClientRect(), r = hole.getBoundingClientRect(), p = $("#lockPlate").getBoundingClientRect();
      return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.width / 2, r: p.width / 2 };
    }
    function clipAt(rad) {
      var g = holeGeom();
      return "circle(" + (rad == null ? g.r : rad) + "px at " + g.x + "px " + g.y + "px)";
    }
    function maxRadius() {
      var g = holeGeom(), w = stage.clientWidth, h = stage.clientHeight;
      return Math.hypot(Math.max(g.x, w - g.x), Math.max(g.y, h - g.y)) + 10;
    }
    gsap.set(reveal, { clipPath: "circle(0px at 70% 50%)" });

    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom bottom", scrub: 0.8, invalidateOnRefresh: true }
    });
    tl.to(".hero__hint", { opacity: 0, duration: 0.05 }, 0)
      // la pointe glisse jusqu'au trou puis la clé pivote vers l'intérieur de la serrure
      .to(key, { x: 0, duration: 0.17, ease: "power1.inOut" }, 0.03)
      .to(key, { rotationY: 64, duration: 0.16, ease: "power1.inOut" }, 0.06)
      // elle s'enfonce le long de son axe
      .to(keyIn, { x: 112, duration: 0.1, ease: "power3.in" }, 0.25)
      .to(".lock__plate", { x: 4, duration: 0.012, yoyo: true, repeat: 3, ease: "sine.inOut" }, 0.35)
      // elle tourne sur elle-même, la serrure s'allume
      .to(keyIn, { rotationX: 180, duration: 0.14, ease: "back.inOut(1.3)" }, 0.37)
      .to("#plateEdge", { stroke: "#FFCA4B", duration: 0.04 }, 0.47)
      .to(".hero__title .word", { yPercent: -110, duration: 0.12, stagger: 0.02, ease: "power2.in" }, 0.44)
      .to(".lock__halo", { scale: 1.6, opacity: 0, duration: 0.2 }, 0.47)
      .fromTo(reveal, { clipPath: function () { return clipAt(0); } }, { clipPath: function () { return clipAt(); }, duration: 0.05 }, 0.53)
      .to(reveal, { clipPath: function () { return clipAt(maxRadius()); }, duration: 0.3, ease: "power2.in" }, 0.58)
      .to(".hero__photo", { scale: 1, duration: 0.38 }, 0.56)
      .from(".hero__welcome", { yPercent: 60, opacity: 0, duration: 0.1 }, 0.84)
      .from(".hero__subtitle", { y: 30, opacity: 0, duration: 0.1 }, 0.88)
      .from(".hero__ctas", { y: 30, opacity: 0, duration: 0.1 }, 0.91)
      .to({}, { duration: 0.04 });

    /* --- 3. Manifeste : les mots s'allument --- */
    var words = $$("#manifesto .w");
    ST.create({
      trigger: ".manifesto", start: "top 75%", end: "bottom 60%", scrub: true,
      onUpdate: function (self) {
        var n = Math.round(self.progress * words.length);
        words.forEach(function (w, i) {
          var on = i < n;
          w.classList.toggle("is-lit", on && !w.classList.contains("is-key-word"));
          w.classList.toggle("is-key", on && w.classList.contains("is-key-word"));
        });
      }
    });

    /* --- 4. Trousseau : les étiquettes tombent puis se balancent --- */
    var tags = $$(".tag");
    gsap.from(tags, {
      y: -140, rotation: function (i) { return i % 2 ? 24 : -24; }, opacity: 0,
      duration: 1.6, ease: "elastic.out(1, 0.45)", stagger: 0.07,
      scrollTrigger: { trigger: ".keyring", start: "top 80%" }
    });
    gsap.from(".keyring__ring path", { drawSVG: "50% 50%", duration: 1.4, ease: "power3.out", scrollTrigger: { trigger: ".keyring", start: "top 85%" } });
    var swing = tags.map(function (t) { return gsap.quickTo(t, "rotation", { duration: 0.5, ease: "power3.out" }); });
    var settle;
    ST.create({
      trigger: ".keyring", start: "top bottom", end: "bottom top",
      onUpdate: function (self) {
        var v = gsap.utils.clamp(-16, 16, self.getVelocity() / 160);
        swing.forEach(function (q, i) { q(v * (i % 2 ? 1 : 0.75)); });
        clearTimeout(settle);
        settle = setTimeout(function () {
          gsap.to(tags, { rotation: 0, duration: 2, ease: "elastic.out(1.1, 0.25)", overwrite: "auto" });
        }, 120);
      }
    });
    gsap.fromTo(".gestion__figure img", { yPercent: -8 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: ".gestion__figure", scrub: true } });

    /* --- 5. Pourquoi nous : la clé se trace, les icônes se dessinent --- */
    gsap.from(".why__key > *", { drawSVG: 0, duration: 1.2, stagger: 0.12, ease: "power2.out", scrollTrigger: { trigger: ".why__key", start: "top 85%" } });
    $$(".why__item").forEach(function (item) {
      gsap.from(item.querySelectorAll(".why__icon svg > *"), { drawSVG: 0, duration: 1.1, ease: "power2.out", scrollTrigger: { trigger: item, start: "top 80%" } });
    });

    /* --- 6. Offres : les coupons glissent, la photo pivote --- */
    gsap.from(".ticket", { xPercent: 30, rotation: 4, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.15, scrollTrigger: { trigger: ".offers__tickets", start: "top 80%" } });
    gsap.fromTo(".offers__figure", { rotate: -9 }, { rotate: 3, ease: "none", scrollTrigger: { trigger: ".offers", scrub: true } });

    /* --- 7. Blog : défilement horizontal épinglé (grand écran) --- */
    var mm = gsap.matchMedia();
    mm.add("(min-width: 861px)", function () {
      var track = $("#blogTrack");
      function dist() { return Math.max(0, track.scrollWidth - window.innerWidth); }
      gsap.to(track, {
        x: function () { return -dist(); }, ease: "none",
        scrollTrigger: { trigger: ".blog__pin", start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 }
      });
    });

    /* --- 8. Construire ensemble : deux moitiés se rejoignent --- */
    var tt = gsap.timeline({ scrollTrigger: { trigger: ".together__visual", start: "top 85%", end: "center 50%", scrub: 0.8 } });
    tt.fromTo(".half--left", { x: -110, rotation: -25, svgOrigin: "200 200" }, { x: 0, rotation: 0, ease: "power2.out" }, 0)
      .fromTo(".half--right", { x: 110, rotation: 25, svgOrigin: "200 200" }, { x: 0, rotation: 0, ease: "power2.out" }, 0)
      .fromTo(".together__photo", { scale: 0.55, opacity: 0.2 }, { scale: 1, opacity: 1, ease: "power2.out" }, 0.1);
    gsap.from(".together__quote", { clipPath: "inset(0 100% 0 0)", duration: 1.4, ease: "power3.inOut", scrollTrigger: { trigger: ".together__quote", start: "top 82%" } });

    /* --- 9. Le sourire final --- */
    var st = gsap.timeline({ scrollTrigger: { trigger: ".smile", start: "top 75%", end: "bottom 95%", scrub: 0.6 } });
    st.from(".smile__curve", { drawSVG: "50% 50%", ease: "power2.out" })
      .from(".smile__eye", { scale: 0, transformOrigin: "50% 50%", stagger: 0.1, ease: "back.out(3)" }, 0.4);

    // Recalcul quand les images chargent
    window.addEventListener("load", function () { ST.refresh(); });
  }

  /* ------------------------------------------------------------------ */
  /* Démarrage                                                           */
  /* ------------------------------------------------------------------ */
  function boot() {
    loadContent().then(function (c) {
      render(c);
      initUi();
      initMotion();
      document.documentElement.classList.add("is-ready");
      if (location.hash && location.hash.length > 1) setTimeout(function () { scrollToHash(location.hash); }, 300);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
