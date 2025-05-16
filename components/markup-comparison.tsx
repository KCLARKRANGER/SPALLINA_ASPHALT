"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface MarkupComparisonProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  baseCost: number
}

export function MarkupComparison({ open, onOpenChange, baseCost }: MarkupComparisonProps) {
  const [customBaseCost, setCustomBaseCost] = useState<number>(baseCost)
  const [markupRange, setMarkupRange] = useState({ min: 1, max: 40 })
  const printRef = useRef<HTMLDivElement>(null)

  // Generate array of markup percentages
  const markupPercentages = Array.from({ length: markupRange.max - markupRange.min + 1 }, (_, i) => markupRange.min + i)

  // Calculate price with markup
  const calculatePrice = (basePrice: number, markupPercentage: number) => {
    return basePrice * (1 + markupPercentage / 100)
  }

  // Calculate profit amount
  const calculateProfit = (basePrice: number, markupPercentage: number) => {
    return basePrice * (markupPercentage / 100)
  }

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML
      const originalContents = document.body.innerHTML

      document.body.innerHTML = `
        <div style="padding: 20px;">
          <h1 style="text-align: center; margin-bottom: 20px;">Markup Comparison Table</h1>
          <p style="margin-bottom: 10px;"><strong>Base Cost:</strong> $${customBaseCost.toFixed(2)}</p>
          ${printContents}
        </div>
      `
      window.print()
      document.body.innerHTML = originalContents
      window.location.reload()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Markup Comparison Table</DialogTitle>
        </DialogHeader>

        <div className="mb-4 grid grid-cols-4 gap-4">
          <div>
            <Label htmlFor="base-cost">Base Cost ($)</Label>
            <Input
              id="base-cost"
              type="number"
              value={customBaseCost}
              onChange={(e) => setCustomBaseCost(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="min-markup">Min Markup (%)</Label>
            <Input
              id="min-markup"
              type="number"
              min="0"
              max="100"
              value={markupRange.min}
              onChange={(e) => setMarkupRange({ ...markupRange, min: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label htmlFor="max-markup">Max Markup (%)</Label>
            <Input
              id="max-markup"
              type="number"
              min="0"
              max="100"
              value={markupRange.max}
              onChange={(e) => setMarkupRange({ ...markupRange, max: Number(e.target.value) || 40 })}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handlePrint} className="w-full">
              <Printer className="mr-2 h-4 w-4" />
              Print Table
            </Button>
          </div>
        </div>

        <div className="border rounded-md" ref={printRef}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Markup %</TableHead>
                <TableHead className="text-right">Final Price ($)</TableHead>
                <TableHead className="text-right">Profit ($)</TableHead>
                <TableHead className="text-right">Profit Margin (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Add a row for 0% markup */}
              <TableRow>
                <TableCell className="font-medium">0%</TableCell>
                <TableCell className="text-right">${customBaseCost.toFixed(2)}</TableCell>
                <TableCell className="text-right">$0.00</TableCell>
                <TableCell className="text-right">0.00%</TableCell>
              </TableRow>
              {markupPercentages.map((percentage) => {
                const finalPrice = calculatePrice(customBaseCost, percentage)
                const profit = calculateProfit(customBaseCost, percentage)
                const profitMargin = (profit / finalPrice) * 100

                return (
                  <TableRow key={percentage}>
                    <TableCell className="font-medium">{percentage}%</TableCell>
                    <TableCell className="text-right">${finalPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${profit.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{profitMargin.toFixed(2)}%</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
