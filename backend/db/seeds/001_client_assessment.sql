-- =============================================================
-- Client Assessment Seed - 14 sections
-- Tier 1: Sections 1-9 (Foundation)  Tier 2: Sections 10-14 (Deep Dive)
-- =============================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM questions WHERE audience = 'client' LIMIT 1) THEN
    RAISE NOTICE 'Client questions already seeded -- skipping';
    RETURN;
  END IF;
END $$;

-- SECTION 1: Company Profile (Tier 1)
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(1, 1, 1, 'What is your company''s primary line of business?',
 'Select the closest fit.', 'single_select',
 '["Manufacturer","Retailer","Distributor","Wholesaler","Carrier","Broker/LSP","3PL/4PL","Multi-line"]'::jsonb,
 '{}', true, NULL, 'client'),
(1, 1, 2, 'Approximate annual revenue (USD)?', NULL, 'single_select',
 '["Under $10M","$10M-$50M","$50M-$250M","$250M-$1B","Over $1B"]'::jsonb,
 '{}', true, NULL, 'client'),
(1, 1, 3, 'Number of employees?', NULL, 'single_select',
 '["Under 50","50-250","250-1,000","1,000-5,000","Over 5,000"]'::jsonb,
 '{}', true, NULL, 'client'),
(1, 1, 4, 'Primary geographic footprint?', NULL, 'multi_select',
 '["US domestic","Canada","Mexico","Cross-border NA","Latin America","EU","UK","Asia-Pacific","Global"]'::jsonb,
 '{}', true, 'D1', 'client');

-- SECTION 2: Freight Profile (Tier 1)
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(2, 1, 1, 'Annual freight spend (USD)?', NULL, 'single_select',
 '["Under $1M","$1M-$10M","$10M-$50M","$50M-$250M","Over $250M"]'::jsonb,
 '{}', true, 'D1', 'client'),
(2, 1, 2, 'Which modes do you use?',
 'Select every mode your operation requires.', 'multi_select',
 '["FTL","LTL","Parcel","Intermodal","Rail","Ocean","Air","Drayage","Final-mile","Bulk/Tank","Flatbed","Reefer"]'::jsonb,
 '{}', true, 'D2', 'client'),
(2, 1, 3, 'Approximate annual load volume?', NULL, 'single_select',
 '["Under 1,000","1,000-10,000","10,000-50,000","50,000-250,000","Over 250,000"]'::jsonb,
 '{}', true, 'D2', 'client'),
(2, 1, 4, 'Do you operate a private fleet?', NULL, 'boolean', NULL,
 '{shipper_private_fleet,shipper,asset_carrier,carrier_brokerage,carrier_3pl_4pl,multi_business_line}', false, NULL, 'client');

-- SECTION 3: Current Technology Stack (Tier 1)
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(3, 1, 1, 'What TMS, if any, do you use today?',
 'Enter the name or "None" if you do not have a TMS.', 'text', NULL,
 '{}', true, NULL, 'client'),
(3, 1, 2, 'What ERP system do you run?', NULL, 'single_select',
 '["SAP S/4HANA","SAP ECC","Oracle NetSuite","Oracle Fusion","Microsoft Dynamics 365","Microsoft Dynamics AX","Infor","Sage","Epicor","Workday","Custom/Homegrown","None"]'::jsonb,
 '{}', true, 'D4', 'client'),
(3, 1, 3, 'Do you have a WMS?', NULL, 'single_select',
 '["Yes - standalone","Yes - module of ERP","Yes - third party","No"]'::jsonb,
 '{}', true, 'D4', 'client'),
(3, 1, 4, 'Other systems currently integrated into logistics workflow',
 'Visibility, freight audit, rating engines, appointment/dock, customs, etc.', 'multi_select',
 '["Visibility platform","Freight audit & pay","Rating engine","Appointment/dock scheduling","Customs/compliance","Yard management","OMS","CRM","BI/Analytics"]'::jsonb,
 '{}', false, 'D4', 'client'),
(3, 1, 5, 'Which current systems MUST a new TMS integrate with?', NULL, 'multi_select',
 '["ERP","WMS","OMS","Accounting/AP","CRM","Customer portal","EDI trading partners","API to carriers","Data warehouse"]'::jsonb,
 '{}', true, 'D4', 'client');

