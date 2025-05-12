/**
 * Check if code is running in browser environment
 */
const isBrowser = () => typeof window !== "undefined"

/**
 * Get the next quote number
 * @returns Next quote number
 */
export function getNextQuoteNumber(): number {
  // Get the current year
  const currentYear = new Date().getFullYear()

  // Only access localStorage in browser environment
  if (isBrowser()) {
    // Get the last quote number from localStorage
    const lastQuoteNumber = localStorage.getItem("lastQuoteNumber")

    if (lastQuoteNumber) {
      const [year, number] = lastQuoteNumber.split("-")

      // If the year is the same, increment the number
      if (Number.parseInt(year) === currentYear) {
        const nextNumber = Number.parseInt(number) + 1
        localStorage.setItem("lastQuoteNumber", `${currentYear}-${nextNumber}`)
        return nextNumber
      }
    }

    // If the year is different or no last quote number, start from 1001
    localStorage.setItem("lastQuoteNumber", `${currentYear}-1001`)
  }

  return 1001
}

/**
 * Format quote number with year prefix
 * @param quoteNumber Quote number
 * @returns Formatted quote number
 */
export function formatQuoteNumber(quoteNumber: number): string {
  const currentYear = new Date().getFullYear()
  return `${currentYear}-${quoteNumber}`
}
