CREATE TABLE push_subscriptions (
  endpoint     TEXT PRIMARY KEY,
  grup         TEXT NOT NULL,
  ad           TEXT NOT NULL,
  p256dh       TEXT NOT NULL,
  auth         TEXT NOT NULL,
  createdAt    INTEGER NOT NULL
);
CREATE INDEX idx_push_subs_ad ON push_subscriptions(grup, ad);
