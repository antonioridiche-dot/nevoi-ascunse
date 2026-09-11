/**
 * Tracking utilities for Facebook Pixel, Google Analytics 4, and Microsoft Clarity.
 * All tracking IDs are injected via environment variables (set in index.html).
 */

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    gtag: (...args: any[]) => void;
    clarity: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// ============ CONSENT-GATED LOADER (GDPR / ePrivacy) ============
// Analytics/marketing pixels load ONLY after the user accepts cookies.
let _analyticsLoaded = false;
export function loadAnalytics(): void {
  if (_analyticsLoaded || typeof window === "undefined") return;
  _analyticsLoaded = true;
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  const valid = (v?: string) => !!v && !v.includes("VITE_");
  const fb = env.VITE_FB_PIXEL_ID, ga = env.VITE_GA4_ID, cl = env.VITE_CLARITY_ID;
  const w = window as any, d = document;

  if (valid(fb)) {
    if (!w.fbq) {
      const n: any = (w.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); });
      if (!w._fbq) w._fbq = n;
      n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      const t = d.createElement("script"); t.async = true; t.src = "https://connect.facebook.net/en_US/fbevents.js";
      const s = d.getElementsByTagName("script")[0]; s.parentNode!.insertBefore(t, s);
    }
    w.fbq("init", fb); w.fbq("track", "PageView");
  }
  if (valid(ga)) {
    const t = d.createElement("script"); t.async = true; t.src = "https://www.googletagmanager.com/gtag/js?id=" + ga; d.head.appendChild(t);
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () { w.dataLayer.push(arguments); };
    w.gtag("js", new Date()); w.gtag("config", ga);
  }
  if (valid(cl)) {
    w.clarity = w.clarity || function () { (w.clarity.q = w.clarity.q || []).push(arguments); };
    const t = d.createElement("script"); t.async = true; t.src = "https://www.clarity.ms/tag/" + cl;
    const y = d.getElementsByTagName("script")[0]; y.parentNode!.insertBefore(t, y);
  }
}

// ============ FACEBOOK PIXEL ============
export function trackPixelEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params);
  }
}

export function trackPixelCustomEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", eventName, params);
  }
}

// ============ GOOGLE ANALYTICS 4 ============
export function trackGA4Event(eventName: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}

// ============ MICROSOFT CLARITY ============
export function trackClarityEvent(eventName: string, value?: string) {
  if (typeof window !== "undefined" && window.clarity) {
    window.clarity("set", eventName, value || "true");
  }
}

// ============ COMBINED TRACKING FUNCTIONS ============

/**
 * Track Lead event (quiz completion)
 */
export function trackLead(data: { email: string; gender: string; score: number }) {
  trackPixelEvent("Lead", {
    content_name: `Quiz ${data.gender}`,
    content_category: data.gender,
    value: data.score,
  });
  trackGA4Event("generate_lead", {
    method: "quiz",
    gender: data.gender,
    score: data.score,
  });
  trackClarityEvent("lead", data.gender);
}

/**
 * Track ViewContent event (sales page view)
 */
export function trackViewContent(data: { productName: string; value: number; currency?: string; gender: string }) {
  trackPixelEvent("ViewContent", {
    content_name: data.productName,
    content_type: "product",
    value: data.value,
    currency: data.currency || "RON",
  });
  trackGA4Event("view_item", {
    items: [{ item_name: data.productName, price: data.value }],
    currency: data.currency || "RON",
    value: data.value,
  });
  trackClarityEvent("view_content", data.productName);
}

/**
 * Track InitiateCheckout event
 */
export function trackInitiateCheckout(data: { productName: string; value: number; currency?: string }) {
  trackPixelEvent("InitiateCheckout", {
    content_name: data.productName,
    value: data.value,
    currency: data.currency || "RON",
    num_items: 1,
  });
  trackGA4Event("begin_checkout", {
    items: [{ item_name: data.productName, price: data.value }],
    currency: data.currency || "RON",
    value: data.value,
  });
  trackClarityEvent("initiate_checkout", data.productName);
}

/**
 * Track Purchase event
 */
export function trackPurchase(data: { productName: string; value: number; currency?: string; orderId?: string }) {
  trackPixelEvent("Purchase", {
    content_name: data.productName,
    value: data.value,
    currency: data.currency || "RON",
    content_type: "product",
  });
  trackGA4Event("purchase", {
    transaction_id: data.orderId || `order_${Date.now()}`,
    items: [{ item_name: data.productName, price: data.value }],
    currency: data.currency || "RON",
    value: data.value,
  });
  trackClarityEvent("purchase", data.productName);
}

/**
 * Track quiz start
 */
export function trackQuizStart(gender: string) {
  trackPixelCustomEvent("QuizStart", { gender });
  trackGA4Event("quiz_start", { gender });
  trackClarityEvent("quiz_start", gender);
}

/**
 * Track page view (called on route change)
 */
export function trackPageView(path: string) {
  trackGA4Event("page_view", { page_path: path });
}
