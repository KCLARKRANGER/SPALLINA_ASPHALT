/**
 * Calculate tons of asphalt needed based on area and depth
 * @param area Area in square feet
 * @param depth Depth in inches
 * @returns Tons of asphalt needed
 */
export function calculateTonsFromArea(area: number, depth: number): number {
  // Formula: (Area in sq ft * Depth in inches) / 12 * 145 lbs per cubic foot / 2000 lbs per ton
  return (area * depth * 145) / (12 * 2000)
}

/**
 * Calculate area based on length and width
 * @param length Length in feet
 * @param width Width in feet
 * @returns Area in square feet
 */
export function calculateArea(length: number, width: number): number {
  return length * width
}

/**
 * Calculate cost per square foot
 * @param totalCost Total cost in dollars
 * @param area Area in square feet
 * @returns Cost per square foot
 */
export function calculateCostPerSquareFoot(totalCost: number, area: number): number {
  if (area === 0) return 0
  return totalCost / area
}

/**
 * Calculate cost per ton
 * @param totalCost Total cost in dollars
 * @param tons Tons of asphalt
 * @returns Cost per ton
 */
export function calculateCostPerTon(totalCost: number, tons: number): number {
  if (tons === 0) return 0
  return totalCost / tons
}
