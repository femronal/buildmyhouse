-- Waitlist rows for Batch 1 coming-soon tools and the "new tools" notify list.
-- Reuses the existing waitlists table. Join still requires a matching key.
INSERT INTO "waitlists" ("id", "key", "name", "purpose", "description", "pagePath", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), v.key, v.name, 'tool', v.description, v.page_path, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  VALUES
    ('construction-scam-red-flag-checker', 'Construction Scam Red-Flag Checker', 'Early access for the Construction Scam Red-Flag Checker.', '/tools/construction-scam-red-flag-checker'),
    ('contractor-quote-comparison', 'Contractor Quote Comparison Tool', 'Early access for the Contractor Quote Comparison Tool.', '/tools/contractor-quote-comparison'),
    ('nigeria-building-cost-planner', 'Nigeria Building Cost Planner', 'Early access for the Nigeria Building Cost Planner.', '/tools/nigeria-building-cost-planner'),
    ('property-repair-triage', 'Property Repair Triage Assistant', 'Early access for the Property Repair Triage Assistant.', '/tools/property-repair-triage'),
    ('land-purchase-risk-checker', 'Land Purchase Risk Checker', 'Early access for the Land Purchase Risk Checker.', '/tools/land-purchase-risk-checker'),
    ('all-tools', 'New BuildMyHouse tools', 'Notify me when another BuildMyHouse tool opens.', '/tools')
) AS v(key, name, description, page_path)
WHERE NOT EXISTS (
  SELECT 1 FROM "waitlists" existing WHERE existing."key" = v.key
);
