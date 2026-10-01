export type ArtisanTradeSeed = {
  id: string;
  key: string;
  label: string;
  specialties: string[];
  services: string[];
  problems: Array<{ label: string; services: string[]; professionalNote?: string; professionalHref?: string }>;
};

export const ARTISAN_TRADES: ArtisanTradeSeed[] = [
  {
    id: 'trade_bricklayer',
    key: 'bricklayer-mason',
    label: 'Bricklayer / Mason',
    specialties: ['Blockwork', 'Plasterwork', 'Masonry repair'],
    services: ['Wall repair', 'Block replacement', 'Fence repair', 'Concrete patching', 'Plaster repair'],
    problems: [
      { label: 'Cracked wall', services: ['Wall repair', 'Plaster repair'] },
      { label: 'Broken fence', services: ['Fence repair'] },
      { label: 'Damaged blockwork', services: ['Block replacement', 'Wall repair'] },
      { label: 'Plaster falling off', services: ['Plaster repair'] },
      {
        label: 'Serious or repeated wall cracking',
        services: ['Wall repair'],
        professionalNote: 'Significant or recurring structural cracks may require assessment by a Structural Engineer. A professional may also be relevant.',
        professionalHref: '/professionals?q=structural',
      },
    ],
  },
  {
    id: 'trade_plumber',
    key: 'plumber',
    label: 'Plumber',
    specialties: ['Residential plumbing', 'Water systems', 'Drainage'],
    services: ['Tap repair', 'Toilet repair', 'Pipe leak repair', 'Drainage connection', 'Pump installation'],
    problems: [
      { label: 'Leaking pipe', services: ['Pipe leak repair'] },
      { label: 'Leaking tap', services: ['Tap repair'] },
      { label: 'No water', services: ['Pipe leak repair', 'Pump installation'] },
      { label: 'Blocked drainage', services: ['Drainage connection'] },
      { label: 'Broken toilet', services: ['Toilet repair'] },
      { label: 'Burst pipe', services: ['Pipe leak repair'] },
      { label: 'Plumbing problem', services: ['Tap repair', 'Pipe leak repair', 'Toilet repair'] },
    ],
  },
  {
    id: 'trade_electrician',
    key: 'electrician',
    label: 'Electrician',
    specialties: ['House wiring', 'Fault finding', 'Fittings'],
    services: ['Socket repair', 'Lighting repair', 'Distribution board check', 'Fault tracing'],
    problems: [
      { label: 'Electrical fault', services: ['Fault tracing', 'Socket repair'] },
      { label: 'Lights not working', services: ['Lighting repair'] },
      { label: 'Socket not working', services: ['Socket repair'] },
      {
        label: 'Major electrical design or inspection',
        services: ['Distribution board check'],
        professionalNote: 'A full electrical design or formal inspection may also need an Electrical Engineer. A professional may also be relevant.',
        professionalHref: '/professionals?q=electrical',
      },
    ],
  },
  {
    id: 'trade_carpenter',
    key: 'carpenter-joiner',
    label: 'Carpenter / Joiner',
    specialties: ['Doors', 'Furniture repair', 'Site carpentry'],
    services: ['Door repair', 'Frame repair', 'Cabinet repair', 'Timber replacement'],
    problems: [
      { label: 'Broken door', services: ['Door repair'] },
      { label: 'Damaged door frame', services: ['Frame repair'] },
      { label: 'Broken cabinet', services: ['Cabinet repair'] },
    ],
  },
  {
    id: 'trade_roofer',
    key: 'roofer',
    label: 'Roofer',
    specialties: ['Sheet roofing', 'Leak repair', 'Roof drainage'],
    services: ['Roof leak repair', 'Sheet replacement', 'Flashing repair', 'Gutter repair'],
    problems: [
      { label: 'Roof leak', services: ['Roof leak repair', 'Flashing repair'] },
      { label: 'Damaged roof sheet', services: ['Sheet replacement'] },
      { label: 'Gutter overflow', services: ['Gutter repair'] },
    ],
  },
  {
    id: 'trade_tiler',
    key: 'tiler',
    label: 'Tiler',
    specialties: ['Floor tiles', 'Wall tiles', 'Wet areas'],
    services: ['Tile replacement', 'Tile regrouting', 'Bathroom tiling repair'],
    problems: [
      { label: 'Broken tiles', services: ['Tile replacement'] },
      { label: 'Loose tiles', services: ['Tile replacement', 'Tile regrouting'] },
      { label: 'Bathroom tiles damaged', services: ['Bathroom tiling repair'] },
    ],
  },
  {
    id: 'trade_painter',
    key: 'painter',
    label: 'Painter',
    specialties: ['Interior painting', 'Exterior painting', 'Surface preparation'],
    services: ['Repainting', 'Damp stain treatment', 'Wall finishing'],
    problems: [
      { label: 'Painting/repainting', services: ['Repainting', 'Wall finishing'] },
      { label: 'Peeling paint', services: ['Repainting', 'Damp stain treatment'] },
    ],
  },
  {
    id: 'trade_welder',
    key: 'welder-metal-fabricator',
    label: 'Welder / Metal Fabricator',
    specialties: ['Gates', 'Railings', 'Metal repair'],
    services: ['Gate repair', 'Railing repair', 'Metal welding'],
    problems: [
      { label: 'Damaged gate', services: ['Gate repair'] },
      { label: 'Broken railing', services: ['Railing repair'] },
    ],
  },
  {
    id: 'trade_aluminium',
    key: 'aluminium-glass',
    label: 'Aluminium & Glass Technician',
    specialties: ['Windows', 'Doors', 'Glass replacement'],
    services: ['Window repair', 'Aluminium door repair', 'Glass replacement'],
    problems: [
      { label: 'Broken window', services: ['Window repair', 'Glass replacement'] },
      { label: 'Window not closing', services: ['Window repair'] },
      { label: 'Glass door problem', services: ['Aluminium door repair', 'Glass replacement'] },
    ],
  },
  {
    id: 'trade_pop',
    key: 'pop-ceiling',
    label: 'POP / Ceiling Artisan',
    specialties: ['POP ceilings', 'Ceiling repair', 'Cornice'],
    services: ['Ceiling repair', 'POP patching', 'Cornice repair'],
    problems: [
      { label: 'Damaged ceiling', services: ['Ceiling repair', 'POP patching'] },
      { label: 'Ceiling falling', services: ['Ceiling repair'] },
    ],
  },
  {
    id: 'trade_waterproofing',
    key: 'waterproofing',
    label: 'Waterproofing Technician',
    specialties: ['Roof waterproofing', 'Wet areas', 'Wall damp'],
    services: ['Roof coating', 'Bathroom waterproofing', 'Wall damp treatment'],
    problems: [
      { label: 'Water entering the roof', services: ['Roof coating'] },
      { label: 'Damp wall', services: ['Wall damp treatment'] },
    ],
  },
  {
    id: 'trade_drainage',
    key: 'drainage',
    label: 'Drainage Technician',
    specialties: ['Surface drainage', 'Soakaway', 'Blocked lines'],
    services: ['Drain clearing', 'Chamber repair', 'Soakaway repair'],
    problems: [
      { label: 'Blocked drainage', services: ['Drain clearing'] },
      { label: 'Flooding around the house', services: ['Soakaway repair', 'Chamber repair'] },
    ],
  },
  {
    id: 'trade_pump',
    key: 'pump',
    label: 'Pump Technician',
    specialties: ['Domestic pumps', 'Pump installation', 'Pump repair'],
    services: ['Pump repair', 'Pump installation', 'Pump replacement'],
    problems: [
      { label: 'Water pump not working', services: ['Pump repair'] },
      { label: 'Pumping machine not working', services: ['Pump repair', 'Pump replacement'] },
    ],
  },
  {
    id: 'trade_borehole',
    key: 'borehole',
    label: 'Borehole Technician',
    specialties: ['Borehole pumps', 'Borehole servicing'],
    services: ['Borehole pump repair', 'Borehole servicing'],
    problems: [
      { label: 'Borehole not producing water', services: ['Borehole pump repair', 'Borehole servicing'] },
    ],
  },
  {
    id: 'trade_ac',
    key: 'ac-hvac',
    label: 'AC / HVAC Technician',
    specialties: ['Split AC', 'Servicing', 'Installation'],
    services: ['AC servicing', 'AC gas refill', 'AC installation'],
    problems: [
      { label: 'AC not cooling', services: ['AC servicing', 'AC gas refill'] },
      { label: 'AC leaking water', services: ['AC servicing'] },
    ],
  },
  {
    id: 'trade_generator',
    key: 'generator',
    label: 'Generator Technician',
    specialties: ['Petrol generators', 'Diesel generators', 'Servicing'],
    services: ['Generator repair', 'Generator servicing'],
    problems: [
      { label: 'Generator not starting', services: ['Generator repair'] },
      { label: 'Generator needs service', services: ['Generator servicing'] },
    ],
  },
  {
    id: 'trade_solar',
    key: 'solar-inverter',
    label: 'Solar / Inverter Technician',
    specialties: ['Inverters', 'Solar panels', 'Batteries'],
    services: ['Inverter repair', 'Battery check', 'Solar panel check'],
    problems: [
      { label: 'Inverter problem', services: ['Inverter repair'] },
      { label: 'Inverter not charging', services: ['Inverter repair', 'Battery check'] },
    ],
  },
  {
    id: 'trade_cctv',
    key: 'cctv-security',
    label: 'CCTV / Security Systems Technician',
    specialties: ['CCTV', 'Alarms', 'Access control'],
    services: ['Camera repair', 'DVR repair', 'Alarm check'],
    problems: [
      { label: 'CCTV not recording', services: ['Camera repair', 'DVR repair'] },
      { label: 'Security camera offline', services: ['Camera repair'] },
    ],
  },
  {
    id: 'trade_locksmith',
    key: 'locksmith-door',
    label: 'Locksmith / Door Technician',
    specialties: ['Locks', 'Doors', 'Keys'],
    services: ['Lock repair', 'Lock replacement', 'Door adjustment'],
    problems: [
      { label: 'Door or lock problem', services: ['Lock repair', 'Door adjustment'] },
      { label: 'Lock not opening', services: ['Lock repair', 'Lock replacement'] },
    ],
  },
  {
    id: 'trade_flooring',
    key: 'flooring',
    label: 'Flooring Technician',
    specialties: ['Tile floors', 'Vinyl', 'Screed repair'],
    services: ['Floor repair', 'Vinyl replacement', 'Screed patching'],
    problems: [
      { label: 'Damaged floor', services: ['Floor repair', 'Screed patching'] },
    ],
  },
  {
    id: 'trade_paving',
    key: 'interlocking-paving',
    label: 'Interlocking / Paving Artisan',
    specialties: ['Interlocking', 'Driveways', 'Walkways'],
    services: ['Paving repair', 'Interlocking replacement'],
    problems: [
      { label: 'Broken interlocking', services: ['Interlocking replacement', 'Paving repair'] },
      { label: 'Sunken driveway', services: ['Paving repair'] },
    ],
  },
  {
    id: 'trade_garden',
    key: 'gardener-grounds',
    label: 'Gardener / Grounds Worker',
    specialties: ['Compound maintenance', 'Grass', 'Clearing'],
    services: ['Compound clearing', 'Grass cutting', 'Garden tidy'],
    problems: [
      { label: 'Overgrown compound', services: ['Compound clearing', 'Grass cutting'] },
    ],
  },
  {
    id: 'trade_pest',
    key: 'pest-treatment',
    label: 'Pest / Property Treatment Technician',
    specialties: ['Insects', 'Rodents', 'Treatment'],
    services: ['Pest treatment', 'Termite inspection support'],
    problems: [
      { label: 'Pest infestation', services: ['Pest treatment'] },
    ],
  },
  {
    id: 'trade_appliance',
    key: 'appliance-repair',
    label: 'Appliance Repair Technician',
    specialties: ['Washing machines', 'Cookers', 'Small appliances'],
    services: ['Washing machine repair', 'Cooker repair', 'Appliance diagnosis'],
    problems: [
      { label: 'Washing machine not working', services: ['Washing machine repair'] },
      { label: 'Cooker not heating', services: ['Cooker repair'] },
    ],
  },
];

export function slugKey(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}
