// Tek fiyat kaynağı: ana sayfa, tedavi sayfaları, /fees/, sonuç kartları, /book/ özeti, admin Settings varsayılanları.
const n = (v: number) => v.toLocaleString('en-IE');
export const eur = (v: number) => `€${n(v)}`;
/** Tek fiyat: €85 · aralık: €95–€140 (iki uç da yazılır, "from €" yok) */
export const range = (min: number, max: number) => (min === max ? eur(min) : `${eur(min)}–${eur(max)}`);

export type Price = [number, number];

/** Ana tedavi aralıkları (bilgi tabloları, /treatments/, /book/ özeti, admin Settings) */
export const TREATMENT_PRICE: Record<string, Price> = {
  examination: [65, 85],
  'check-up-and-clean': [95, 140],
  fillings: [110, 220],
  'root-canal': [450, 1100],
  implants: [2400, 3400],
  'braces-and-aligners': [3200, 6500],
  whitening: [350, 450],
  'crowns-and-veneers': [650, 1150],
  emergency: [80, 80],
};
export const treatmentFee = (slug: string) => range(...TREATMENT_PRICE[slug]);

/** /fees/ tam liste. `slug` yalnız ana tedavi aralığıyla birebir aynı olan satırlarda (Settings'ten değişirse sitede görünür). */
export interface FeeItem { name: string; p: Price; slug?: string }
export const FEE_GROUPS: { title: string; rows: FeeItem[] }[] = [
  { title: 'Examinations', rows: [
    { name: 'New patient examination (incl. X-rays if needed)', p: [85, 85] },
    { name: 'Routine examination', p: [65, 65] },
    { name: 'Child examination (under 16)', p: [45, 45] },
    { name: 'Emergency appointment', p: [80, 80], slug: 'emergency' },
    { name: 'Small X-ray', p: [25, 25] },
    { name: 'Panoramic X-ray (OPG)', p: [80, 80] },
    { name: '3D CT scan', p: [160, 160] },
  ] },
  { title: 'General dentistry', rows: [
    { name: 'Scale and polish (hygienist)', p: [85, 110] },
    { name: 'Check-up and clean (exam + hygienist)', p: [95, 140], slug: 'check-up-and-clean' },
    { name: 'Deep clean, per quadrant', p: [90, 90] },
    { name: 'White filling', p: [110, 220], slug: 'fillings' },
    { name: 'Temporary filling', p: [80, 80] },
    { name: 'Fissure sealant, per tooth', p: [50, 50] },
    { name: 'Simple extraction', p: [150, 190] },
    { name: 'Surgical extraction', p: [220, 400] },
    { name: 'Night guard', p: [280, 280] },
  ] },
  { title: 'Root canal', rows: [
    { name: 'Front tooth', p: [450, 600] },
    { name: 'Premolar', p: [600, 800] },
    { name: 'Molar', p: [850, 1100] },
    { name: 'Re-treatment', p: [900, 1250] },
  ] },
  { title: 'Implants', rows: [
    { name: 'Consultation and 3D plan', p: [120, 120] },
    { name: 'Single implant with crown', p: [2400, 3400], slug: 'implants' },
    { name: 'Bone graft', p: [450, 900] },
  ] },
  { title: 'Braces and clear aligners', rows: [
    { name: 'Orthodontic consultation', p: [80, 80] },
    { name: 'Clear aligners', p: [3200, 5200] },
    { name: 'Fixed braces', p: [3600, 6500] },
    { name: 'Retainers, per arch', p: [250, 350] },
  ] },
  { title: 'Cosmetic', rows: [
    { name: 'Whitening (custom trays + gel)', p: [350, 450], slug: 'whitening' },
    { name: 'Composite bonding, per tooth', p: [250, 380] },
    { name: 'Porcelain veneer, per tooth', p: [750, 1150] },
    { name: 'Crown', p: [650, 1150] },
  ] },
];
export const PRICES_UPDATED = 'October 2026';
