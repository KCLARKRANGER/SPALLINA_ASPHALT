"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { materialTypes } from "../config/paving-templates"
import { calculateTonsFromArea } from "@/utils/asphalt-calculations"

interface SectionMaterialsProps {
  sectionId: string
  sectionArea: number
  materials: any[]
  updateMaterialItem: (sectionId: string, index: number, field: string, value: any) => void
  addMaterialItem: (sectionId: string) => void
  removeMaterialItem: (sectionId: string, index: number) => void
  recalculateTonnage: (sectionId: string) => void
}

export function SectionMaterials({
  sectionId,
  sectionArea,
  materials,
  updateMaterialItem,
  addMaterialItem,
  removeMaterialItem,
  recalculateTonnage,
}: SectionMaterialsProps) {
  // Function to calculate tonnage based on area and thickness
  const calculateTonnage = (area: number, thickness: number) => {
    if (!area || !thickness) return 0
    return calculateTonsFromArea(area, thickness)
  }

  // Handle thickness change and recalculate tonnage
  const handleThicknessChange = (index: number, value: number) => {
    updateMaterialItem(sectionId, index, "thickness", value)

    // Only auto-calculate quantity if the material is measured in tons
    if (materials[index].unit === "tons") {
      const calculatedTons = calculateTonnage(sectionArea, value)
      updateMaterialItem(sectionId, index, "quantity", calculatedTons)

      // Update total based on new quantity
      const total = calculatedTons * materials[index].rate
      updateMaterialItem(sectionId, index, "total", total)
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">Materials</h3>
        <Button size="sm" onClick={() => addMaterialItem(sectionId)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </div>

      {sectionArea > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm font-medium">Section Area: {sectionArea.toFixed(2)} sq ft</p>
          <p className="text-xs text-gray-500">Thickness and tonnage will be calculated based on this area.</p>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Material Type</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Thickness (in)</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((item: any, index: number) => (
            <TableRow key={`material-${sectionId}-${index}`}>
              <TableCell>
                <Select
                  value={item.name}
                  onValueChange={(value) => updateMaterialItem(sectionId, index, "name", value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialTypes.map((material) => (
                      <SelectItem key={material.code} value={material.name}>
                        {material.code} - {material.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={item.unit}
                  onValueChange={(value) => updateMaterialItem(sectionId, index, "unit", value)}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tons">Tons</SelectItem>
                    <SelectItem value="yards">Cubic Yards</SelectItem>
                    <SelectItem value="gallons">Gallons</SelectItem>
                    <SelectItem value="lbs">Pounds</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.thickness || ""}
                  onChange={(e) => handleThicknessChange(index, Number(e.target.value))}
                  className="w-20"
                  placeholder="0"
                  step="0.5"
                  min="0"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => {
                    updateMaterialItem(sectionId, index, "quantity", Number(e.target.value))
                    // Update total when quantity changes
                    updateMaterialItem(sectionId, index, "total", Number(e.target.value) * item.rate)
                  }}
                  className="w-24"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.rate}
                  onChange={(e) => {
                    updateMaterialItem(sectionId, index, "rate", Number(e.target.value))
                    // Update total when rate changes
                    updateMaterialItem(sectionId, index, "total", item.quantity * Number(e.target.value))
                  }}
                  className="w-24"
                />
              </TableCell>
              <TableCell>${item.total?.toFixed(2) || "0.00"}</TableCell>
              <TableCell>
                <Button variant="destructive" size="icon" onClick={() => removeMaterialItem(sectionId, index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {materials.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                No materials added yet. Click "Add Material" to add one.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {materials.length > 0 && (
        <div className="mt-2 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => recalculateTonnage(sectionId)}>
            Recalculate Tonnage
          </Button>
        </div>
      )}
    </>
  )
}
