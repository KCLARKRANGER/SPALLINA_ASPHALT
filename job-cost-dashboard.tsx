"use client"

import { CardTitle } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { pavingTypes, sectionTemplates, equipmentList } from "./config/paving-templates"
import { calculateTonsFromArea } from "./utils/asphalt-calculations"
import { getNextQuoteNumber } from "./utils/quote-number"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CSVExport } from "@/components/csv-export"
import { ContactForm, type ContactInfo } from "@/components/contact-form"
import { Calculator } from "@/components/calculator"
import { MixCalculator } from "@/components/mix-calculator"
import { useToast } from "@/components/ui/use-toast"
import { Save, FileText, Plus, ChevronDown, ChevronUp, Trash2, Upload, Settings } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { QuotePreview } from "@/components/quote-preview"

// Check if code is running in browser environment
const isBrowser = () => typeof window !== "undefined"

const defaultJobData = {
  projectName: "New Project",
  customerName: "",
  location: "",
  date: new Date().toISOString().split("T")[0],
  totalArea: 0,
  totalTonnage: 0,
  sections: [],
  selectedSections: [],
  notes: "",
  terms: "",
  contactInfo: {
    name: "John Smith",
    phone: "(585) 658-2248",
    email: "info@spallinamaterials.com",
    company: "Spallina Materials",
    position: "Estimator",
  },
  mobilization: {
    enabled: false,
    sectionSpecific: false,
    numTrucks: 1,
    tripType: "one-way",
    sectionMobilization: {},
  },
  markups: {}, // Store markup percentages for each section
}

