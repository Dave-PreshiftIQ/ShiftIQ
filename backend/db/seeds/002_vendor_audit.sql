-- =============================================================
-- Vendor Audit Scorecard Seed - PSQ-IP-009 - 9 sections
-- Sections 101-109 (offset 100 to avoid collision with client assessment)
-- =============================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM questions WHERE audience = 'vendor' LIMIT 1) THEN
    RAISE NOTICE 'Vendor audit questions already seeded -- skipping';
    RETURN;
  END IF;
END $$;

-- 101: Identity & Market Fit
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(101, 1, 1, 'Company legal name and DBA', NULL, 'text', NULL, '{}', true, NULL, 'vendor'),
(101, 1, 2, 'Year founded', NULL, 'number', NULL, '{}', true, NULL, 'vendor'),
(101, 1, 3, 'HQ location and primary ops locations', NULL, 'text', NULL, '{}', true, NULL, 'vendor'),
(101, 1, 4, 'Primary personas served', NULL, 'multi_select',
 '["Shipper","Shipper with Private Fleet","Shipper with eCom/3PL","Broker/LSP","Asset Carrier","Carrier with Brokerage","Carrier with 3PL","Multi-line","PE/PortCo"]'::jsonb,
 '{}', true, 'D1', 'vendor'),
(101, 1, 5, 'Modes supported as first-class (not resold or bolted on)', NULL, 'multi_select',
 '["FTL","LTL","Parcel","Intermodal","Rail","Ocean","Air","Drayage","Final-mile","Bulk/Tank","Flatbed","Reefer"]'::jsonb,
 '{}', true, 'D2', 'vendor'),
(101, 1, 6, 'Total active customer count', NULL, 'single_select',
 '["Under 25","25-100","100-500","500-1,500","Over 1,500"]'::jsonb,
 '{}', true, NULL, 'vendor');

-- 102: Architectural Integrity
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(102, 1, 1, 'Deployment model', NULL, 'single_select',
 '["SaaS multi-tenant","SaaS single-tenant","Private cloud","On-premise","Hybrid"]'::jsonb,
 '{}', true, 'D3', 'vendor'),
(102, 1, 2, 'Primary cloud provider', NULL, 'single_select',
 '["AWS","Azure","GCP","Oracle Cloud","Owned data center","Other"]'::jsonb,
 '{}', true, 'D3', 'vendor'),
(102, 1, 3, 'Architecture style', NULL, 'single_select',
 '["Microservices","Service-oriented","Modular monolith","Monolith","Legacy"]'::jsonb,
 '{}', true, 'D3', 'vendor'),
(102, 1, 4, 'Platform age (years since primary codebase origin)', NULL, 'number', NULL,
 '{}', true, 'D3', 'vendor'),
(102, 1, 5, 'Scalability proof - peak transactions per day observed', NULL, 'number', NULL,
 '{}', false, 'D3', 'vendor');

-- 103: Security & Compliance
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(103, 1, 1, 'Active security certifications', NULL, 'multi_select',
 '["SOC 2 Type II","ISO 27001","HIPAA","PCI DSS","FedRAMP","CMMC","None"]'::jsonb,
 '{}', true, 'D5', 'vendor'),
(103, 1, 2, 'Date of most recent pen test', NULL, 'text', NULL, '{}', true, 'D5', 'vendor'),
(103, 1, 3, 'Encryption at rest / in transit', NULL, 'single_select',
 '["Both AES-256 + TLS 1.2+","At rest only","In transit only","Neither"]'::jsonb,
 '{}', true, 'D5', 'vendor'),
(103, 1, 4, 'Data breach in last 24 months?', NULL, 'boolean', NULL,
 '{}', true, 'D5', 'vendor'),
(103, 1, 5, 'Data residency options offered', NULL, 'multi_select',
 '["US","EU","Canada","Asia-Pacific","Client-specified"]'::jsonb,
 '{}', true, 'D5', 'vendor');

-- 104: AI & Intelligence
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(104, 1, 1, 'AI/ML capabilities in production', NULL, 'multi_select',
 '["Predictive ETA","Automated rating","Load matching","Freight audit anomaly detection","Carrier scorecards","Demand forecasting","NL queries","None"]'::jsonb,
 '{}', true, 'D3', 'vendor'),
(104, 1, 2, 'Model explainability offered to customers?', NULL, 'single_select',
 '["Yes - full","Partial","No","Roadmap"]'::jsonb,
 '{}', false, 'D3', 'vendor'),
(104, 1, 3, 'Is customer data used to train shared models?', NULL, 'single_select',
 '["Never","Opt-in only","Default opt-in","Default opt-out","Unspecified"]'::jsonb,
 '{}', true, 'D5', 'vendor');

