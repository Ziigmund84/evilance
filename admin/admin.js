/* Evilance — espace d'administration (Supabase Auth + base + stockage) */
(function () {
  "use strict";

  var CFG = window.EVILANCE_CONFIG || {};
  var DEFAULT = window.EVILANCE_DEFAULT;
  var BUCKET = "media";

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null && attrs[k] !== false) n.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function toast(msg, isErr) {
    var t = $("#toast"); t.textContent = msg; t.className = "toast show" + (isErr ? " err" : "");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.className = "toast"; }, 3200);
  }

  /* ------------------------------------------------------------------ */
  /* Description des sections éditables                                  */
  /* ------------------------------------------------------------------ */
  var SECTIONS = [
    { key: "settings", label: "Coordonnées", help: "Téléphone, e-mail, adresse et liens utilisés partout sur le site.", fields: [
      { k: "phone", label: "Téléphone" }, { k: "email", label: "E-mail de contact", type: "email" },
      { k: "address", label: "Adresse" }, { k: "booking_url", label: "Lien de prise de rendez-vous", type: "url" },
      { k: "linkedin_url", label: "Page LinkedIn", type: "url" },
      { k: "meta_description", label: "Description pour Google", type: "textarea", help: "Environ 150 caractères." }
    ]},
    { key: "hero", label: "Accueil", help: "Le grand titre, puis ce qui apparaît quand la clé ouvre la porte.", fields: [
      { k: "title", label: "Grand titre", help: "Chaque phrase terminée par un point passe à la ligne." },
      { k: "subtitle", label: "Texte d’accompagnement", type: "textarea" },
      { k: "image", label: "Photo révélée", type: "image" },
      { k: "cta_primary", label: "Bouton principal" }, { k: "cta_secondary", label: "Bouton secondaire" }
    ]},
    { key: "manifesto", label: "Engagement", help: "Le texte dont les mots s’allument au défilement.", fields: [
      { k: "text", label: "Texte", type: "textarea" }
    ]},
    { key: "gestion", label: "Gestion locative", help: "Les étiquettes du trousseau et les avantages.", fields: [
      { k: "title", label: "Titre" }, { k: "intro", label: "Introduction", type: "textarea" },
      { k: "tasks", label: "Étiquettes du trousseau", type: "strings", add: "Ajouter une étiquette" },
      { k: "image", label: "Photo", type: "image" },
      { k: "advantages_title", label: "Titre des avantages" },
      { k: "advantages", label: "Avantages", type: "objects", add: "Ajouter un avantage", itemLabel: "Avantage", fields: [
        { k: "title", label: "Titre" }, { k: "points", label: "Points", type: "strings", add: "Ajouter un point" }
      ]}
    ]},
    { key: "why", label: "Pourquoi nous", fields: [
      { k: "title", label: "Titre" },
      { k: "items", label: "Atouts", type: "objects", add: "Ajouter un atout", itemLabel: "Atout", fields: [
        { k: "icon", label: "Pictogramme", type: "select", options: [["bolt", "Éclair (réactivité)"], ["ruler", "Règle (sur mesure)"], ["pin", "Repère (local)"], ["leaf", "Feuille (sérénité)"], ["key", "Clé"], ["hand", "Main"], ["smile", "Sourire"], ["shield", "Bouclier"]] },
        { k: "title", label: "Titre" }, { k: "text", label: "Texte", type: "textarea" }
      ]}
    ]},
    { key: "paths", label: "À vos côtés", help: "Les deux portes : autonome ou accompagné.", fields: [
      { k: "title", label: "Titre" },
      { k: "autonomous_title", label: "Porte 1 · titre" }, { k: "autonomous_text", label: "Porte 1 · texte", type: "textarea" }, { k: "autonomous_cta", label: "Porte 1 · lien" },
      { k: "delegate_title", label: "Porte 2 · titre" }, { k: "delegate_text", label: "Porte 2 · texte", type: "textarea" }, { k: "delegate_cta", label: "Porte 2 · lien" }
    ]},
    { key: "offers", label: "Offres du moment", help: "La section disparaît d’elle-même après la date de fin.", fields: [
      { k: "enabled", label: "Afficher les offres", type: "bool" },
      { k: "title", label: "Titre" }, { k: "end_date", label: "Date de fin", type: "date" },
      { k: "image", label: "Photo", type: "image" },
      { k: "items", label: "Offres", type: "objects", add: "Ajouter une offre", itemLabel: "Offre", fields: [
        { k: "title", label: "Intitulé de l’offre", type: "textarea" }, { k: "cta", label: "Texte du bouton" }
      ]}
    ]},
    { key: "blog", label: "Blog", help: "Les articles mis en avant renvoient vers leur page complète.", fields: [
      { k: "title", label: "Titre" }, { k: "intro", label: "Introduction", type: "textarea" },
      { k: "all_url", label: "Lien « Tous les articles »", type: "url" },
      { k: "posts", label: "Articles", type: "objects", add: "Ajouter un article", itemLabel: "Article", fields: [
        { k: "title", label: "Titre" }, { k: "date", label: "Date", type: "date" }, { k: "category", label: "Catégorie" },
        { k: "excerpt", label: "Résumé", type: "textarea" }, { k: "url", label: "Lien de l’article", type: "url" }
      ]},
      { k: "categories", label: "Thèmes (bandeau défilant)", type: "strings", add: "Ajouter un thème" }
    ]},
    { key: "together", label: "Construire ensemble", fields: [
      { k: "title", label: "Titre" }, { k: "quote", label: "Citation" }, { k: "text", label: "Texte", type: "textarea" },
      { k: "image", label: "Photo", type: "image" },
      { k: "owner_label", label: "Bouton propriétaire" }, { k: "owner_url", label: "Questionnaire propriétaire", type: "url" },
      { k: "tenant_label", label: "Bouton locataire" }, { k: "tenant_url", label: "Questionnaire locataire", type: "url" }
    ]},
    { key: "contact", label: "Contact", fields: [
      { k: "title", label: "Titre" }, { k: "intro", label: "Introduction", type: "textarea" },
      { k: "booking_text", label: "Texte rendez-vous", type: "textarea" }, { k: "phone_text", label: "Texte téléphone", type: "textarea" },
      { k: "closing", label: "Phrase finale (avec le sourire)" }
    ]},
    { key: "legal", label: "Mentions légales", help: "Balises autorisées : h3, p, br, strong, em, ul, ol, li, a.", fields: [
      { k: "html", label: "Contenu", type: "code" }
    ]}
  ];

  /* ------------------------------------------------------------------ */
  /* Supabase                                                            */
  /* ------------------------------------------------------------------ */
  if (!CFG.supabaseUrl || !CFG.supabaseKey || !window.supabase) {
    document.body.innerHTML = '<main class="auth"><div class="auth__card"><h1 class="auth__title">Espace admin</h1><p class="muted">La connexion à Supabase n’est pas encore configurée (fichier assets/js/config.js).</p></div></main>';
    return;
  }
  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { persistSession: true, detectSessionInUrl: true, flowType: "implicit" } });

  var state = { rows: {}, current: null, draft: null, dirty: false, unread: 0, recovery: false };

  /* ------------------------------------------------------------------ */
  /* Authentification                                                    */
  /* ------------------------------------------------------------------ */
  function authMsg(text, kind) { var m = $("#authMsg"); m.textContent = text || ""; m.className = "auth__msg" + (kind ? " " + kind : ""); }
  function showForm(id) {
    ["loginForm", "forgotForm", "resetForm"].forEach(function (f) { $("#" + f).hidden = f !== id; });
    $("#authTitle").textContent = id === "resetForm" ? "Nouveau mot de passe" : id === "forgotForm" ? "Mot de passe oublié" : "Espace admin";
  }
  function showAuth(form) { $("#appView").hidden = true; $("#authView").hidden = false; showForm(form || "loginForm"); }

  $("#toForgot").addEventListener("click", function () { authMsg(""); showForm("forgotForm"); });
  $("#toLogin").addEventListener("click", function () { authMsg(""); showForm("loginForm"); });

  $("#loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, btn = f.querySelector("button[type=submit]");
    btn.disabled = true; authMsg("Connexion…");
    sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value }).then(function (r) {
      btn.disabled = false;
      if (r.error) { authMsg("E-mail ou mot de passe incorrect.", "err"); return; }
      authMsg(""); enterApp(r.data.session);
    });
  });

  $("#forgotForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, btn = f.querySelector("button[type=submit]");
    btn.disabled = true;
    sb.auth.resetPasswordForEmail(f.email.value.trim(), { redirectTo: location.origin + location.pathname }).then(function (r) {
      btn.disabled = false;
      if (r.error) authMsg("L’envoi a échoué : " + r.error.message, "err");
      else authMsg("Si cette adresse a un compte, un e-mail vient d’être envoyé. Pensez à vérifier les indésirables.", "ok");
    });
  });

  $("#resetForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    if (f.password.value !== f.confirm.value) { authMsg("Les deux mots de passe ne correspondent pas.", "err"); return; }
    if (f.password.value.length < 10) { authMsg("Choisissez au moins 10 caractères.", "err"); return; }
    sb.auth.updateUser({ password: f.password.value }).then(function (r) {
      if (r.error) { authMsg("Impossible d’enregistrer : " + r.error.message, "err"); return; }
      state.recovery = false;
      history.replaceState(null, "", location.pathname);
      authMsg("Mot de passe enregistré.", "ok");
      sb.auth.getSession().then(function (s) { enterApp(s.data.session); });
    });
  });

  $("#logout").addEventListener("click", function () {
    if (state.dirty && !confirm("Des modifications ne sont pas enregistrées. Se déconnecter quand même ?")) return;
    sb.auth.signOut().then(function () { showAuth(); });
  });

  // Lien de réinitialisation / d'invitation reçu par e-mail
  var hash = location.hash || "";
  if (/type=(recovery|invite)/.test(hash)) state.recovery = true;
  if (/error_description=/.test(hash)) {
    var p = new URLSearchParams(hash.slice(1));
    setTimeout(function () { showAuth(); authMsg("Le lien n’est plus valide (" + (p.get("error_description") || "expiré") + "). Demandez-en un nouveau.", "err"); }, 0);
  }

  sb.auth.onAuthStateChange(function (event, session) {
    if (event === "PASSWORD_RECOVERY" || (state.recovery && session)) { showAuth("resetForm"); authMsg(""); }
  });

  sb.auth.getSession().then(function (r) {
    var s = r.data.session;
    if (state.recovery && s) { showAuth("resetForm"); return; }
    if (s) enterApp(s); else if ($("#authView").hidden && $("#appView").hidden) showAuth();
  });

  /* ------------------------------------------------------------------ */
  /* Application                                                         */
  /* ------------------------------------------------------------------ */
  function enterApp(session) {
    sb.rpc("is_admin").then(function (r) {
      if (r.error || r.data !== true) {
        showAuth(); authMsg("Ce compte n’a pas les droits d’administration.", "err");
        sb.auth.signOut();
        return;
      }
      $("#authView").hidden = true; $("#appView").hidden = false;
      $("#who").textContent = session.user.email;
      loadAll().then(function () { buildNav(); open(state.current || "settings"); });
    });
  }

  function loadAll() {
    return Promise.all([
      sb.from("site_content").select("key,data,updated_at"),
      sb.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false)
    ]).then(function (res) {
      state.rows = {};
      (res[0].data || []).forEach(function (r) { state.rows[r.key] = r; });
      state.unread = res[1].count || 0;
    });
  }

  function buildNav() {
    var nav = $("#sideNav"); nav.innerHTML = "";
    SECTIONS.forEach(function (s) { nav.appendChild(el("button", { type: "button", "data-key": s.key, onclick: function () { open(s.key); } }, [s.label])); });
    nav.appendChild(el("div", { class: "sep" }));
    nav.appendChild(el("button", { type: "button", "data-key": "_messages", onclick: function () { open("_messages"); } }, ["Messages", state.unread ? el("span", { class: "badge", text: String(state.unread) }) : null]));
    nav.appendChild(el("button", { type: "button", "data-key": "_media", onclick: function () { open("_media"); } }, ["Médias"]));
    markNav();
  }
  function markNav() { $$("#sideNav button").forEach(function (b) { b.setAttribute("aria-current", String(b.dataset.key === state.current)); }); }

  window.addEventListener("beforeunload", function (e) { if (state.dirty) { e.preventDefault(); e.returnValue = ""; } });

  function open(key) {
    if (state.dirty && key !== state.current && !confirm("Des modifications ne sont pas enregistrées. Les abandonner ?")) return;
    state.current = key; state.dirty = false; markNav();
    var main = $("#main"); main.innerHTML = "";
    if (key === "_messages") renderMessages(main);
    else if (key === "_media") renderMedia(main);
    else renderSection(main, SECTIONS.filter(function (s) { return s.key === key; })[0]);
    main.focus(); window.scrollTo(0, 0);
  }

  /* --- Édition d'une section --- */
  function renderSection(main, sec) {
    var row = state.rows[sec.key];
    state.draft = Object.assign(clone(DEFAULT[sec.key] || {}), row ? clone(row.data) : {});
    main.appendChild(el("div", { class: "head" }, [
      el("div", {}, [el("h1", { text: sec.label }), sec.help ? el("p", { text: sec.help }) : null])
    ]));
    var card = el("div", { class: "card" });
    sec.fields.forEach(function (f) { card.appendChild(fieldFor(f, state.draft)); });
    main.appendChild(card);

    var stateTxt = el("span", { class: "savebar__state", text: row ? "Dernière mise à jour : " + new Date(row.updated_at).toLocaleString("fr-FR") : "Contenu d’origine (jamais modifié)" });
    var saveBtn = el("button", { class: "btn", type: "button", text: "Enregistrer et publier", onclick: function () { save(sec, saveBtn); } });
    var resetBtn = row ? el("button", { class: "btn btn--ghost", type: "button", text: "Revenir au contenu d’origine", onclick: function () { resetSection(sec); } }) : null;
    main.appendChild(el("div", { class: "savebar" }, [stateTxt, resetBtn, saveBtn]));
  }

  function touch() { state.dirty = true; var s = $(".savebar__state"); if (s) s.textContent = "Modifications non enregistrées"; }

  function fieldFor(f, obj) {
    var id = "f_" + Math.random().toString(36).slice(2, 9);
    var help = f.help ? el("span", { class: "field-help", text: f.help }) : null;
    var t = f.type || "text";

    if (t === "bool") {
      var cb = el("input", { type: "checkbox", id: id, onchange: function () { obj[f.k] = cb.checked; touch(); } });
      cb.checked = !!obj[f.k];
      return el("label", { class: "check", for: id }, [cb, f.label]);
    }
    if (t === "select") {
      var sel = el("select", { id: id, onchange: function () { obj[f.k] = sel.value; touch(); } }, f.options.map(function (o) { return el("option", { value: o[0], text: o[1] }); }));
      sel.value = obj[f.k] || f.options[0][0];
      return el("label", { for: id }, [f.label, help, sel]);
    }
    if (t === "strings") return stringsField(f, obj);
    if (t === "objects") return objectsField(f, obj);
    if (t === "image") return imageField(f, obj);

    var input;
    if (t === "textarea" || t === "code") {
      input = el("textarea", { id: id, rows: t === "code" ? 16 : 3, class: t === "code" ? "code" : null });
    } else {
      input = el("input", { id: id, type: t === "url" ? "url" : t === "date" ? "date" : t === "email" ? "email" : "text" });
    }
    input.value = obj[f.k] == null ? "" : obj[f.k];
    input.addEventListener("input", function () { obj[f.k] = input.value; touch(); });
    return el("label", { for: id }, [f.label, help, input]);
  }

  function toolBtns(arr, i, rerender) {
    return el("div", { class: "list__tools" }, [
      el("button", { class: "icon-btn", type: "button", title: "Monter", "aria-label": "Monter", text: "↑", onclick: function () { if (i > 0) { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); touch(); rerender(); } } }),
      el("button", { class: "icon-btn", type: "button", title: "Descendre", "aria-label": "Descendre", text: "↓", onclick: function () { if (i < arr.length - 1) { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); touch(); rerender(); } } }),
      el("button", { class: "icon-btn danger", type: "button", title: "Supprimer", "aria-label": "Supprimer", text: "×", onclick: function () { arr.splice(i, 1); touch(); rerender(); } })
    ]);
  }

  function stringsField(f, obj) {
    if (!Array.isArray(obj[f.k])) obj[f.k] = [];
    var arr = obj[f.k];
    var wrap = el("div", { class: "stack" }, [el("strong", { text: f.label })]);
    var list = el("div", { class: "list" });
    function draw() {
      list.innerHTML = "";
      arr.forEach(function (v, i) {
        var inp = el("input", { type: "text", "aria-label": f.label + " " + (i + 1) });
        inp.value = v;
        inp.addEventListener("input", function () { arr[i] = inp.value; touch(); });
        list.appendChild(el("div", { class: "list__simple" }, [inp, toolBtns(arr, i, draw)]));
      });
    }
    draw();
    wrap.appendChild(list);
    wrap.appendChild(el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "+ " + (f.add || "Ajouter"), onclick: function () { arr.push(""); touch(); draw(); var ins = $$("input", list); ins[ins.length - 1].focus(); } }));
    return wrap;
  }

  function objectsField(f, obj) {
    if (!Array.isArray(obj[f.k])) obj[f.k] = [];
    var arr = obj[f.k];
    var wrap = el("div", { class: "stack" }, [el("strong", { text: f.label })]);
    var list = el("div", { class: "list" });
    function draw() {
      list.innerHTML = "";
      arr.forEach(function (item, i) {
        var box = el("div", { class: "list__item" }, [el("div", { class: "list__bar" }, [el("strong", { text: (f.itemLabel || "Élément") + " " + (i + 1) }), toolBtns(arr, i, draw)])]);
        f.fields.forEach(function (sf) { box.appendChild(fieldFor(sf, item)); });
        list.appendChild(box);
      });
    }
    draw();
    wrap.appendChild(list);
    wrap.appendChild(el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "+ " + (f.add || "Ajouter"), onclick: function () {
      var blank = {}; f.fields.forEach(function (sf) { blank[sf.k] = sf.type === "strings" ? [] : ""; });
      arr.push(blank); touch(); draw();
    } }));
    return wrap;
  }

  function imageField(f, obj) {
    var prev = el("img", { class: "img-field__preview", alt: "" });
    var url = el("input", { type: "url", "aria-label": f.label + " (adresse)" });
    function set(v) { obj[f.k] = v; url.value = v || ""; prev.src = v || ""; }
    set(obj[f.k]);
    url.addEventListener("input", function () { obj[f.k] = url.value; prev.src = url.value; touch(); });
    var file = el("input", { type: "file", accept: "image/*", hidden: true, onchange: function () {
      if (!file.files[0]) return;
      uploadImage(file.files[0]).then(function (u) { if (u) { set(u); touch(); toast("Image envoyée. Pensez à enregistrer."); } });
      file.value = "";
    } });
    return el("div", { class: "stack" }, [
      el("strong", { text: f.label }),
      el("div", { class: "img-field" }, [prev, el("div", { class: "img-field__tools" }, [
        url,
        el("div", { class: "img-field__btns" }, [
          el("button", { class: "btn btn--dark btn--sm", type: "button", text: "Envoyer une image", onclick: function () { file.click(); } }),
          el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Choisir dans les médias", onclick: function () { pickMedia(function (u) { set(u); touch(); }); } })
        ]),
        file
      ])])
    ]);
  }

  function save(sec, btn) {
    btn.disabled = true;
    sb.from("site_content").upsert({ key: sec.key, data: state.draft }).select().single().then(function (r) {
      btn.disabled = false;
      if (r.error) { toast("Enregistrement impossible : " + r.error.message, true); return; }
      state.rows[sec.key] = r.data; state.dirty = false;
      toast("Publié. Le site est à jour.");
      open(sec.key);
    });
  }

  function resetSection(sec) {
    if (!confirm("Remettre « " + sec.label + " » comme à l’origine ? Vos modifications de cette section seront perdues.")) return;
    sb.from("site_content").delete().eq("key", sec.key).then(function (r) {
      if (r.error) { toast("Action impossible : " + r.error.message, true); return; }
      delete state.rows[sec.key]; state.dirty = false;
      toast("Section remise à l’origine.");
      open(sec.key);
    });
  }

  /* --- Médias (Supabase Storage) --- */
  function slug(name) {
    var parts = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(".");
    var ext = parts.length > 1 ? parts.pop() : "jpg";
    return parts.join("-").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) + "-" + Date.now().toString(36) + "." + ext.replace(/[^a-z0-9]/g, "");
  }
  function publicUrl(path) { return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl; }

  function uploadImage(fileObj) {
    if (fileObj.size > 8 * 1024 * 1024) { toast("Image trop lourde (8 Mo maximum).", true); return Promise.resolve(null); }
    toast("Envoi de l’image…");
    var path = slug(fileObj.name);
    return sb.storage.from(BUCKET).upload(path, fileObj, { cacheControl: "31536000", upsert: false, contentType: fileObj.type }).then(function (r) {
      if (r.error) { toast("Envoi impossible : " + r.error.message, true); return null; }
      return publicUrl(path);
    });
  }

  function listMedia() {
    return sb.storage.from(BUCKET).list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } }).then(function (r) {
      return (r.data || []).filter(function (f) { return f.id && f.name !== ".emptyFolderPlaceholder"; });
    });
  }

  function renderMedia(main) {
    var file = el("input", { type: "file", accept: "image/*", multiple: true, hidden: true, onchange: function () {
      var files = Array.prototype.slice.call(file.files);
      Promise.all(files.map(uploadImage)).then(function () { toast("Images envoyées."); open("_media"); });
    } });
    main.appendChild(el("div", { class: "head" }, [
      el("div", {}, [el("h1", { text: "Médias" }), el("p", { text: "Les images envoyées ici peuvent être utilisées dans toutes les sections." })]),
      el("button", { class: "btn", type: "button", text: "Envoyer des images", onclick: function () { file.click(); } }), file
    ]));
    var grid = el("div", { class: "media-grid" });
    main.appendChild(grid);
    listMedia().then(function (files) {
      if (!files.length) { main.appendChild(el("p", { class: "empty", text: "Aucune image pour l’instant. Envoyez-en une pour commencer." })); return; }
      files.forEach(function (f) {
        var u = publicUrl(f.name);
        grid.appendChild(el("div", { class: "media" }, [
          el("img", { src: u, alt: f.name, loading: "lazy" }),
          el("div", { class: "media__info" }, [f.name, el("div", { class: "media__btns" }, [
            el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Copier l’adresse", onclick: function () { navigator.clipboard.writeText(u).then(function () { toast("Adresse copiée."); }); } }),
            el("button", { class: "btn btn--danger btn--sm", type: "button", text: "Supprimer", onclick: function () {
              if (!confirm("Supprimer définitivement cette image ? Si elle est utilisée sur le site, elle n’y apparaîtra plus.")) return;
              sb.storage.from(BUCKET).remove([f.name]).then(function (r) { if (r.error) toast(r.error.message, true); else { toast("Image supprimée."); open("_media"); } });
            } })
          ])])
        ]));
      });
    });
  }

  function pickMedia(cb) {
    var dlg = el("dialog", { class: "picker" });
    var grid = el("div", { class: "media-grid" });
    dlg.appendChild(el("div", { class: "head" }, [el("h1", { text: "Choisir une image" }), el("button", { class: "btn btn--ghost", type: "button", text: "Fermer", onclick: function () { dlg.close(); } })]));
    dlg.appendChild(grid);
    document.body.appendChild(dlg);
    dlg.addEventListener("close", function () { dlg.remove(); });
    dlg.showModal();
    listMedia().then(function (files) {
      if (!files.length) { grid.appendChild(el("p", { class: "empty", text: "Aucune image. Utilisez « Envoyer une image »." })); return; }
      files.forEach(function (f) {
        var u = publicUrl(f.name);
        grid.appendChild(el("button", { class: "media pickable", type: "button", onclick: function () { cb(u); dlg.close(); } }, [el("img", { src: u, alt: f.name }), el("div", { class: "media__info" }, [f.name])]));
      });
    });
  }

  /* --- Messages reçus par le formulaire --- */
  function renderMessages(main) {
    main.appendChild(el("div", { class: "head" }, [el("div", {}, [el("h1", { text: "Messages" }), el("p", { text: "Les demandes envoyées depuis le formulaire de contact." })])]));
    var box = el("div");
    main.appendChild(box);
    sb.from("messages").select("*").order("created_at", { ascending: false }).limit(200).then(function (r) {
      if (r.error) { box.appendChild(el("p", { class: "empty", text: "Lecture impossible : " + r.error.message })); return; }
      if (!r.data.length) { box.appendChild(el("p", { class: "empty", text: "Aucun message pour l’instant." })); return; }
      r.data.forEach(function (m) {
        var name = [m.first_name, m.last_name].filter(Boolean).join(" ") || "Sans nom";
        var reply = "mailto:" + encodeURIComponent(m.email) + "?subject=" + encodeURIComponent("Re : " + (m.subject || "votre demande"));
        var card = el("article", { class: "msg" + (m.is_read ? "" : " unread") }, [
          el("div", { class: "msg__top" }, [
            el("span", { class: "msg__who", text: name + (m.profile ? " · " + m.profile : "") }),
            el("span", { class: "msg__meta", text: new Date(m.created_at).toLocaleString("fr-FR") })
          ]),
          el("span", { class: "msg__meta", text: [m.email, m.phone].filter(Boolean).join(" — ") }),
          m.subject ? el("strong", { text: m.subject }) : null,
          el("p", { class: "msg__body", text: m.message }),
          el("div", { class: "msg__actions" }, [
            el("a", { class: "btn btn--dark btn--sm", href: reply, text: "Répondre par e-mail" }),
            m.phone ? el("a", { class: "btn btn--ghost btn--sm", href: "tel:" + m.phone, text: "Appeler" }) : null,
            el("button", { class: "btn btn--ghost btn--sm", type: "button", text: m.is_read ? "Marquer non lu" : "Marquer comme lu", onclick: function () {
              sb.from("messages").update({ is_read: !m.is_read }).eq("id", m.id).then(function (x) { if (x.error) toast(x.error.message, true); else refreshMessages(); });
            } }),
            el("button", { class: "btn btn--danger btn--sm", type: "button", text: "Supprimer", onclick: function () {
              if (!confirm("Supprimer définitivement ce message ?")) return;
              sb.from("messages").delete().eq("id", m.id).then(function (x) { if (x.error) toast(x.error.message, true); else refreshMessages(); });
            } })
          ])
        ]);
        box.appendChild(card);
      });
    });
  }
  function refreshMessages() { loadAll().then(function () { buildNav(); open("_messages"); }); }
})();