function JobCostDashboard() {
  const [jobData, setJobData] = useState(defaultJobData)
  const [sectionName, setSectionName] = useState("")
  const [area, setArea] = useState<number | undefined>(undefined)
  const [depth, setDepth] = useState<number | undefined>(undefined)
  const [activeTab, setActiveTab] = useState("sections")
  const [isContactFormOpen, setIsContactFormOpen] = useState(false)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [isMixCalculatorOpen, setIsMixCalculatorOpen] = useState(false)
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    name: "John Smith",
    phone: "(585) 658-2248",
    email: "info@spallinamaterials.com",
    company: "Spallina Materials",
    position: "Estimator",
  })
  const [isQuotePreviewOpen, setIsQuotePreviewOpen] = useState(false)
  const [quoteNumber, setQuoteNumber] = useState(1001) // Default value
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [editableEquipmentList, setEditableEquipmentList] = useState(equipmentList)

  // Load equipment list from localStorage if available
  useEffect(() => {
    if (isBrowser()) {
      const savedEquipmentList = localStorage.getItem("equipmentList")
      if (savedEquipmentList) {
        try {
          const parsed = JSON.parse(savedEquipmentList)
          if (Array.isArray(parsed)) {
            setEditableEquipmentList(parsed)
          }
        } catch (e) {
          console.error("Error parsing saved equipment list:", e)
          // If there's an error, initialize with the default list
          setEditableEquipmentList(equipmentList)
        }
      } else {
        // If no saved list, initialize with the default list
        setEditableEquipmentList(equipmentList)
      }
    }
  }, [])

  useEffect(() => {
    // Only run this code in the browser
    if (isBrowser()) {
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
    }
  }, [])

  // Update the handleSaveConfig function to check for browser environment
  const handleSaveConfig = () => {
    try {
      // Create a complete project state object
      const projectState = {
        jobData,
        contactInfo: jobData.contactInfo,
        quoteNumber,
        expandedSections,
        date: new Date().toISOString(),
      }

      // Only save to localStorage in browser environment
      if (isBrowser()) {
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
      }

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

  // Update the handleLoadConfig function to check for browser environment
  const handleLoadConfig = () => {
    try {
      // Only access localStorage in browser environment
      if (isBrowser()) {
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

  const createSectionFromTemplate = (templateName) => {
    const template = sectionTemplates[templateName]
    if (!template) return null

    // Add rates to equipment based on the equipment list
    const equipmentWithRates = template.equipment.map((item) => {
      const equipmentItem = equipmentList.find((e) => e.name === item.name)
      const rate = equipmentItem ? equipmentItem.hourlyRate : 0

      return {
        ...item,
        rate,
        total: item.quantity * item.hours * rate, // Hourly rate
      }
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

      return { ...item, rate, total: item.quantity * item.hours * rate } // Hourly rate
    })

    return {
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: templateName,
      length: 0,
      width: 0,
      depth: 0,
      area: 0, // Changed from 1000 to 0
      tons: 0, // Changed from conditional 120 to 0
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
    // if (
    //   item.name &&
    //   (item.name.includes("Paver") ||
    //     item.name.includes("Roller") ||
    //     item.name.includes("Skidsteer") ||
    //     item.name.includes("Mill") ||
    //     item.name.includes("Truck") ||
    //     item.name.includes("Broom") ||
    //     item.name.includes("Excavator") ||
    //     item.name.includes("Dozer"))
    // ) {
    //   return quantity * (hours / 8) * rate // Convert hours to days for daily rate
    // }

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
    // Also remove any markup for this section
    const updatedMarkups = { ...jobData.markups }
    delete updatedMarkups[sectionId]

    setJobData({
      ...jobData,
      sections: jobData.sections.filter((section) => section.id !== sectionId),
      selectedSections: jobData.selectedSections.filter((id) => id !== sectionId),
      markups: updatedMarkups,
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

  // Handle markup percentage change for a section
  const handleMarkupChange = (sectionId: string, value: string) => {
    const markupValue = value === "" ? 0 : Number(value)

    setJobData({
      ...jobData,
      markups: {
        ...jobData.markups,
        [sectionId]: markupValue,
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

      // If the name field is being updated, also update the rate from the equipment list
      if (field === "name") {
        const equipmentItem = equipmentList.find((e) => e.name === value)
        if (equipmentItem) {
          equipment[index].rate = equipmentItem.hourlyRate
        }
      }

      // Calculate total
      if (field === "quantity" || field === "hours" || field === "rate" || field === "name") {
        const quantity = equipment[index].quantity || 0
        const hours = equipment[index].hours || 0
        const rate = equipment[index].rate || 0
        equipment[index].total = quantity * hours * rate // Hourly rate
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
        trucking[index].total = quantity * hours * rate // Hourly rate
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
      const newItem = {
        name: "AP2 CAT Paver AP1000F",
        quantity: 1,
        hours: 8,
        rate: 575,
        includesOperator: false,
        total: 575 * 8, // 8 hours at hourly rate
      }
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

  // Calculate section total (without markup)
  const calculateSectionBaseTotal = (section: any) => {
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

  // Calculate section total (with markup)
  const calculateSectionTotal = (section: any) => {
    const baseTotal = calculateSectionBaseTotal(section)
    const markup = jobData.markups[section.id] || 0
    return baseTotal * (1 + markup / 100)
  }

  // Calculate job total (without markups for project summary)
  const calculateJobTotalWithoutMarkup = () => {
    return jobData.sections
      .filter((section: any) => jobData.selectedSections.includes(section.id))
      .reduce((sum: number, section: any) => sum + calculateSectionBaseTotal(section), 0)
  }

  // Calculate job total (with markups for internal use)
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

  // Export to PDF
  const handleExportPdf = () => {
    const doc = new jsPDF()

    // Add header
    doc.setFontSize(20)
    doc.text("Job Cost Estimate", 20, 20)

    doc.setFontSize(12)
    doc.text(`Project: ${jobData.projectName}`, 20, 30)
    doc.text(`Location: ${jobData.location || "N/A"}`, 20, 40)
    doc.text(`Date: ${jobData.date || new Date().toLocaleDateString()}`, 20, 50)
    doc.text(`Total Area: ${jobData.totalArea?.toLocaleString() || "0"} sq ft`, 20, 60)
    doc.text(`Total Tonnage: ${jobData.totalTonnage?.toLocaleString() || "0"} tons`, 20, 70)

    // Add sections table
    const sectionsTableData = jobData.sections
      .filter((section) => jobData.selectedSections.includes(section.id))
      .map((section) => [
        section.name,
        section.area?.toString() || "0",
        section.tons?.toString() || "0",
        `$${section.equipment.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}`,
        `$${section.labor.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}`,
        `$${section.materials.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}`,
        `$${section.trucking.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}`,
        `$${calculateSectionBaseTotal(section).toFixed(2)}`,
      ])

    autoTable(doc, {
      startY: 80, // Adjusted to account for the new lines
      head: [["Section", "Area (sq ft)", "Tons", "Equipment", "Labor", "Materials", "Trucking", "Total"]],
      body: sectionsTableData,
    })

    // Add total
    const finalY = (doc as any).lastAutoTable.finalY || 150
    doc.text(`Total Job Cost: $${calculateJobTotalWithoutMarkup().toFixed(2)}`, 20, finalY + 10)

    // Add notes if available
    if (jobData.notes) {
      doc.text("Notes:", 20, finalY + 20)
      doc.text(jobData.notes, 20, finalY + 30)
    }

    // Save the PDF
    doc.save(`${jobData.projectName.replace(/\s+/g, "_")}_estimate.pdf`)

    toast({
      title: "PDF exported successfully.",
      description: "Your job estimate has been exported as a PDF file.",
    })
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
          <Button variant="outline" onClick={() => setIsQuotePreviewOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Project Summary
          </Button>
          <div className="flex items-center gap-2">
            <CSVExport jobData={jobData} />
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
            <Button variant="outline" onClick={() => setIsConfigOpen(true)}>
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

          <div className="mt-4 border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Prepared By</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="contactName">Name</Label>
                <Input
                  type="text"
                  id="contactName"
                  placeholder="Enter your name"
                  value={jobData.contactInfo?.name || ""}
                  onChange={(e) =>
                    setJobData({
                      ...jobData,
                      contactInfo: { ...jobData.contactInfo, name: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="contactPosition">Position</Label>
                <Input
                  type="text"
                  id="contactPosition"
                  placeholder="Enter your position"
                  value={jobData.contactInfo?.position || ""}
                  onChange={(e) =>
                    setJobData({
                      ...jobData,
                      contactInfo: { ...jobData.contactInfo, position: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="contactCompany">Company</Label>
                <Input
                  type="text"
                  id="contactCompany"
                  placeholder="Enter your company"
                  value={jobData.contactInfo?.company || ""}
                  onChange={(e) =>
                    setJobData({
                      ...jobData,
                      contactInfo: { ...jobData.contactInfo, company: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Phone</Label>
                <Input
                  type="text"
                  id="contactPhone"
                  placeholder="Enter your phone"
                  value={jobData.contactInfo?.phone || ""}
                  onChange={(e) =>
                    setJobData({
                      ...jobData,
                      contactInfo: { ...jobData.contactInfo, phone: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  type="email"
                  id="contactEmail"
                  placeholder="Enter your email"
                  value={jobData.contactInfo?.email || ""}
                  onChange={(e) =>
                    setJobData({
                      ...jobData,
                      contactInfo: { ...jobData.contactInfo, email: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="totalArea">Total Area (sq ft)</Label>
              <Input
                type="number"
                id="totalArea"
                placeholder="Enter total area"
                value={jobData.totalArea || ""}
                onChange={(e) => setJobData({ ...jobData, totalArea: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="totalTonnage">Total Tonnage</Label>
              <Input
                type="number"
                id="totalTonnage"
                placeholder="Enter total tonnage"
                value={jobData.totalTonnage || ""}
                onChange={(e) => setJobData({ ...jobData, totalTonnage: Number(e.target.value) })}
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
        <TabsList className="grid grid-cols-3 w-full mb-4">
          <TabsTrigger value="sections">Job Sections</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
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
                      <div className="flex items-center gap-2">
                        <span className="font-medium">${calculateSectionBaseTotal(section).toFixed(2)}</span>
                        {jobData.markups[section.id] > 0 && (
                          <span className="text-red-500 font-medium">
                            (+{jobData.markups[section.id]}% = ${calculateSectionTotal(section).toFixed(2)})
                          </span>
                        )}
                      </div>
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
                      <div className="mb-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div>
                            <Label htmlFor={`markup-${section.id}`} className="text-red-500 font-medium">
                              Markup %
                            </Label>
                            <Input
                              id={`markup-${section.id}`}
                              type="number"
                              min="0"
                              max="100"
                              className="w-24 text-red-500"
                              value={jobData.markups[section.id] || ""}
                              onChange={(e) => handleMarkupChange(section.id, e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="italic text-gray-500">
                          <p>
                            Job Total: {jobData.totalArea.toLocaleString()} sq ft /{" "}
                            {jobData.totalTonnage.toLocaleString()} tons
                          </p>
                        </div>
                      </div>

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
                                    <Select
                                      value={item.name}
                                      onValueChange={(value) => updateEquipmentItem(section.id, index, "name", value)}
                                    >
                                      <SelectTrigger>
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
                                      readOnly
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
                                      onChange={(value) => updateMaterialItem(section.id, index, "unit", value)}
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
                          <div>
                            <span className="text-lg font-bold">${calculateSectionBaseTotal(section).toFixed(2)}</span>
                            {jobData.markups[section.id] > 0 && (
                              <span className="text-red-500 ml-2 font-medium">
                                (+{jobData.markups[section.id]}% = ${calculateSectionTotal(section).toFixed(2)})
                              </span>
                            )}
                          </div>
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

        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Costs Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Manage your equipment costs here. Changes will be saved locally and applied to new sections.
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment Name</TableHead>
                    <TableHead>Hourly Rate ($)</TableHead>
                    <TableHead>Daily Rate (8hrs)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editableEquipmentList.map((equipment, index) => (
                    <TableRow key={`equipment-${index}`}>
                      <TableCell>
                        <Input
                          value={equipment.name}
                          onChange={(e) => {
                            const updated = [...editableEquipmentList]
                            updated[index].name = e.target.value
                            setEditableEquipmentList(updated)
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={equipment.hourlyRate}
                          onChange={(e) => {
                            const updated = [...editableEquipmentList]
                            updated[index].hourlyRate = Number(e.target.value)
                            setEditableEquipmentList(updated)
                          }}
                        />
                      </TableCell>
                      <TableCell>${(equipment.hourlyRate * 8).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            const updated = [...editableEquipmentList]
                            updated.splice(index, 1)
                            setEditableEquipmentList(updated)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex justify-between">
                <Button
                  onClick={() => {
                    const newEquipment = { name: "New Equipment", hourlyRate: 100 }
                    setEditableEquipmentList([...editableEquipmentList, newEquipment])

                    // Save to localStorage immediately
                    if (isBrowser()) {
                      localStorage.setItem("equipmentList", JSON.stringify([...editableEquipmentList, newEquipment]))
                    }

                    toast({
                      title: "Equipment added",
                      description: "New equipment has been added to the list.",
                    })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Equipment
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    // Save to localStorage
                    if (isBrowser()) {
                      localStorage.setItem("equipmentList", JSON.stringify(editableEquipmentList))

                      toast({
                        title: "Equipment list saved.",
                        description: "Your equipment list has been saved locally.",
                      })
                    }
                  }}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Equipment List
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 p-4 bg-gray-100 rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-xl font-medium">Job Total:</span>
          <div>
            <span className="text-xl font-bold">${calculateJobTotalWithoutMarkup().toFixed(2)}</span>
            {Object.values(jobData.markups).some((markup) => markup > 0) && (
              <span className="text-red-500 ml-2 font-medium">(With Markups: ${calculateJobTotal().toFixed(2)})</span>
            )}
          </div>
        </div>
      </div>

      <ContactForm open={isContactFormOpen} onOpenChange={setIsContactFormOpen} onSubmit={handleContactFormSubmit} />

      <Calculator open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen} />

      <Dialog open={isMixCalculatorOpen} onOpenChange={setIsMixCalculatorOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Asphalt Mix Calculator</DialogTitle>
          </DialogHeader>
          <MixCalculator />
        </DialogContent>
      </Dialog>

      {/* Config Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configuration</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Default Markup Percentage</h3>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="Default markup percentage"
                value={jobData.defaultMarkup || ""}
                onChange={(e) =>
                  setJobData({
                    ...jobData,
                    defaultMarkup: e.target.value ? Number(e.target.value) : "",
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Default Terms & Conditions</h3>
              <Textarea
                value={jobData.terms || ""}
                onChange={(e) => setJobData({ ...jobData, terms: e.target.value })}
                placeholder="Enter default terms and conditions"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Other Settings</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoSave"
                  checked={jobData.autoSave || false}
                  onCheckedChange={(checked) => setJobData({ ...jobData, autoSave: !!checked })}
                />
                <Label htmlFor="autoSave">Enable auto-save</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleSaveConfig()
                setIsConfigOpen(false)
                toast({
                  title: "Configuration saved",
                  description: "Your configuration has been successfully saved.",
                })
              }}
            >
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <QuotePreview
        open={isQuotePreviewOpen}
        onOpenChange={setIsQuotePreviewOpen}
        jobData={jobData}
        quoteNumber={quoteNumber}
        contactInfo={jobData.contactInfo || contactInfo}
        onSave={(updatedJobData, updatedContactInfo) => {
          setJobData({
            ...updatedJobData,
            contactInfo: updatedContactInfo,
          })
          toast({
            title: "Quote saved.",
            description: "The quote has been successfully saved.",
          })
        }}
      />

      <style jsx>{`
        .dropdown {
          position: relative;
          display: inline-block;
        }
        
        .dropdown-content {
          position: absolute;
          background-color: white;
          min-width: 160px;
          box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
          z-index: 1;
          border-radius: 0.375rem;
          display: none;
          flex-direction: column;
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
