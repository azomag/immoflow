"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "fr" | "ar";

type TranslationTree = {
  nav: {
    links: Array<{ label: string; href: string }>;
    cta: string;
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
    cards: Array<{ title: string; description: string; metric: string }>;
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
  };
  workflows: {
    badge: string;
    title: string;
    description: string;
    items: Array<{ title: string; description: string }>;
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
  en: {
    nav: {
      links: [
        { label: "Home", href: "#home" },
        { label: "Listing", href: "#listings" },
        { label: "Plan", href: "#plans" },
        { label: "Contact", href: "#contact" },
      ],
      cta: "Book a demo",
    },
    hero: {
      badge: "Rental operations platform",
      title: "Immoflow for rental teams.",
      description:
        "A professional real-estate workflow for public listings, tenant follow-up, operational management, and decision-ready reporting.",
      primaryCta: "Browse listings",
      secondaryCta: "View plans",
      scroll: "Scroll",
    },
    overview: {
      badge: "Platform overview",
      title: "One product for the public website and the internal rental workflow.",
      description:
        "Immoflow gives every team the workspace it needs while keeping listings, contracts, visits, documents, and communication aligned in one operating model.",
      cards: [
        {
          title: "Agent workspace",
          description:
            "Manage visits, leads, owner follow-up, property updates, and pipeline activity from a single dashboard.",
          metric: "Faster lead handling",
        },
        {
          title: "Tenant portal",
          description:
            "Let tenants review listings, submit requests, track documents, and stay informed through a cleaner rental journey.",
          metric: "Clearer tenant journey",
        },
        {
          title: "Administration hub",
          description:
            "Supervise occupancy, approvals, reporting, and operational compliance with a complete view of the business.",
          metric: "Centralized control",
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
    },
    workflows: {
      badge: "Management",
      title: "Operational spaces designed around the real roles in a rental business.",
      description:
        "The platform separates responsibilities without fragmenting the data, so each actor works faster with fewer handoffs.",
      items: [
        {
          title: "Agent operations",
          description:
            "Track prospects, organize visits, update listing quality, and convert demand into signed occupancy.",
        },
        {
          title: "Tenant lifecycle",
          description:
            "Handle applications, files, follow-up, and key status updates in a structured communication flow.",
        },
        {
          title: "Administrative governance",
          description:
            "Monitor occupancy, financial performance, workload, and service quality from one reporting layer.",
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
          features: [
            "Public listings website",
            "Basic tenant requests",
            "Up to 50 active properties",
          ],
          cta: "Start with Starter",
        },
        {
          name: "Pro",
          price: "€129",
          audience: "For active teams managing visits, tenants, and internal follow-up.",
          features: [
            "Agent workspace and pipelines",
            "Tenant follow-up and document tracking",
            "Operational dashboards",
          ],
          featured: true,
          cta: "Choose Pro",
        },
        {
          name: "Enterprise",
          price: "Custom",
          audience: "For administrations and multi-branch organizations needing governance and reporting.",
          features: [
            "Role-based administration",
            "Custom reporting structure",
            "Priority onboarding and support",
          ],
          cta: "Talk to sales",
        },
      ],
    },
    contact: {
      badge: "Contact",
      title: "Plan your Immoflow rollout with the right operational setup.",
      description:
        "Discuss public listings, internal management, multilingual deployment, and reporting needs with our team.",
      cards: [
        { label: "Email", value: "contact@immoflow.app" },
        { label: "Phone", value: "+212 5 00 00 00 00" },
        { label: "Office", value: "Casablanca, Morocco" },
      ],
      cta: "Request a demo",
    },
    footer: {
      tagline:
        "Immoflow helps rental teams publish listings, coordinate operations, and keep tenants informed from one platform.",
      columns: [
        { title: "Navigation", links: ["Home", "Listing", "Plan", "Contact"] },
        { title: "Product", links: ["Agent workspace", "Tenant portal", "Administration"] },
      ],
      legal: ["Privacy policy", "Terms of service", "Cookies"],
      rights: "All rights reserved.",
    },
  },
  fr: {
    nav: {
      links: [
        { label: "Accueil", href: "#home" },
        { label: "Listing", href: "#listings" },
        { label: "Plan", href: "#plans" },
        { label: "Contact", href: "#contact" },
      ],
      cta: "Demander une demo",
    },
    hero: {
      badge: "Plateforme de gestion locative",
      title: "Immoflow pour les equipes locatives.",
      description:
        "Une experience professionnelle pour publier des logements, suivre la relation locataire, piloter la gestion et analyser la performance depuis une seule plateforme.",
      primaryCta: "Voir les logements",
      secondaryCta: "Voir les plans",
      scroll: "Defiler",
    },
    overview: {
      badge: "Vue d'ensemble",
      title: "Un seul produit pour le site public et pour toute l'organisation locative.",
      description:
        "Immoflow donne a chaque equipe son espace de travail tout en gardant les annonces, les visites, les contrats, les documents et les echanges dans un flux unique.",
      cards: [
        {
          title: "Espace agent",
          description:
            "Suivez les prospects, organisez les visites, mettez a jour les biens et pilotez l'activite commerciale depuis un seul tableau.",
          metric: "Traitement plus rapide",
        },
        {
          title: "Espace locataire",
          description:
            "Permettez au locataire de consulter les logements, envoyer ses demandes, suivre ses documents et rester informe a chaque etape.",
          metric: "Parcours plus clair",
        },
        {
          title: "Espace administration",
          description:
            "Supervisez l'occupation, les validations, les indicateurs et la conformite avec une vision globale de l'activite.",
          metric: "Pilotage centralise",
        },
      ],
      cta: "Voir la logique de gestion",
    },
    listings: {
      badge: "Logements publics",
      title: "Presentez les biens disponibles avec des informations claires et une mise en scene premium.",
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
          featuredLabel: "Selection",
          priceSuffix: "/ mois",
          statusLabel: "Disponible",
        },
        {
          id: "2",
          image: "/images/property-2.png",
          title: "Residence Horizon",
          location: "Rabat Agdal",
          price: 1200,
          rating: 4.8,
          reviews: 86,
          badge: "Appartement familial",
          featured: false,
          featuredLabel: "Selection",
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
          featuredLabel: "Selection",
          priceSuffix: "/ mois",
          statusLabel: "Pret a occuper",
        },
      ],
    },
    workflows: {
      badge: "Gestion",
      title: "Des espaces operationnels concus autour des vrais roles du metier locatif.",
      description:
        "La plateforme separe les responsabilites sans fragmenter les donnees, pour que chaque acteur gagne du temps avec moins d'allers-retours.",
      items: [
        {
          title: "Operations agent",
          description:
            "Centralisez les prospects, les visites, la qualite des annonces et la transformation en occupation signee.",
        },
        {
          title: "Cycle locataire",
          description:
            "Structurez les demandes, les dossiers, les relances et les mises a jour importantes dans un flux lisible.",
        },
        {
          title: "Pilotage administratif",
          description:
            "Suivez l'occupation, la performance, la charge des equipes et la qualite de service depuis un seul niveau de reporting.",
        },
      ],
    },
    plans: {
      badge: "Plans",
      title: "Choisissez le deploiement adapte a votre portefeuille et a votre organisation.",
      description:
        "Commencez avec une configuration legere ou activez une couche complete de gouvernance pour des equipes multiples.",
      cards: [
        {
          name: "Starter",
          price: "49€",
          audience: "Pour les petites agences qui lancent leur catalogue public.",
          features: [
            "Site web d'annonces",
            "Demandes locataires de base",
            "Jusqu'a 50 biens actifs",
          ],
          cta: "Commencer avec Starter",
        },
        {
          name: "Pro",
          price: "129€",
          audience: "Pour les equipes qui gerent visites, locataires et suivi interne.",
          features: [
            "Espace agent et pipeline",
            "Suivi locataire et documents",
            "Tableaux de bord operationnels",
          ],
          featured: true,
          cta: "Choisir Pro",
        },
        {
          name: "Enterprise",
          price: "Sur mesure",
          audience: "Pour les administrations et organisations multi-sites avec besoins de gouvernance.",
          features: [
            "Administration par roles",
            "Reporting personnalise",
            "Onboarding et support prioritaires",
          ],
          cta: "Contacter l'equipe",
        },
      ],
    },
    contact: {
      badge: "Contact",
      title: "Preparez votre deploiement Immoflow avec une organisation adaptee.",
      description:
        "Parlez de votre site public, de votre gestion interne, du multilingue et de vos besoins de reporting avec notre equipe.",
      cards: [
        { label: "Email", value: "contact@immoflow.app" },
        { label: "Telephone", value: "+212 5 00 00 00 00" },
        { label: "Bureau", value: "Casablanca, Maroc" },
      ],
      cta: "Demander une demo",
    },
    footer: {
      tagline:
        "Immoflow aide les equipes locatives a publier les biens, coordonner la gestion et informer les locataires depuis une seule plateforme.",
      columns: [
        { title: "Navigation", links: ["Accueil", "Listing", "Plan", "Contact"] },
        { title: "Produit", links: ["Espace agent", "Espace locataire", "Administration"] },
      ],
      legal: ["Confidentialite", "Conditions", "Cookies"],
      rights: "Tous droits reserves.",
    },
  },
  ar: {
    nav: {
      links: [
        { label: "الرئيسية", href: "#home" },
        { label: "العروض", href: "#listings" },
        { label: "الخطط", href: "#plans" },
        { label: "اتصل بنا", href: "#contact" },
      ],
      cta: "اطلب عرضا",
    },
    hero: {
      badge: "منصة لتدبير الكراء",
      title: "Immoflow لفرق التسيير الكرائي.",
      description:
        "تجربة احترافية لنشر السكنات ومتابعة المكتريين وتسيير العمليات وتحليل الاداء من خلال واجهة واحدة واضحة.",
      primaryCta: "تصفح السكنات",
      secondaryCta: "شاهد الخطط",
      scroll: "مرر",
    },
    overview: {
      badge: "نظرة عامة",
      title: "منتج واحد للموقع العمومي وللتدبير الداخلي الكامل.",
      description:
        "Immoflow تمنح لكل فريق مساحة العمل التي يحتاجها مع الحفاظ على الاعلانات والزيارات والعقود والوثائق والتواصل داخل نفس المسار.",
      cards: [
        {
          title: "فضاء الوكيل",
          description:
            "تتبع العملاء المحتملين وتنظيم الزيارات وتحديث السكنات ومراقبة النشاط التجاري من لوحة واحدة.",
          metric: "معالجة اسرع",
        },
        {
          title: "فضاء المكتري",
          description:
            "تمكين المكتري من مشاهدة السكنات وارسال الطلبات وتتبع الوثائق والبقاء على اطلاع في كل مرحلة.",
          metric: "رحلة اوضح",
        },
        {
          title: "فضاء الادارة",
          description:
            "مراقبة الاشغال والموافقات والمؤشرات والامتثال عبر رؤية شاملة للنشاط.",
          metric: "تحكم مركزي",
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
    },
    workflows: {
      badge: "التسيير",
      title: "مساحات تشغيل مصممة حسب الادوار الحقيقية في النشاط الكرائي.",
      description:
        "المنصة تفصل المسؤوليات بدون تشتيت المعطيات حتى يشتغل كل طرف بسرعة اكبر وباقل تنقل بين الادوات.",
      items: [
        {
          title: "عمليات الوكيل",
          description:
            "مركز واحد لتدبير العملاء والزيارات وجودة الاعلانات وتحويل الطلب الى سكن فعلي.",
        },
        {
          title: "مسار المكتري",
          description:
            "تنظيم الطلبات والملفات والتذكيرات والتحديثات المهمة في مسار واضح وسهل المتابعة.",
        },
        {
          title: "الاشراف الاداري",
          description:
            "متابعة الاشغال والاداء وعبء الفرق وجودة الخدمة من خلال طبقة تقارير موحدة.",
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
          features: [
            "موقع للعروض العقارية",
            "طلبات مكتريين اساسية",
            "حتى 50 عقارا نشطا",
          ],
          cta: "ابدأ مع Starter",
        },
        {
          name: "Pro",
          price: "129€",
          audience: "للفرق التي تدير الزيارات والمكتريين والمتابعة الداخلية يوميا.",
          features: [
            "فضاء الوكلاء ومسار المتابعة",
            "متابعة المكتريين والوثائق",
            "لوحات قيادة تشغيلية",
          ],
          featured: true,
          cta: "اختر Pro",
        },
        {
          name: "Enterprise",
          price: "حسب الطلب",
          audience: "للا دارات والمؤسسات متعددة الفروع التي تحتاج الى حكامة وتقارير متقدمة.",
          features: [
            "ادارة حسب الصلاحيات",
            "تقارير مخصصة",
            "مواكبة ودعم اولوية",
          ],
          cta: "تحدث معنا",
        },
      ],
    },
    contact: {
      badge: "اتصل بنا",
      title: "ابن انطلاقة Immoflow المناسبة لطريقة عملك.",
      description:
        "ناقش معنا الموقع العمومي والتدبير الداخلي وتعدد اللغات واحتياجات التقارير قبل الاطلاق.",
      cards: [
        { label: "البريد", value: "contact@immoflow.app" },
        { label: "الهاتف", value: "+212 5 00 00 00 00" },
        { label: "المكتب", value: "الدار البيضاء - المغرب" },
      ],
      cta: "اطلب عرضا تجريبيا",
    },
    footer: {
      tagline:
        "Immoflow تساعد فرق الكراء على نشر السكنات وتنسيق العمليات وابقاء المكتريين على اطلاع من منصة واحدة.",
      columns: [
        { title: "التنقل", links: ["الرئيسية", "العروض", "الخطط", "اتصل بنا"] },
        { title: "المنتج", links: ["فضاء الوكيل", "فضاء المكتري", "الادارة"] },
      ],
      legal: ["الخصوصية", "الشروط", "الكوكيز"],
      rights: "جميع الحقوق محفوظة.",
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

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return "fr";
    }

    const savedLocale = window.localStorage.getItem("immoflow-locale") as Locale | null;
    return savedLocale && savedLocale in translations ? savedLocale : "fr";
  });

  useEffect(() => {
    window.localStorage.setItem("immoflow-locale", locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      dir: locale === "ar" ? "rtl" : "ltr",
      t: translations[locale],
    }),
    [locale]
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