-- SECTION 4: Priorities & Pain Points (Tier 1)
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(4, 1, 1, 'What is driving this evaluation?', NULL, 'multi_select',
 '["Replacing legacy system","First-time TMS","Cost avoidance pressure","Customer service issues","Visibility gaps","Integration problems","M&A / consolidation","Carrier/rate management","Capacity constraints","Other"]'::jsonb,
 '{}', true, NULL, 'client'),
(4, 1, 2, 'What is your top priority in a new solution?',
 'Single most important outcome.', 'single_select',
 '["Cost avoidance","Visibility","Automation","Integration","Carrier management","Customer experience","Scalability","Compliance"]'::jsonb,
 '{}', true, 'D9', 'client'),
(4, 1, 3, 'Rank these dimensions by importance (1 = most important, 9 = least)',
 'Captures your weighting across the scoring dimensions.', 'text', NULL,
 '{}', false, 'D9', 'client');

-- SECTION 5: Timeline & Decision Process (Tier 1)
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(5, 1, 1, 'Target go-live timeline?', NULL, 'single_select',
 '["ASAP (< 3 months)","3-6 months","6-12 months","12-18 months","Exploring only"]'::jsonb,
 '{}', true, 'D6', 'client'),
(5, 1, 2, 'Who is the executive sponsor?',
 'Title is fine - we will not share with vendors until a match is accepted.', 'text', NULL,
 '{}', true, NULL, 'client'),
(5, 1, 3, 'How many stakeholders are involved in the final decision?', NULL, 'single_select',
 '["1","2-3","4-6","7-10","10+"]'::jsonb,
 '{}', true, NULL, 'client'),
(5, 1, 4, 'Is there budget approved for this initiative?', NULL, 'single_select',
 '["Yes - approved","Yes - in planning","Pending","No - discovery only"]'::jsonb,
 '{}', true, NULL, 'client');

-- SECTION 6: Non-Negotiables / Hard Filters (Tier 1)
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(6, 1, 1, 'Must-have capabilities (hard filter - vendor will be disqualified if unmet)',
 'Select only what is genuinely non-negotiable.', 'multi_select',
 '["Native multimodal","Real-time visibility","SOC 2 Type II","ISO 27001","GDPR compliance","Carrier EDI","API for customer portal","Freight audit integrated","Rating engine native","Dock scheduling","Parcel included","Cross-border customs"]'::jsonb,
 '{}', true, NULL, 'client'),
(6, 1, 2, 'Must support these modes as first-class (hard filter)', NULL, 'multi_select',
 '["FTL","LTL","Parcel","Intermodal","Rail","Ocean","Air","Drayage","Final-mile"]'::jsonb,
 '{}', true, NULL, 'client'),
(6, 1, 3, 'Must have native/certified integration with your ERP (hard filter)', NULL, 'boolean', NULL,
 '{}', true, NULL, 'client');

-- SECTION 7: Security & Compliance (Tier 1)
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(7, 1, 1, 'Which security certifications does your vendor need to have?', NULL, 'multi_select',
 '["SOC 2 Type II","ISO 27001","HIPAA","PCI DSS","FedRAMP","CMMC","None specifically"]'::jsonb,
 '{}', true, 'D5', 'client'),
(7, 1, 2, 'Are you subject to any of the following?', NULL, 'multi_select',
 '["GDPR","CCPA","HIPAA","SOX","DOT/FMCSA","Customs/ACE","ITAR","None"]'::jsonb,
 '{}', true, 'D5', 'client'),
(7, 1, 3, 'Data residency requirements?', NULL, 'single_select',
 '["US only","EU only","Canada only","Specific region - other","No requirement"]'::jsonb,
 '{}', true, 'D5', 'client');

-- SECTION 8: Commercial Preferences (Tier 1)
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(8, 1, 1, 'Preferred pricing model?', NULL, 'single_select',
 '["SaaS subscription","Transaction-based","Hybrid","Managed service","No preference"]'::jsonb,
 '{}', true, 'D7', 'client'),
(8, 1, 2, 'Annual budget range for this system (USD)?', NULL, 'single_select',
 '["Under $50K","$50K-$150K","$150K-$500K","$500K-$1.5M","Over $1.5M","Undisclosed"]'::jsonb,
 '{}', true, 'D7', 'client'),
