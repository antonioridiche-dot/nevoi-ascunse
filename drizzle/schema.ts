import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/** Helper: NOT NULL timestamp column defaulting to now (stored as unix seconds). */
const tsNow = (name: string) =>
  integer(name, { mode: "timestamp" }).notNull().default(sql`(unixepoch())`);
/** Helper: nullable timestamp column. */
const tsNullable = (name: string) => integer(name, { mode: "timestamp" });

/**
 * Core user table backing auth flow (admin users).
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: tsNow("createdAt"),
  updatedAt: tsNow("updatedAt").$onUpdate(() => new Date()),
  lastSignedIn: tsNow("lastSignedIn"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Contacts - people who take the quiz / buy products.
 * This is the main CRM table.
 */
export const contacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  firstName: text("firstName"),
  gender: text("gender", { enum: ["male", "female"] }).notNull(),
  tag: text("tag"),
  status: text("status", { enum: ["lead", "customer", "refunded", "unsubscribed"] }).default("lead").notNull(),
  /** Quiz score (procent_sanse / categorie_rezultat) */
  procentSanse: integer("procentSanse"),
  /** Lead score based on engagement */
  leadScore: integer("leadScore").default(0).notNull(),
  /** Pipeline stage */
  pipelineStage: text("pipelineStage", { enum: ["quiz_completed", "sales_page_viewed", "checkout_started", "purchased", "upsell_purchased", "coaching_active"] }).default("quiz_completed").notNull(),
  /** Affiliate who referred this contact */
  affiliateId: integer("affiliateId"),
  /** Stripe customer ID */
  stripeCustomerId: text("stripeCustomerId"),
  /** Whether contact is subscribed to emails */
  emailSubscribed: integer("emailSubscribed", { mode: "boolean" }).default(true).notNull(),
  /** Current email sequence step (null = not in sequence) */
  currentSequenceStep: integer("currentSequenceStep"),
  /** When the sequence was started */
  sequenceStartedAt: tsNullable("sequenceStartedAt"),
  /** When next email should be sent */
  nextEmailAt: tsNullable("nextEmailAt"),
  createdAt: tsNow("createdAt"),
  updatedAt: tsNow("updatedAt").$onUpdate(() => new Date()),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Quiz responses - stores all individual answers per contact.
 */
export const quizResponses = sqliteTable("quiz_responses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contactId: integer("contactId").notNull(),
  /** JSON object with all quiz answers */
  answers: text("answers", { mode: "json" }).notNull(),
  /** Specific key answers stored for email personalization */
  incercariReparare: text("incercariReparare"),
  infidelitate: text("infidelitate"),
  durataRelatie: text("durataRelatie"),
  timpDespartire: text("timpDespartire"),
  initiatorDespartire: text("initiatorDespartire"),
  comunicare: text("comunicare"),
  sentimente: text("sentimente"),
  /** Final computed score */
  scorFinal: integer("scorFinal").notNull(),
  createdAt: tsNow("createdAt"),
});

export type QuizResponse = typeof quizResponses.$inferSelect;
export type InsertQuizResponse = typeof quizResponses.$inferInsert;

/**
 * Products catalog.
 */
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  /** Price in RON (cents) */
  priceInCents: integer("priceInCents").notNull(),
  /** Stripe price ID */
  stripePriceId: text("stripePriceId"),
  /** Stripe product ID */
  stripeProductId: text("stripeProductId"),
  /** Product type */
  type: text("type", { enum: ["ebook", "coaching", "bundle"] }).notNull(),
  /** Gender segment (null = both) */
  gender: text("gender", { enum: ["male", "female"] }),
  /** Local file key for ebook delivery */
  fileKey: text("fileKey"),
  /** Whether this is a subscription product */
  isSubscription: integer("isSubscription", { mode: "boolean" }).default(false).notNull(),
  /** Position in upsell chain (0 = front-end offer) */
  upsellPosition: integer("upsellPosition").default(0).notNull(),
  /** Affiliate commission percentage */
  commissionPercent: integer("commissionPercent").default(50).notNull(),
  active: integer("active", { mode: "boolean" }).default(true).notNull(),
  createdAt: tsNow("createdAt"),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Orders - tracks all purchases.
 */
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contactId: integer("contactId").notNull(),
  productId: integer("productId"),
  /** Amount in cents */
  amountInCents: integer("amountInCents").notNull(),
  currency: text("currency").default("RON").notNull(),
  status: text("status", { enum: ["pending", "completed", "refunded"] }).default("pending").notNull(),
  /** Stripe payment intent ID */
  stripePaymentIntentId: text("stripePaymentIntentId"),
  /** Stripe checkout session ID */
  stripeSessionId: text("stripeSessionId"),
  /** Affiliate who gets commission */
  affiliateId: integer("affiliateId"),
  /** Whether this was a 1-click upsell */
  isUpsell: integer("isUpsell", { mode: "boolean" }).default(false).notNull(),
  /** Refund timestamp */
  refundedAt: tsNullable("refundedAt"),
  createdAt: tsNow("createdAt"),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Email sequences (campaigns).
 */
