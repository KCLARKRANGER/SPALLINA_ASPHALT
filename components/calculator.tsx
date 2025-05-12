"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CalculatorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function Calculator({ open, onOpenChange }: CalculatorProps) {
  const [display, setDisplay] = useState("0")
  const [firstOperand, setFirstOperand] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false)

  const clearDisplay = () => {
    setDisplay("0")
    setFirstOperand(null)
    setOperator(null)
    setWaitingForSecondOperand(false)
  }

  const inputDigit = (digit: string) => {
    if (waitingForSecondOperand) {
      setDisplay(digit)
      setWaitingForSecondOperand(false)
    } else {
      setDisplay(display === "0" ? digit : display + digit)
    }
  }

  const inputDecimal = () => {
    if (waitingForSecondOperand) {
      setDisplay("0.")
      setWaitingForSecondOperand(false)
      return
    }

    if (!display.includes(".")) {
      setDisplay(display + ".")
    }
  }

  const handleOperator = (nextOperator: string) => {
    const inputValue = Number.parseFloat(display)

    if (firstOperand === null) {
      setFirstOperand(inputValue)
    } else if (operator) {
      const result = performCalculation(operator, firstOperand, inputValue)
      setDisplay(String(result))
      setFirstOperand(result)
    }

    setWaitingForSecondOperand(true)
    setOperator(nextOperator)
  }

  const performCalculation = (op: string, first: number, second: number): number => {
    switch (op) {
      case "+":
        return first + second
      case "-":
        return first - second
      case "*":
        return first * second
      case "/":
        return first / second
      default:
        return second
    }
  }

  const handleEquals = () => {
    if (firstOperand === null || operator === null) {
      return
    }

    const inputValue = Number.parseFloat(display)
    const result = performCalculation(operator, firstOperand, inputValue)
    setDisplay(String(result))
    setFirstOperand(result)
    setOperator(null)
    setWaitingForSecondOperand(true)
  }

  const handlePercentage = () => {
    const inputValue = Number.parseFloat(display)
    setDisplay(String(inputValue / 100))
  }

  const toggleSign = () => {
    setDisplay(String(-Number.parseFloat(display)))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Calculator</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4 p-4">
          <Input
            value={display}
            readOnly
            className="text-right text-xl font-mono h-12"
            aria-label="Calculator display"
          />

          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" onClick={clearDisplay}>
              C
            </Button>
            <Button variant="outline" onClick={toggleSign}>
              +/-
            </Button>
            <Button variant="outline" onClick={handlePercentage}>
              %
            </Button>
            <Button variant="outline" onClick={() => handleOperator("/")}>
              ÷
            </Button>

            <Button variant="outline" onClick={() => inputDigit("7")}>
              7
            </Button>
            <Button variant="outline" onClick={() => inputDigit("8")}>
              8
            </Button>
            <Button variant="outline" onClick={() => inputDigit("9")}>
              9
            </Button>
            <Button variant="outline" onClick={() => handleOperator("*")}>
              ×
            </Button>

            <Button variant="outline" onClick={() => inputDigit("4")}>
              4
            </Button>
            <Button variant="outline" onClick={() => inputDigit("5")}>
              5
            </Button>
            <Button variant="outline" onClick={() => inputDigit("6")}>
              6
            </Button>
            <Button variant="outline" onClick={() => handleOperator("-")}>
              -
            </Button>

            <Button variant="outline" onClick={() => inputDigit("1")}>
              1
            </Button>
            <Button variant="outline" onClick={() => inputDigit("2")}>
              2
            </Button>
            <Button variant="outline" onClick={() => inputDigit("3")}>
              3
            </Button>
            <Button variant="outline" onClick={() => handleOperator("+")}>
              +
            </Button>

            <Button variant="outline" onClick={() => inputDigit("0")} className="col-span-2">
              0
            </Button>
            <Button variant="outline" onClick={inputDecimal}>
              .
            </Button>
            <Button variant="default" onClick={handleEquals}>
              =
            </Button>
          </div>

          {/* Asphalt Calculator Section */}
          <div className="mt-4 border-t pt-4">
            <h3 className="font-medium mb-2">Asphalt Calculator</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const area = Number.parseFloat(display)
                    const depth = 2 // 2 inches
                    // Formula: (Area in sq ft * Depth in inches) / 12 * 145 lbs per cubic foot / 2000 lbs per ton
                    const tons = (area * depth * 145) / (12 * 2000)
                    setDisplay(tons.toFixed(2))
                  }}
                >
                  Area → Tons (2")
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const area = Number.parseFloat(display)
                    const depth = 3 // 3 inches
                    // Formula: (Area in sq ft * Depth in inches) / 12 * 145 lbs per cubic foot / 2000 lbs per ton
                    const tons = (area * depth * 145) / (12 * 2000)
                    setDisplay(tons.toFixed(2))
                  }}
                >
                  Area → Tons (3")
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const tons = Number.parseFloat(display)
                    const depth = 2 // 2 inches
                    // Formula: Tons * 2000 lbs per ton / 145 lbs per cubic foot * 12 / Depth in inches
                    const area = (tons * 2000 * 12) / (145 * depth)
                    setDisplay(area.toFixed(2))
                  }}
                >
                  Tons → Area (2")
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const tons = Number.parseFloat(display)
                    const depth = 3 // 3 inches
                    // Formula: Tons * 2000 lbs per ton / 145 lbs per cubic foot * 12 / Depth in inches
                    const area = (tons * 2000 * 12) / (145 * depth)
                    setDisplay(area.toFixed(2))
                  }}
                >
                  Tons → Area (3")
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
