"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Locale = "en" | "fr" | "ar";

type TranslationTree = {
  nav: {
    links: Array<{ label: string; href: string }>;
    cta: string;
    login: string;
    signup: string;
    profileSettings: string;
    dashboard: string;
    logout: string;
  };
  hero: {
    badge: string;
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    scroll: string;
  };
  overview: {
    badge: string;
    title: string;
    description: string;
    cards: Array<{ title: string; subtitle: string; description: string }>;
    cta: string;
  };
  listings: {
    badge: string;
    title: string;
    cta: string;
    items: Array<{
      id: string;
      image: string;
      title: string;
      location: string;
      price: number;
      rating: number;
      reviews: number;
      badge: string;
      featured: boolean;
      featuredLabel: string;
      priceSuffix: string;
      statusLabel: string;
    }>;
    filters: {
      destination: string;
      destinationPlaceholder: string;
      bedrooms: string;
      maxBudget: string;
      reset: string;
      categories: {
        all: string;
        apartments: string;
        houses: string;
        parking: string;
        premium: string;
      };
      availableTitle: string;
      listingSingular: string;
      listingPlural: string;
      publishedByAgents: string;
      viewAll: string;
      noResultsTitle: string;
      noResultsDescription: string;
      perMonth: string;
      saveListing: string;
    };
  };
  workflows: {
    badge: string;
    title: string;
    description: string;
    items: Array<{ title: string; subtitle: string; description: string }>;
  };
  plans: {
    badge: string;
    title: string;
    description: string;
    cards: Array<{
      name: string;
      price: string;
      audience: string;
      features: string[];
      featured?: boolean;
      cta: string;
    }>;
  };
  teams: {
    badge: string;
    title: string;
    description: string;
    members: Array<{
      id: string;
      name: string;
      department: string;
      specialty: string;
      image: string;
      socials: {
        twitter?: string;
        linkedin?: string;
        github?: string;
        mail?: string;
      };
    }>;
  };
  contact: {
    badge: string;
    title: string;
    description: string;
    cards: Array<{ label: string; value: string }>;
    cta: string;
  };
  footer: {
    tagline: string;
    columns: Array<{ title: string; links: string[] }>;
    legal: string[];
    rights: string;
  };
};

