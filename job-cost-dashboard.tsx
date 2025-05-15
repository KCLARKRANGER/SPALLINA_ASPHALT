"use client"

import React, { useState } from "react"
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
import { pavingTypes, equipmentList, materialTypes, sectionTemplates } from "@/config/paving-templates"
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
} from "lucide-react"
import { QuotePreview } from "@/components/quote-preview"
import { SectionMaterials } from "@/components/section-materials"

// Import the crew data at the top of the file, after the other imports
import { crewMembers, getCrewMemberById } from "@/config/crew-data"

// Trucking function options
const truckingFunctions = [
  "Hauling Millings",
  "Hauling Asphalt",
  "Hauling Aggregate",
  "Hauling Tonnage",
  "General Hauling",
  "Material Delivery",
]

export default function JobCostDashboard() {
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

    // Calculate area if we have both length and width
    if (field === "length" || field === "width") {
      if (updatedSection.length && updatedSection.width) {
        updatedSection.area = updatedSection.length * updatedSection.width

        // Recalculate tonnage for all materials based on the new area
        if (updatedSection.materials && updatedSection.materials.length > 0) {
          let totalTons = 0
          updatedSection.materials = updatedSection.materials.map((material) => {
            if (material.unit === "tons" && material.thickness) {
              const tons = calculateTonsFromArea(updatedSection.area, material.thickness)
              totalTons += tons
              return { ...material, quantity: tons, total: tons * material.rate }
            }
            return material
          })
          updatedSection.tons = totalTons
        }
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
    if (!section || !section.area) {
      toast({
        title: "Cannot Calculate Tonnage",
        description: "Please enter section dimensions first to calculate area.",
        variant: "destructive",
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
      title: "Tonnage Recalculated",
      description: `Total tonnage for this section: ${totalTons.toFixed(2)} tons`,
    })
  }

  // Function to update material item in a section
  const updateMaterialItem = (sectionId: string, index: number, field: string, value: any) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section || !section.materials) return

    const updatedMaterials = [...section.materials]
    updatedMaterials[index] = { ...updatedMaterials[index], [field]: value }

    // Calculate total for this material
    if (field === "quantity" || field === "rate") {
      updatedMaterials[index].total = updatedMaterials[index].quantity * updatedMaterials[index].rate
    }

    // Calculate total tonnage for the section
    let totalTons = 0
    updatedMaterials.forEach((material) => {
      if (material.unit === "tons") {
        totalTons += Number(material.quantity) || 0
      }
    })

    // Update the section
    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              materials: updatedMaterials,
              tons: totalTons,
            }
          : s,
      ),
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
      thickness: 0,
      rate: 85,
      total: 0,
    }

    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) =>
        s.id === sectionId ? { ...s, materials: [...s.materials, newMaterial] } : s,
      ),
    })
  }

  // Function to remove a material item from a section
  const removeMaterialItem = (sectionId: string, index: number) => {
    const section = jobData.sections.find((s) => s.id === sectionId)
    if (!section || !section.materials) return

    const updatedMaterials = section.materials.filter((_, i) => i !== index)

    // Recalculate total tonnage
    let totalTons = 0
    updatedMaterials.forEach((material) => {
      if (material.unit === "tons") {
        totalTons += Number(material.quantity) || 0
      }
    })

    setJobData({
      ...jobData,
      sections: jobData.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              materials: updatedMaterials,
              tons: totalTons,
            }
          : s,
      ),
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
      hours: 8,
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
      const crewMember = getCrewMemberById(value)
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
      hours: 8,
      rate: 20,
      overtimeHours: 0,
      overtimeRate: 30, // 1.5x regular rate
      total: 160,
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

    return equipmentTotal + laborTotal + materialsTotal + truckingTotal
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

    // Apply markup to each category
    const equipmentWithMarkup = equipmentTotal * (1 + (jobData.markup?.equipment || 15) / 100)
    const laborWithMarkup = laborTotal * (1 + (jobData.markup?.labor || 15) / 100)
    const materialsWithMarkup = materialsTotal * (1 + (jobData.markup?.materials || 15) / 100)
    const truckingWithMarkup = truckingTotal * (1 + (jobData.markup?.trucking || 15) / 100)

    return equipmentWithMarkup + laborWithMarkup + materialsWithMarkup + truckingWithMarkup
  }

  // Function to save job data to localStorage
  const saveJobData = () => {
    try {
      const dataToSave = JSON.stringify(jobData)
      localStorage.setItem("jobData", dataToSave)
      toast({
        title: "Job Data Saved",
        description: "Your job data has been saved locally.",
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
      const dataStr = JSON.stringify(jobData, null, 2)
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

      const exportFileDefaultName = `job-estimate-${jobData.quoteNumber}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
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
          setJobData(importedData)
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

  // Calculate total area and tonnage for the job
  const calculateTotals = () => {
    let totalArea = 0
    let totalTonnage = 0

    jobData.sections.forEach((section) => {
      if (jobData.selectedSections.includes(section.id)) {
        totalArea += section.area || 0
        totalTonnage += section.tons || 0
      }
    })

    if (totalArea !== jobData.totalArea || totalTonnage !== jobData.totalTonnage) {
      setJobData({
        ...jobData,
        totalArea,
        totalTonnage,
      })
    }
  }

  // Calculate totals whenever sections or selected sections change
  React.useEffect(() => {
    calculateTotals()
  }, [jobData.sections, jobData.selectedSections])

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
                  value={jobData.contactInfo.preparedBy}
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
                  value={jobData.contactInfo.phone}
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
                  value={jobData.contactInfo.email}
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
                    <Label htmlFor="totalArea">Total Area (sq ft)</Label>
                    <Input
                      id="totalArea"
                      type="number"
                      min="0"
                      value={jobData.totalArea || ""}
                      onChange={(e) => setJobData({ ...jobData, totalArea: Number(e.target.value) || 0 })}
                      placeholder="Total Area"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalTonnage">Total Tonnage</Label>
                    <Input
                      id="totalTonnage"
                      type="number"
                      min="0"
                      value={jobData.totalTonnage || ""}
                      onChange={(e) => setJobData({ ...jobData, totalTonnage: Number(e.target.value) || 0 })}
                      placeholder="Total Tonnage"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="markupPercentage">Markup Percentage</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="markupPercentage"
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
                      <div className="border rounded-md p-4">
                        <h3 className="text-lg font-medium mb-4">Section Dimensions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <Label htmlFor={`area-${section.id}`}>Area (sq ft)</Label>
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
                        </div>

                        {/* Area and Tonnage Display */}
                        {section.area > 0 && (
                          <div className="mt-4 grid grid-cols-2 gap-4 bg-blue-50 p-3 rounded-md">
                            <div>
                              <p className="text-sm font-medium">Total Area:</p>
                              <p className="text-lg">{section.area.toFixed(2)} sq ft</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Total Tonnage:</p>
                              <p className="text-lg">{section.tons?.toFixed(2) || "0.00"} tons</p>
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
                          removeMaterialItem={removeMaterialItem}
                          recalculateTonnage={recalculateTonnage}
                        />
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
                              <TableHead>Quantity</TableHead>
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
                              <TableHead>Quantity</TableHead>
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
                      <p className="text-sm font-medium">Area: {section.area?.toFixed(2) || "0.00"} sq ft</p>
                      <p className="text-sm font-medium">Tonnage: {section.tons?.toFixed(2) || "0.00"} tons</p>
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Equipment List</CardTitle>
                <CardDescription>View the equipment list with hourly rates</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Hourly Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipmentList.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>${item.hourlyRate.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Material Types</CardTitle>
                <CardDescription>View the available material types</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materialTypes.map((item) => (
                      <TableRow key={item.code}>
                        <TableCell>{item.code}</TableCell>
                        <TableCell>{item.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Crew Members</CardTitle>
                <CardDescription>View the crew members and their rates</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Regular Rate</TableHead>
                      <TableHead>Overtime Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {crewMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.name}</TableCell>
                        <TableCell>{member.title}</TableCell>
                        <TableCell>${member.rate.toFixed(2)}</TableCell>
                        <TableCell>${member.overtimeRate.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
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
    </div>
  )
}
