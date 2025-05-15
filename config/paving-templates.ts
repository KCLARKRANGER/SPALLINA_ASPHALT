// Define paving types for template selection
export const pavingTypes = [
  "Prep",
  "Bulk Milling",
  "Edge Milling",
  "Mainline Paving",
  "Binder Course",
  "Top Course",
  "Shoulder Paving",
  "Driveway Paving",
  "Parking Lot Paving Top",
  "Parking Lot Paving Binder",
  "Patching",
  "Tack Coat",
  "Striping",
  "Curbing",
  "Drainage",
]

// Define equipment list with hourly rates
export const equipmentList = [
  { name: "AP2 CAT Paver AP1000F", hourlyRate: 71.88 },
  { name: "AP3 Small Paver", hourlyRate: 68.75 },
  { name: "Weiler Paver", hourlyRate: 68.75 },
  { name: "R1 Hamm Roller HD-120", hourlyRate: 21.88 },
  { name: "R3 SM Hamm Roller HD-8", hourlyRate: 16.88 },
  { name: "R4 SM Hamm Roller HD-10C", hourlyRate: 18.75 },
  { name: "R5 BOMAG Roller 120AD - OLD", hourlyRate: 18.75 },
  { name: "R6 BOMAG Roller 120AD - NEW", hourlyRate: 18.75 },
  { name: "R7 Stone Roller", hourlyRate: 12.5 },
  { name: "SS1 CASE 90X Skidsteer", hourlyRate: 37.5 },
  { name: "SS2 Volvo Skidsteer", hourlyRate: 37.5 },
  { name: "SS1M CASE Skidsteer w/ Mill", hourlyRate: 37.5 },
  { name: "SS2M Volvo Skidsteer w/ Mill", hourlyRate: 37.5 },
  { name: "SS3 CAT 262D Skidsteer", hourlyRate: 37.5 },
  { name: "SS3M CAT 262D Skidsteer w/ Mill", hourlyRate: 37.5 },
  { name: "MIL-1 CAT PM322 Mill", hourlyRate: 500.0 },
  { name: "MIL-2 CAT PM622 Mill", hourlyRate: 625.0 },
  { name: "W-11 Mack Water Truck", hourlyRate: 25 },
  { name: "SW1 Brocce Broom", hourlyRate: 12.5 },
  { name: "Pick Up Broom Attachment", hourlyRate: 37.5 },
  { name: "SW2 LeeBoy Broom", hourlyRate: 37.5 },
  { name: "EX 02 Linkbelt Mini Excavator", hourlyRate: 37.5 },
  { name: "D1 - Komatsu 399PX Dozer", hourlyRate: 37.5 },
  { name: "D6 CAT D6 Dozer", hourlyRate: 50.0 },
  { name: "EX 2020 CAT 336 Excavator", hourlyRate: 56.25 },
  { name: "Pickup", hourlyRate: 12.5 },
  { name: "Tack Coat Truck", hourlyRate: 165.0 },
]

// Update the materials list with the provided options
export const materialTypes = [
  { code: "9503", name: "9.5mm < 30 mil ESAL" },
  { code: "9501", name: "9.5 mm < .3 Mil ESAL" },
  { code: "1203", name: "12.5 mm < 30 mil ESAL" },
  { code: "1903", name: "19.0 mm < 30 mil ESAL" },
  { code: "2503", name: "25 mm < 30 mil ESAL" },
  { code: "3703", name: "37.5 mm < 30 mil ESAL" },
  { code: "6306", name: "6.3 mm < 30 mil ESAL" },
  { code: "TACK", name: "TACK COAT" },
  { code: "TYP1", name: "TYPE 1 BASE" },
  { code: "TYP2", name: "TYPE 2 OPEN BASE" },
  { code: "TYP3", name: "TYPE 3 BINDER" },
  { code: "TYP6", name: "TYPE 6 TOP" },
  { code: "TYP7", name: "TYPE 7 TOP" },
  { code: "MX08", name: "#1 DENSE BINDER" },
]

