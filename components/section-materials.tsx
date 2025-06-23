"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { materialTypes } from "../config/paving-templates"

const safeNumber = (val: number | "") => (Number.isNaN(val) ? "" : val)

interface SectionMaterialsProps {
  sectionId: string
  materials: any[]
  updateMaterialItem: (sectionId: string, index: number, field: string, value: any) => void
  addMaterialItem: (sectionId: string) => void
  addCustomMaterialItem: (sectionId: string) => void
  removeMaterialItem: (sectionId: string, index: number) => void
}

export function SectionMaterials({
  sectionId,
  materials,
  updateMaterialItem,
  addMaterialItem,
  addCustomMaterialItem,
  removeMaterialItem,
}: SectionMaterialsProps) {
  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">Materials</h3>
        <div className="flex space-x-2">
          <Button size="sm" onClick={() => addMaterialItem(sectionId)}>
            <Plus className="h-4 w-4 mr-2" />
            Add from List
          </Button>
          <Button size="sm" variant="outline" onClick={() => addCustomMaterialItem(sectionId)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Custom
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Material Type</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price per Unit</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((item: any, index: number) => (
            <TableRow key={`material-${sectionId}-${index}`}>
              <TableCell>
                {item.isCustom ? (
                  <Input
                    value={item.name || ""}
                    onChange={(e) => updateMaterialItem(sectionId, index, "name", e.target.value)}
                    placeholder="Enter material name"
                    className="w-[200px]"
                  />
                ) : (
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
                )}
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
                    <SelectItem value="linft">Linear Ft</SelectItem>
                    <SelectItem value="bags">Bags</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.01"
                  value={safeNumber(item.quantity)}
                  onChange={(e) => {
                    const raw = e.target.value
                    // keep '' while typing
                    updateMaterialItem(sectionId, index, "quantity", raw === "" ? "" : Number(raw))
                  }}
                  onBlur={(e) => {
                    if (e.target.value === "") {
                      // commit as 0 so we never save ''
                      updateMaterialItem(sectionId, index, "quantity", 0)
                    }
                  }}
                  className="w-24"
                  placeholder="0"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.01"
                  value={safeNumber(item.rate)}
                  onChange={(e) => {
                    const raw = e.target.value
                    updateMaterialItem(sectionId, index, "rate", raw === "" ? "" : Number(raw))
                  }}
                  onBlur={(e) => {
                    if (e.target.value === "") {
                      updateMaterialItem(sectionId, index, "rate", 0)
                    }
                  }}
                  className="w-24"
                  placeholder="0.00"
                />
              </TableCell>
              <TableCell>
                <span className="font-medium">${item.total?.toFixed(2) || "0.00"}</span>
              </TableCell>
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
                No materials added yet. Click "Add from List" or "Add Custom" to add materials.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  )
}
