import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const brands = mysqlTable("brands", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 80 }).notNull().unique(),
  displayName: varchar("displayName", { length: 180 }).notNull(),
  routeBase: varchar("routeBase", { length: 255 }).notNull().unique(),
  category: varchar("category", { length: 80 }).notNull(),
  senderName: varchar("senderName", { length: 160 }),
  senderEmail: varchar("senderEmail", { length: 320 }),
  replyToEmail: varchar("replyToEmail", { length: 320 }),
  notificationRecipientsJson: text("notificationRecipientsJson"),
  themeJson: text("themeJson"),
  status: mysqlEnum("status", ["draft", "migrating", "active", "archived"]).notNull().default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
  productKey: varchar("productKey", { length: 120 }).notNull(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  description: text("description"),
  stripeProductId: varchar("stripeProductId", { length: 255 }),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  accessMode: mysqlEnum("accessMode", ["library", "download", "service", "mixed"]).notNull().default("library"),
  status: mysqlEnum("status", ["draft", "active", "archived"]).notNull().default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("products_brand_key_unique").on(table.brandId, table.productKey),
  index("products_brand_index").on(table.brandId),
]);

export const offerSteps = mysqlTable("offer_steps", {
  id: int("id").autoincrement().primaryKey(),
  brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  stepKey: varchar("stepKey", { length: 120 }).notNull(),
  stage: mysqlEnum("stage", ["fe", "oto", "downsell", "bump", "confirmation"]).notNull(),
  routeSuffix: varchar("routeSuffix", { length: 255 }).notNull(),
  sortOrder: int("sortOrder").notNull().default(0),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  metadataJson: text("metadataJson"),
  isActive: int("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("offer_steps_brand_key_unique").on(table.brandId, table.stepKey),
  index("offer_steps_product_index").on(table.productId),
]);

export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  firstName: varchar("firstName", { length: 160 }),
  lastName: varchar("lastName", { length: 160 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const brandContacts = mysqlTable("brand_contacts", {
  id: int("id").autoincrement().primaryKey(),
  brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
  contactId: int("contactId").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  marketingConsent: int("marketingConsent").notNull().default(0),
  transactionalConsentAt: timestamp("transactionalConsentAt"),
  marketingConsentAt: timestamp("marketingConsentAt"),
  metadataJson: text("metadataJson"),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("brand_contacts_unique").on(table.brandId, table.contactId),
  index("brand_contacts_brand_index").on(table.brandId),
]);

export const trackingSessions = mysqlTable("tracking_sessions", {
  id: int("id").autoincrement().primaryKey(),
  brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
  sessionToken: varchar("sessionToken", { length: 96 }).notNull().unique(),
  contactId: int("contactId").references(() => contacts.id, { onDelete: "set null" }),
  affiliateCode: varchar("affiliateCode", { length: 64 }),
  landingPath: varchar("landingPath", { length: 500 }),
  attributionJson: text("attributionJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("tracking_sessions_brand_index").on(table.brandId),
  index("tracking_sessions_contact_index").on(table.contactId),
]);

export const intakeSubmissions = mysqlTable("intake_submissions", {
  id: int("id").autoincrement().primaryKey(),
  brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
  productId: int("productId").references(() => products.id, { onDelete: "set null" }),
  contactId: int("contactId").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  trackingSessionId: int("trackingSessionId").references(() => trackingSessions.id, { onDelete: "set null" }),
  submissionKey: varchar("submissionKey", { length: 120 }).notNull(),
  payloadJson: text("payloadJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("intake_submissions_brand_contact_index").on(table.brandId, table.contactId),
  index("intake_submissions_product_index").on(table.productId),
]);

export const checkoutSessions = mysqlTable("checkout_sessions", {
  id: int("id").autoincrement().primaryKey(),
  brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  offerStepId: int("offerStepId").references(() => offerSteps.id, { onDelete: "set null" }),
  contactId: int("contactId").references(() => contacts.id, { onDelete: "set null" }),
  trackingSessionId: int("trackingSessionId").references(() => trackingSessions.id, { onDelete: "set null" }),
  checkoutToken: varchar("checkoutToken", { length: 96 }).notNull().unique(),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }).unique(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).unique(),
  checkoutState: mysqlEnum("checkoutState", ["started", "payment_pending", "completed", "abandoned", "expired"]).notNull().default("started"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("checkout_sessions_brand_state_index").on(table.brandId, table.checkoutState),
  index("checkout_sessions_contact_index").on(table.contactId),
]);

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "restrict" }),
  contactId: int("contactId").notNull().references(() => contacts.id, { onDelete: "restrict" }),
  checkoutSessionId: int("checkoutSessionId").references(() => checkoutSessions.id, { onDelete: "set null" }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).notNull().unique(),
  amountCents: int("amountCents").notNull().default(0),
  currency: varchar("currency", { length: 8 }).notNull().default("ron"),
  fulfillmentStatus: mysqlEnum("fulfillmentStatus", ["pending", "fulfilled", "revoked", "refunded"]).notNull().default("pending"),
  fulfilledAt: timestamp("fulfilledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("orders_brand_contact_index").on(table.brandId, table.contactId),
]);

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "restrict" }),
  offerStepId: int("offerStepId").references(() => offerSteps.id, { onDelete: "set null" }),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("order_items_order_product_unique").on(table.orderId, table.productId),
]);

export const productAssets = mysqlTable("product_assets", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 500 }).notNull(),
  mimeType: varchar("mimeType", { length: 160 }),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const entitlements = mysqlTable("entitlements", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  orderItemId: int("orderItemId").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["active", "revoked", "expired"]).notNull().default("active"),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
}, (table) => [
  uniqueIndex("entitlements_contact_product_unique").on(table.contactId, table.productId),
  index("entitlements_brand_contact_index").on(table.brandId, table.contactId),
]);

