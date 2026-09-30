-- Waitlist rows for Batch 2 coming-soon tools.
-- Reuses the existing waitlists table. No new table.
INSERT INTO "waitlists" ("id", "key", "name", "purpose", "description", "pagePath", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), v.key, v.name, 'tool', v.description, v.page_path, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  VALUES
    ('property-document-checklist', 'Property Document Checklist Generator', 'Early access for the Property Document Checklist Generator.', '/tools/property-document-checklist'),
    ('survey-plan-review-request', 'Survey Plan Review Request Tool', 'Early access for the Survey Plan Review Request Tool.', '/tools/survey-plan-review-request'),
    ('building-approval-navigator', 'Building Approval Navigator', 'Early access for the Building Approval Navigator.', '/tools/building-approval-navigator'),
    ('pre-purchase-property-inspection', 'Pre-Purchase Property Inspection App', 'Early access for the Pre-Purchase Property Inspection App.', '/tools/pre-purchase-property-inspection'),
    ('property-document-vault', 'Property Document Vault', 'Early access for the Property Document Vault.', '/tools/property-document-vault'),
    ('project-readiness-score', 'Project Readiness Score', 'Early access for Project Readiness Score.', '/tools/project-readiness-score'),
    ('build-buy-or-renovate-calculator', 'Build, Buy or Renovate Calculator', 'Early access for the Build, Buy or Renovate Calculator.', '/tools/build-buy-or-renovate-calculator'),
    ('plot-to-project-feasibility', 'Plot-to-Project Feasibility Brief', 'Early access for the Plot-to-Project Feasibility Brief.', '/tools/plot-to-project-feasibility'),
    ('abandoned-building-recovery-checker', 'Abandoned Building Recovery Checker', 'Early access for the Abandoned Building Recovery Checker.', '/tools/abandoned-building-recovery-checker')
) AS v(key, name, description, page_path)
WHERE NOT EXISTS (
  SELECT 1 FROM "waitlists" existing WHERE existing."key" = v.key
);