const translations: Record<Locale, TranslationTree> = {
  fr: {
    nav: {
      links: [
        { label: "Accueil", href: "/" },
        { label: "Plateforme", href: "#overview" },
        { label: "Gestion", href: "#workflows" },
        { label: "Contact", href: "#contact" },
      ],
      cta: "Connexion",
      login: "Connexion",
      signup: "Inscription",
      profileSettings: "Paramètres du profil",
      dashboard: "Tableau de bord",
      logout: "Déconnexion",
    },
    hero: {
      badge: "Solution de gestion immobilière tout-en-un",
      title: "Gérez vos biens immobiliers en toute simplicité",
      description:
        "Publiez, louez, encaissez en toute sécurité. Offrez une expérience digitale fluide et gagnez des heures chaque semaine avec IMMOFLOW.",
      primaryCta: "Découvrir plus",
      secondaryCta: "Voir les plans",
      scroll: "Découvrir plus",
    },
    overview: {
      badge: "Vue d'ensemble",
      title: "Gérez vos annonces et votre gestion locative depuis un seul produit.",
      description:
        "Immoflow centralise tout : annonces, visites, contrats et échanges. Chaque équipe garde son espace de travail, dans un flux unique et clair.",
      cards: [
        {
          title: "Espace Agent",
          subtitle: "Plus simple",
          description:
            "Un seul écran pour suivre vos prospects, planifier les visites et gérer vos biens.",
        },
        {
          title: "Espace Locataire",
          subtitle: "Parcours plus clair",
          description:
            "Permettez à vos locataires de consulter les logements, envoyer leurs demandes et suivre leurs documents en toute autonomie.",
        },
        {
          title: "Espace Administration",
          subtitle: "Pilotage centralisé",
          description:
            "Supervisez l’occupation, les validations et les indicateurs clés avec une vision globale en temps réel.",
        },
      ],
      cta: "Voir la logique de gestion",
    },
    listings: {
      badge: "Logements publics",
      title: "Présentez les biens disponibles avec des informations claires et une mise en scène premium.",
      cta: "Voir tous les logements",
      items: [
        {
          id: "1",
          image: "/images/property-1.png",
          title: "Palm View Residence",
          location: "Casablanca Finance City",
          price: 850,
          rating: 4.9,
          reviews: 124,
          badge: "2 chambres",
          featured: true,
          featuredLabel: "Sélection",
          priceSuffix: "/ mois",
          statusLabel: "Disponible",
        },
        {
          id: "2",
          image: "/images/property-2.png",
          title: "Résidence Horizon",
          location: "Rabat Agdal",
          price: 1200,
          rating: 4.8,
          reviews: 86,
          badge: "Appartement familial",
          featured: false,
          featuredLabel: "Sélection",
          priceSuffix: "/ mois",
          statusLabel: "Nouvelle annonce",
        },
        {
          id: "3",
          image: "/images/property-3.png",
          title: "Marina Loft",
          location: "Tanger Marina Bay",
          price: 1500,
          rating: 4.9,
          reviews: 210,
          badge: "Vue mer",
          featured: true,
          featuredLabel: "Sélection",
          priceSuffix: "/ mois",
          statusLabel: "Prêt à occuper",
        },
      ],
      filters: {
        destination: "Destination",
        destinationPlaceholder: "Ville, quartier, adresse",
        bedrooms: "Chambres",
        maxBudget: "Budget max",
        reset: "Réinitialiser",
        categories: {
          all: "Tous",
          apartments: "Appartements",
          houses: "Maisons",
          parking: "Parking",
          premium: "Premium",
        },
        availableTitle: "Logements disponibles",
        listingSingular: "annonce",
        listingPlural: "annonces",
        publishedByAgents: "publiées par les agents Immoflow.",
        viewAll: "Voir tout",
        noResultsTitle: "Aucun logement trouvé",
        noResultsDescription: "Changez les filtres pour afficher plus d'annonces.",
        perMonth: "/ mois",
        saveListing: "Enregistrer l'annonce",
      },
    },
    workflows: {
      badge: "Gestion",
      title: "Organisez la gestion locative par rôle, sans perdre la vue d’ensemble.",
      description:
        "Séparez les responsabilités, gardez les données centralisées. Gagnez du temps et réduisez les allers-retours.",
      items: [
        {
          title: "Opérations agent",
          subtitle: "Vendez plus vite",
          description:
            "Suivez vos prospects et visites au même endroit. Moins de temps perdu, plus de baux signés.",
        },
        {
          title: "Cycle locataire",
          subtitle: "Simplifiez la gestion",
          description:
            "Centralisez demandes, documents et relances. Tout est clair, rien ne se perd.",
        },
        {
          title: "Pilotage administratif",
          subtitle: "Supervision opérationnelle",
          description:
            "Mesurez la performance des équipes, l’occupation et la qualité de service en temps réel.",
        },
      ],
    },
    plans: {
      badge: "Plans",
      title: "Choisissez le déploiement adapté à votre organisation.",
      description:
        "Commencez avec une configuration légère ou activez une couche complète de gouvernance.",
      cards: [
        {
          name: "Starter",
          price: "49€",
          audience: "Pour les petites agences qui lancent leur catalogue.",
          features: ["Site web d'annonces", "Demandes locataires", "Jusqu'à 50 biens"],
          cta: "Commencer",
        },
        {
          name: "Pro",
          price: "129€",
          audience: "Pour gérer les visites, locataires et suivi interne.",
          features: ["Espace agent et pipeline", "Suivi locataire", "Tableaux de bord"],
          featured: true,
          cta: "Choisir Pro",
        },
        {
          name: "Enterprise",
          price: "Sur mesure",
          audience: "Pour les organisations avec besoins de gouvernance.",
          features: ["Administration par rôles", "Reporting", "Support prioritaire"],
          cta: "Nous contacter",
        },
      ],
    },
    teams: {
      badge: "Le Cœur de l'Ingénierie",
      title: "Rencontrez les esprits derrière l'architecture.",
      description: "Un collectif de designers, d'ingénieurs et de stratèges dédiés à l'élévation de vos espaces de travail.",
      members: [
        {
          id: "1",
          name: "Mohamed Azoumag",
          department: "Génie Informatique",
          specialty: "Full Stack Developer",
          image: "/teams/mohamed.png",
          socials: { twitter: "#", linkedin: "#", github: "#" },
        },
        {
          id: "2",
          name: "Hajar Kandri",
          department: "Génie Informatique",
          specialty: "Administratrice Réseau",
          image: "/teams/hajar.png",
          socials: { twitter: "#", linkedin: "#", mail: "mailto:#" },
        },
        {
          id: "3",
          name: "Hind Khodari",
          department: "Génie Informatique",
          specialty: "Cybersecurity Specialist",
          image: "/teams/hind.png",
          socials: { linkedin: "#", github: "#" },
        },
      ],
    },
    contact: {
      badge: "Contact",
      title: "Lancez Immoflow avec la bonne organisation",
      description:
        "Discutez de vos besoins avec notre équipe : site public, gestion interne, multi-langue et reporting.",
      cards: [
        { label: "Email", value: "contact@immoflow.com" },
        { label: "Téléphone", value: "+212 695446640" },
        { label: "Bureau", value: "Sala EL Jadida, Maroc" },
      ],
      cta: "Demander une démo",
    },
    footer: {
      tagline:
        "Immoflow centralise la gestion locative : publication des biens, organisation des visites et suivi des locataires sur une seule plateforme.",
      columns: [
        { title: "Navigation", links: ["Accueil", "Plateforme", "Gestion", "Contact"] },
        { title: "Produit", links: ["Espace Agent", "Espace Locataire", "Administration"] },
      ],
      legal: ["Confidentialité", "Conditions", "Cookies"],
      rights: "© 2026 Immoflow. Tous droits réservés.",
    },
  },
  en: {
    nav: {
      links: [
        { label: "Home", href: "/" },
        { label: "Platform", href: "#overview" },
        { label: "Management", href: "#workflows" },
        { label: "Contact", href: "#contact" },
      ],
      cta: "Login",
      login: "Login",
      signup: "Sign up",
      profileSettings: "Profile settings",
      dashboard: "Dashboard",
      logout: "Logout",
    },
    hero: {
      badge: "All-in-one property management solution",
      title: "Manage your real estate properties with ease",
      description:
        "Publish, rent, and collect securely. Offer a seamless digital experience and save hours every week with IMMOFLOW.",
      primaryCta: "Discover more",
      secondaryCta: "View plans",
      scroll: "Discover more",
    },
    overview: {
      badge: "Platform overview",
      title: "Manage your listings and rental operations from a single product.",
      description:
        "Immoflow centralizes everything: listings, visits, contracts, and communication. Each team keeps their workspace in a single, clear flow.",
      cards: [
        {
          title: "Agent Workspace",
          subtitle: "Simpler",
          description: "A single screen to track your leads, schedule visits, and manage properties.",
        },
        {
          title: "Tenant Workspace",
          subtitle: "Clearer journey",
          description: "Allow tenants to view properties, send requests, and track documents independently.",
        },
        {
          title: "Administration Workspace",
          subtitle: "Centralized control",
          description: "Supervise occupancy, approvals, and key metrics with a global real-time view.",
        },
      ],
      cta: "See how management flows work",
    },
    listings: {
      badge: "Public listings",
      title: "Show available housing with clear information and a premium presentation.",
      cta: "See all listings",
      items: [
        {
          id: "1",
          image: "/images/property-1.png",
          title: "Palm View Residence",
          location: "Casablanca Finance City",
          price: 850,
          rating: 4.9,
          reviews: 124,
          badge: "2 bedrooms",
          featured: true,
          featuredLabel: "Featured",
          priceSuffix: "/ month",
          statusLabel: "Available now",
        },
        {
          id: "2",
          image: "/images/property-2.png",
          title: "Residence Horizon",
          location: "Rabat Agdal",
          price: 1200,
          rating: 4.8,
          reviews: 86,
          badge: "Family apartment",
          featured: false,
          featuredLabel: "Featured",
          priceSuffix: "/ month",
          statusLabel: "New listing",
        },
        {
          id: "3",
          image: "/images/property-3.png",
          title: "Marina Loft",
          location: "Tangier Marina Bay",
          price: 1500,
          rating: 4.9,
          reviews: 210,
          badge: "Sea view",
          featured: true,
          featuredLabel: "Featured",
          priceSuffix: "/ month",
          statusLabel: "Move-in ready",
        },
      ],
      filters: {
        destination: "Destination",
        destinationPlaceholder: "City, district, address",
        bedrooms: "Bedrooms",
        maxBudget: "Max budget",
        reset: "Reset",
        categories: {
          all: "All",
          apartments: "Apartments",
          houses: "Houses",
          parking: "Parking",
          premium: "Premium",
        },
        availableTitle: "Available homes",
        listingSingular: "listing",
        listingPlural: "listings",
        publishedByAgents: "published by Immoflow agents.",
        viewAll: "View all",
        noResultsTitle: "No homes found",
        noResultsDescription: "Change the filters to show more listings.",
        perMonth: "/ month",
        saveListing: "Save listing",
      },
    },
    workflows: {
      badge: "Management",
      title: "Organize rental management by role, without losing the big picture.",
      description:
        "Separate responsibilities, keep data centralized. Save time and reduce back-and-forths.",
      items: [
        {
          title: "Agent operations",
          subtitle: "Sell faster",
          description: "Track leads and visits in one place. Less time wasted, more leases signed.",
        },
        {
          title: "Tenant cycle",
          subtitle: "Simplify management",
          description: "Centralize requests, documents, and reminders. Everything is clear, nothing is lost.",
        },
        {
          title: "Administrative steering",
          subtitle: "Operational supervision",
          description: "Measure team performance, occupancy, and service quality in real time.",
        },
      ],
    },
    plans: {
      badge: "Plans",
      title: "Choose the rollout that matches your portfolio and operations.",
      description:
        "Start with a lean setup for one agency or deploy a complete governance layer for multi-team operations.",
      cards: [
        {
          name: "Starter",
          price: "€49",
          audience: "For small agencies launching their public catalog.",
          features: ["Public listings website", "Basic tenant requests", "Up to 50 active properties"],
          cta: "Start with Starter",
        },
        {
          name: "Pro",
          price: "€129",
          audience: "For active teams managing visits, tenants, and internal follow-up.",
          features: ["Agent workspace and pipelines", "Tenant follow-up and document tracking", "Operational dashboards"],
          featured: true,
          cta: "Choose Pro",
        },
        {
          name: "Enterprise",
          price: "Custom",
          audience: "For administrations and multi-branch organizations needing governance and reporting.",
          features: ["Role-based administration", "Custom reporting structure", "Priority onboarding and support"],
          cta: "Talk to sales",
        },
      ],
    },
    teams: {
      badge: "The Engineering Core",
      title: "Meet the minds behind the architecture.",
      description: "A collective of designers, engineers, and strategists dedicated to elevating your digital and physical workspaces.",
      members: [
        {
          id: "1",
          name: "Mohamed Azoumag",
          department: "Computer Engineering",
          specialty: "Full Stack Developer",
          image: "/teams/mohamed.png",
          socials: { twitter: "#", linkedin: "#", github: "#" },
        },
        {
          id: "2",
          name: "Hajar Kandri",
          department: "Computer Engineering",
          specialty: "Network Administrator",
          image: "/teams/hajar.png",
          socials: { twitter: "#", linkedin: "#", mail: "mailto:#" },
        },
        {
          id: "3",
          name: "Hind Khodari",
          department: "Computer Engineering",
          specialty: "Cybersecurity Specialist",
          image: "/teams/hind.png",
          socials: { linkedin: "#", github: "#" },
        },
      ],
    },
    contact: {
      badge: "Contact",
      title: "Launch Immoflow with the right setup",
      description:
        "Discuss your needs with our team: public site, internal management, multi-language, and reporting.",
      cards: [
        { label: "Email", value: "contact@immoflow.com" },
        { label: "Phone", value: "+212 695446640" },
        { label: "Office", value: "Sala EL Jadida, Morocco" },
      ],
      cta: "Request a demo",
    },
    footer: {
      tagline:
        "Immoflow centralizes rental management: publishing properties, organizing visits, and following up with tenants on a single platform.",
      columns: [
        { title: "Navigation", links: ["Home", "Platform", "Management", "Contact"] },
        { title: "Product", links: ["Agent Workspace", "Tenant Workspace", "Administration"] },
      ],
      legal: ["Privacy", "Terms", "Cookies"],
      rights: "© 2026 Immoflow. All rights reserved.",
    },
  },
  ar: {
    nav: {
      links: [
        { label: "الرئيسية", href: "/" },
        { label: "المنصة", href: "#overview" },
        { label: "التسيير", href: "#workflows" },
        { label: "اتصل بنا", href: "#contact" },
      ],
      cta: "تسجيل الدخول",
      login: "تسجيل الدخول",
      signup: "إنشاء حساب",
      profileSettings: "إعدادات الملف",
      dashboard: "لوحة التحكم",
      logout: "تسجيل الخروج",
    },
    hero: {
      badge: "حل متكامل لإدارة العقارات",
      title: "قم بإدارة عقاراتك بكل سهولة",
      description:
        "انشر، أجر، وحصّل بأمان. قدم تجربة رقمية سلسة ووفر ساعات كل أسبوع مع IMMOFLOW.",
      primaryCta: "اكتشف المزيد",
      secondaryCta: "شاهد الخطط",
      scroll: "اكتشف المزيد",
    },
    overview: {
      badge: "نظرة عامة",
      title: "قم بإدارة إعلاناتك وعمليات الكراء من منتج واحد.",
      description:
        "إيموفلو يركز كل شيء: الإعلانات، الزيارات، العقود والتواصل. يحتفظ كل فريق بمساحة عمله ضمن مسار واحد وواضح.",
      cards: [
        {
          title: "فضاء الوكيل",
          subtitle: "أكثر بساطة",
          description: "شاشة واحدة لتتبع عملائك، جدولة الزيارات وإدارة عقاراتك.",
        },
        {
          title: "فضاء المكتري",
          subtitle: "مسار أوضح",
          description: "اسمح لمكتريك بالاطلاع على السكنات، إرسال طلباتهم وتتبع وثائقهم بكل استقلالية.",
        },
        {
          title: "فضاء الإدارة",
          subtitle: "تحكم مركزي",
          description: "أشرف على الإشغال والموافقات والمؤشرات الرئيسية برؤية شاملة في الوقت الفعلي.",
        },
      ],
      cta: "اكتشف منطق التسيير",
    },
    listings: {
      badge: "السكنات المعروضة",
      title: "اعرض السكنات المتاحة بمعلومات واضحة وتقديم احترافي.",
      cta: "عرض كل السكنات",
      items: [
        {
          id: "1",
          image: "/images/property-1.png",
          title: "Palm View Residence",
          location: "الدار البيضاء - كازا فايننس سيتي",
          price: 850,
          rating: 4.9,
          reviews: 124,
          badge: "غرفتان",
          featured: true,
          featuredLabel: "مميز",
          priceSuffix: "/ الشهر",
          statusLabel: "متاح الان",
        },
        {
          id: "2",
          image: "/images/property-2.png",
          title: "Residence Horizon",
          location: "الرباط - اكدال",
          price: 1200,
          rating: 4.8,
          reviews: 86,
          badge: "شقة عائلية",
          featured: false,
          featuredLabel: "مميز",
          priceSuffix: "/ الشهر",
          statusLabel: "عرض جديد",
        },
        {
          id: "3",
          image: "/images/property-3.png",
          title: "Marina Loft",
          location: "طنجة - مارينا باي",
          price: 1500,
          rating: 4.9,
          reviews: 210,
          badge: "اطلالة بحرية",
          featured: true,
          featuredLabel: "مميز",
          priceSuffix: "/ الشهر",
          statusLabel: "جاهز للسكن",
        },
      ],
      filters: {
        destination: "الوجهة",
        destinationPlaceholder: "المدينة، الحي، العنوان",
        bedrooms: "الغرف",
        maxBudget: "أقصى ميزانية",
        reset: "إعادة",
        categories: {
          all: "الكل",
          apartments: "شقق",
          houses: "منازل",
          parking: "موقف",
          premium: "مميز",
        },
        availableTitle: "السكنات المتاحة",
        listingSingular: "عرض",
        listingPlural: "عروض",
        publishedByAgents: "منشورة من طرف وكلاء Immoflow.",
        viewAll: "عرض الكل",
        noResultsTitle: "لم يتم العثور على سكن",
        noResultsDescription: "غيّر المرشحات لعرض المزيد من الإعلانات.",
        perMonth: "/ الشهر",
        saveListing: "حفظ الإعلان",
      },
    },
    workflows: {
      badge: "التسيير",
      title: "نظم الإدارة الإيجارية حسب الدور، دون أن تفقد الصورة العامة.",
      description:
        "افصل بين المسؤوليات، واحتفظ بالبيانات مركزية. وفر الوقت وقلل من التردد ذهاباً وإياباً.",
      items: [
        {
          title: "عمليات الوكيل",
          subtitle: "بِع بشكل أسرع",
          description: "تتبع العملاء المحتملين والزيارات في مكان واحد. وقت ضائع أقل، عقود أكثر موقعة.",
        },
        {
          title: "دورة المكتري",
          subtitle: "بسط الإدارة",
          description: "ركز الطلبات والوثائق والتذكيرات. كل شيء واضح، لا شيء يضيع.",
        },
        {
          title: "القيادة الإدارية",
          subtitle: "إشراف تشغيلي",
          description: "قس أداء الفرق والإشغال وجودة الخدمة في الوقت الفعلي.",
        },
      ],
    },
    plans: {
      badge: "الخطط",
      title: "اختر الصيغة المناسبة لمحفظتك العقارية وطريقة عملك.",
      description:
        "ابدأ باعداد خفيف لوكالة واحدة او فعّل طبقة كاملة من الحكامة لفرق متعددة.",
      cards: [
        {
          name: "Starter",
          price: "49€",
          audience: "لوكالات صغيرة تريد اطلاق الموقع العمومي بسرعة.",
          features: ["موقع للعروض العقارية", "طلبات مكتريين اساسية", "حتى 50 عقارا نشطا"],
          cta: "ابدأ مع Starter",
        },
        {
          name: "Pro",
          price: "129€",
          audience: "للفرق التي تدير الزيارات والمكتريين والمتابعة الداخلية يوميا.",
          features: ["فضاء الوكلاء ومسار المتابعة", "متابعة المكتريين والوثائق", "لوحات قيادة تشغيلية"],
          featured: true,
          cta: "اختر Pro",
        },
        {
          name: "Enterprise",
          price: "حسب الطلب",
          audience: "للا دارات والمؤسسات متعددة الفروع التي تحتاج الى حكامة وتقارير متقدمة.",
          features: ["ادارة حسب الصلاحيات", "تقارير مخصصة", "مواكبة ودعم اولوية"],
          cta: "تحدث معنا",
        },
      ],
    },
    teams: {
      badge: "الجوهر الهندسي",
      title: "تعرف على العقول التي تقف وراء الهندسة.",
      description: "مجموعة من المصممين والمهندسين والاستراتيجيين المكرسين للارتقاء بمساحات عملك.",
      members: [
        {
          id: "1",
          name: "Mohamed Azoumag",
          department: "هندسة المعلوميات",
          specialty: "مطور مواقع شامل",
          image: "/teams/mohamed.png",
          socials: { twitter: "#", linkedin: "#", github: "#" },
        },
        {
          id: "2",
          name: "Hajar Kandri",
          department: "هندسة المعلوميات",
          specialty: "مسؤولة شبكات",
          image: "/teams/hajar.png",
          socials: { twitter: "#", linkedin: "#", mail: "mailto:#" },
        },
        {
          id: "3",
          name: "Hind Khodari",
          department: "هندسة المعلوميات",
          specialty: "خبيرة أمن سيبراني",
          image: "/teams/hind.png",
          socials: { linkedin: "#", github: "#" },
        },
      ],
    },
    contact: {
      badge: "اتصل بنا",
      title: "أطلق إيموفلو بالتنظيم الصحيح",
      description:
        "ناقش احتياجاتك مع فريقنا: الموقع العام، الإدارة الداخلية، تعدد اللغات وإعداد التقارير.",
      cards: [
        { label: "البريد", value: "contact@immoflow.com" },
        { label: "الهاتف", value: "+212 695446640" },
        { label: "المكتب", value: "سلا الجديدة، المغرب" },
      ],
      cta: "اطلب عرضاً تجريبياً",
    },
    footer: {
      tagline:
        "إيموفلو يركز الإدارة الإيجارية: نشر العقارات، تنظيم الزيارات ومتابعة المكتريين على منصة واحدة.",
      columns: [
        { title: "التنقل", links: ["الرئيسية", "المنصة", "الإدارة", "اتصل بنا"] },
        { title: "المنتج", links: ["فضاء الوكيل", "فضاء المكتري", "الإدارة"] },
      ],
      legal: ["الخصوصية", "الشروط", "ملفات تعريف الارتباط"],
      rights: "© 2026 إيموفلو. جميع الحقوق محفوظة.",
    },
  },
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: "ltr" | "rtl";
  t: TranslationTree;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const DEFAULT_LOCALE: Locale = "fr";
const LOCALE_STORAGE_KEY = "immoflow-locale";
const LOCALE_CHANGE_EVENT = "immoflow-locale-change";

function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "fr" || value === "ar";
}

function getStoredLocale() {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(savedLocale) ? savedLocale : DEFAULT_LOCALE;
}

function subscribeToLocale(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => callback();
  window.addEventListener("storage", handleChange);
  window.addEventListener(LOCALE_CHANGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(LOCALE_CHANGE_EVENT, handleChange);
  };
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeToLocale,
    getStoredLocale,
    () => DEFAULT_LOCALE
  );

  const setLocale = useCallback((nextLocale: Locale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  }, []);

  useEffect(() => {
    const isArabic = locale === "ar";

    document.documentElement.lang = locale;
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
    document.documentElement.dataset.locale = locale;
    document.documentElement.classList.toggle("locale-ar", isArabic);
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      dir: locale === "ar" ? "rtl" : "ltr",
      t: translations[locale],
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}