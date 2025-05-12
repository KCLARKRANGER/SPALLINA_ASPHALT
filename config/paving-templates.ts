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
  "Parking Lot Paving",
  "Patching",
  "Tack Coat",
  "Striping",
  "Curbing",
  "Drainage",
]

// Define section templates with default equipment, labor, materials, and trucking
export const sectionTemplates: Record<string, any> = {
  Prep: {
    equipment: [
      { name: "Skidsteer", quantity: 1, hours: 8, includesOperator: false },
      { name: "Broom", quantity: 1, hours: 8, includesOperator: false },
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
      { name: "Mill", quantity: 1, hours: 8, includesOperator: false },
      { name: "Skidsteer", quantity: 1, hours: 8, includesOperator: false },
      { name: "Broom", quantity: 1, hours: 8, includesOperator: false },
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
      { name: "Mill", quantity: 1, hours: 8, includesOperator: false },
      { name: "Skidsteer", quantity: 1, hours: 8, includesOperator: false },
      { name: "Broom", quantity: 1, hours: 8, includesOperator: false },
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
      { name: "Paver", quantity: 1, hours: 8, includesOperator: false },
      { name: "Roller", quantity: 2, hours: 8, includesOperator: false },
      { name: "Water Truck", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 3, hours: 8 },
      { name: "Screedman", quantity: 2, hours: 8 },
      { name: "Raker", quantity: 2, hours: 8 },
      { name: "Laborer", quantity: 2, hours: 8 },
    ],
    materials: [{ name: "Hot Mix Asphalt", unit: "tons", quantity: 120, rate: 85 }],
    trucking: [{ name: "Flowboy", quantity: 3, hours: 8 }],
  },
  "Binder Course": {
    equipment: [
      { name: "Paver", quantity: 1, hours: 8, includesOperator: false },
      { name: "Roller", quantity: 2, hours: 8, includesOperator: false },
      { name: "Water Truck", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 3, hours: 8 },
      { name: "Screedman", quantity: 2, hours: 8 },
      { name: "Raker", quantity: 2, hours: 8 },
      { name: "Laborer", quantity: 2, hours: 8 },
    ],
    materials: [{ name: "Binder Course Mix", unit: "tons", quantity: 120, rate: 80 }],
    trucking: [{ name: "Flowboy", quantity: 3, hours: 8 }],
  },
  "Top Course": {
    equipment: [
      { name: "Paver", quantity: 1, hours: 8, includesOperator: false },
      { name: "Roller", quantity: 2, hours: 8, includesOperator: false },
      { name: "Water Truck", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 3, hours: 8 },
      { name: "Screedman", quantity: 2, hours: 8 },
      { name: "Raker", quantity: 2, hours: 8 },
      { name: "Laborer", quantity: 2, hours: 8 },
    ],
    materials: [{ name: "Top Course Mix", unit: "tons", quantity: 120, rate: 90 }],
    trucking: [{ name: "Flowboy", quantity: 3, hours: 8 }],
  },
  "Shoulder Paving": {
    equipment: [
      { name: "Paver", quantity: 1, hours: 8, includesOperator: false },
      { name: "Roller", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 2, hours: 8 },
      { name: "Screedman", quantity: 1, hours: 8 },
      { name: "Raker", quantity: 1, hours: 8 },
      { name: "Laborer", quantity: 1, hours: 8 },
    ],
    materials: [{ name: "Shoulder Mix", unit: "tons", quantity: 80, rate: 75 }],
    trucking: [{ name: "Flowboy", quantity: 2, hours: 8 }],
  },
  "Driveway Paving": {
    equipment: [
      { name: "Paver", quantity: 1, hours: 8, includesOperator: false },
      { name: "Roller", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 2, hours: 8 },
      { name: "Screedman", quantity: 1, hours: 8 },
      { name: "Raker", quantity: 1, hours: 8 },
      { name: "Laborer", quantity: 1, hours: 8 },
    ],
    materials: [{ name: "Driveway Mix", unit: "tons", quantity: 20, rate: 95 }],
    trucking: [{ name: "Dump Truck", quantity: 1, hours: 8 }],
  },
  "Parking Lot Paving": {
    equipment: [
      { name: "Paver", quantity: 1, hours: 8, includesOperator: false },
      { name: "Roller", quantity: 2, hours: 8, includesOperator: false },
      { name: "Water Truck", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 3, hours: 8 },
      { name: "Screedman", quantity: 2, hours: 8 },
      { name: "Raker", quantity: 2, hours: 8 },
      { name: "Laborer", quantity: 2, hours: 8 },
    ],
    materials: [{ name: "Commercial Mix", unit: "tons", quantity: 100, rate: 85 }],
    trucking: [{ name: "Flowboy", quantity: 2, hours: 8 }],
  },
  Patching: {
    equipment: [
      { name: "Skidsteer", quantity: 1, hours: 8, includesOperator: false },
      { name: "Roller", quantity: 1, hours: 8, includesOperator: false },
    ],
    labor: [
      { name: "Foreman", quantity: 1, hours: 8 },
      { name: "Operator", quantity: 1, hours: 8 },
      { name: "Laborer", quantity: 2, hours: 8 },
    ],
    materials: [{ name: "Patch Mix", unit: "tons", quantity: 15, rate: 95 }],
    trucking: [{ name: "Dump Truck", quantity: 1, hours: 8 }],
  },
  "Tack Coat": {
    equipment: [{ name: "Tack Truck", quantity: 1, hours: 8, includesOperator: false }],
    labor: [{ name: "Operator", quantity: 1, hours: 8 }],
    materials: [{ name: "Tack Coat", unit: "gallons", quantity: 200, rate: 3.5 }],
    trucking: [],
  },
  Striping: {
    equipment: [{ name: "Striper", quantity: 1, hours: 8, includesOperator: false }],
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
      { name: "Curb Machine", quantity: 1, hours: 8, includesOperator: false },
      { name: "Skidsteer", quantity: 1, hours: 8, includesOperator: false },
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
      { name: "Excavator", quantity: 1, hours: 8, includesOperator: false },
      { name: "Skidsteer", quantity: 1, hours: 8, includesOperator: false },
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