export const emailSequences = sqliteTable("email_sequences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  gender: text("gender", { enum: ["male", "female"] }).notNull(),
  type: text("type", { enum: ["nurture", "transactional"] }).notNull(),
  active: integer("active", { mode: "boolean" }).default(true).notNull(),
  createdAt: tsNow("createdAt"),
});

export type EmailSequence = typeof emailSequences.$inferSelect;

/**
 * Individual email steps within a sequence.
 */
export const emailSteps = sqliteTable("email_steps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sequenceId: integer("sequenceId").notNull(),
  /** Position in sequence (0-indexed) */
  position: integer("position").notNull(),
  subject: text("subject").notNull(),
  previewText: text("previewText"),
  /** HTML body content */
  body: text("body").notNull(),
  /** Delay in seconds before sending (from previous step) */
  delaySeconds: integer("delaySeconds").notNull(),
  /** A/B test variant (null = no test) */
  abTestId: integer("abTestId"),
  abVariant: text("abVariant"),
  active: integer("active", { mode: "boolean" }).default(true).notNull(),
  createdAt: tsNow("createdAt"),
});

export type EmailStep = typeof emailSteps.$inferSelect;

/**
 * Email send log - tracks every email sent.
 */
export const emailSends = sqliteTable("email_sends", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contactId: integer("contactId").notNull(),
  emailStepId: integer("emailStepId").notNull(),
  /** Resend message ID */
  resendMessageId: text("resendMessageId"),
  status: text("status", { enum: ["sent", "delivered", "opened", "clicked", "bounced", "complained"] }).default("sent").notNull(),
  sentAt: tsNow("sentAt"),
  openedAt: tsNullable("openedAt"),
  clickedAt: tsNullable("clickedAt"),
});

export type EmailSend = typeof emailSends.$inferSelect;

/**
 * Affiliates - people who promote the products.
 */
export const affiliates = sqliteTable("affiliates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  /** Unique referral code */
  referralCode: text("referralCode").notNull().unique(),
  /** Hashed password for affiliate dashboard login */
  passwordHash: text("passwordHash").notNull(),
  /** Commission percentage override (null = use product default) */
  commissionPercent: integer("commissionPercent"),
  status: text("status", { enum: ["pending", "active", "suspended"] }).default("pending").notNull(),
  /** Total earned (cents) */
  totalEarned: integer("totalEarned").default(0).notNull(),
  /** Total paid out (cents) */
  totalPaid: integer("totalPaid").default(0).notNull(),
  /** Stripe Connect Express account id (automatic payouts) */
  stripeConnectAccountId: text("stripeConnectAccountId"),
  /** Connect onboarding status: none | pending | active | restricted */
  connectStatus: text("connectStatus", { enum: ["none", "pending", "active", "restricted"] }).default("none").notNull(),
  /** Metoda de plata aleasa de afiliat: stripe (automat) sau manual: iban | paypal | wise | revolut */
  payoutMethod: text("payoutMethod", { enum: ["stripe", "iban", "paypal", "wise", "revolut"] }),
  /** Detalii pentru plata manuala (IBAN / email PayPal / email Wise / Revolut tag etc.) */
  payoutDetails: text("payoutDetails"),
  createdAt: tsNow("createdAt"),
  updatedAt: tsNow("updatedAt").$onUpdate(() => new Date()),
});

export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = typeof affiliates.$inferInsert;

/**
 * Affiliate referrals - tracks clicks on referral links.
 */
export const affiliateReferrals = sqliteTable("affiliate_referrals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  affiliateId: integer("affiliateId").notNull(),
  contactId: integer("contactId"),
  /** IP address for deduplication */
  ipAddress: text("ipAddress"),
  /** Landing page URL */
  landingPage: text("landingPage"),
  /** Whether this referral converted to a sale */
  converted: integer("converted", { mode: "boolean" }).default(false).notNull(),
  createdAt: tsNow("createdAt"),
});

export type AffiliateReferral = typeof affiliateReferrals.$inferSelect;

/**
 * Tokenuri de acces trimise pe email pentru afiliati — inlocuiesc parola.
 * "link" = linkul de acces (o singura folosire, 60 de minute).
 * "login" / "register" raman pentru compatibilitate cu randurile vechi.
 */
export const affiliateLoginCodes = sqliteTable("affiliate_login_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  /** Tokenul trimis pe email (linkul de acces) */
  code: text("code").notNull(),
  /** "link" = link de acces; "login"/"register" = variante vechi */
  purpose: text("purpose", { enum: ["login", "register", "link"] }).notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  usedAt: tsNullable("usedAt"),
  /** Incercari gresite, ca sa nu se poata ghici codul */
  attempts: integer("attempts").default(0).notNull(),
  createdAt: tsNow("createdAt"),
});

export type AffiliateLoginCode = typeof affiliateLoginCodes.$inferSelect;