-- 105: Connectivity
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(105, 1, 1, 'API type available', NULL, 'multi_select',
 '["REST","GraphQL","SOAP","Webhooks","EDI","SFTP/Flat file","None"]'::jsonb,
 '{}', true, 'D4', 'vendor'),
(105, 1, 2, 'Pre-built ERP integrations (certified)', NULL, 'multi_select',
 '["SAP S/4HANA","SAP ECC","Oracle NetSuite","Oracle Fusion","Dynamics 365","Dynamics AX","Infor","Sage","Epicor","Workday","None"]'::jsonb,
 '{}', true, 'D4', 'vendor'),
(105, 1, 3, 'Pre-built WMS integrations', NULL, 'multi_select',
 '["Manhattan","Blue Yonder","HighJump/Korber","SAP EWM","Oracle WMS","Softeon","Fishbowl","None"]'::jsonb,
 '{}', false, 'D4', 'vendor'),
(105, 1, 4, 'Carrier network - connected carriers count', NULL, 'number', NULL,
 '{}', true, 'D4', 'vendor');

-- 106: Implementation & Ops
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(106, 1, 1, 'Typical implementation timeline (weeks)', NULL, 'number', NULL,
 '{}', true, 'D6', 'vendor'),
(106, 1, 2, 'Implementation approach', NULL, 'single_select',
 '["Vendor-led","Partner-led","Client-led","Hybrid"]'::jsonb,
 '{}', true, 'D6', 'vendor'),
(106, 1, 3, 'Implementation success rate (last 24 months, %)', NULL, 'number', NULL,
 '{}', false, 'D6', 'vendor'),
(106, 1, 4, 'Uptime SLA offered', NULL, 'single_select',
 '["99.99%","99.95%","99.9%","99.5%","Lower","No SLA"]'::jsonb,
 '{}', true, 'D6', 'vendor'),
(106, 1, 5, 'Customer support model', NULL, 'single_select',
 '["24/7 with named CSM","24/7 shared","Business hours","Tier-1 only","Community only"]'::jsonb,
 '{}', true, 'D6', 'vendor');

-- 107: Fiduciary Financials
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(107, 1, 1, 'Pricing model', NULL, 'multi_select',
 '["SaaS subscription","Transaction/load-based","Hybrid","Managed service","Custom"]'::jsonb,
 '{}', true, 'D7', 'vendor'),
(107, 1, 2, 'Published pricing available?', NULL, 'single_select',
 '["Yes - public","On request","NDA required","Custom per deal"]'::jsonb,
 '{}', true, 'D7', 'vendor'),
(107, 1, 3, 'Typical annual contract value range for your core segment', NULL, 'single_select',
 '["Under $25K","$25K-$100K","$100K-$500K","$500K-$1.5M","Over $1.5M"]'::jsonb,
 '{}', true, 'D7', 'vendor'),
(107, 1, 4, 'Hidden fees disclosed upfront?', NULL, 'boolean', NULL,
 '{}', true, 'D7', 'vendor'),
(107, 1, 5, 'Contract exit terms - data portability on exit', NULL, 'single_select',
 '["Full export in standard formats","Partial export","On request with fee","Not guaranteed"]'::jsonb,
 '{}', true, 'D7', 'vendor');

-- 108: Company Health & Legal Risk
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(108, 1, 1, 'Funding stage', NULL, 'single_select',
 '["Bootstrapped/Profitable","Seed","Series A","Series B","Series C+","PE-owned","Public","Subsidiary"]'::jsonb,
 '{}', true, 'D8', 'vendor'),
(108, 1, 2, 'Are you profitable or cash-flow positive?', NULL, 'boolean', NULL,
 '{}', true, 'D8', 'vendor'),
(108, 1, 3, 'Customer churn rate (annual, %)', NULL, 'number', NULL,
 '{}', false, 'D8', 'vendor'),
(108, 1, 4, 'Any active litigation material to customers?', NULL, 'boolean', NULL,
 '{}', true, 'D8', 'vendor'),
(108, 1, 5, 'Leadership team tenure (avg years)', NULL, 'number', NULL,
 '{}', false, 'D8', 'vendor');

-- 109: Platform Scalability, Data Ownership, Risk Signals
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(109, 1, 1, 'Who owns customer data?', NULL, 'single_select',
 '["Customer - explicit contractual","Customer - implied","Vendor-default","Unclear"]'::jsonb,
 '{}', true, 'D5', 'vendor'),
(109, 1, 2, 'Customer data segregation', NULL, 'single_select',
 '["Logical + separate encryption keys per customer","Logical only","Shared"]'::jsonb,
 '{}', true, 'D5', 'vendor'),
(109, 1, 3, 'Known implementation risks you proactively disclose', NULL, 'text', NULL,
 '{}', false, 'D6', 'vendor'),
(109, 1, 4, 'Technical debt ratio - pct of engineering capacity on maintenance', NULL, 'number', NULL,
 '{}', false, 'D8', 'vendor');
