"use client"

import { CardTitle } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { pavingTypes, sectionTemplates } from "./config/paving-templates"
import { calculateTonsFromArea } from "./utils/asphalt-calculations"
import { getNextQuoteNumber } from "./utils/quote-number"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CSVExport } from "@/components/csv-export"
import { CSVIntegration } from "@/components/csv-integration"
import { ContactForm, type ContactInfo } from "@/components/contact-form"
import { QuotePreview } from "@/components/quote-preview"
import { useToast } from "@/components/ui/use-toast"
import { Save, Printer, Mail, Settings, FileText, Plus, ChevronDown, ChevronUp, Trash2, Upload } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

const defaultJobData = {
  projectName: "New Project",
  customerName: "",
  location: "",
  date: new Date().toISOString().split("T")[0],
  sections: [],
  selectedSections: [],
  notes: "",
  terms: "",
  mobilization: {
    enabled: false,
    sectionSpecific: false,
    numTrucks: 1,
    tripType: "one-way",
    sectionMobilization: {},
  },
}

function JobCostDashboard() {
  const [jobData, setJobData] = useState(defaultJobData)
  const [sectionName, setSectionName] = useState("")
  const [area, setArea] = useState<number | undefined>(undefined)
  const [depth, setDepth] = useState<number | undefined>(undefined)
  const [activeTab, setActiveTab] = useState("sections")
  const [isContactFormOpen, setIsContactFormOpen] = useState(false)
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    name: "John Smith",
    phone: "(585) 658-2248",
    email: "info@spallinamaterials.com",
    company: "Spallina Materials",
    position: "Estimator",
  })
  const [isQuotePreviewOpen, setIsQuotePreviewOpen] = useState(false)
  const [quoteNumber, setQuoteNumber] = useState(getNextQuoteNumber())
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    setQuoteNumber(getNextQuoteNumber())

    // Add some default sections for demo purposes
    if (jobData.sections.length === 0) {
      const defaultSections = [
        createSectionFromTemplate("Prep"),
        createSectionFromTemplate("Bulk Milling"),
        createSectionFromTemplate("Mainline Paving"),
      ]

      setJobData({
        ...jobData,
        sections: defaultSections,
        selectedSections: [defaultSections[0].id],
      })

      // Auto-expand the first section
      setExpandedSections({
        [defaultSections[0].id]: true,
      })
    }
  }, [])

  const createSectionFromTemplate = (templateName) => {
    const template = sectionTemplates[templateName]
    if (!template) return null

    // Add realistic rates to equipment
    const equipmentWithRates = template.equipment.map((item) => {
      let rate = 0
      // Assign rates based on equipment type
      if (item.name.includes("Dozer")) rate = 1200
      else if (item.name.includes("Excavator")) rate = 1500
      else if (item.name.includes("Skidsteer")) rate = 800
      else if (item.name.includes("Mill")) rate = 2000
      else if (item.name.includes("Paver")) rate = 1800
      else if (item.name.includes("Roller")) rate = 900
      else if (item.name.includes("Water Truck")) rate = 750
      else if (item.name.includes("Broom")) rate = 500
      else rate = 1000 // Default rate

      return { ...item, rate, total: (item.quantity * item.hours * rate) / 8 } // Daily rate
    })

    // Add realistic rates to labor
    const laborWithRates = template.labor.map((item) => {
      let rate = 0
      // Assign rates based on role
      if (item.name.includes("Foreman")) rate = 65
      else if (item.name.includes("Operator")) rate = 55
      else if (item.name.includes("Screedman")) rate = 50
      else if (item.name.includes("Raker")) rate = 45
      else if (item.name.includes("Laborer")) rate = 40
      else if (item.name.includes("Flagger")) rate = 35
      else rate = 45 // Default rate

      return { ...item, rate, total: item.quantity * item.hours * rate }
    })

    // Add realistic rates to trucking
    const truckingWithRates = template.trucking.map((item) => {
      let rate = 0
      // Assign rates based on truck type
      if (item.name.includes("Dump Truck")) rate = 95
      else if (item.name.includes("Flowboy")) rate = 125
      else rate = 100 // Default rate

      return { ...item, rate, total: (item.quantity * item.hours * rate) / 8 } // Daily rate
    })

    return {
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: templateName,
      length: 0,
      width: 0,
      depth: 0,
      area: 1000, // Default area
      tons: templateName.includes("Paving") ? 120 : 0, // Default tons for paving sections
      equipment: equipmentWithRates,
      labor: laborWithRates,
      materials: template.materials.map((item) => ({ ...item, total: calculateMaterialTotal(item) })),
      trucking: truckingWithRates,
    }
  }

  const calculateItemTotal = (item) => {
    const quantity = Number(item.quantity) || 0
    const hours = Number(item.hours) || 0
    const rate = Number(item.rate) || 0

    // For equipment and trucking, we typically use daily rates (8 hours)
    if (
      item.name &&
      (item.name.includes("Dozer") ||
        item.name.includes("Excavator") ||
        item.name.includes("Skidsteer") ||
        item.name.includes("Mill") ||
        item.name.includes("Paver") ||
        item.name.includes("Roller") ||
        item.name.includes("Truck") ||
        item.name.includes("Broom"))
    ) {
      return quantity * (hours / 8) * rate // Convert hours to days for daily rate
    }

    return quantity * hours * rate
  }

  const calculateMaterialTotal = (item) => {
    const quantity = Number(item.quantity) || 0
    const rate = Number(item.rate) || 0
    return quantity * rate
  }

  const handleSectionNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSectionName(e.target.value)
  }

  const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setArea(Number(e.target.value))
  }

  const handleDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDepth(Number(e.target.value))
  }

  const toggleSectionExpand = (sectionId: string) => {
    setExpandedSections({
      ...expandedSections,
      [sectionId]: !expandedSections[sectionId],
    })
  }

  const addSection = () => {
    if (!sectionName || !area || !depth) {
      alert("Please enter section name, area, and depth")
      return
    }

    const tons = calculateTonsFromArea(area, depth)

    const newSection = {
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: sectionName,
      length: 0, // We don't have this from user input
      width: 0, // We don't have this from user input
      depth: depth,
      area: area,
      tons: tons,
      equipment: [],
      labor: [],
      materials: [],
      trucking: [],
    }

    setJobData({
      ...jobData,
      sections: [...jobData.sections, newSection],
      selectedSections: [...jobData.selectedSections, newSection.id],
    })

    // Auto-expand the new section
    setExpandedSections({
      ...expandedSections,
      [newSection.id]: true,
    })

    setSectionName("")
    setArea(undefined)
    setDepth(undefined)
  }

  const removeSection = (sectionId: string) => {
    setJobData({
      ...jobData,
      sections: jobData.sections.filter((section) => section.id !== sectionId),
      selectedSections: jobData.selectedSections.filter((id) => id !== sectionId),
    })
  }

  const handleSectionSelection = (sectionId: string) => {
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

  const handleTemplateSelection = (templateName: string) => {
    const newSection = createSectionFromTemplate(templateName)
    if (newSection) {
      setJobData({
        ...jobData,
        sections: [...jobData.sections, newSection],
        selectedSections: [...jobData.selectedSections, newSection.id],
      })

      // Auto-expand the new section
      setExpandedSections({
        ...expandedSections,
        [newSection.id]: true,
      })
    }
  }

  const handleMobilizationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJobData({
      ...jobData,
      mobilization: {
        ...jobData.mobilization,
        enabled: e.target.checked,
      },
    })
  }

  const handleSectionSpecificChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJobData({
      ...jobData,
      mobilization: {
        ...jobData.mobilization,
        sectionSpecific: e.target.checked,
      },
    })
  }

  const handleNumTrucksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJobData({
      ...jobData,
      mobilization: {
        ...jobData.mobilization,
        numTrucks: Number.parseInt(e.target.value),
      },
    })
  }

  const handleTripTypeChange = (value: string) => {
    setJobData({
      ...jobData,
      mobilization: {
        ...jobData.mobilization,
        tripType: value,
      },
    })
  }

  const handleSectionMobilizationChange = (sectionId: string, checked: boolean) => {
    setJobData({
      ...jobData,
      mobilization: {
        ...jobData.mobilization,
        sectionMobilization: {
          ...jobData.mobilization.sectionMobilization,
          [sectionId]: checked,
        },
      },
    })
  }

  const handleContactFormSubmit = (contactInfo: ContactInfo) => {
    setContactInfo(contactInfo)
    setIsContactFormOpen(false)
    setIsQuotePreviewOpen(true)
    toast({
      title: "Contact information saved.",
      description: "You can now preview the quote.",
    })
  }

  const handleSaveQuote = (updatedJobData: any, updatedContactInfo: ContactInfo) => {
    setJobData(updatedJobData)
    setContactInfo(updatedContactInfo)
    toast({
      title: "Quote saved.",
      description: "The quote has been successfully saved.",
    })
  }

  const handleSelectAll = () => {
    setJobData({
      ...jobData,
      selectedSections: jobData.sections.map((section) => section.id),
    })
  }

  const handleDeselectAll = () => {
    setJobData({
      ...jobData,
      selectedSections: [],
    })
  }

  const handleSelectByType = (type: string) => {
    const sectionsOfType = jobData.sections
      .filter((section) => section.name.toLowerCase().includes(type.toLowerCase()))
      .map((section) => section.id)

    setJobData({
      ...jobData,
      selectedSections: [...new Set([...jobData.selectedSections, ...sectionsOfType])],
    })
  }

  const handleSaveConfig = () => {
    try {
      // Create a complete project state object
      const projectState = {
        jobData,
        contactInfo,
        quoteNumber,
        expandedSections,
        date: new Date().toISOString(),
      }

      // Save to localStorage
      localStorage.setItem("jobData", JSON.stringify(projectState))

      // Also offer to download as a JSON file
      const dataStr = JSON.stringify(projectState, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)

      const a = document.createElement("a")
      a.href = url
      a.download = `${jobData.projectName.replace(/\s+/g, "_")}_project.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Configuration saved.",
        description: "Your job configuration has been saved to localStorage and downloaded as a JSON file.",
      })
    } catch (error) {
      console.error("Error saving configuration:", error)
      toast({
        title: "Error saving configuration",
        description: "There was an error saving your configuration. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLoadConfig = () => {
    try {
      const savedData = localStorage.getItem("jobData")
      if (savedData) {
        const parsedData = JSON.parse(savedData)

        // Check if the data has the expected structure
        if (parsedData.jobData) {
          setJobData(parsedData.jobData)

          // Restore other state if available
          if (parsedData.contactInfo) setContactInfo(parsedData.contactInfo)
          if (parsedData.quoteNumber) setQuoteNumber(parsedData.quoteNumber)
          if (parsedData.expandedSections) setExpandedSections(parsedData.expandedSections)

          toast({
            title: "Configuration loaded.",
            description: "Your saved job configuration has been loaded.",
          })
        } else {
          // Handle legacy format (just jobData)
          setJobData(parsedData)
          toast({
            title: "Configuration loaded (legacy format).",
            description: "Your saved job configuration has been loaded in legacy format.",
          })
        }
      } else {
        toast({
          title: "No saved configuration found.",
          description: "There is no saved configuration in localStorage.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading configuration:", error)
      toast({
        title: "Error loading configuration",
        description: "There was an error loading your configuration. The saved data may be corrupted.",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null)
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsedData = JSON.parse(content)

        // Check if the data has the expected structure
        if (parsedData.jobData) {
          setJobData(parsedData.jobData)

          // Restore other state if available
          if (parsedData.contactInfo) setContactInfo(parsedData.contactInfo)
          if (parsedData.quoteNumber) setQuoteNumber(parsedData.quoteNumber)
          if (parsedData.expandedSections) setExpandedSections(parsedData.expandedSections)

          setIsImportDialogOpen(false)
          toast({
            title: "Project imported successfully.",
            description: "Your project has been imported and loaded.",
          })
        } else {
          setImportError("Invalid project file format. The file does not contain the expected data structure.")
        }
      } catch (error) {
        console.error("Error parsing JSON file:", error)
        setImportError("Failed to parse JSON file. Please check the file format.")
      }
    }
    reader.readAsText(file)

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleNewJob = () => {
    setJobData(defaultJobData)
    toast({
      title: "New job created.",
      description: "You can now start a new job estimate.",
    })
  }

  // Update equipment item
  const updateEquipmentItem = (sectionId: string, index: number, field: string, value: any) => {
    const updatedSections = [...jobData.sections]
    const sectionIndex = updatedSections.findIndex((s) => s.id === sectionId)

    if (sectionIndex !== -1) {
      const equipment = [...updatedSections[sectionIndex].equipment]
      equipment[index] = { ...equipment[index], [field]: value }

      // Calculate total
      if (field === "quantity" || field === "hours" || field === "rate") {
        const quantity = equipment[index].quantity || 0
        const hours = equipment[index].hours || 0
        const rate = equipment[index].rate || 0
        equipment[index].total = quantity * hours * rate
      }

      updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], equipment }
      setJobData({ ...jobData, sections: updatedSections })
    }
  }

  // Update labor item
  const updateLaborItem = (sectionId: string, index: number, field: string, value: any) => {
    const updatedSections = [...jobData.sections]
    const sectionIndex = updatedSections.findIndex((s) => s.id === sectionId)

    if (sectionIndex !== -1) {
      const labor = [...updatedSections[sectionIndex].labor]
      labor[index] = { ...labor[index], [field]: value }

      // Calculate total
      if (field === "quantity" || field === "hours" || field === "rate") {
        const quantity = labor[index].quantity || 0
        const hours = labor[index].hours || 0
        const rate = labor[index].rate || 0
        labor[index].total = quantity * hours * rate
      }

      updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], labor }
      setJobData({ ...jobData, sections: updatedSections })
    }
  }

  // Update material item
  const updateMaterialItem = (sectionId: string, index: number, field: string, value: any) => {
    const updatedSections = [...jobData.sections]
    const sectionIndex = updatedSections.findIndex((s) => s.id === sectionId)

    if (sectionIndex !== -1) {
      const materials = [...updatedSections[sectionIndex].materials]
      materials[index] = { ...materials[index], [field]: value }

      // Calculate total
      if (field === "quantity" || field === "rate") {
        const quantity = materials[index].quantity || 0
        const rate = materials[index].rate || 0
        materials[index].total = quantity * rate
      }

      updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], materials }
      setJobData({ ...jobData, sections: updatedSections })
    }
  }

  // Update trucking item
  const updateTruckingItem = (sectionId: string, index: number, field: string, value: any) => {
    const updatedSections = [...jobData.sections]
    const sectionIndex = updatedSections.findIndex((s) => s.id === sectionId)

    if (sectionIndex !== -1) {
      const trucking = [...updatedSections[sectionIndex].trucking]
      trucking[index] = { ...trucking[index], [field]: value }

      // Calculate total
      if (field === "quantity" || field === "hours" || field === "rate") {
        const quantity = trucking[index].quantity || 0
        const hours = trucking[index].hours || 0
        const rate = trucking[index].rate || 0
        trucking[index].total = quantity * hours * rate
      }

      updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], trucking }
      setJobData({ ...jobData, sections: updatedSections })
    }
  }

  // Add new equipment item
  const addEquipmentItem = (sectionId: string) => {
    const updatedSections = [...jobData.sections]
    const sectionIndex = updatedSections.findIndex((s) => s.id === sectionId)

    if (sectionIndex !== -1) {
      const newItem = { name: "New Equipment", quantity: 1, hours: 8, rate: 0, includesOperator: false, total: 0 }
      updatedSections[sectionIndex].equipment.push(newItem)
      setJobData({ ...jobData, sections: updatedSections })
    }
  }

  // Add new labor item
  const addLaborItem = (sectionId: string) => {
    const updatedSections = [...jobData.sections]
    const sectionIndex = updatedSections.findIndex((s) => s.id === sectionId)

    if (sectionIndex !== -1) {
      const newItem = { name: "New Labor", quantity: 1, hours: 8, rate: 0, total: 0 }
      updatedSections[sectionIndex].labor.push(newItem)
      setJobData({ ...jobData, sections: updatedSections })
    }
  }

  // Add new material item
  const addMaterialItem = (sectionId: string) => {
    const updatedSections = [...jobData.sections]
    const sectionIndex = updatedSections.findIndex((s) => s.id === sectionId)

    if (sectionIndex !== -1) {
      const newItem = { name: "New Material", unit: "tons", quantity: 0, rate: 0, total: 0 }
      updatedSections[sectionIndex].materials.push(newItem)
      setJobData({ ...jobData, sections: updatedSections })
    }
  }

  // Add new trucking item
  const addTruckingItem = (sectionId: string) => {
    const updatedSections = [...jobData.sections]
    const sectionIndex = updatedSections.findIndex((s) => s.id === sectionId)

    if (sectionIndex !== -1) {
      const newItem = { name: "New Trucking", quantity: 1, hours: 8, rate: 0, total: 0 }
      updatedSections[sectionIndex].trucking.push(newItem)
      setJobData({ ...jobData, sections: updatedSections })
    }
  }

  // Remove equipment item
  const removeEquipmentItem = (sectionId: string, index: number) => {
    const updatedSections = [...jobData.sections]
    const sectionIndex = updatedSections.findIndex((s) => s.id === sectionId)

    if (sectionIndex !== -1) {
      updatedSections[sectionIndex].equipment.splice(index, 1)
      setJobData({ ...jobData, sections: updatedSections })
    }
  }

  // Remove labor item
  const removeLaborItem = (sectionId: string, index: number) => {
    const updatedSections = [...jobData.sections]
    const sectionIndex = updatedSections.findIndex((s) => s.id === sectionId)

    if (sectionIndex !== -1) {
      updatedSections[sectionIndex].labor.splice(index, 1)
      setJobData({ ...jobData, sections: updatedSections })
    }
  }

  // Remove material item
  const removeMaterialItem = (sectionId: string, index: number) => {
    const updatedSections = [...jobData.sections]
    const sectionIndex = updatedSections.findIndex((s) => s.id === sectionId)

    if (sectionIndex !== -1) {
      updatedSections[sectionIndex].materials.splice(index, 1)
      setJobData({ ...jobData, sections: updatedSections })
    }
  }

  // Remove trucking item
  const removeTruckingItem = (sectionId: string, index: number) => {
    const updatedSections = [...jobData.sections]
    const sectionIndex = updatedSections.findIndex((s) => s.id === sectionId)

    if (sectionIndex !== -1) {
      updatedSections[sectionIndex].trucking.splice(index, 1)
      setJobData({ ...jobData, sections: updatedSections })
    }
  }

  // Calculate section total
  const calculateSectionTotal = (section: any) => {
    const equipmentTotal = section.equipment.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
    const laborTotal = section.labor.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
    const materialsTotal = section.materials.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
    const truckingTotal = section.trucking.reduce((sum: number, item: any) => sum + (item.total || 0), 0)

    // Calculate mobilization cost if enabled
    let mobilizationTotal = 0
    if (
      jobData.mobilization?.enabled &&
      (!jobData.mobilization.sectionSpecific ||
        (jobData.mobilization.sectionSpecific && jobData.mobilization.sectionMobilization[section.id]))
    ) {
      const mobilizationCost = 1020 // Base cost
      mobilizationTotal = jobData.mobilization.sectionSpecific
        ? mobilizationCost * jobData.mobilization.numTrucks * (jobData.mobilization.tripType === "round-trip" ? 2 : 1)
        : (mobilizationCost *
            jobData.mobilization.numTrucks *
            (jobData.mobilization.tripType === "round-trip" ? 2 : 1)) /
          jobData.sections.filter((s: any) => jobData.selectedSections.includes(s.id)).length
    }

    return equipmentTotal + laborTotal + materialsTotal + truckingTotal + mobilizationTotal
  }

  // Calculate job total
  const calculateJobTotal = () => {
    return jobData.sections
      .filter((section: any) => jobData.selectedSections.includes(section.id))
      .reduce((sum: number, section: any) => sum + calculateSectionTotal(section), 0)
  }

  // Get all materials from all sections
  const getAllMaterials = () => {
    const materials: any[] = []

    jobData.sections.forEach((section) => {
      if (jobData.selectedSections.includes(section.id)) {
        section.materials.forEach((material: any) => {
          materials.push({
            ...material,
            sectionId: section.id,
            sectionName: section.name,
          })
        })
      }
    })

    return materials
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <img src="/NEW_Logo.jpg" alt="Spallina Materials" className="h-16 object-contain" />
          <h1 className="text-2xl font-bold">Spallina Asphalt Estimator</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" className="bg-black hover:bg-gray-800" onClick={handleSaveConfig}>
            <Save className="mr-2 h-4 w-4" />
            Save Project
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={() => setIsContactFormOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Button variant="outline" onClick={() => setIsQuotePreviewOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Project Summary
          </Button>
          <div className="flex items-center gap-2">
            <CSVExport jobData={jobData} />
            <CSVIntegration jobData={jobData} setJobData={setJobData} />
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Import Project</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col space-y-4 py-4">
                  {importError && (
                    <Alert variant="destructive">
                      <AlertDescription>{importError}</AlertDescription>
                    </Alert>
                  )}

                  <Input type="file" accept=".json" onChange={handleFileUpload} ref={fileInputRef} />

                  <p className="text-sm text-gray-500">
                    Upload a JSON file to import a previously saved project. This will replace your current project
                    data.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => {}}>
              <Settings className="mr-2 h-4 w-4" />
              Config
            </Button>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="projectName">Job Name</Label>
              <Input
                type="text"
                id="projectName"
                placeholder="Enter job name"
                value={jobData.projectName}
                onChange={(e) => setJobData({ ...jobData, projectName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                type="text"
                id="location"
                placeholder="Enter job location"
                value={jobData.location}
                onChange={(e) => setJobData({ ...jobData, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                id="date"
                value={jobData.date}
                onChange={(e) => setJobData({ ...jobData, date: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Enter any additional notes about the job"
              value={jobData.notes || ""}
              onChange={(e) => setJobData({ ...jobData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">Quick Section Selection</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Deselect All
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSelectByType("milling")}>
              Milling Only
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSelectByType("paving")}>
              Paving Only
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveConfig}>
              Save Config
            </Button>
            <Button variant="outline" size="sm" onClick={handleLoadConfig}>
              Load Config
            </Button>
            <Button variant="outline" size="sm" onClick={handleNewJob}>
              New Job
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full mb-4">
          <TabsTrigger value="sections">Job Sections</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="space-y-4">
          {jobData.sections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No sections added yet. Add a section to get started.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {pavingTypes.map((type) => (
                  <Button key={type} variant="outline" onClick={() => handleTemplateSelection(type)}>
                    Add {type}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            jobData.sections.map((section) => (
              <Card
                key={section.id}
                className={`border ${jobData.selectedSections.includes(section.id) ? "border-black" : "border-gray-200"}`}
              >
                <CardContent className="p-0">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => toggleSectionExpand(section.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center font-medium">
                        {jobData.sections.indexOf(section) + 1}
                      </div>
                      <h3 className="font-medium">{section.name}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">${calculateSectionTotal(section).toFixed(2)}</span>
                      <Button
                        variant={jobData.selectedSections.includes(section.id) ? "default" : "outline"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSectionSelection(section.id)
                        }}
                      >
                        {jobData.selectedSections.includes(section.id) ? "Selected" : "Select"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeSection(section.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {expandedSections[section.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {expandedSections[section.id] && (
                    <div className="border-t p-4">
                      <Tabs defaultValue="equipment">
                        <TabsList>
                          <TabsTrigger value="equipment">Equipment</TabsTrigger>
                          <TabsTrigger value="labor">Labor</TabsTrigger>
                          <TabsTrigger value="materials">Materials</TabsTrigger>
                          <TabsTrigger value="trucking">Trucking</TabsTrigger>
                        </TabsList>

                        {/* Equipment Tab */}
                        <TabsContent value="equipment">
                          <div className="mb-4 flex justify-between items-center">
                            <h3 className="text-lg font-medium">Equipment</h3>
                            <Button size="sm" onClick={() => addEquipmentItem(section.id)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Equipment
                            </Button>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Hours</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead>Includes Operator</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {section.equipment.map((item: any, index: number) => (
                                <TableRow key={`equipment-${section.id}-${index}`}>
                                  <TableCell>
                                    <Input
                                      value={item.name}
                                      onChange={(e) => updateEquipmentItem(section.id, index, "name", e.target.value)}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) =>
                                        updateEquipmentItem(section.id, index, "quantity", Number(e.target.value))
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={item.hours}
                                      onChange={(e) =>
                                        updateEquipmentItem(section.id, index, "hours", Number(e.target.value))
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={item.rate || 0}
                                      onChange={(e) =>
                                        updateEquipmentItem(section.id, index, "rate", Number(e.target.value))
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Checkbox
                                      checked={item.includesOperator}
                                      onCheckedChange={(checked) =>
                                        updateEquipmentItem(section.id, index, "includesOperator", !!checked)
                                      }
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
                            </TableBody>
                          </Table>
                        </TabsContent>

                        {/* Labor Tab */}
                        <TabsContent value="labor">
                          <div className="mb-4 flex justify-between items-center">
                            <h3 className="text-lg font-medium">Labor</h3>
                            <Button size="sm" onClick={() => addLaborItem(section.id)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Labor
                            </Button>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Hours</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {section.labor.map((item: any, index: number) => (
                                <TableRow key={`labor-${section.id}-${index}`}>
                                  <TableCell>
                                    <Input
                                      value={item.name}
                                      onChange={(e) => updateLaborItem(section.id, index, "name", e.target.value)}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) =>
                                        updateLaborItem(section.id, index, "quantity", Number(e.target.value))
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={item.hours}
                                      onChange={(e) =>
                                        updateLaborItem(section.id, index, "hours", Number(e.target.value))
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={item.rate || 0}
                                      onChange={(e) =>
                                        updateLaborItem(section.id, index, "rate", Number(e.target.value))
                                      }
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
                            </TableBody>
                          </Table>
                        </TabsContent>

                        {/* Materials Tab */}
                        <TabsContent value="materials">
                          <div className="mb-4 flex justify-between items-center">
                            <h3 className="text-lg font-medium">Materials</h3>
                            <Button size="sm" onClick={() => addMaterialItem(section.id)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Material
                            </Button>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {section.materials.map((item: any, index: number) => (
                                <TableRow key={`material-${section.id}-${index}`}>
                                  <TableCell>
                                    <Input
                                      value={item.name}
                                      onChange={(e) => updateMaterialItem(section.id, index, "name", e.target.value)}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={item.unit}
                                      onValueChange={(value) => updateMaterialItem(section.id, index, "unit", value)}
                                    >
                                      <SelectTrigger>
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
                                      value={item.quantity}
                                      onChange={(e) =>
                                        updateMaterialItem(section.id, index, "quantity", Number(e.target.value))
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={item.rate}
                                      onChange={(e) =>
                                        updateMaterialItem(section.id, index, "rate", Number(e.target.value))
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>${item.total?.toFixed(2) || "0.00"}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      onClick={() => removeMaterialItem(section.id, index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TabsContent>

                        {/* Trucking Tab */}
                        <TabsContent value="trucking">
                          <div className="mb-4 flex justify-between items-center">
                            <h3 className="text-lg font-medium">Trucking</h3>
                            <Button size="sm" onClick={() => addTruckingItem(section.id)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Trucking
                            </Button>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Hours</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {section.trucking.map((item: any, index: number) => (
                                <TableRow key={`trucking-${section.id}-${index}`}>
                                  <TableCell>
                                    <Input
                                      value={item.name}
                                      onChange={(e) => updateTruckingItem(section.id, index, "name", e.target.value)}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) =>
                                        updateTruckingItem(section.id, index, "quantity", Number(e.target.value))
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={item.hours}
                                      onChange={(e) =>
                                        updateTruckingItem(section.id, index, "hours", Number(e.target.value))
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={item.rate || 0}
                                      onChange={(e) =>
                                        updateTruckingItem(section.id, index, "rate", Number(e.target.value))
                                      }
                                    />
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
                            </TableBody>
                          </Table>
                        </TabsContent>
                      </Tabs>

                      <div className="mt-4 p-4 bg-gray-100 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-medium">Section Total:</span>
                          <span className="text-lg font-bold">${calculateSectionTotal(section).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}

          <div className="flex justify-center mt-6">
            <div className="dropdown">
              <Button variant="outline">Add Section</Button>
              <div className="dropdown-content">
                {pavingTypes.map((type) => (
                  <Button
                    key={type}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleTemplateSelection(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>All Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getAllMaterials().map((material, index) => (
                    <TableRow key={`all-material-${index}`}>
                      <TableCell>{material.sectionName}</TableCell>
                      <TableCell>{material.name}</TableCell>
                      <TableCell>{material.unit}</TableCell>
                      <TableCell>{material.quantity}</TableCell>
                      <TableCell>${material.rate?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>${material.total?.toFixed(2) || "0.00"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {getAllMaterials().length === 0 && (
                <div className="text-center py-4 text-gray-500">No materials added to any sections yet.</div>
              )}

              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total Materials Cost:</span>
                  <span className="text-lg font-bold">
                    $
                    {getAllMaterials()
                      .reduce((sum, material) => sum + (material.total || 0), 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 p-4 bg-gray-100 rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-xl font-medium">Job Total:</span>
          <span className="text-xl font-bold">${calculateJobTotal().toFixed(2)}</span>
        </div>
      </div>

      <ContactForm open={isContactFormOpen} onOpenChange={setIsContactFormOpen} onSubmit={handleContactFormSubmit} />

      <QuotePreview
        open={isQuotePreviewOpen}
        onOpenChange={setIsQuotePreviewOpen}
        jobData={jobData}
        quoteNumber={quoteNumber}
        contactInfo={contactInfo}
        onSave={handleSaveQuote}
      />

      <style jsx>{`
        .dropdown {
          position: relative;
          display: inline-block;
        }
        
        .dropdown-content {
          display: none;
          position: absolute;
          background-color: white;
          min-width: 160px;
          box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
          z-index: 1;
          border-radius: 0.375rem;
        }
        
        .dropdown:hover .dropdown-content {
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  )
}

export default JobCostDashboard