/**
 * Sesiuni de lunga durata pentru afiliati.
 *
 * Afiliatul introduce codul din email O SINGURA DATA. De acolo primeste un token
 * aleator de 256 de biti pe care browserul il tine minte, deci ramane conectat
 * ~90 de zile (prelungite automat la fiecare intrare in panou) fara sa mai puna
 * codul. In baza de date se pastreaza DOAR hash-ul SHA-256 al token-ului: chiar
 * daca baza de date ar fi compromisa, token-urile nu pot fi folosite.
 */
export const affiliateSessions = sqliteTable("affiliate_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** SHA-256 (hex) al token-ului. Token-ul in clar exista doar la afiliat. */
  tokenHash: text("tokenHash").notNull().unique(),
  affiliateId: integer("affiliateId").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  lastUsedAt: tsNow("lastUsedAt"),
  /** De pe ce dispozitiv s-a conectat (doar informativ, pentru afiliat). */
  userAgent: text("userAgent"),
  createdAt: tsNow("createdAt"),
});

export type AffiliateSession = typeof affiliateSessions.$inferSelect;

/**
 * Commissions - tracks affiliate earnings per order.
 */
export const commissions = sqliteTable("commissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  affiliateId: integer("affiliateId").notNull(),
  orderId: integer("orderId"),
  /** Commission amount in cents */
  amountInCents: integer("amountInCents").notNull(),
  status: text("status", { enum: ["pending", "approved", "paid", "cancelled"] }).default("pending").notNull(),
  /** Date when commission becomes payable (45 days after guarantee) */
  payableAt: tsNullable("payableAt"),
  paidAt: tsNullable("paidAt"),
  createdAt: tsNow("createdAt"),
});

export type Commission = typeof commissions.$inferSelect;

/**
 * A/B Tests.
 */
export const abTests = sqliteTable("ab_tests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: ["page_headline", "email_subject", "page_layout"] }).notNull(),
  /** Target page or email step */
  targetId: text("targetId"),
  /** JSON with variant definitions */
  variants: text("variants", { mode: "json" }).notNull(),
  /** Winner variant (null = still running) */
  winner: text("winner"),
  status: text("status", { enum: ["running", "completed", "paused"] }).default("running").notNull(),
  createdAt: tsNow("createdAt"),
  completedAt: tsNullable("completedAt"),
});

export type AbTest = typeof abTests.$inferSelect;

/**
 * Funnel events - tracks every step in the funnel for analytics.
 */
export const funnelEvents = sqliteTable("funnel_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contactId: integer("contactId"),
  /** Anonymous session ID for non-identified visitors */
  sessionId: text("sessionId"),
  event: text("event", {
    enum: [
      "quiz_started", "quiz_completed", "sales_page_viewed",
      "checkout_started", "purchase_completed",
      "upsell_viewed", "upsell_purchased", "upsell_declined",
      "downsell_viewed", "downsell_purchased", "downsell_declined",
      "book_delivered", "email_opened", "email_clicked",
      "unsubscribed", "refunded",
    ],
  }).notNull(),
  /** Additional event metadata */
  metadata: text("metadata", { mode: "json" }),
  /** Gender segment */
  gender: text("gender", { enum: ["male", "female"] }),
  /** A/B test variant shown */
  abVariant: text("abVariant"),
  abTestId: integer("abTestId"),
  createdAt: tsNow("createdAt"),
});

export type FunnelEvent = typeof funnelEvents.$inferSelect;

/**
 * Payout records for affiliates.
 */
export const payouts = sqliteTable("payouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  affiliateId: integer("affiliateId").notNull(),
  /** Total amount paid in cents */
  amountInCents: integer("amountInCents").notNull(),
  /** Payment method/reference */
  paymentMethod: text("paymentMethod"),
  paymentReference: text("paymentReference"),
  notes: text("notes"),
  createdAt: tsNow("createdAt"),
});

export type Payout = typeof payouts.$inferSelect;

/**
 * Cheltuieli - ca sa se poata face contabilitatea direct din admin.
 *
 * Proprietarul le adauga manual (reclame, abonamente, colaboratori, taxe etc.),
 * iar profitul afisat in admin scade automat veniturile cu comisioanele
 * afiliatilor si cu cheltuielile de aici.
 */
export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Data la care s-a facut cheltuiala */
  spentAt: tsNow("spentAt"),
  /** Categoria, ca sa se poata grupa usor in rapoarte */
  category: text("category", {
    enum: ["stripe_fees", "ads", "software", "contractors", "content", "taxes", "other"],
  }).default("other").notNull(),
  description: text("description").notNull(),
  /** Suma in bani (cents), ca la toate celelalte sume din baza de date */
  amountInCents: integer("amountInCents").notNull(),
  /** Cheltuiala se repeta lunar (abonament) — folosita la proiectii */
  recurring: integer("recurring", { mode: "boolean" }).default(false).notNull(),
  notes: text("notes"),
  createdAt: tsNow("createdAt"),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;