"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function MixCalculator() {
  const [length, setLength] = useState<number | "">("")
  const [width, setWidth] = useState<number | "">("")
  const [depth, setDepth] = useState<number | "">("")
  const [area, setArea] = useState<number | "">("")
  const [tons, setTons] = useState<number | "">("")
  const [mixType, setMixType] = useState("standard")
  const [result, setResult] = useState<string>("")

  // Density factors for different mix types (lbs per cubic foot)
  const densityFactors = {
    standard: 145,
    binder: 148,
    top: 143,
    shoulder: 140,
    driveway: 142,
  }

  const calculateTonsFromDimensions = () => {
    if (length !== "" && width !== "" && depth !== "") {
      const calculatedArea = Number(length) * Number(width)
      const calculatedTons = (calculatedArea * Number(depth) * densityFactors[mixType]) / (12 * 2000)
      setArea(calculatedArea)
      setTons(calculatedTons)
      setResult(`Area: ${calculatedArea.toFixed(2)} sq ft\nTons: ${calculatedTons.toFixed(2)} tons`)
    } else {
      setResult("Please enter all dimensions")
    }
  }

  const calculateTonsFromArea = () => {
    if (area !== "" && depth !== "") {
      const calculatedTons = (Number(area) * Number(depth) * densityFactors[mixType]) / (12 * 2000)
      setTons(calculatedTons)
      setResult(`Tons: ${calculatedTons.toFixed(2)} tons`)
    } else {
      setResult("Please enter area and depth")
    }
  }

  const calculateAreaFromTons = () => {
    if (tons !== "" && depth !== "") {
      const calculatedArea = (Number(tons) * 2000 * 12) / (Number(depth) * densityFactors[mixType])
      setArea(calculatedArea)
      setResult(`Area: ${calculatedArea.toFixed(2)} sq ft`)
    } else {
      setResult("Please enter tons and depth")
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Asphalt Mix Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dimensions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dimensions">Dimensions to Tons</TabsTrigger>
            <TabsTrigger value="area">Area to Tons</TabsTrigger>
            <TabsTrigger value="tons">Tons to Area</TabsTrigger>
          </TabsList>

          <div className="mb-4 mt-4">
            <Label htmlFor="mix-type">Mix Type</Label>
            <Select value={mixType} onValueChange={setMixType}>
              <SelectTrigger id="mix-type">
                <SelectValue placeholder="Select mix type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Mix (145 lbs/cu ft)</SelectItem>
                <SelectItem value="binder">Binder Course (148 lbs/cu ft)</SelectItem>
                <SelectItem value="top">Top Course (143 lbs/cu ft)</SelectItem>
                <SelectItem value="shoulder">Shoulder Mix (140 lbs/cu ft)</SelectItem>
                <SelectItem value="driveway">Driveway Mix (142 lbs/cu ft)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="dimensions">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="length">Length (ft)</Label>
                <Input
                  id="length"
                  type="number"
                  value={length}
                  onChange={(e) => setLength(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
              <div>
                <Label htmlFor="width">Width (ft)</Label>
                <Input
                  id="width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
              <div>
                <Label htmlFor="depth">Depth (inches)</Label>
                <Input
                  id="depth"
                  type="number"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
            </div>
            <Button onClick={calculateTonsFromDimensions} className="w-full">
              Calculate
            </Button>
          </TabsContent>

          <TabsContent value="area">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="area">Area (sq ft)</Label>
                <Input
                  id="area"
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
              <div>
                <Label htmlFor="depth-area">Depth (inches)</Label>
                <Input
                  id="depth-area"
                  type="number"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
            </div>
            <Button onClick={calculateTonsFromArea} className="w-full">
              Calculate
            </Button>
          </TabsContent>

          <TabsContent value="tons">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="tons">Tons</Label>
                <Input
                  id="tons"
                  type="number"
                  value={tons}
                  onChange={(e) => setTons(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
              <div>
                <Label htmlFor="depth-tons">Depth (inches)</Label>
                <Input
                  id="depth-tons"
                  type="number"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
            </div>
            <Button onClick={calculateAreaFromTons} className="w-full">
              Calculate
            </Button>
          </TabsContent>

          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <Label>Result</Label>
            <pre className="whitespace-pre-wrap">{result}</pre>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
