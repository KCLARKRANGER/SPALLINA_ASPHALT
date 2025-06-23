"use client"

import React, { useState, useEffect } from "react"
import type { ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { generateQuoteNumber } from "@/utils/quote-number"
import { calculateTonsFromArea } from "@/utils/asphalt-calculations"
import {
  pavingTypes,
  equipmentList as defaultEquipmentList,
  materialTypes as defaultMaterialTypes,
  sectionTemplates,
} from "@/config/paving-templates"
import {
  Save,
  FileText,
  Plus,
  Trash2,
  Settings,
  Download,
  Upload,
  Copy,
  Check,
  X,
  FileUp,
  FileDown,
  Pencil,
  ChevronDown,
  ChevronUp,
  Calculator,
  Edit,
} from "lucide-react"
import { QuotePreview } from "@/components/quote-preview"
import { SectionMaterials } from "@/components/section-materials"
import { MarkupComparison } from "@/components/markup-comparison"

// Import the crew data at the top of the file, after the other imports
import { crewMembers as defaultCrewMembers } from "@/config/crew-data"

// Trucking function options
const truckingFunctions = [
  "Hauling Millings",
  "Hauling Asphalt",
  "Hauling Aggregate",
  "Hauling Tonnage",
  "General Hauling",
  "Material Delivery",
  "Material Desposal",
]

// Additional item units
const additionalItemUnits = [
  "each",
  "hours",
  "days",
  "tons",
  "yards",
  "gallons",
  "lbs",
  "sqft",
  "linft",
  "bags",
  "loads",
  "trips",
  "permits",
  "inspections",
  "lump sum",
]

export default function JobCostDashboard() {
  // State for editable configuration data
  const [equipmentList, setEquipmentList] = useState(defaultEquipmentList)
  const [materialTypes, setMaterialTypes] = useState(defaultMaterialTypes)
  const [crewMembers, setCrewMembers] = useState(defaultCrewMembers)

  // State for editing tables
  const [editingEquipment, setEditingEquipment] = useState(false)
  const [editingMaterials, setEditingMaterials] = useState(false)
  const [editingCrew, setEditingCrew] = useState(false)

  // State for editing individual items
  const [editingEquipmentItem, setEditingEquipmentItem] = useState<number | null>(null)
  const [editingMaterialItem, setEditingMaterialItem] = useState<number | null>(null)
  const [editingCrewItem, setEditingCrewItem] = useState<number | null>(null)

  // Temporary state for editing
  const [tempEquipmentItem, setTempEquipmentItem] = useState<any>(null)
  const [tempMaterialItem, setTempMaterialItem] = useState<any>(null)
  const [tempCrewItem, setTempCrewItem] = useState<any>(null)

  // State for job data
  const [jobData, setJobData] = useState({
    quoteNumber: generateQuoteNumber(),
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    projectName: "",
    projectLocation: "",
    contactInfo: {
      preparedBy: "",
      phone: "",
      email: "",
    },
    sections: [],
    selectedSections: [],
    markup: {
      equipment: 15,
      labor: 15,
      materials: 15,
      trucking: 15,
      overtime: 15,
    },
    notes: "",
    totalArea: 0,
    totalTonnage: 0,
  })

  // State for UI controls
  const [activeTab, setActiveTab] = useState("job-info")
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingSectionName, setEditingSectionName] = useState("")
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [showQuotePreview, setShowQuotePreview] = useState(false)
  const [showMarkupComparison, setShowMarkupComparison] = useState(false)

  // Load saved configuration data on initial load
  useEffect(() => {
    const savedEquipment = localStorage.getItem("equipmentList")
    const savedMaterials = localStorage.getItem("materialTypes")
    const savedCrew = localStorage.getItem("crewMembers")

    if (savedEquipment) {
      try {
        setEquipmentList(JSON.parse(savedEquipment))
      } catch (e) {
        console.error("Error loading saved equipment list:", e)
      }
    }

    if (savedMaterials) {
      try {
        setMaterialTypes(JSON.parse(savedMaterials))
      } catch (e) {
        console.error("Error loading saved material types:", e)
      }
    }

    if (savedCrew) {
      try {
        setCrewMembers(JSON.parse(savedCrew))
      } catch (e) {
        console.error("Error loading saved crew members:", e)
      }
    }
  }, [])

  // Save configuration data
  const saveConfigData = () => {
    localStorage.setItem("equipmentList", JSON.stringify(equipmentList))
    localStorage.setItem("materialTypes", JSON.stringify(materialTypes))
    localStorage.setItem("crewMembers", JSON.stringify(crewMembers))

    toast({
      title: "Configuration Saved",
      description: "Your equipment, materials, and crew data has been saved.",
    })
  }

  // Reset configuration data to defaults
  const resetConfigData = () => {
    setEquipmentList(defaultEquipmentList)
    setMaterialTypes(defaultMaterialTypes)
    setCrewMembers(defaultCrewMembers)

    localStorage.removeItem("equipmentList")
    localStorage.removeItem("materialTypes")
    localStorage.removeItem("crewMembers")

    toast({
      title: "Configuration Reset",
      description: "Your equipment, materials, and crew data has been reset to defaults.",
    })
  }

  // Equipment editing functions
  const startEditingEquipmentItem = (index: number) => {
    setEditingEquipmentItem(index)
    setTempEquipmentItem({ ...equipmentList[index] })
  }

  const saveEquipmentItem = () => {
    if (editingEquipmentItem !== null && tempEquipmentItem) {
      const newList = [...equipmentList]
      newList[editingEquipmentItem] = tempEquipmentItem
      setEquipmentList(newList)
      setEditingEquipmentItem(null)
      setTempEquipmentItem(null)
    }
  }

  const cancelEditingEquipmentItem = () => {
    setEditingEquipmentItem(null)
    setTempEquipmentItem(null)
  }

  const addNewEquipmentItem = () => {
    const newItem = {
      name: "New Equipment",
      hourlyRate: 0,
    }
    setEquipmentList([...equipmentList, newItem])
    startEditingEquipmentItem(equipmentList.length)
  }

  const deleteEquipmentItem = (index: number) => {
    const newList = [...equipmentList]
    newList.splice(index, 1)
    setEquipmentList(newList)
  }

  // Material editing functions
  const startEditingMaterialItem = (index: number) => {
    setEditingMaterialItem(index)
    setTempMaterialItem({ ...materialTypes[index] })
  }

  const saveMaterialItem = () => {
    if (editingMaterialItem !== null && tempMaterialItem) {
      const newList = [...materialTypes]
      newList[editingMaterialItem] = tempMaterialItem
      setMaterialTypes(newList)
      setEditingMaterialItem(null)
      setTempMaterialItem(null)
    }
  }

  const cancelEditingMaterialItem = () => {
    setEditingMaterialItem(null)
    setTempMaterialItem(null)
  }

  const addNewMaterialItem = () => {
    const newItem = {
      code: "NEW",
      name: "New Material",
    }
    setMaterialTypes([...materialTypes, newItem])
    startEditingMaterialItem(materialTypes.length)
  }

  const deleteMaterialItem = (index: number) => {
    const newList = [...materialTypes]
    newList.splice(index, 1)
    setMaterialTypes(newList)
  }

  // Crew editing functions
  const startEditingCrewItem = (index: number) => {
    setEditingCrewItem(index)
    setTempCrewItem({ ...crewMembers[index] })
  }

  const saveCrewItem = () => {
    if (editingCrewItem !== null && tempCrewItem) {
      const newList = [...crewMembers]
      newList[editingCrewItem] = tempCrewItem
      setCrewMembers(newList)
      setEditingCrewItem(null)
      setTempCrewItem(null)
    }
  }

  const cancelEditingCrewItem = () => {
    setEditingCrewItem(null)
    setTempCrewItem(null)
  }

  const addNewCrewItem = () => {
    const newItem = {
      id: `crew-${Date.now()}`,
      name: "New Crew Member",
      title: "Laborer",
      rate: 0,
      overtimeRate: 0,
    }
    setCrewMembers([...crewMembers, newItem])
    startEditingCrewItem(crewMembers.length)
  }

  const deleteCrewItem = (index: number) => {
    const newList = [...crewMembers]
    newList.splice(index, 1)
    setCrewMembers(newList)
  }

  // Function to add a new section from a template
  const addSectionFromTemplate = (templateName: string) => {
    const template = sectionTemplates[templateName]
    if (!template) return

    const newSectionId = `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Process equipment to ensure rates are set correctly
    const processedEquipment = template.equipment.map((item) => {
      const equipmentItem = equipmentList.find((e) => e.name === item.name)
      const rate = equipmentItem ? equipmentItem.hourlyRate : item.rate || 0
      return {
        ...item,
        rate: rate,
        total: item.quantity * item.hours * rate,
      }
    })

    // Add thickness field to materials
    const processedMaterials = template.materials.map((item) => {
      return {
        ...item,
        thickness: item.thickness || 0,
        total: item.quantity * item.rate,
      }
    })

    const newSection = {
      id: newSectionId,
      name: templateName,
      area: 0,
      tons: 0,
      length: 0,
      width: 0,
      equipment: processedEquipment,
      labor: [...template.labor],
      materials: processedMaterials,
      trucking: [...template.trucking],
      additionalItems: [], // New field for additional items
      notes: "",
    }

    setJobData({
      ...jobData,
      sections: [...jobData.sections, newSection],
      selectedSections: [...jobData.selectedSections, newSectionId],
    })

    // Auto-expand the new section
    setExpandedSections({
      ...expandedSections,
      [newSectionId]: true,
    })

    setIsAddSectionDialogOpen(false)

    toast({
      title: "Section Added",
      description: `${templateName} section has been added to your project.`,
    })
  }

  // Function to duplicate a section
  const duplicateSection = (sectionId: string) => {
    const sectionToDuplicate = jobData.sections.find((section) => section.id === sectionId)
    if (sectionToDuplicate) {
      const newSectionId = `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Create a deep copy to ensure all properties are properly duplicated
      const duplicatedSection = JSON.parse(
        JSON.stringify({
          ...sectionToDuplicate,
          id: newSectionId,
          name: `${sectionToDuplicate.name} (Copy)`,
        }),
      )

      setJobData({
        ...jobData,
        sections: [...jobData.sections, duplicatedSection],
        selectedSections: [...jobData.selectedSections, newSectionId],
      })

      // Auto-expand the duplicated section
      setExpandedSections({
        ...expandedSections,
        [newSectionId]: true,
      })

      toast({
        title: "Section Duplicated",
        description: `${sectionToDuplicate.name} has been duplicated.`,
      })
    }
  }

  // Function to rename a section
  const startRenamingSection = (sectionId: string) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (section) {
      setEditingSectionId(sectionId)
      setEditingSectionName(section.name)
    }
  }

  const saveRenamedSection = () => {
    if (editingSectionId && editingSectionName.trim()) {
      setJobData({
        ...jobData,
        sections: jobData.sections.map((section) =>
          section.id === editingSectionId ? { ...section, name: editingSectionName.trim() } : section,
        ),
      })
      setEditingSectionId(null)
      setEditingSectionName("")
    }
  }

  const cancelRenamingSection = () => {
    setEditingSectionId(null)
    setEditingSectionName("")
  }

  // Function to toggle section expansion
  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSections({
      ...expandedSections,
      [sectionId]: !expandedSections[sectionId],
    })
  }

  // Function to update section dimensions and recalculate area and tonnage
  const updateSectionDimensions = (sectionId: string, field: string, value: number) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section) return

    const updatedSection = { ...section, [field]: value }

    // Calculate area if we have both length and width and the user clicks the calculate button
    if (field === "length" || field === "width") {
      if (updatedSection.length && updatedSection.width) {
        // Don't auto-calculate area, let user do it manually if they want
      }
    }

    // Update the section
    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) => (s.id === sectionId ? updatedSection : s)),
    })
  }

  // Function to recalculate tonnage for a section
  const recalculateTonnage = (sectionId: string) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section) return

    if (!section.area) {
      toast({
        title: "No Area Specified",
        description: "No area has been specified. Tonnage will be calculated based on manual entries.",
        variant: "warning",
      })
      return
    }

    let totalTons = 0
    const updatedMaterials = section.materials.map((material) => {
      if (material.unit === "tons" && material.thickness) {
        const tons = calculateTonsFromArea(section.area, material.thickness)
        totalTons += tons
        return { ...material, quantity: tons, total: tons * material.rate }
      }
      return material
    })

    const updatedSection = {
      ...section,
      materials: updatedMaterials,
      tons: totalTons,
    }

    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) => (s.id === sectionId ? updatedSection : s)),
    })

    toast({
      title: "Tonnage Updated",
      description: `Total tonnage for this section: ${totalTons.toFixed(2)} tons`,
    })
  }

  // Function to add a material item to a section
  const addMaterialItem = (sectionId: string) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section) return

    const newMaterial = {
      name: materialTypes.length > 0 ? materialTypes[0].name : "New Material",
      unit: "tons",
      quantity: 0,
      rate: 85,
      total: 0,
      isCustom: false, // Flag to indicate this is from the dropdown list
    }

    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) =>
        s.id === sectionId ? { ...s, materials: [...s.materials, newMaterial] } : s,
      ),
    })
  }

  // Add this new function after the existing addMaterialItem function:
  const addCustomMaterialItem = (sectionId: string) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section) return

    const newMaterial = {
      name: "",
      unit: "each",
      quantity: 0,
      rate: 0,
      total: 0,
      isCustom: true, // Flag to indicate this is a custom material
    }

    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) =>
        s.id === sectionId ? { ...s, materials: [...s.materials, newMaterial] } : s,
      ),
    })
  }

  // Function to update material item in a section
  const updateMaterialItem = (sectionId: string, index: number, field: string, value: any) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section || !section.materials) return

    // Create a copy of the materials array
    const updatedMaterials = [...section.materials]

    // Update the specific field
    updatedMaterials[index] = {
      ...updatedMaterials[index],
      [field]: value,
    }

    // If quantity or rate changed, update the total
    if (field === "quantity" || field === "rate") {
      const quantity =
        typeof updatedMaterials[index].quantity === "string" && updatedMaterials[index].quantity === ""
          ? 0
          : Number(updatedMaterials[index].quantity) || 0
      const rate =
        typeof updatedMaterials[index].rate === "string" && updatedMaterials[index].rate === ""
          ? 0
          : Number(updatedMaterials[index].rate) || 0
      updatedMaterials[index].total = quantity * rate
    }

    // Update the section with the new materials array
    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) => (s.id === sectionId ? { ...s, materials: updatedMaterials } : s)),
    })
  }

  // Function to remove a material item from a section
  const removeMaterialItem = (sectionId: string, index: number) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section || !section.materials) return

    const updatedMaterials = section.materials.filter((_, i) => i !== index)

    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              materials: updatedMaterials,
            }
          : s,
      ),
    })
  }

  // Additional Items functions
  const addAdditionalItem = (sectionId: string) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section) return

    const newItem = {
      description: "",
      unit: "each",
      quantity: 0,
      rate: 0,
      total: 0,
    }

    const updatedAdditionalItems = [...(section.additionalItems || []), newItem]

    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) =>
        s.id === sectionId ? { ...s, additionalItems: updatedAdditionalItems } : s,
      ),
    })
  }

  const updateAdditionalItem = (sectionId: string, index: number, field: string, value: any) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section || !section.additionalItems) return

    const updatedItems = [...section.additionalItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Calculate total if quantity or rate changed
    if (field === "quantity" || field === "rate") {
      const quantity =
        typeof updatedItems[index].quantity === "string" && updatedItems[index].quantity === ""
          ? 0
          : Number(updatedItems[index].quantity) || 0
      const rate =
        typeof updatedItems[index].rate === "string" && updatedItems[index].rate === ""
          ? 0
          : Number(updatedItems[index].rate) || 0
      updatedItems[index].total = quantity * rate
    }

    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) => (s.id === sectionId ? { ...s, additionalItems: updatedItems } : s)),
    })
  }

  const removeAdditionalItem = (sectionId: string, index: number) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section || !section.additionalItems) return

    const updatedItems = section.additionalItems.filter((_, i) => i !== index)

    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) => (s.id === sectionId ? { ...s, additionalItems: updatedItems } : s)),
    })
  }

  // Function to update equipment item in a section
  const updateEquipmentItem = (sectionId: string, index: number, field: string, value: any) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section || !section.equipment) return

    const updatedEquipment = [...section.equipment]
    updatedEquipment[index] = { ...updatedEquipment[index], [field]: value }

    // Calculate total for this equipment
    if (field === "quantity" || field === "hours" || field === "rate") {
      updatedEquipment[index].total =
        updatedEquipment[index].quantity * updatedEquipment[index].hours * updatedEquipment[index].rate
    }

    // Update the section
    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) => (s.id === sectionId ? { ...s, equipment: updatedEquipment } : s)),
    })
  }

  // Function to add an equipment item to a section
  const addEquipmentItem = (sectionId: string) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section) return

    const newEquipment = {
      name: equipmentList.length > 0 ? equipmentList[0].name : "New Equipment",
      quantity: 1,
      hours: 8, // Default to 8 hours for equipment
      rate: equipmentList.length > 0 ? equipmentList[0].hourlyRate : 0,
      total: equipmentList.length > 0 ? equipmentList[0].hourlyRate * 8 : 0,
      includesOperator: false,
    }

    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) =>
        s.id === sectionId ? { ...s, equipment: [...s.equipment, newEquipment] } : s,
      ),
    })
  }

  // Function to remove an equipment item from a section
  const removeEquipmentItem = (sectionId: string, index: number) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section || !section.equipment) return

    const updatedEquipment = section.equipment.filter((_, i) => i !== index)

    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) => (s.id === sectionId ? { ...s, equipment: updatedEquipment } : s)),
    })
  }

  // Function to update labor item in a section
  const updateLaborItem = (sectionId: string, index: number, field: string, value: any) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section || !section.labor) return

    const updatedLabor = [...section.labor]

    // If selecting a crew member, update all related fields
    if (field === "crewMemberId") {
      const crewMember = crewMembers.find((member) => member.id === value)
      if (crewMember) {
        updatedLabor[index] = {
          ...updatedLabor[index],
          crewMemberId: value,
          name: crewMember.name,
          title: crewMember.title,
          rate: crewMember.rate,
          overtimeRate: crewMember.overtimeRate,
        }
      }
    } else {
      updatedLabor[index] = { ...updatedLabor[index], [field]: value }
    }

    // If setting the regular rate and overtime rate isn't set yet, default overtime rate to 1.5x regular
    if (field === "rate" && !updatedLabor[index].overtimeRate) {
      updatedLabor[index].overtimeRate = value * 1.5
    }

    // Calculate total for this labor including overtime
    const regularHours = Math.min(updatedLabor[index].hours || 0, 8) // Cap regular hours at 8
    const overtimeHours = Math.max((updatedLabor[index].hours || 0) - 8, 0) // Hours beyond 8 are overtime

    const regularPay = updatedLabor[index].quantity * regularHours * updatedLabor[index].rate
    const overtimePay =
      updatedLabor[index].quantity *
      overtimeHours *
      (updatedLabor[index].overtimeRate || updatedLabor[index].rate * 1.5)

    updatedLabor[index].overtimeHours = overtimeHours
    updatedLabor[index].total = regularPay + overtimePay

    // Update the section
    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) => (s.id === sectionId ? { ...s, labor: updatedLabor } : s)),
    })
  }

  // Function to add a labor item to a section
  const addLaborItem = (sectionId: string) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section) return

    const newLabor = {
      name: "Select Crew Member",
      title: "Laborer",
      crewMemberId: "",
      quantity: 1,
      hours: 10, // Default to 10 hours for labor (changed from 8)
      rate: 20,
      overtimeHours: 2, // 2 hours of overtime (10 - 8)
      overtimeRate: 30, // 1.5x regular rate
      total: 200, // 8 regular hours + 2 overtime hours
    }

    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) => (s.id === sectionId ? { ...s, labor: [...s.labor, newLabor] } : s)),
    })
  }

  // Function to remove a labor item from a section
  const removeLaborItem = (sectionId: string, index: number) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section || !section.labor) return

    const updatedLabor = section.labor.filter((_, i) => i !== index)

    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) => (s.id === sectionId ? { ...s, labor: updatedLabor } : s)),
    })
  }

  // Function to update trucking item in a section
  const updateTruckingItem = (sectionId: string, index: number, field: string, value: any) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section || !section.trucking) return

    const updatedTrucking = [...section.trucking]
    updatedTrucking[index] = { ...updatedTrucking[index], [field]: value }

    // Calculate total based on pricing type
    if (field === "pricingType") {
      // Reset fields based on pricing type
      if (value === "per-hour") {
        updatedTrucking[index] = {
          ...updatedTrucking[index],
          hours: 8,
          tons: 0,
          total: updatedTrucking[index].quantity * 8 * updatedTrucking[index].rate,
        }
      } else if (value === "per-ton") {
        updatedTrucking[index] = {
          ...updatedTrucking[index],
          hours: 0,
          tons: 100, // Default value
          total: updatedTrucking[index].quantity * 100 * updatedTrucking[index].rate,
        }
      }
    } else if (
      (updatedTrucking[index].pricingType === "per-hour" &&
        (field === "quantity" || field === "hours" || field === "rate")) ||
      (updatedTrucking[index].pricingType === "per-ton" &&
        (field === "quantity" || field === "tons" || field === "rate"))
    ) {
      // Calculate total based on pricing type
      if (updatedTrucking[index].pricingType === "per-hour") {
        updatedTrucking[index].total =
          updatedTrucking[index].quantity * updatedTrucking[index].hours * updatedTrucking[index].rate
      } else if (updatedTrucking[index].pricingType === "per-ton") {
        updatedTrucking[index].total =
          updatedTrucking[index].quantity * updatedTrucking[index].tons * updatedTrucking[index].rate
      }
    }

    // Update the section
    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) => (s.id === sectionId ? { ...s, trucking: updatedTrucking } : s)),
    })
  }

  // Function to add a trucking item to a section
  const addTruckingItem = (sectionId: string) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section) return

    const newTrucking = {
      name: "Dump Truck",
      function: truckingFunctions[0],
      pricingType: "per-hour", // Default to hourly pricing
      quantity: 1,
      hours: 8,
      tons: 0, // Not used for hourly pricing
      rate: 95,
      total: 760,
    }

    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) =>
        s.id === sectionId ? { ...s, trucking: [...s.trucking, newTrucking] } : s,
      ),
    })
  }

  // Function to remove a trucking item from a section
  const removeTruckingItem = (sectionId: string, index: number) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section || !section.trucking) return

    const updatedTrucking = section.trucking.filter((_, i) => i !== index)

    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) => (s.id === sectionId ? { ...s, trucking: updatedTrucking } : s)),
    })
  }

  // Function to delete a section
  const deleteSection = (sectionId: string) => {
    setJobData({
      ...jobData,
      sections: jobData.sections.filter((section) => section.id !== sectionId),
      selectedSections: jobData.selectedSections.filter((id) => id !== sectionId),
    })

    toast({
      title: "Section Deleted",
      description: "The section has been removed from your project.",
    })
  }

  // Function to toggle section selection
  const toggleSectionSelection = (sectionId: string) => {
    if (jobData.selectedSections.includes(sectionId)) {
      setJobData({
        ...jobData,
        selectedSections: jobData.selectedSections.filter((id) => id !== sectionId),
      })
    } else {
      setJobData({
        ...jobData,
        selectedSections: [...jobData.selectedSections, sectionId],
      })
    }
  }

  // Function to calculate section total
  const calculateSectionTotal = (section) => {
    const equipmentTotal = section.equipment.reduce((sum, item) => sum + (item.total || 0), 0)
    const laborTotal = section.labor.reduce((sum, item) => sum + (item.total || 0), 0)
    const materialsTotal = section.materials.reduce((sum, item) => sum + (item.total || 0), 0)
    const truckingTotal = section.trucking.reduce((sum, item) => sum + (item.total || 0), 0)
    const additionalItemsTotal = (section.additionalItems || []).reduce((sum, item) => sum + (item.total || 0), 0)

    return equipmentTotal + laborTotal + materialsTotal + truckingTotal + additionalItemsTotal
  }

  // Function to calculate job total
  const calculateJobTotal = () => {
    return jobData.sections
      .filter((section) => jobData.selectedSections.includes(section.id))
      .reduce((sum, section) => sum + calculateSectionTotal(section), 0)
  }

  // Function to calculate final quote amount with markup
  const calculateFinalQuoteAmount = () => {
    const equipmentTotal = jobData.sections
      .filter((section) => jobData.selectedSections.includes(section.id))
      .reduce((sum, section) => {
        return sum + section.equipment.reduce((subSum, item) => subSum + (item.total || 0), 0)
      }, 0)

    const laborTotal = jobData.sections
      .filter((section) => jobData.selectedSections.includes(section.id))
      .reduce((sum, section) => {
        return sum + section.labor.reduce((subSum, item) => subSum + (item.total || 0), 0)
      }, 0)

    const materialsTotal = jobData.sections
      .filter((section) => jobData.selectedSections.includes(section.id))
      .reduce((sum, section) => {
        return sum + section.materials.reduce((subSum, item) => subSum + (item.total || 0), 0)
      }, 0)

    const truckingTotal = jobData.sections
      .filter((section) => jobData.selectedSections.includes(section.id))
      .reduce((sum, section) => {
        return sum + section.trucking.reduce((subSum, item) => subSum + (item.total || 0), 0)
      }, 0)

    const additionalItemsTotal = jobData.sections
      .filter((section) => jobData.selectedSections.includes(section.id))
      .reduce((sum, section) => {
        return sum + (section.additionalItems || []).reduce((subSum, item) => subSum + (item.total || 0), 0)
      }, 0)

    // Apply markup to each category, but only if markup percentage is greater than 0
    const equipmentWithMarkup =
      jobData.markup?.equipment > 0 ? equipmentTotal * (1 + (jobData.markup?.equipment || 0) / 100) : equipmentTotal

    const laborWithMarkup =
      jobData.markup?.labor > 0 ? laborTotal * (1 + (jobData.markup?.labor || 0) / 100) : laborTotal

    const materialsWithMarkup =
      jobData.markup?.materials > 0 ? materialsTotal * (1 + (jobData.markup?.materials || 0) / 100) : materialsTotal

    const truckingWithMarkup =
      jobData.markup?.trucking > 0 ? truckingTotal * (1 + (jobData.markup?.trucking || 0) / 100) : truckingTotal

    // Apply materials markup to additional items as well
    const additionalItemsWithMarkup =
      jobData.markup?.materials > 0
        ? additionalItemsTotal * (1 + (jobData.markup?.materials || 0) / 100)
        : additionalItemsTotal

    return equipmentWithMarkup + laborWithMarkup + materialsWithMarkup + truckingWithMarkup + additionalItemsWithMarkup
  }

  // Function to save job data to localStorage
  const saveJobData = () => {
    try {
      const dataToSave = JSON.stringify(jobData)
      localStorage.setItem("jobData", dataToSave)

      // Also export as JSON file
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataToSave)

      // Format current date for the filename
      const now = new Date()
      const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`

      // Create filename using project name and date
      const projectName = jobData.projectName
        ? jobData.projectName.replace(/[^a-z0-9]/gi, "-").toLowerCase()
        : "untitled-job"

      const exportFileName = `${projectName}.${dateStr}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileName)
      linkElement.click()

      toast({
        title: "Job Data Saved",
        description: "Your job data has been saved locally and exported as a JSON file.",
      })
    } catch (error) {
      console.error("Error saving job data:", error)
      toast({
        title: "Error Saving Data",
        description: "There was an error saving your job data.",
        variant: "destructive",
      })
    }
  }

  // Function to autosave job data to localStorage
  const autosaveJobData = () => {
    try {
      const dataToSave = JSON.stringify(jobData)
      localStorage.setItem("jobData_autosave", dataToSave)

      // Also save a timestamped version for recovery
      const timestamp = new Date().toISOString()
      localStorage.setItem("jobData_autosave_timestamp", timestamp)

      // Optional: Save a JSON file for recovery
      if (typeof window !== "undefined" && window.navigator && window.navigator.msSaveBlob) {
        // For IE/Edge browsers
        const blob = new Blob([dataToSave], { type: "application/json" })
        window.navigator.msSaveBlob(blob, `${jobData.projectName || "job"}_autosave.json`)
      } else {
        // For modern browsers, save to IndexedDB or localStorage only
        // We don't automatically download files to avoid disrupting the user
      }

      console.log("Autosave completed:", timestamp)
    } catch (error) {
      console.error("Error during autosave:", error)
    }
  }

  // Function to check for autosaved data
  const checkForAutosavedData = () => {
    try {
      const autosavedData = localStorage.getItem("jobData_autosave")
      const timestamp = localStorage.getItem("jobData_autosave_timestamp")

      if (autosavedData && timestamp) {
        const parsedTimestamp = new Date(timestamp)
        const timeAgo = Math.round((new Date().getTime() - parsedTimestamp.getTime()) / 60000) // minutes

        // Only offer recovery for recent autosaves (within last 24 hours)
        if (timeAgo < 1440) {
          toast({
            title: "Recover Autosaved Work",
            description: `We found autosaved work from ${timeAgo} minutes ago. Would you like to recover it?`,
            action: (
              <Button
                onClick={() => {
                  try {
                    const parsedData = JSON.parse(autosavedData)
                    setJobData(parsedData)
                    toast({
                      title: "Work Recovered",
                      description: "Your autosaved work has been successfully loaded.",
                    })
                  } catch (error) {
                    console.error("Error recovering autosaved data:", error)
                    toast({
                      title: "Recovery Failed",
                      description: "There was an error recovering your autosaved work.",
                      variant: "destructive",
                    })
                  }
                }}
                variant="outline"
              >
                Recover
              </Button>
            ),
            duration: 10000, // Show for 10 seconds
          })
        }
      }
    } catch (error) {
      console.error("Error checking for autosaved data:", error)
    }
  }

  // Function to export autosaved data as JSON file
  const exportAutosavedData = () => {
    try {
      const autosavedData = localStorage.getItem("jobData_autosave")
      if (!autosavedData) {
        toast({
          title: "No Autosaved Data",
          description: "There is no autosaved data to export.",
          variant: "destructive",
        })
        return
      }

      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(autosavedData)

      // Format current date for the filename
      const now = new Date()
      const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`

      // Create filename using project name and date
      const projectName = jobData.projectName
        ? jobData.projectName.replace(/[^a-z0-9]/gi, "-").toLowerCase()
        : "recovered-job"

      const exportFileName = `${projectName}.${dateStr}.recovered.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileName)
      linkElement.click()

      toast({
        title: "Autosaved Data Exported",
        description: "Your autosaved data has been exported as a JSON file.",
      })
    } catch (error) {
      console.error("Error exporting autosaved data:", error)
      toast({
        title: "Error Exporting Data",
        description: "There was an error exporting your autosaved data.",
        variant: "destructive",
      })
    }
  }

  // Function to load job data from localStorage
  const loadJobData = () => {
    try {
      const savedData = localStorage.getItem("jobData")
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        setJobData(parsedData)

        // Also update expanded sections for any loaded sections
        const newExpandedSections = {}
        parsedData.sections.forEach((section) => {
          newExpandedSections[section.id] = expandedSections[section.id] || false
        })
        setExpandedSections(newExpandedSections)

        toast({
          title: "Job Data Loaded",
          description: "Your saved job data has been loaded.",
        })
      } else {
        toast({
          title: "No Saved Data",
          description: "No previously saved job data was found.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading job data:", error)
      toast({
        title: "Error Loading Data",
        description: "There was an error loading your job data.",
        variant: "destructive",
      })
    }
  }

  // Function to export job data as JSON file
  const exportJobData = () => {
    try {
      const dataStr = JSON.stringify({ jobData }, null, 2)
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

      // Format current date for the filename
      const now = new Date()
      const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`

      // Create filename using project name and date
      const projectName = jobData.projectName
        ? jobData.projectName.replace(/[^a-z0-9]/gi, "-").toLowerCase()
        : "untitled-job"

      const exportFileName = `${projectName}.${dateStr}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileName)
      linkElement.click()

      toast({
        title: "Job Data Exported",
        description: "Your job data has been exported as a JSON file.",
      })
    } catch (error) {
      console.error("Error exporting job data:", error)
      toast({
        title: "Error Exporting Data",
        description: "There was an error exporting your job data.",
        variant: "destructive",
      })
    }
  }

  // Function to import job data from JSON file
  const importJobData = (event: ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string)

          // Handle both wrapped and unwrapped data formats
          const dataToImport = importedData.jobData || importedData

          // Ensure contactInfo exists with proper structure
          if (!dataToImport.contactInfo) {
            dataToImport.contactInfo = {
              preparedBy: "",
              phone: "",
              email: "",
            }
          } else {
            // Ensure all required fields exist
            dataToImport.contactInfo = {
              preparedBy: dataToImport.contactInfo.preparedBy || "",
              phone: dataToImport.contactInfo.phone || "",
              email: dataToImport.contactInfo.email || "",
            }
          }

          setJobData(dataToImport)
          toast({
            title: "Job Data Imported",
            description: "Your job data has been imported successfully.",
          })
        } catch (error) {
          console.error("Error parsing imported data:", error)
          toast({
            title: "Invalid File Format",
            description: "The selected file is not a valid job data file.",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    } catch (error) {
      console.error("Error importing job data:", error)
      toast({
        title: "Error Importing Data",
        description: "There was an error importing your job data.",
        variant: "destructive",
      })
    }
  }

  // Function to reset form and create new estimate
  const createNewEstimate = () => {
    setJobData({
      quoteNumber: generateQuoteNumber(),
      date: new Date().toISOString().split("T")[0],
      customerName: "",
      projectName: "",
      projectLocation: "",
      contactInfo: {
        preparedBy: "",
        phone: "",
        email: "",
      },
      sections: [],
      selectedSections: [],
      markup: {
        equipment: 15,
        labor: 15,
        materials: 15,
        trucking: 15,
        overtime: 15,
      },
      notes: "",
      totalArea: 0,
      totalTonnage: 0,
    })

    toast({
      title: "New Estimate Created",
      description: "You can now start a fresh estimate.",
    })
  }

  // Set up autosave and check for autosaved data
  React.useEffect(() => {
    // Check for autosaved data when the component mounts
    checkForAutosavedData()

    // Set up autosave interval (every 2 minutes)
    const autosaveInterval = setInterval(
      () => {
        autosaveJobData()
      },
      2 * 60 * 1000,
    ) // 2 minutes in milliseconds

    // Clean up interval on component unmount
    return () => {
      clearInterval(autosaveInterval)
    }
  }, []) // Empty dependency array means this runs once on mount

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Asphalt Job Estimator</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setConfigDialogOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Config
            </Button>
          </div>
        </div>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Prepared By</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="preparedBy">Name</Label>
                <Input
                  id="preparedBy"
                  value={jobData.contactInfo?.preparedBy || ""}
                  onChange={(e) =>
                    setJobData({
                      ...jobData,
                      contactInfo: {
                        ...jobData.contactInfo,
                        preparedBy: e.target.value,
                      },
                    })
                  }
                  placeholder="Your Name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={jobData.contactInfo?.phone || ""}
                  onChange={(e) =>
                    setJobData({
                      ...jobData,
                      contactInfo: {
                        ...jobData.contactInfo,
                        phone: e.target.value,
                      },
                    })
                  }
                  placeholder="Phone Number"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={jobData.contactInfo?.email || ""}
                  onChange={(e) =>
                    setJobData({
                      ...jobData,
                      contactInfo: {
                        ...jobData.contactInfo,
                        email: e.target.value,
                      },
                    })
                  }
                  placeholder="Email Address"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="job-info" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="job-info">Job Information</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="equipment">Equipment & Materials</TabsTrigger>
          </TabsList>

          <TabsContent value="job-info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Job Information</CardTitle>
                <CardDescription>Enter the basic information about the job</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quoteNumber">Quote Number</Label>
                    <Input
                      id="quoteNumber"
                      value={jobData.quoteNumber}
                      onChange={(e) => setJobData({ ...jobData, quoteNumber: e.target.value })}
                      placeholder="Quote Number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={jobData.date}
                      onChange={(e) => setJobData({ ...jobData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={jobData.customerName}
                    onChange={(e) => setJobData({ ...jobData, customerName: e.target.value })}
                    placeholder="Customer Name"
                  />
                </div>

                <div>
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={jobData.projectName}
                    onChange={(e) => setJobData({ ...jobData, projectName: e.target.value })}
                    placeholder="Project Name"
                  />
                </div>

                <div>
                  <Label htmlFor="projectLocation">Project Location</Label>
                  <Input
                    id="projectLocation"
                    value={jobData.projectLocation}
                    onChange={(e) => setJobData({ ...jobData, projectLocation: e.target.value })}
                    placeholder="Project Location"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalArea">Total Project Area (sq ft)</Label>
                    <Input
                      id="totalArea"
                      type="number"
                      min="0"
                      value={jobData.totalArea || ""}
                      onChange={(e) => setJobData({ ...jobData, totalArea: Number(e.target.value) || 0 })}
                      placeholder="Total Area"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This is the overall project area, independent of section areas
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="totalTonnage">Total Project Tonnage</Label>
                    <Input
                      id="totalTonnage"
                      type="number"
                      min="0"
                      value={jobData.totalTonnage || ""}
                      onChange={(e) => setJobData({ ...jobData, totalTonnage: Number(e.target.value) || 0 })}
                      placeholder="Total Tonnage"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This is the overall project tonnage, independent of section tonnages
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-lg font-semibold mb-2 block">Markup Percentages</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md bg-gray-50">
                    <div>
                      <Label htmlFor="equipmentMarkup">Equipment Markup</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="equipmentMarkup"
                          type="number"
                          min="0"
                          max="100"
                          value={jobData.markup.equipment}
                          onChange={(e) =>
                            setJobData({
                              ...jobData,
                              markup: {
                                ...jobData.markup,
                                equipment: Number.parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-24"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="laborMarkup">Labor Markup</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="laborMarkup"
                          type="number"
                          min="0"
                          max="100"
                          value={jobData.markup.labor}
                          onChange={(e) =>
                            setJobData({
                              ...jobData,
                              markup: {
                                ...jobData.markup,
                                labor: Number.parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-24"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="materialsMarkup">Materials Markup</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="materialsMarkup"
                          type="number"
                          min="0"
                          max="100"
                          value={jobData.markup.materials}
                          onChange={(e) =>
                            setJobData({
                              ...jobData,
                              markup: {
                                ...jobData.markup,
                                materials: Number.parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-24"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="truckingMarkup">Trucking Markup</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="truckingMarkup"
                          type="number"
                          min="0"
                          max="100"
                          value={jobData.markup.trucking}
                          onChange={(e) =>
                            setJobData({
                              ...jobData,
                              markup: {
                                ...jobData.markup,
                                trucking: Number.parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-24"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="overtimeMarkup">Overtime Markup</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="overtimeMarkup"
                          type="number"
                          min="0"
                          max="100"
                          value={jobData.markup.overtime}
                          onChange={(e) =>
                            setJobData({
                              ...jobData,
                              markup: {
                                ...jobData.markup,
                                overtime: Number.parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-24"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    <div className="col-span-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const value = window.prompt("Enter markup percentage for all categories:", "15")
                          const markupValue = Number.parseFloat(value || "15") || 15
                          setJobData({
                            ...jobData,
                            markup: {
                              equipment: markupValue,
                              labor: markupValue,
                              materials: markupValue,
                              trucking: markupValue,
                              overtime: markupValue,
                            },
                          })
                        }}
                      >
                        Set All Markups
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={jobData.notes}
                    onChange={(e) => setJobData({ ...jobData, notes: e.target.value })}
                    placeholder="Additional notes about the job"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Summary</CardTitle>
                <CardDescription>View the summary of your estimate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Quote Amount:</p>
                    <p className="text-2xl font-bold">${calculateFinalQuoteAmount().toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Internal note: Includes {jobData.markup.equipment}% markup on base cost of $
                      {calculateJobTotal().toFixed(2)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setShowQuotePreview(true)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Project Summary
                    </Button>
                    <Button variant="outline" onClick={() => setShowMarkupComparison(true)}>
                      <Calculator className="mr-2 h-4 w-4" />
                      Markup Calculator
                    </Button>
                    <Button variant="outline" onClick={saveJobData}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={loadJobData}>
                      <Upload className="mr-2 h-4 w-4" />
                      Load
                    </Button>
                    <Button variant="outline" onClick={exportJobData}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <label htmlFor="import-json">
                      <Button variant="outline" onClick={() => document.getElementById("import-json")?.click()} asChild>
                        <div>
                          <FileUp className="mr-2 h-4 w-4" />
                          Import
                        </div>
                      </Button>
                    </label>
                    <input id="import-json" type="file" accept=".json" onChange={importJobData} className="hidden" />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <FileDown className="mr-2 h-4 w-4" />
                          New Estimate
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Create New Estimate?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will clear all current data. Make sure you've saved your work if needed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={createNewEstimate}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="outline" onClick={exportAutosavedData}>
                      <FileUp className="mr-2 h-4 w-4" />
                      Recover Autosave
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Job Sections</h2>
              <Button onClick={() => setIsAddSectionDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </div>

            {/* Section Template Selection Dialog */}
            <Dialog open={isAddSectionDialogOpen} onOpenChange={setIsAddSectionDialogOpen}>
              <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                  <DialogTitle>Select Section Type</DialogTitle>
                  <DialogDescription>
                    Choose a section type to add to your project. Each type comes with pre-configured equipment, labor,
                    materials, and trucking.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
                  {pavingTypes.map((type) => (
                    <Card
                      key={type}
                      className="cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => addSectionFromTemplate(type)}
                    >
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">{type}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm text-muted-foreground">
                          Pre-configured {type.toLowerCase()} section with default values.
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            {jobData.sections.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <p className="text-center text-muted-foreground mb-4">
                    No sections added yet. Click the "Add Section" button to get started.
                  </p>
                  <Button onClick={() => setIsAddSectionDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Section
                  </Button>
                </CardContent>
              </Card>
            ) : (
              jobData.sections.map((section) => (
                <Card key={section.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 py-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`select-${section.id}`}
                          checked={jobData.selectedSections.includes(section.id)}
                          onChange={() => toggleSectionSelection(section.id)}
                          className="h-4 w-4"
                        />
                        {editingSectionId === section.id ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              value={editingSectionName}
                              onChange={(e) => setEditingSectionName(e.target.value)}
                              className="w-64"
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" onClick={saveRenamedSection}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelRenamingSection}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <CardTitle className="text-lg">{section.name}</CardTitle>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startRenamingSection(section.id)}
                              className="ml-2"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleSectionExpansion(section.id)}
                          className="h-8 w-8 p-0"
                        >
                          {expandedSections[section.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => duplicateSection(section.id)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Section?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this section and all its data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction asChild>
                                <Button onClick={() => deleteSection(section.id)} variant="destructive">
                                  Delete
                                </Button>
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>

                  {expandedSections[section.id] && (
                    <CardContent className="p-6 space-y-6">
                      {/* Section Dimensions */}
                      <div className="border rounded-md p-4 bg-blue-50">
                        <h3 className="text-lg font-medium mb-4 text-blue-800">📐 Section Area & Tonnage</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor={`length-${section.id}`}>Length (ft)</Label>
                            <Input
                              id={`length-${section.id}`}
                              type="number"
                              min="0"
                              step="0.1"
                              value={section.length || ""}
                              onChange={(e) => {
                                const value = Number.parseFloat(e.target.value) || 0
                                updateSectionDimensions(section.id, "length", value)
                              }}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`width-${section.id}`}>Width (ft)</Label>
                            <Input
                              id={`width-${section.id}`}
                              type="number"
                              min="0"
                              step="0.1"
                              value={section.width || ""}
                              onChange={(e) => {
                                const value = Number.parseFloat(e.target.value) || 0
                                updateSectionDimensions(section.id, "width", value)
                              }}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`area-${section.id}`}>Section Area (sq ft)</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id={`area-${section.id}`}
                                type="number"
                                min="0"
                                value={section.area || ""}
                                onChange={(e) => {
                                  const value = Number.parseFloat(e.target.value) || 0
                                  // Update area directly
                                  const updatedSection = { ...section, area: value }
                                  setJobData({
                                    ...jobData,
                                    sections: jobData.sections.map((s) => (s.id === section.id ? updatedSection : s)),
                                  })
                                }}
                                className="flex-1"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  if (section.length && section.width) {
                                    const area = section.length * section.width
                                    const updatedSection = { ...section, area }
                                    setJobData({
                                      ...jobData,
                                      sections: jobData.sections.map((s) => (s.id === section.id ? updatedSection : s)),
                                    })
                                  }
                                }}
                                title="Calculate from length and width"
                              >
                                <Calculator className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor={`tons-${section.id}`}>Section Tonnage</Label>
                            <Input
                              id={`tons-${section.id}`}
                              type="number"
                              min="0"
                              step="0.1"
                              value={section.tons || ""}
                              onChange={(e) => {
                                const value = Number.parseFloat(e.target.value) || 0
                                const updatedSection = { ...section, tons: value }
                                setJobData({
                                  ...jobData,
                                  sections: jobData.sections.map((s) => (s.id === section.id ? updatedSection : s)),
                                })
                              }}
                              placeholder="Enter tonnage"
                            />
                          </div>
                        </div>

                        {/* Area and Tonnage Display */}
                        {(section.area > 0 || section.tons > 0) && (
                          <div className="mt-4 grid grid-cols-2 gap-4 bg-blue-100 p-3 rounded-md">
                            <div>
                              <p className="text-sm font-medium text-blue-800">Section Area:</p>
                              <p className="text-lg font-bold text-blue-900">
                                {section.area?.toFixed(2) || "0.00"} sq ft
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-blue-800">Section Tonnage:</p>
                              <p className="text-lg font-bold text-blue-900">
                                {section.tons?.toFixed(2) || "0.00"} tons
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Materials Section */}
                      <div className="border rounded-md p-4">
                        <SectionMaterials
                          sectionId={section.id}
                          sectionArea={section.area || 0}
                          materials={section.materials || []}
                          updateMaterialItem={updateMaterialItem}
                          addMaterialItem={addMaterialItem}
                          addCustomMaterialItem={addCustomMaterialItem}
                          removeMaterialItem={removeMaterialItem}
                          recalculateTonnage={recalculateTonnage}
                        />
                      </div>

                      {/* Additional Items Section */}
                      <div className="border rounded-md p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">Additional Items</h3>
                          <Button size="sm" onClick={() => addAdditionalItem(section.id)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                          </Button>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Description</TableHead>
                              <TableHead>Unit</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Rate</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(section.additionalItems || []).map((item, index) => (
                              <TableRow key={`additional-${section.id}-${index}`}>
                                <TableCell>
                                  <Input
                                    value={item.description || ""}
                                    onChange={(e) =>
                                      updateAdditionalItem(section.id, index, "description", e.target.value)
                                    }
                                    placeholder="Enter description"
                                    className="w-[200px]"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={item.unit}
                                    onValueChange={(value) => updateAdditionalItem(section.id, index, "unit", value)}
                                  >
                                    <SelectTrigger className="w-[120px]">
                                      <SelectValue placeholder="Unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {additionalItemUnits.map((unit) => (
                                        <SelectItem key={unit} value={unit}>
                                          {unit}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={
                                      typeof item.quantity === "string" && item.quantity === ""
                                        ? ""
                                        : item.quantity || 0
                                    }
                                    onChange={(e) => {
                                      const raw = e.target.value
                                      updateAdditionalItem(section.id, index, "quantity", raw === "" ? "" : Number(raw))
                                    }}
                                    onBlur={(e) => {
                                      if (e.target.value === "") {
                                        updateAdditionalItem(section.id, index, "quantity", 0)
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
                                    value={typeof item.rate === "string" && item.rate === "" ? "" : item.rate || 0}
                                    onChange={(e) => {
                                      const raw = e.target.value
                                      updateAdditionalItem(section.id, index, "rate", raw === "" ? "" : Number(raw))
                                    }}
                                    onBlur={(e) => {
                                      if (e.target.value === "") {
                                        updateAdditionalItem(section.id, index, "rate", 0)
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
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => removeAdditionalItem(section.id, index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {(!section.additionalItems || section.additionalItems.length === 0) && (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                                  No additional items added yet. Click "Add Item" to add one.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Equipment Section */}
                      <div className="border rounded-md p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">Equipment</h3>
                          <Button size="sm" onClick={() => addEquipmentItem(section.id)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Equipment
                          </Button>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Equipment</TableHead>
                              <TableHead>Days</TableHead>
                              <TableHead>Hours</TableHead>
                              <TableHead>Rate</TableHead>
                              <TableHead>Includes Operator</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {section.equipment.map((item, index) => (
                              <TableRow key={`equipment-${section.id}-${index}`}>
                                <TableCell>
                                  <Select
                                    value={item.name}
                                    onValueChange={(value) => {
                                      const selectedEquipment = equipmentList.find((e) => e.name === value)
                                      if (selectedEquipment) {
                                        // Create a temporary updated item to ensure all changes are applied at once
                                        const updatedItem = {
                                          ...item,
                                          name: value,
                                          rate: selectedEquipment.hourlyRate,
                                          total: item.quantity * item.hours * selectedEquipment.hourlyRate,
                                        }

                                        // Update the entire equipment item at once
                                        const updatedEquipment = [...section.equipment]
                                        updatedEquipment[index] = updatedItem

                                        setJobData({
                                          ...jobData,
                                          sections: jobData.sections.map((s) =>
                                            s.id === section.id ? { ...s, equipment: updatedEquipment } : s,
                                          ),
                                        })
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-[200px]">
                                      <SelectValue placeholder="Select Equipment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {equipmentList.map((equipment) => (
                                        <SelectItem key={equipment.name} value={equipment.name}>
                                          {equipment.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      updateEquipmentItem(section.id, index, "quantity", Number(e.target.value))
                                    }
                                    className="w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={item.hours}
                                    onChange={(e) =>
                                      updateEquipmentItem(section.id, index, "hours", Number(e.target.value))
                                    }
                                    className="w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={item.rate}
                                    onChange={(e) =>
                                      updateEquipmentItem(section.id, index, "rate", Number(e.target.value))
                                    }
                                    className="w-24"
                                  />
                                </TableCell>
                                <TableCell>
                                  <input
                                    type="checkbox"
                                    checked={item.includesOperator}
                                    onChange={(e) =>
                                      updateEquipmentItem(section.id, index, "includesOperator", e.target.checked)
                                    }
                                    className="h-4 w-4"
                                  />
                                </TableCell>
                                <TableCell>${item.total?.toFixed(2) || "0.00"}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => removeEquipmentItem(section.id, index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {section.equipment.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                                  No equipment added yet. Click "Add Equipment" to add one.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Labor Section */}
                      <div className="border rounded-md p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">Labor</h3>
                          <Button size="sm" onClick={() => addLaborItem(section.id)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Labor
                          </Button>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Role</TableHead>
                              <TableHead>Days</TableHead>
                              <TableHead>Reg. Hours</TableHead>
                              <TableHead>Rate</TableHead>
                              <TableHead>OT Hours</TableHead>
                              <TableHead>OT Rate</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {section.labor.map((item, index) => (
                              <TableRow key={`labor-${section.id}-${index}`}>
                                <TableCell>
                                  <Select
                                    value={item.crewMemberId || ""}
                                    onValueChange={(value) => updateLaborItem(section.id, index, "crewMemberId", value)}
                                  >
                                    <SelectTrigger className="w-[180px]">
                                      <SelectValue placeholder="Select Crew Member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="custom">Custom Entry</SelectItem>
                                      {crewMembers.map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                          {member.name} ({member.title})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      updateLaborItem(section.id, index, "quantity", Number(e.target.value))
                                    }
                                    className="w-16"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={item.hours}
                                    onChange={(e) => {
                                      const hours = Number(e.target.value)
                                      updateLaborItem(section.id, index, "hours", hours)
                                    }}
                                    className="w-16"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={item.rate}
                                    onChange={(e) => updateLaborItem(section.id, index, "rate", Number(e.target.value))}
                                    className="w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  {item.hours > 8 ? (
                                    <span className="text-orange-500 font-medium">{item.hours - 8}</span>
                                  ) : (
                                    <span>0</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={item.overtimeRate || item.rate * 1.5}
                                    onChange={(e) =>
                                      updateLaborItem(section.id, index, "overtimeRate", Number(e.target.value))
                                    }
                                    className="w-20"
                                  />
                                </TableCell>
                                <TableCell>${item.total?.toFixed(2) || "0.00"}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => removeLaborItem(section.id, index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {section.labor.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                                  No labor added yet. Click "Add Labor" to add one.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Trucking Section */}
                      <div className="border rounded-md p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">Trucking</h3>
                          <Button size="sm" onClick={() => addTruckingItem(section.id)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Trucking
                          </Button>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Function</TableHead>
                              <TableHead>Pricing</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Rate</TableHead>
                              <TableHead>Hours/Tons</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {section.trucking.map((item, index) => (
                              <TableRow key={`trucking-${section.id}-${index}`}>
                                <TableCell>
                                  <Select
                                    value={item.name}
                                    onValueChange={(value) => updateTruckingItem(section.id, index, "name", value)}
                                  >
                                    <SelectTrigger className="w-[150px]">
                                      <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Dump Truck">Dump Truck</SelectItem>
                                      <SelectItem value="Flowboy">Flowboy</SelectItem>
                                      <SelectItem value="Concrete Truck">Concrete Truck</SelectItem>
                                      <SelectItem value="Water Truck">Water Truck</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={item.function || truckingFunctions[0]}
                                    onValueChange={(value) => updateTruckingItem(section.id, index, "function", value)}
                                  >
                                    <SelectTrigger className="w-[150px]">
                                      <SelectValue placeholder="Select Function" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {truckingFunctions.map((func) => (
                                        <SelectItem key={func} value={func}>
                                          {func}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={item.pricingType || "per-hour"}
                                    onValueChange={(value) =>
                                      updateTruckingItem(section.id, index, "pricingType", value)
                                    }
                                  >
                                    <SelectTrigger className="w-[120px]">
                                      <SelectValue placeholder="Pricing Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="per-hour">Per Hour</SelectItem>
                                      <SelectItem value="per-ton">Per Ton</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      updateTruckingItem(section.id, index, "quantity", Number(e.target.value))
                                    }
                                    className="w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={item.rate}
                                    onChange={(e) =>
                                      updateTruckingItem(section.id, index, "rate", Number(e.target.value))
                                    }
                                    className="w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  {item.pricingType === "per-hour" ? (
                                    <Input
                                      type="number"
                                      value={item.hours}
                                      onChange={(e) =>
                                        updateTruckingItem(section.id, index, "hours", Number(e.target.value))
                                      }
                                      className="w-20"
                                    />
                                  ) : (
                                    <Input
                                      type="number"
                                      value={item.tons}
                                      onChange={(e) =>
                                        updateTruckingItem(section.id, index, "tons", Number(e.target.value))
                                      }
                                      className="w-20"
                                    />
                                  )}
                                </TableCell>
                                <TableCell>${item.total?.toFixed(2) || "0.00"}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => removeTruckingItem(section.id, index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {section.trucking.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                                  No trucking added yet. Click "Add Trucking" to add one.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      <div>
                        <Label htmlFor={`notes-${section.id}`}>Section Notes</Label>
                        <Textarea
                          id={`notes-${section.id}`}
                          value={section.notes || ""}
                          onChange={(e) => {
                            const updatedSection = { ...section, notes: e.target.value }
                            setJobData({
                              ...jobData,
                              sections: jobData.sections.map((s) => (s.id === section.id ? updatedSection : s)),
                            })
                          }}
                          placeholder="Additional notes about this section"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  )}

                  <CardFooter className="bg-muted/30 flex justify-between">
                    <div>
                      <p className="text-sm font-medium">Section Cost:</p>
                      <p className="text-lg font-bold">${calculateSectionTotal(section).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-700">
                        📐 Area: {section.area?.toFixed(2) || "0.00"} sq ft
                      </p>
                      <p className="text-sm font-medium text-blue-700">
                        ⚖️ Tonnage: {section.tons?.toFixed(2) || "0.00"} tons
                      </p>
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4">
            {/* Equipment List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Equipment List</CardTitle>
                  <CardDescription>View and edit equipment with hourly rates</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingEquipment(!editingEquipment)}>
                    {editingEquipment ? "Done" : <Edit className="mr-2 h-4 w-4" />}
                    {editingEquipment ? "Done" : "Edit"}
                  </Button>
                  {editingEquipment && (
                    <>
                      <Button variant="outline" size="sm" onClick={addNewEquipmentItem}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                      <Button variant="outline" size="sm" onClick={saveConfigData}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Hourly Rate</TableHead>
                      <TableHead>8-Hour Day</TableHead>
                      {editingEquipment && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipmentList.map((item, index) => (
                      <TableRow key={item.name}>
                        <TableCell>
                          {editingEquipmentItem === index ? (
                            <Input
                              value={tempEquipmentItem?.name || ""}
                              onChange={(e) => setTempEquipmentItem({ ...tempEquipmentItem, name: e.target.value })}
                            />
                          ) : (
                            item.name
                          )}
                        </TableCell>
                        <TableCell>
                          {editingEquipmentItem === index ? (
                            <Input
                              type="number"
                              value={tempEquipmentItem?.hourlyRate || 0}
                              onChange={(e) =>
                                setTempEquipmentItem({ ...tempEquipmentItem, hourlyRate: Number(e.target.value) })
                              }
                            />
                          ) : (
                            `$${item.hourlyRate.toFixed(2)}`
                          )}
                        </TableCell>
                        <TableCell>${(item.hourlyRate * 8).toFixed(2)}</TableCell>
                        {editingEquipment && (
                          <TableCell>
                            {editingEquipmentItem === index ? (
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" onClick={saveEquipmentItem}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEditingEquipmentItem}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" onClick={() => startEditingEquipmentItem(index)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => deleteEquipmentItem(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Material Types */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Material Types</CardTitle>
                  <CardDescription>View and edit available material types</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingMaterials(!editingMaterials)}>
                    {editingMaterials ? "Done" : <Edit className="mr-2 h-4 w-4" />}
                    {editingMaterials ? "Done" : "Edit"}
                  </Button>
                  {editingMaterials && (
                    <>
                      <Button variant="outline" size="sm" onClick={addNewMaterialItem}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                      <Button variant="outline" size="sm" onClick={saveConfigData}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      {editingMaterials && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materialTypes.map((item, index) => (
                      <TableRow key={item.code}>
                        <TableCell>
                          {editingMaterialItem === index ? (
                            <Input
                              value={tempMaterialItem?.code || ""}
                              onChange={(e) => setTempMaterialItem({ ...tempMaterialItem, code: e.target.value })}
                            />
                          ) : (
                            item.code
                          )}
                        </TableCell>
                        <TableCell>
                          {editingMaterialItem === index ? (
                            <Input
                              value={tempMaterialItem?.name || ""}
                              onChange={(e) => setTempMaterialItem({ ...tempMaterialItem, name: e.target.value })}
                            />
                          ) : (
                            item.name
                          )}
                        </TableCell>
                        {editingMaterials && (
                          <TableCell>
                            {editingMaterialItem === index ? (
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" onClick={saveMaterialItem}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEditingMaterialItem}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" onClick={() => startEditingMaterialItem(index)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => deleteMaterialItem(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Crew Members */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Crew Members</CardTitle>
                  <CardDescription>View and edit crew members and their rates</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingCrew(!editingCrew)}>
                    {editingCrew ? "Done" : <Edit className="mr-2 h-4 w-4" />}
                    {editingCrew ? "Done" : "Edit"}
                  </Button>
                  {editingCrew && (
                    <>
                      <Button variant="outline" size="sm" onClick={addNewCrewItem}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                      <Button variant="outline" size="sm" onClick={saveConfigData}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Regular Rate</TableHead>
                      <TableHead>Overtime Rate</TableHead>
                      <TableHead>10-Hour Day</TableHead>
                      {editingCrew && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {crewMembers.map((member, index) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          {editingCrewItem === index ? (
                            <Input
                              value={tempCrewItem?.name || ""}
                              onChange={(e) => setTempCrewItem({ ...tempCrewItem, name: e.target.value })}
                            />
                          ) : (
                            member.name
                          )}
                        </TableCell>
                        <TableCell>
                          {editingCrewItem === index ? (
                            <Input
                              value={tempCrewItem?.title || ""}
                              onChange={(e) => setTempCrewItem({ ...tempCrewItem, title: e.target.value })}
                            />
                          ) : (
                            member.title
                          )}
                        </TableCell>
                        <TableCell>
                          {editingCrewItem === index ? (
                            <Input
                              type="number"
                              value={tempCrewItem?.rate || 0}
                              onChange={(e) => setTempCrewItem({ ...tempCrewItem, rate: Number(e.target.value) })}
                            />
                          ) : (
                            `$${member.rate.toFixed(2)}`
                          )}
                        </TableCell>
                        <TableCell>
                          {editingCrewItem === index ? (
                            <Input
                              type="number"
                              value={tempCrewItem?.overtimeRate || 0}
                              onChange={(e) =>
                                setTempCrewItem({ ...tempCrewItem, overtimeRate: Number(e.target.value) })
                              }
                            />
                          ) : (
                            `$${member.overtimeRate.toFixed(2)}`
                          )}
                        </TableCell>
                        <TableCell>${(member.rate * 8 + member.overtimeRate * 2).toFixed(2)}</TableCell>
                        {editingCrew && (
                          <TableCell>
                            {editingCrewItem === index ? (
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" onClick={saveCrewItem}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEditingCrewItem}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" onClick={() => startEditingCrewItem(index)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => deleteCrewItem(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                {editingCrew && (
                  <Button variant="outline" onClick={resetConfigData}>
                    Reset to Defaults
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Configuration</DialogTitle>
            <DialogDescription>Configure application settings and defaults</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="export">Export/Import</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-md font-medium">Markup Percentages (Internal Only)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="equipment-markup">Equipment Markup</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="equipment-markup"
                        type="number"
                        min="0"
                        max="100"
                        value={jobData.markup.equipment}
                        onChange={(e) =>
                          setJobData({
                            ...jobData,
                            markup: {
                              ...jobData.markup,
                              equipment: Number.parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-24"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="labor-markup">Labor Markup</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="labor-markup"
                        type="number"
                        min="0"
                        max="100"
                        value={jobData.markup.labor}
                        onChange={(e) =>
                          setJobData({
                            ...jobData,
                            markup: {
                              ...jobData.markup,
                              labor: Number.parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-24"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="materials-markup">Materials Markup</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="materials-markup"
                        type="number"
                        min="0"
                        max="100"
                        value={jobData.markup.materials}
                        onChange={(e) =>
                          setJobData({
                            ...jobData,
                            markup: {
                              ...jobData.markup,
                              materials: Number.parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-24"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="trucking-markup">Trucking Markup</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="trucking-markup"
                        type="number"
                        min="0"
                        max="100"
                        value={jobData.markup.trucking}
                        onChange={(e) =>
                          setJobData({
                            ...jobData,
                            markup: {
                              ...jobData.markup,
                              trucking: Number.parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-24"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="overtime-markup">Overtime Markup</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="overtime-markup"
                        type="number"
                        min="0"
                        max="100"
                        value={jobData.markup.overtime}
                        onChange={(e) =>
                          setJobData({
                            ...jobData,
                            markup: {
                              ...jobData.markup,
                              overtime: Number.parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-24"
                      />
                      <span>%</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  These markups will be applied to their respective cost categories but won't be shown separately on the
                  customer quote.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <QuotePreview open={showQuotePreview} onOpenChange={setShowQuotePreview} jobData={jobData} />
      <MarkupComparison
        open={showMarkupComparison}
        onOpenChange={setShowMarkupComparison}
        baseCost={calculateJobTotal()}
      />
    </div>
  )
}