// Define section templates with default equipment, labor, materials, and trucking
export const sectionTemplates: Record<string, any> = {
  Prep: {
    equipment: [
      { name: "SS1 CASE 90X Skidsteer", quantity: 1, hours: 8, includesOperator: false },
      { name: "SW1 Brocce Broom", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Laborer", quantity: 2, hours: 8 },
    ],
    materials: [],
    trucking: [],
  },
  "Bulk Milling": {
    equipment: [
      { name: "MIL-1 CAT PM322 Mill", quantity: 0, hours: 8, includesOperator: true },
      { name: "MIL-2 CAT PM622 Mill", quantity: 1, hours: 8, includesOperator: true },
      { name: "SS1 CASE 90X Skidsteer", quantity: 1, hours: 8, includesOperator: false },
      { name: "SW1 Brocce Broom", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 2, hours: 8 },
      { name: "Laborer", quantity: 2, hours: 8 },
    ],
    materials: [],
    trucking: [{ name: "Dump Truck", quantity: 2, hours: 8 }],
  },
  "Edge Milling": {
    equipment: [
      { name: "MIL-1 CAT PM322 Mill", quantity: 1, hours: 8, includesOperator: true },
      { name: "MIL-2 CAT PM622 Mill", quantity: 0, hours: 8, includesOperator: true },
      { name: "SS1 CASE 90X Skidsteer", quantity: 1, hours: 8, includesOperator: false },
      { name: "SW1 Brocce Broom", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 2, hours: 8 },
      { name: "Laborer", quantity: 2, hours: 8 },
    ],
    materials: [],
    trucking: [{ name: "Dump Truck", quantity: 1, hours: 8 }],
  },
  "Mainline Paving": {
    equipment: [
      { name: "AP2 CAT Paver AP1000F", quantity: 1, hours: 8, includesOperator: false },
      { name: "R1 Hamm Roller HD-120", quantity: 1, hours: 8, includesOperator: false },
      { name: "R6 BOMAG Roller 120AD - NEW", quantity: 1, hours: 8, includesOperator: false },
      { name: "W-11 Mack Water Truck", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 3, hours: 8 },
      { name: "Screedman", quantity: 2, hours: 8 },
      { name: "Raker", quantity: 2, hours: 8 },
      { name: "Laborer", quantity: 2, hours: 8 },
    ],
    materials: [{ name: "Hot Mix Asphalt", unit: "tons", quantity: 0, rate: 85 }],
    trucking: [{ name: "Flowboy", quantity: 3, hours: 8 }],
  },
  "Binder Course": {
    equipment: [
      { name: "AP2 CAT Paver AP1000F", quantity: 1, hours: 8, includesOperator: false },
      { name: "R1 Hamm Roller HD-120", quantity: 1, hours: 8, includesOperator: false },
      { name: "R6 BOMAG Roller 120AD - NEW", quantity: 1, hours: 8, includesOperator: false },
      { name: "W-11 Mack Water Truck", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 3, hours: 8 },
      { name: "Screedman", quantity: 2, hours: 8 },
      { name: "Raker", quantity: 2, hours: 8 },
      { name: "Laborer", quantity: 2, hours: 8 },
    ],
    materials: [{ name: "Binder Course Mix", unit: "tons", quantity: 0, rate: 80 }],
    trucking: [{ name: "Flowboy", quantity: 3, hours: 8 }],
  },
  "Top Course": {
    equipment: [
      { name: "AP2 CAT Paver AP1000F", quantity: 1, hours: 8, includesOperator: false },
      { name: "R1 Hamm Roller HD-120", quantity: 1, hours: 8, includesOperator: false },
      { name: "R6 BOMAG Roller 120AD - NEW", quantity: 1, hours: 8, includesOperator: false },
      { name: "W-11 Mack Water Truck", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 3, hours: 8 },
      { name: "Screedman", quantity: 2, hours: 8 },
      { name: "Raker", quantity: 2, hours: 8 },
      { name: "Laborer", quantity: 2, hours: 8 },
    ],
    materials: [{ name: "Top Course Mix", unit: "tons", quantity: 0, rate: 90 }],
    trucking: [{ name: "Flowboy", quantity: 3, hours: 8 }],
  },
  "Shoulder Paving": {
    equipment: [
      { name: "AP3 Small Paver", quantity: 1, hours: 8, includesOperator: false },
      { name: "R4 SM Hamm Roller HD-10C", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 2, hours: 8 },
      { name: "Screedman", quantity: 1, hours: 8 },
      { name: "Raker", quantity: 1, hours: 8 },
      { name: "Laborer", quantity: 1, hours: 8 },
    ],
    materials: [{ name: "Shoulder Mix", unit: "tons", quantity: 0, rate: 75 }],
    trucking: [{ name: "Flowboy", quantity: 2, hours: 8 }],
  },
  "Driveway Paving": {
    equipment: [
      { name: "Weiler Paver", quantity: 1, hours: 8, includesOperator: false },
      { name: "R3 SM Hamm Roller HD-8", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 2, hours: 8 },
      { name: "Screedman", quantity: 1, hours: 8 },
      { name: "Raker", quantity: 1, hours: 8 },
      { name: "Laborer", quantity: 1, hours: 8 },
    ],
    materials: [{ name: "Driveway Mix", unit: "tons", quantity: 0, rate: 95 }],
    trucking: [{ name: "Dump Truck", quantity: 1, hours: 8 }],
  },
  "Parking Lot Paving Top": {
    equipment: [
      { name: "Weiler Paver", quantity: 1, hours: 8, includesOperator: false },
      { name: "R1 Hamm Roller HD-120", quantity: 1, hours: 8, includesOperator: false },
      { name: "R4 SM Hamm Roller HD-10C", quantity: 1, hours: 8, includesOperator: false },
      { name: "W-11 Mack Water Truck", quantity: 1, hours: 8, includesOperator: false },
      { name: "Tack Coat Truck", quantity: 1, hours: 8, includesOperator: true },
      { name: "Pickup", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 3, hours: 8 },
      { name: "Screedman", quantity: 2, hours: 8 },
      { name: "Raker", quantity: 2, hours: 8 },
      { name: "Laborer", quantity: 2, hours: 8 },
    ],
    materials: [{ name: "Commercial Mix", unit: "tons", quantity: 0, rate: 85 }],
    trucking: [{ name: "Flowboy", quantity: 2, hours: 8 }],
  },
  "Parking Lot Paving Binder": {
    equipment: [
      { name: "Weiler Paver", quantity: 1, hours: 8, includesOperator: false },
      { name: "R1 Hamm Roller HD-120", quantity: 1, hours: 8, includesOperator: false },
      { name: "R4 SM Hamm Roller HD-10C", quantity: 1, hours: 8, includesOperator: false },
      { name: "W-11 Mack Water Truck", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 3, hours: 8 },
      { name: "Screedman", quantity: 2, hours: 8 },
      { name: "Raker", quantity: 2, hours: 8 },
      { name: "Laborer", quantity: 2, hours: 8 },
    ],
    materials: [{ name: "Commercial Mix", unit: "tons", quantity: 0, rate: 85 }],
    trucking: [{ name: "Flowboy", quantity: 2, hours: 8 }],
  },
  Patching: {
    equipment: [
      { name: "SS1 CASE 90X Skidsteer", quantity: 1, hours: 8, includesOperator: false },
      { name: "R3 SM Hamm Roller HD-8", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 1, hours: 8 },
      { name: "Laborer", quantity: 2, hours: 8 },
    ],
    materials: [{ name: "Patch Mix", unit: "tons", quantity: 0, rate: 95 }],
    trucking: [{ name: "Dump Truck", quantity: 1, hours: 8 }],
  },
  "Tack Coat": {
    equipment: [{ name: "W-11 Mack Water Truck", quantity: 1, hours: 8, includesOperator: false }],
    labor: [{ name: "Operator", quantity: 1, hours: 8 }],
    materials: [{ name: "Tack Coat", unit: "gallons", quantity: 200, rate: 3.5 }],
    trucking: [],
  },
  Striping: {
    equipment: [{ name: "SW2 LeeBoy Broom", quantity: 1, hours: 8, includesOperator: false }],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 1, hours: 8 },
      { name: "Laborer", quantity: 1, hours: 8 },
    ],
    materials: [{ name: "Paint", unit: "gallons", quantity: 20, rate: 45 }],
    trucking: [],
  },
  Curbing: {
    equipment: [
      { name: "SS3 CAT 262D Skidsteer", quantity: 1, hours: 8, includesOperator: false },
      { name: "EX 02 Linkbelt Mini Excavator", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 2, hours: 8 },
      { name: "Laborer", quantity: 2, hours: 8 },
    ],
    materials: [{ name: "Concrete", unit: "yards", quantity: 20, rate: 150 }],
    trucking: [{ name: "Concrete Truck", quantity: 1, hours: 8 }],
  },
  Drainage: {
    equipment: [
      { name: "EX 2020 CAT 336 Excavator", quantity: 1, hours: 8, includesOperator: false },
      { name: "SS1 CASE 90X Skidsteer", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 2, hours: 8 },
      { name: "Laborer", quantity: 2, hours: 8 },
    ],
    materials: [
      { name: "Pipe", unit: "feet", quantity: 100, rate: 15 },
      { name: "Catch Basins", unit: "each", quantity: 2, rate: 500 },
    ],
    trucking: [{ name: "Dump Truck", quantity: 1, hours: 8 }],
  },
}