export const accessSessions = mysqlTable("access_sessions", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  deviceHash: varchar("deviceHash", { length: 128 }),
  expiresAt: timestamp("expiresAt").notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("access_sessions_contact_brand_index").on(table.contactId, table.brandId),
]);

export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 120 }).notNull(),
  label: varchar("label", { length: 180 }).notNull(),
  kind: mysqlEnum("kind", ["system", "marketing", "lifecycle", "manual"]).notNull().default("system"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("tags_brand_key_unique").on(table.brandId, table.key),
]);

export const contactTags = mysqlTable("contact_tags", {
  id: int("id").autoincrement().primaryKey(),
  brandContactId: int("brandContactId").notNull().references(() => brandContacts.id, { onDelete: "cascade" }),
  tagId: int("tagId").notNull().references(() => tags.id, { onDelete: "cascade" }),
  source: varchar("source", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("contact_tags_unique").on(table.brandContactId, table.tagId),
]);

export const funnelEvents = mysqlTable("funnel_events", {
  id: int("id").autoincrement().primaryKey(),
  brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
  contactId: int("contactId").references(() => contacts.id, { onDelete: "set null" }),
  orderId: int("orderId").references(() => orders.id, { onDelete: "set null" }),
  trackingSessionId: int("trackingSessionId").references(() => trackingSessions.id, { onDelete: "set null" }),
  eventType: varchar("eventType", { length: 120 }).notNull(),
  metadataJson: text("metadataJson"),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
}, (table) => [
  index("funnel_events_brand_type_index").on(table.brandId, table.eventType),
  index("funnel_events_contact_index").on(table.contactId),
]);

export const emailMessages = mysqlTable("email_messages", {
  id: int("id").autoincrement().primaryKey(),
  brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
  contactId: int("contactId").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  orderId: int("orderId").references(() => orders.id, { onDelete: "set null" }),
  templateKey: varchar("templateKey", { length: 160 }).notNull(),
  category: mysqlEnum("category", ["transactional", "lifecycle", "marketing", "operational"]).notNull(),
  resendEmailId: varchar("resendEmailId", { length: 255 }).unique(),
  senderEmail: varchar("senderEmail", { length: 320 }).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("email_messages_brand_contact_index").on(table.brandId, table.contactId),
]);

export const emailProviderEvents = mysqlTable("email_provider_events", {
  id: int("id").autoincrement().primaryKey(),
  brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
  emailMessageId: int("emailMessageId").references(() => emailMessages.id, { onDelete: "set null" }),
  providerEventId: varchar("providerEventId", { length: 255 }).notNull().unique(),
  providerMessageId: varchar("providerMessageId", { length: 255 }),
  eventType: varchar("eventType", { length: 120 }).notNull(),
  occurredAt: timestamp("occurredAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("email_provider_events_brand_type_index").on(table.brandId, table.eventType),
]);

export const coachingApplications = mysqlTable("coaching_applications", {
  id: int("id").autoincrement().primaryKey(),
  brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
  contactId: int("contactId").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  context: text("context").notNull(),
  status: mysqlEnum("status", ["pending", "reviewing", "accepted", "declined"]).notNull().default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("coaching_applications_brand_status_index").on(table.brandId, table.status),
  index("coaching_applications_contact_index").on(table.contactId),
]);

export const affiliates = mysqlTable("affiliates", {
  id: int("id").autoincrement().primaryKey(),
  brandId: int("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  email: varchar("email", { length: 320 }).notNull(),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  affiliateCode: varchar("affiliateCode", { length: 64 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "active", "paused"]).notNull().default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("affiliates_brand_code_unique").on(table.brandId, table.affiliateCode),
  index("affiliates_brand_email_index").on(table.brandId, table.email),
]);

export const affiliateClicks = mysqlTable("affiliate_clicks", {
  id: int("id").autoincrement().primaryKey(),
  affiliateId: int("affiliateId").notNull().references(() => affiliates.id, { onDelete: "cascade" }),
  trackingSessionId: int("trackingSessionId").references(() => trackingSessions.id, { onDelete: "set null" }),
  landingPath: varchar("landingPath", { length: 500 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const affiliateCommissions = mysqlTable("affiliate_commissions", {
  id: int("id").autoincrement().primaryKey(),
  affiliateId: int("affiliateId").notNull().references(() => affiliates.id, { onDelete: "cascade" }),
  orderItemId: int("orderItemId").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  commissionRateBps: int("commissionRateBps").notNull(),
  commissionAmountCents: int("commissionAmountCents").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "paid", "void"]).notNull().default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  paidAt: timestamp("paidAt"),
}, (table) => [
  uniqueIndex("affiliate_commissions_item_unique").on(table.affiliateId, table.orderItemId),
]);

export const webhookDeliveries = mysqlTable("webhook_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  provider: mysqlEnum("provider", ["stripe", "resend"]).notNull(),
  providerEventId: varchar("providerEventId", { length: 255 }).notNull(),
  eventType: varchar("eventType", { length: 160 }).notNull(),
  processingStatus: mysqlEnum("processingStatus", ["received", "processed", "failed"]).notNull().default("received"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("webhook_deliveries_provider_event_unique").on(table.provider, table.providerEventId),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Brand = typeof brands.$inferSelect;
export type Product = typeof products.$inferSelect;
export type OfferStep = typeof offerSteps.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Order = typeof orders.$inferSelect;
