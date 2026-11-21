/**
 * SEO técnico para SPA — helpers para definir meta tags por rota
 * e injectar dados estruturados JSON-LD.
 */

export const SITE_URL = (
  import.meta.env.VITE_APP_URL || 'https://womanexperience.ao'
).replace(/\/$/, '');

export const SITE_NAME = 'Mulheres de Fogo — Woman Experience';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/bilhete.jpg`;

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMeta(attr: 'name' | 'property', key: string) {
  document.head
    .querySelectorAll(`meta[${attr}="${key}"]`)
    .forEach((el) => el.remove());
}

export interface PageMeta {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  ogType?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const JSONLD_ID = 'wex-jsonld';

/** Aplica title, description, canonical, OG/Twitter e robots de uma página. */
export function applyPageMeta(meta: PageMeta): () => void {
  const url = `${SITE_URL}${meta.path === '/' ? '/' : meta.path}`;
  const previousTitle = document.title;

  document.title = meta.title;
  setMeta('name', 'description', meta.description);
  setMeta('name', 'robots', meta.noindex ? 'noindex, nofollow' : 'index, follow');

  // Canonical
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;

  // Open Graph
  setMeta('property', 'og:site_name', SITE_NAME);
  setMeta('property', 'og:title', meta.title);
  setMeta('property', 'og:description', meta.description);
  setMeta('property', 'og:type', meta.ogType || 'website');
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:image', DEFAULT_OG_IMAGE);
  setMeta('property', 'og:locale', 'pt_AO');

  // Twitter
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', meta.title);
  setMeta('name', 'twitter:description', meta.description);
  setMeta('name', 'twitter:image', DEFAULT_OG_IMAGE);

  // JSON-LD
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = JSONLD_ID;
  if (meta.jsonLd) {
    script.textContent = JSON.stringify(
      Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd]
    );
    document.head.appendChild(script);
  }

  return () => {
    document.title = previousTitle;
    document.getElementById(JSONLD_ID)?.remove();
  };
}

export const EVENT_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'Conferência Explosão Profética Mulheres de Fogo — 2ª Edição',
  description:
    'Conferência de fé, identidade, propósito, liderança e capacitação para mulheres.',
  startDate: '2026-12-05',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  eventStatus: 'https://schema.org/EventScheduled',
  location: {
    '@type': 'Place',
    name: 'Talatona Shopping',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Talatona',
      addressLocality: 'Luanda',
      addressCountry: 'AO',
    },
  },
  organizer: {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    email: 'geral@womanexperience.ao',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'AOA',
    availability: 'https://schema.org/InStock',
    url: `${SITE_URL}/`,
  },
};

export const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  email: 'geral@womanexperience.ao',
  telephone: '+244932583167',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Via A1, Talatona',
    addressLocality: 'Luanda',
    addressCountry: 'AO',
  },
  sameAs: [
    'https://www.instagram.com/muf.mulheresdefogo/',
    'https://www.facebook.com/profile.php?id=61583199112349',
  ],
};

export const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: 'pt-AO',
};
