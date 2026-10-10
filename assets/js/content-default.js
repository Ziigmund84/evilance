/*
 * Contenu par défaut du site Evilance.
 * Ce contenu est affiché tant que rien n'a été enregistré depuis l'espace admin
 * (ou si Supabase est injoignable). Chaque clé correspond à une ligne de la
 * table `site_content` côté Supabase.
 */
window.EVILANCE_DEFAULT = {
  settings: {
    phone: "07 75 76 15 80",
    email: "contact@evilance.fr",
    address: "14 rue des Bouteilles, 45000 Orléans",
    booking_url: "https://outlook.office.com/bookwithme/user/467ce1a2c6ba4459b64e7f67ddae7365%40evilance.fr?anonymous",
    linkedin_url: "https://www.linkedin.com/company/evilance/",
    meta_description: "Experts en gestion locative à Orléans, nous accompagnons propriétaires et locataires avec des solutions sur mesure et une approche humaine et de confiance."
  },

  hero: {
    title: "Gérer. Partager. Construire ensemble.",
    subtitle: "Notre volonté est d’accompagner les propriétaires dans la gestion locative de leur bien situé sur l’agglomération orléanaise et le partage de connaissances sur la gestion immobilière.",
    image: "https://kdcflcvufukagdjycwww.supabase.co/storage/v1/object/public/evilance-media/site/interieur.webp",
    cta_primary: "Confier mon bien",
    cta_secondary: "Découvrir l’agence"
  },

  manifesto: {
    text: "Une agence à taille humaine, un interlocuteur unique et des clés entre de bonnes mains. Nous gérons votre bien comme si c’était le nôtre, avec la réactivité d’un voisin et la rigueur d’un professionnel."
  },

  gestion: {
    title: "La gestion locative en quelques mots",
    intro: "La gestion locative implique la prise en charge complète de la gestion d’un bien immobilier loué. Chaque tâche est une clé de votre trousseau : nous les gardons toutes.",
    tasks: [
      "Recherche de locataires",
      "Organisation des visites",
      "Signature des baux",
      "Encaissement des loyers",
      "Règlement des charges de copropriété",
      "Entretien et réparations",
      "Gestion des conflits"
    ],
    image: "https://kdcflcvufukagdjycwww.supabase.co/storage/v1/object/public/evilance-media/site/securite.webp",
    advantages_title: "Avantages de la gestion locative",
    advantages: [
      { title: "Gain de temps", points: ["Moins de tâches administratives pour le propriétaire", "Moins de tracas liés à la recherche de locataires et à la gestion quotidienne"] },
      { title: "Professionnalisme", points: ["Expertise de l’agence pour fixer des loyers compétitifs", "Connaissance des lois et réglementations"] },
      { title: "Sécurité financière", points: ["Garantie des loyers payés à temps", "Gestion des assurances et des dépôts de garantie"] },
      { title: "Entretien proactif", points: ["Maintien de la valeur du bien grâce à un entretien régulier", "Réparations gérées par des professionnels"] },
      { title: "Réduction du risque de vacance", points: ["Stratégies pour minimiser les périodes sans locataire", "Annonces et marketing efficaces pour trouver rapidement des locataires"] }
    ]
  },

  why: {
    title: "Pourquoi nous choisir",
    items: [
      { icon: "bolt", title: "Réactivité", text: "En tant qu’agence à taille humaine, nous accordons une importance particulière à la réactivité. Vous aurez un interlocuteur unique, toujours à votre écoute, prêt à répondre à toutes vos questions et à intervenir rapidement en cas de besoin." },
      { icon: "ruler", title: "Gestion sur mesure", text: "Chaque bien immobilier est unique et mérite une attention particulière. Nous adaptons nos services à vos besoins spécifiques pour maximiser la rentabilité de votre investissement tout en minimisant les contraintes." },
      { icon: "pin", title: "Expertise locale", text: "Notre connaissance approfondie du marché orléanais nous permet de vous proposer des conseils avisés et des stratégies de mise en location efficaces. Nous trouvons des locataires fiables et solvables, dans le respect des réglementations en vigueur." },
      { icon: "leaf", title: "Tranquillité d’esprit", text: "En nous confiant votre bien, vous vous libérez des tâches administratives et techniques. Rédaction des baux, gestion des loyers, maintenance et bien plus encore : vous vous concentrez sur vos autres priorités." }
    ]
  },

  paths: {
    title: "Nous sommes à vos côtés",
    autonomous_title: "Vous êtes autonome dans la gestion locative ?",
    autonomous_text: "Suivez-nous et consultez notre blog à volonté pour mettre à jour vos connaissances.",
    autonomous_cta: "Lire le blog",
    delegate_title: "Vous préférez faire gérer et profiter de votre temps libre ?",
    delegate_text: "Indiquez-nous vos besoins et nous construirons une gestion locative adaptée.",
    delegate_cta: "Nous écrire"
  },

  offers: {
    enabled: true,
    title: "Offres du moment",
    end_date: "2026-10-31",
    image: "https://kdcflcvufukagdjycwww.supabase.co/storage/v1/object/public/evilance-media/site/offre.webp",
    items: [
      { title: "Parrainez un proche pour un mandat de gestion et recevez 200 €", cta: "Cela m’intéresse" },
      { title: "4 premiers mois offerts sur les honoraires de gestion", cta: "Cela m’intéresse" }
    ]
  },

  blog: {
    title: "Le blog",
    intro: "Nous avons décidé de partager nos connaissances en gestion locative. Et si vous ne vous sentez pas assez à l’aise, nous sommes à vos côtés pour vous accompagner.",
    all_url: "blog.html",
    categories: [
      "Bases de la gestion locative", "Aspects juridiques", "Relations locataires-propriétaires",
      "Entretien et maintenance", "Finances et fiscalité", "Types de location", "Outils et technologies",
      "Sécurité et assurance", "Marché et tendances", "Gestion professionnelle", "Promotion et marketing"
    ],
    posts: [
      { title: "Les travaux à la charge du locataire et du propriétaire", date: "2025-04-08", category: "Entretien et maintenance", excerpt: "La répartition des travaux dans un logement loué est une source fréquente de litiges. Qui doit payer quoi ?", url: "article.html?a=travaux-charge-locataire-proprietaire" },
      { title: "Les meilleures pratiques pour une bonne relation locataire-propriétaire", date: "2025-04-01", category: "Relations locataires-propriétaires", excerpt: "Une relation harmonieuse repose sur quelques bonnes pratiques simples, essentielles à une gestion fluide.", url: "article.html?a=evilance-fr-meilleures-pratiques-relation-locataire-proprietaire" },
      { title: "Les obligations de performance énergétique des logements", date: "2025-03-25", category: "Aspects juridiques", excerpt: "Les obligations de performance énergétique sont devenues essentielles pour les propriétaires bailleurs.", url: "article.html?a=les-obligations-de-performance-energetique-des-logements" },
      { title: "Les aides au logement disponibles pour les locataires", date: "2025-03-18", category: "Finances et fiscalité", excerpt: "Le logement pèse lourd dans le budget des ménages : tour d’horizon des aides qui peuvent l’alléger.", url: "article.html?a=les-aides-au-logement-disponibles-pour-les-locataires" },
      { title: "Les impacts de la loi ALUR sur la gestion locative", date: "2025-03-04", category: "Aspects juridiques", excerpt: "Depuis 2014, la loi ALUR a transformé le marché locatif. Ce que tout propriétaire doit savoir.", url: "article.html?a=les-impacts-de-la-loi-alur-sur-la-gestion-locative" },
      { title: "Comment gérer les nuisances sonores dans un immeuble", date: "2025-02-21", category: "Relations locataires-propriétaires", excerpt: "Voisin bruyant, musique trop forte, travaux à répétition : comment désamorcer les conflits.", url: "article.html?a=comment-gerer-les-nuisances-sonores-dans-un-immeuble" }
    ]
  },

  together: {
    title: "Construire ensemble",
    quote: "Seul on va plus vite, ensemble on va plus loin.",
    text: "Notre volonté est de vous satisfaire, et rien de mieux que de partager vos envies. En deux minutes, exprimez-vous librement sur la gestion locative de demain.",
    image: "https://kdcflcvufukagdjycwww.supabase.co/storage/v1/object/public/evilance-media/site/ensemble.webp",
    owner_label: "Je suis propriétaire",
    owner_url: "https://forms.office.com/e/caa7D2cBtU",
    tenant_label: "Je suis locataire",
    tenant_url: "https://forms.office.com/e/dzP9Gms8WM"
  },

  contact: {
    title: "Parlons de votre bien",
    intro: "Propriétaire, locataire, lecteur du blog ou partenaire : vous êtes au bon endroit pour nous envoyer votre demande, même si vous êtes arrivé ici par hasard.",
    booking_text: "Besoin d’un rendez-vous, d’un conseil ou d’un suivi ? Réservez directement un créneau dans notre agenda en ligne.",
    phone_text: "Besoin urgent ? Laissez-nous un message vocal, nous vous rappelons dès que possible.",
    closing: "Au plaisir de vous rencontrer"
  },

  legal: {
    html: "<h3>Éditeur du site</h3><p>EVILANCE, SAS au capital de 2 000 €<br>14 rue des Bouteilles, 45000 Orléans, France<br>Téléphone : +33 7 75 76 15 80 · E-mail : contact@evilance.fr<br>SIRET : 828 807 750 00025 · TVA intracommunautaire : FR49828807750</p><h3>Directeur de la publication</h3><p>Olivier Delacote</p><h3>Hébergement</h3><p>Site hébergé par GitHub Pages (GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis). Les contenus et les messages envoyés via le formulaire sont stockés par Supabase, dans un centre de données situé à Paris (Union européenne).</p><h3>Propriété intellectuelle</h3><p>Tous les éléments présents sur ce site (textes, images, vidéos, etc.) sont la propriété exclusive d’EVILANCE ou de ses partenaires. Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable d’EVILANCE.</p><h3>Responsabilité</h3><p>Les informations contenues sur ce site sont aussi précises que possible et le site est périodiquement mis à jour, mais il peut toutefois contenir des inexactitudes, des omissions ou des lacunes. Si vous constatez une erreur, merci de la signaler par e-mail en décrivant le problème le plus précisément possible.</p><h3>Données personnelles</h3><p>Les informations saisies dans le formulaire de contact (nom, prénom, e-mail, téléphone, objet, message) sont destinées exclusivement à EVILANCE pour répondre à votre demande et, le cas échéant, vous proposer nos services. Elles ne sont jamais cédées à des tiers, sauf obligation légale. Elles sont conservées au maximum trois ans après le dernier contact.</p><p>Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d’un droit d’accès, de rectification, d’effacement, d’opposition, de limitation et de portabilité de vos données. Pour les exercer, écrivez à contact@evilance.fr. Vous pouvez également introduire une réclamation auprès de la CNIL.</p><h3>Cookies</h3><p>Ce site ne dépose aucun cookie publicitaire ni de mesure d’audience. Les polices de caractères sont hébergées sur le site lui-même. Seul l’espace d’administration utilise un stockage local pour maintenir la session de l’administrateur.</p><h3>Liens hypertextes</h3><p>Le site contient des liens vers d’autres sites (agenda en ligne, questionnaires, LinkedIn, carte). EVILANCE ne peut vérifier leur contenu et n’assume aucune responsabilité à ce titre. Ces services peuvent collecter des données selon leurs propres politiques.</p><h3>Droit applicable</h3><p>Les présentes mentions sont régies par le droit français. Tout litige relève de la compétence exclusive des tribunaux d’Orléans.</p>"
  }
};