(8, 1, 3, 'Acceptable contract term?', NULL, 'single_select',
 '["Annual only","2 years","3 years","5+ years","Flexible"]'::jsonb,
 '{}', true, 'D7', 'client');

-- SECTION 9: Team & Implementation Readiness (Tier 1)
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(9, 1, 1, 'Internal IT capacity for implementation?', NULL, 'single_select',
 '["Dedicated IT team","Shared IT resources","Minimal IT - need vendor-led","No internal IT"]'::jsonb,
 '{}', true, 'D6', 'client'),
(9, 1, 2, 'Appetite for change management?', NULL, 'single_select',
 '["High - org is ready","Moderate","Low - prior failed projects","Unknown"]'::jsonb,
 '{}', true, 'D6', 'client'),
(9, 1, 3, 'Prior TMS implementation experience (team)?', NULL, 'single_select',
 '["Multiple successful","One successful","One failed","None"]'::jsonb,
 '{}', true, 'D6', 'client');

-- SECTION 10: AI & Intelligence (Tier 2)
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(10, 2, 1, 'Which AI-driven capabilities are most valuable to you?', NULL, 'multi_select',
 '["Predictive ETA","Automated rating","Load matching/optimization","Freight audit anomaly detection","Carrier scorecards","Demand forecasting","Natural-language queries","None"]'::jsonb,
 '{}', false, 'D3', 'client'),
(10, 2, 2, 'Do you require explainable AI / model transparency?', NULL, 'boolean', NULL,
 '{}', false, 'D3', 'client');

-- SECTION 11: Architecture Preferences (Tier 2)
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(11, 2, 1, 'Deployment preference?', NULL, 'single_select',
 '["SaaS multi-tenant","SaaS single-tenant","Private cloud","On-premise","No preference"]'::jsonb,
 '{}', false, 'D3', 'client'),
(11, 2, 2, 'Integration approach preference?', NULL, 'single_select',
 '["Native APIs only","iPaaS acceptable","EDI acceptable","Hybrid","No preference"]'::jsonb,
 '{}', false, 'D4', 'client'),
(11, 2, 3, 'Who owns your data in a vendor relationship?',
 'This is a fiduciary question. Strong answers reflect explicit customer ownership.', 'single_select',
 '["Must be client-owned, portable","Client-owned, on-request export","Vendor default terms acceptable","Unsure"]'::jsonb,
 '{}', false, 'D5', 'client');

-- SECTION 12: Financial Rigor / PE Lens (Tier 2)
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(12, 2, 1, 'Do you require vendor financial disclosure?', NULL, 'boolean', NULL,
 '{pe_portco,multi_business_line}', false, 'D8', 'client'),
(12, 2, 2, 'Do you require visibility into vendor''s technical debt posture?', NULL, 'boolean', NULL,
 '{pe_portco,multi_business_line}', false, 'D8', 'client'),
(12, 2, 3, 'Do you need a 100-Day Governance Plan post-implementation?', NULL, 'boolean', NULL,
 '{pe_portco}', false, 'D6', 'client');

-- SECTION 13: Multi-Business-Line / Carrier-Brokerage (Tier 2)
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(13, 2, 1, 'Do you need a single system across all business lines, or best-of-breed per line?', NULL, 'single_select',
 '["Single unified system","Best-of-breed per line","Hybrid"]'::jsonb,
 '{multi_business_line,carrier_brokerage,carrier_3pl_4pl}', false, 'D1', 'client'),
(13, 2, 2, 'Do you need brokerage/asset-carrier workflow segregation?', NULL, 'boolean', NULL,
 '{carrier_brokerage,carrier_3pl_4pl}', false, 'D1', 'client');

-- SECTION 14: Vendor Preferences & Watch Points (Tier 2)
INSERT INTO questions (section, tier, order_index, text, help_text, type, options, persona_tags, required, dimension, audience) VALUES
(14, 2, 1, 'Vendors to exclude (names - we will not share with vendors)', NULL, 'text', NULL,
 '{}', false, NULL, 'client'),
(14, 2, 2, 'Specific watch points vendors should know about',
 'Prior bad experiences, specific risks, sensitivities.', 'text', NULL,
 '{}', false, NULL, 'client');
