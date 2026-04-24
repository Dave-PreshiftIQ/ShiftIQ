export const PERSONAS = [
  { id: 'shipper',               label: 'Shipper (Manufacturer, Retailer, Distributor)',        scoring_key: 'shipper' },
  { id: 'shipper_private_fleet', label: 'Shipper with Private Fleet',                           scoring_key: 'shipper' },
  { id: 'shipper_ecom_3pl',      label: 'Shipper with eCommerce / Warehouse / 3PL Fulfillment', scoring_key: 'shipper' },
  { id: 'broker_lsp',            label: 'Freight Broker / LSP',                                 scoring_key: 'broker'  },
  { id: 'asset_carrier',         label: 'Asset Carrier',                                        scoring_key: 'carrier' },
  { id: 'carrier_brokerage',     label: 'Carrier with Brokerage Arm',                           scoring_key: 'carrier' },
  { id: 'carrier_3pl_4pl',       label: 'Carrier with 3PL / 4PL Offering',                      scoring_key: 'carrier' },
  { id: 'multi_business_line',   label: 'Organization with Multiple Business Lines',            scoring_key: 'shipper' },
  { id: 'pe_portco',             label: 'Private Equity / Portfolio Company',                   scoring_key: 'pe'      },
] as const;

export type PersonaId = typeof PERSONAS[number]['id'];

export function scoringKeysFor(personaIds: string[]): string[] {
  const keys = new Set<string>();
  for (const id of personaIds) {
    const p = PERSONAS.find(x => x.id === id);
    if (p) keys.add(p.scoring_key);
  }
  return Array.from(keys);
}
