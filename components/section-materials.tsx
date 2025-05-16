"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { materialTypes } from "../config/paving-templates"

interface SectionMaterialsProps {
  sectionId: string
  materials: any[]
  updateMaterialItem: (sectionId: string, index: number, field: string, value: any) => void
  addMaterialItem: (sectionId: string) => void
  removeMaterialItem: (sectionId: string, index: number) => void
}

export function SectionMaterials({
  sectionId,
  materials,
  updateMaterialItem,
  addMaterialItem,
  removeMaterialItem,
}: SectionMaterialsProps) {
  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">Materials</h3>
        <Button size="sm" onClick={() => addMaterialItem(sectionId)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Material Type</TableHead>
            <TableHead>Unit</TableHead>
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
                    <SelectItem value="each">Each</SelectItem>
                    <SelectItem value="sqft">Sq Ft</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  type="text"
                  value={String(item.quantity || 0)}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                    if (!isNaN(value)) {
                      updateMaterialItem(sectionId, index, "quantity", value)
                    }
                  }}
                  className="w-24"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="text"
                  value={String(item.rate || 0)}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                    if (!isNaN(value)) {
                      updateMaterialItem(sectionId, index, "rate", value)
                    }
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
              <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                No materials added yet. Click "Add Material" to add one.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  )
}
