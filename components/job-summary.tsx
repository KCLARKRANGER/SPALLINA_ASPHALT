"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calculator } from "lucide-react"
import { useState } from "react"
import { MarkupComparison } from "./markup-comparison"

interface JobSummaryProps {
  jobData: any
  calculateTotalCost: () => number
  calculateFinalQuoteAmount: () => number
}

export function JobSummary({ jobData, calculateTotalCost, calculateFinalQuoteAmount }: JobSummaryProps) {
  const [markupDialogOpen, setMarkupDialogOpen] = useState(false)
  const baseCost = calculateTotalCost()
  const finalCost = calculateFinalQuoteAmount()

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Project Summary</CardTitle>
          <p className="text-sm text-muted-foreground">View the summary of your estimate</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Quote Amount:</h3>
              <p className="text-3xl font-bold">${finalCost.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">
                Internal note: Includes{" "}
                {jobData.markup
                  ? Object.values(jobData.markup).some((m) => m > 0)
                    ? "markup"
                    : "0% markup"
                  : "0% markup"}{" "}
                on base cost of ${baseCost.toFixed(2)}
              </p>
            </div>

            <div className="bg-muted p-3 rounded-md">
              <h4 className="font-medium mb-2">Base Cost: ${baseCost.toFixed(2)}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Equipment Markup:</span> {jobData.markup?.equipment || 0}%
                </div>
                <div>
                  <span className="font-medium">Labor Markup:</span> {jobData.markup?.labor || 0}%
                </div>
                <div>
                  <span className="font-medium">Materials Markup:</span> {jobData.markup?.materials || 0}%
                </div>
                <div>
                  <span className="font-medium">Trucking Markup:</span> {jobData.markup?.trucking || 0}%
                </div>
                <div>
                  <span className="font-medium">Overtime Markup:</span> {jobData.markup?.overtime || 0}%
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setMarkupDialogOpen(true)}>
                <Calculator className="mr-2 h-4 w-4" />
                Markup Calculator
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <MarkupComparison open={markupDialogOpen} onOpenChange={setMarkupDialogOpen} baseCost={baseCost} />
    </>
  )
}
