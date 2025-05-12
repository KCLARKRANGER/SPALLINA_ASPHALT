"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { ContactInfo } from "./contact-form"
import { formatQuoteNumber } from "../utils/quote-number"
import { Printer, Mail, X, Download, ChevronDown, ChevronUp } from "lucide-react"
import JSZip from "jszip"
import FileSaver from "file-saver"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

interface QuotePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobData: any
  quoteNumber: number
  contactInfo: ContactInfo
  onSave: (updatedJobData: any, updatedContactInfo: ContactInfo) => void
}

export function QuotePreview({ open, onOpenChange, jobData, quoteNumber, contactInfo, onSave }: QuotePreviewProps) {
  const [editMode, setEditMode] = useState(false)
  const [editedJobData, setEditedJobData] = useState({ ...jobData })
  const [editedContactInfo, setEditedContactInfo] = useState({ ...contactInfo })
  const [showDetails, setShowDetails] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

  // Update editedJobData when jobData changes or when dialog opens
  useEffect(() => {
    if (open) {
      setEditedJobData({ ...jobData })
      // Use jobData.contactInfo if available, otherwise use the contactInfo prop
      setEditedContactInfo(jobData.contactInfo || { ...contactInfo })
    }
  }, [open, jobData, contactInfo])

  const handleSave = () => {
    // Pass both the updated job data and contact info to the parent component
    onSave(
      {
        ...editedJobData,
        contactInfo: editedContactInfo,
      },
      editedContactInfo,
    )
    setEditMode(false)
  }

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML
      const originalContents = document.body.innerHTML

      document.body.innerHTML = printContents
      window.print()
      document.body.innerHTML = originalContents
      window.location.reload()
    }
  }

  const handleExport = async () => {
    // Create a zip file with the job name and date
    const zip = new JSZip()
    const folderName = `${editedJobData.projectName}_${editedJobData.date.replace(/-/g, "")}`
    const folder = zip.folder(folderName)

    if (folder) {
      // Add the configuration file (JSON)
      const configData = {
        jobData: editedJobData,
        contactInfo: editedContactInfo,
        quoteNumber,
        date: new Date().toISOString(),
      }
      folder.file("config.json", JSON.stringify(configData, null, 2))

      // Add the quote as CSV
      let csvContent = "Quote Number,Project Name,Customer Name,Location,Date,Contact Name,Contact Phone\n"
      csvContent += `${formatQuoteNumber(quoteNumber)},${editedJobData.projectName || ""},${
        editedJobData.customerName || ""
      },${editedJobData.location || ""},${editedJobData.date || ""},${editedContactInfo.name || ""},${
        editedContactInfo.phone || ""
      }\n\n`

      // Add section headers
      csvContent +=
        "Section,Area (sq ft),Asphalt (tons),Equipment Cost,Labor Cost,Materials Cost,Trucking Cost,Mobilization Cost,Total Cost\n"

      // Add section data
      editedJobData.sections
        .filter((section: any) => editedJobData.selectedSections.includes(section.id))
        .forEach((section: any) => {
          const equipmentTotal = section.equipment.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
          const laborTotal = section.labor.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
          const materialsTotal = section.materials.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
          const truckingTotal = section.trucking.reduce((sum: number, item: any) => sum + (item.total || 0), 0)

          // Calculate mobilization cost
          let mobilizationTotal = 0
          if (
            editedJobData.mobilization?.enabled &&
            (!editedJobData.mobilization.sectionSpecific ||
              (editedJobData.mobilization.sectionSpecific &&
                editedJobData.mobilization.sectionMobilization[section.id]))
          ) {
            const mobilizationCost = 1020 // Base cost
            mobilizationTotal = editedJobData.mobilization.sectionSpecific
              ? mobilizationCost *
                editedJobData.mobilization.numTrucks *
                (editedJobData.mobilization.tripType === "round-trip" ? 2 : 1)
              : (mobilizationCost *
                  editedJobData.mobilization.numTrucks *
                  (editedJobData.mobilization.tripType === "round-trip" ? 2 : 1)) /
                editedJobData.sections.filter((s: any) => editedJobData.selectedSections.includes(s.id)).length
          }

          const sectionTotal = equipmentTotal + laborTotal + materialsTotal + truckingTotal + mobilizationTotal

          csvContent += `${section.name},${section.area || 0},${section.tons || 0},${equipmentTotal.toFixed(
            2,
          )},${laborTotal.toFixed(2)},${materialsTotal.toFixed(2)},${truckingTotal.toFixed(
            2,
          )},${mobilizationTotal.toFixed(2)},${sectionTotal.toFixed(2)}\n`
        })

      // Add total row
      const totalCost = calculateJobTotal()
      csvContent += `\nTOTAL,,,,,,,,${totalCost.toFixed(2)}\n`

      folder.file("quote.csv", csvContent)

      // Generate the zip file and save it
      const content = await zip.generateAsync({ type: "blob" })
      FileSaver.saveAs(content, `${folderName}.zip`)
    }
  }

  // Generate PDF for email
  const generatePDF = () => {
    const doc = new jsPDF()

    // Add header
    doc.setFontSize(20)
    doc.text("Job Cost Estimate", 20, 20)

    doc.setFontSize(12)
    doc.text(`Project: ${editedJobData.projectName}`, 20, 30)
    doc.text(`Location: ${editedJobData.location || "N/A"}`, 20, 40)
    doc.text(`Date: ${editedJobData.date || new Date().toLocaleDateString()}`, 20, 50)
    doc.text(`Total Area: ${editedJobData.totalArea?.toLocaleString() || "0"} sq ft`, 20, 60)
    doc.text(`Total Tonnage: ${editedJobData.totalTonnage?.toLocaleString() || "0"} tons`, 20, 70)

    // Add sections table
    const sectionsTableData = editedJobData.sections
      .filter((section) => editedJobData.selectedSections.includes(section.id))
      .map((section) => [
        section.name,
        section.area?.toString() || "0",
        section.tons?.toString() || "0",
        `$${section.equipment.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}`,
        `$${section.labor.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}`,
        `$${section.materials.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}`,
        `$${section.trucking.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}`,
        `$${calculateSectionTotal(section).toFixed(2)}`,
      ])

    autoTable(doc, {
      startY: 80,
      head: [["Section", "Area (sq ft)", "Tons", "Equipment", "Labor", "Materials", "Trucking", "Total"]],
      body: sectionsTableData,
    })

    // Add total
    const finalY = (doc as any).lastAutoTable.finalY || 150
    doc.text(`Total Job Cost: $${calculateJobTotal().toFixed(2)}`, 20, finalY + 10)

    // Add notes if available
    if (editedJobData.notes) {
      doc.text("Notes:", 20, finalY + 20)
      doc.text(editedJobData.notes, 20, finalY + 30)
    }

    return doc
  }

  // Handle email with PDF
  const handleEmail = () => {
    // Generate PDF
    const doc = generatePDF()
    const pdfBlob = doc.output("blob")
    const pdfFile = new File([pdfBlob], `${editedJobData.projectName.replace(/\s+/g, "_")}_estimate.pdf`, {
      type: "application/pdf",
    })

    // Create email draft
    const subject = `Estimate for ${editedJobData.projectName}`
    const body = `Dear Customer,

Please find attached the estimate for your project: ${editedJobData.projectName}.

Project Details:
- Location: ${editedJobData.location || "N/A"}
- Date: ${editedJobData.date || new Date().toLocaleDateString()}
- Total Area: ${editedJobData.totalArea?.toLocaleString() || "0"} sq ft
- Total Tonnage: ${editedJobData.totalTonnage?.toLocaleString() || "0"} tons
- Total Cost: $${calculateJobTotal().toFixed(2)}

If you have any questions or would like to proceed with this estimate, please contact us.

Best regards,
${editedContactInfo.name || editedJobData.contactInfo?.name}
${editedContactInfo.position || editedJobData.contactInfo?.position}
${editedContactInfo.company || editedJobData.contactInfo?.company}
${editedContactInfo.phone || editedJobData.contactInfo?.phone}
${editedContactInfo.email || editedJobData.contactInfo?.email}
`

    // Create mailto link with subject and body
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    // Create a temporary link to download the PDF
    const pdfUrl = URL.createObjectURL(pdfFile)
    const downloadLink = document.createElement("a")
    downloadLink.href = pdfUrl
    downloadLink.download = `${editedJobData.projectName.replace(/\s+/g, "_")}_estimate.pdf`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)

    // Open email client
    window.location.href = mailtoLink
  }

  // Calculate section totals (without markups for project summary)
  const calculateSectionTotal = (section: any) => {
    const equipmentTotal = section.equipment.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
    const laborTotal = section.labor.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
    const materialsTotal = section.materials.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
    const truckingTotal = section.trucking.reduce((sum: number, item: any) => sum + (item.total || 0), 0)

    // Calculate mobilization cost if enabled
    let mobilizationTotal = 0
    if (
      editedJobData.mobilization?.enabled &&
      (!editedJobData.mobilization.sectionSpecific ||
        (editedJobData.mobilization.sectionSpecific && editedJobData.mobilization.sectionMobilization[section.id]))
    ) {
      const mobilizationCost = 1020 // Base cost
      mobilizationTotal = editedJobData.mobilization.sectionSpecific
        ? mobilizationCost *
          editedJobData.mobilization.numTrucks *
          (editedJobData.mobilization.tripType === "round-trip" ? 2 : 1)
        : (mobilizationCost *
            editedJobData.mobilization.numTrucks *
            (editedJobData.mobilization.tripType === "round-trip" ? 2 : 1)) /
          editedJobData.sections.filter((s: any) => editedJobData.selectedSections.includes(s.id)).length
    }

    return equipmentTotal + laborTotal + materialsTotal + truckingTotal + mobilizationTotal
  }

  // Calculate job total (without markups for project summary)
  const calculateJobTotal = () => {
    return editedJobData.sections
      .filter((section: any) => editedJobData.selectedSections.includes(section.id))
      .reduce((sum: number, section: any) => sum + calculateSectionTotal(section), 0)
  }

  // Get all equipment from selected sections
  const getAllEquipment = () => {
    const result = []

    for (const section of editedJobData.sections.filter((s: any) => editedJobData.selectedSections.includes(s.id))) {
      if (section.equipment.length > 0) {
        result.push({
          sectionName: section.name,
          items: section.equipment,
          total: section.equipment.reduce((sum: number, item: any) => sum + (item.total || 0), 0),
        })
      }
    }

    return result
  }

  // Get all labor from selected sections
  const getAllLabor = () => {
    const result = []

    for (const section of editedJobData.sections.filter((s: any) => editedJobData.selectedSections.includes(s.id))) {
      if (section.labor.length > 0) {
        result.push({
          sectionName: section.name,
          items: section.labor,
          total: section.labor.reduce((sum: number, item: any) => sum + (item.total || 0), 0),
        })
      }
    }

    return result
  }

  // Get all materials from selected sections
  const getAllMaterials = () => {
    const result = []

    for (const section of editedJobData.sections.filter((s: any) => editedJobData.selectedSections.includes(s.id))) {
      if (section.materials.length > 0) {
        result.push({
          sectionName: section.name,
          items: section.materials,
          total: section.materials.reduce((sum: number, item: any) => sum + (item.total || 0), 0),
        })
      }
    }

    return result
  }

  // Get all trucking from selected sections
  const getAllTrucking = () => {
    const result = []

    for (const section of editedJobData.sections.filter((s: any) => editedJobData.selectedSections.includes(s.id))) {
      if (section.trucking.length > 0) {
        result.push({
          sectionName: section.name,
          items: section.trucking,
          total: section.trucking.reduce((sum: number, item: any) => sum + (item.total || 0), 0),
        })
      }
    }

    return result
  }

  // Calculate total equipment cost
  const calculateTotalEquipmentCost = () => {
    return editedJobData.sections
      .filter((section: any) => editedJobData.selectedSections.includes(section.id))
      .reduce((sum: number, section: any) => {
        return sum + section.equipment.reduce((subSum: number, item: any) => subSum + (item.total || 0), 0)
      }, 0)
  }

  // Calculate total labor cost
  const calculateTotalLaborCost = () => {
    return editedJobData.sections
      .filter((section: any) => editedJobData.selectedSections.includes(section.id))
      .reduce((sum: number, section: any) => {
        return sum + section.labor.reduce((subSum: number, item: any) => subSum + (item.total || 0), 0)
      }, 0)
  }

  // Calculate total materials cost
  const calculateTotalMaterialsCost = () => {
    return editedJobData.sections
      .filter((section: any) => editedJobData.selectedSections.includes(section.id))
      .reduce((sum: number, section: any) => {
        return sum + section.materials.reduce((subSum: number, item: any) => subSum + (item.total || 0), 0)
      }, 0)
  }

  // Calculate total trucking cost
  const calculateTotalTruckingCost = () => {
    return editedJobData.sections
      .filter((section: any) => editedJobData.selectedSections.includes(section.id))
      .reduce((sum: number, section: any) => {
        return sum + section.trucking.reduce((subSum: number, item: any) => subSum + (item.total || 0), 0)
      }, 0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Job Summary</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={handleEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Save As
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div ref={printRef} className="p-4 bg-white">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-start gap-4">
              <img src="/NEW_Logo.jpg" alt="Spallina Materials" className="h-24 object-contain" />
              <div>
                <h1 className="text-3xl font-bold mb-2">Job Cost Estimate</h1>
                <div className="text-sm">
                  <p className="font-medium">Spallina Materials</p>
                  <p>ASPHALT - CONCRETE - STONE - SAND</p>
                  <p>01 Conlon Ave</p>
                  <p>Mt Morris, NY 14510</p>
                  <p>Phone: (585) 658-2248</p>
                  <p>
                    Email:{" "}
                    <a href="mailto:info@spallinamaterials.com" className="text-blue-600">
                      info@spallinamaterials.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">Date: {new Date().toLocaleDateString()}</p>
              <p className="font-medium">Estimate #: {formatQuoteNumber(quoteNumber)}</p>
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded-md mb-6">
            <h2 className="text-xl font-bold mb-2">Job Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p>
                  <strong>Job Name:</strong> {editedJobData.projectName || "Untitled Job"}
                </p>
                <p>
                  <strong>Location:</strong> {editedJobData.location || "N/A"}
                </p>
              </div>
              <div>
                <p>
                  <strong>Date:</strong> {editedJobData.date || "N/A"}
                </p>
                <p>
                  <strong>Total Area:</strong> {editedJobData.totalArea?.toLocaleString() || "0"} sq ft
                </p>
                <p>
                  <strong>Total Tonnage:</strong> {editedJobData.totalTonnage?.toLocaleString() || "0"} tons
                </p>
              </div>
            </div>
          </div>

          {/* Job Sections Summary */}
          {editedJobData.sections.filter((section: any) => editedJobData.selectedSections.includes(section.id)).length >
            0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Job Sections</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Section</th>
                    <th className="border p-2 text-right">Equipment</th>
                    <th className="border p-2 text-right">Labor</th>
                    <th className="border p-2 text-right">Materials</th>
                    <th className="border p-2 text-right">Trucking</th>
                    <th className="border p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {editedJobData.sections
                    .filter((section: any) => editedJobData.selectedSections.includes(section.id))
                    .map((section: any, idx: number) => {
                      const equipmentTotal = section.equipment.reduce(
                        (sum: number, item: any) => sum + (item.total || 0),
                        0,
                      )
                      const laborTotal = section.labor.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
                      const materialsTotal = section.materials.reduce(
                        (sum: number, item: any) => sum + (item.total || 0),
                        0,
                      )
                      const truckingTotal = section.trucking.reduce(
                        (sum: number, item: any) => sum + (item.total || 0),
                        0,
                      )

                      return (
                        <tr key={idx} className="border-b">
                          <td className="border p-2">{section.name}</td>
                          <td className="border p-2 text-right">${equipmentTotal.toFixed(2)}</td>
                          <td className="border p-2 text-right">${laborTotal.toFixed(2)}</td>
                          <td className="border p-2 text-right">${materialsTotal.toFixed(2)}</td>
                          <td className="border p-2 text-right">${truckingTotal.toFixed(2)}</td>
                          <td className="border p-2 text-right">${calculateSectionTotal(section).toFixed(2)}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* Detailed Cost Breakdown */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">Job Cost Summary</h2>
              <button className="text-blue-600 flex items-center text-sm" onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? (
                  <>
                    Hide Details <ChevronUp className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show Details <ChevronDown className="ml-1 h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {showDetails && (
              <>
                {/* Equipment Cost Breakdown */}
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Equipment Cost (Selected Sections):</h3>
                    <span className="font-semibold">${calculateTotalEquipmentCost().toFixed(2)}</span>
                  </div>

                  {getAllEquipment().map((sectionEquipment, idx) => (
                    <div key={`equipment-${idx}`} className="ml-4 mt-2">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-sm mr-2 flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                        <span className="font-medium">
                          {sectionEquipment.sectionName} - ${sectionEquipment.total.toFixed(2)}
                        </span>
                      </div>
                      {sectionEquipment.items.map((item, itemIdx) => (
                        <p key={`equipment-item-${idx}-${itemIdx}`} className="ml-6 text-gray-600 italic">
                          {item.name}: {item.quantity} {item.quantity > 1 ? "units" : "unit"} @ ${item.rate}/hr ×{" "}
                          {item.hours} hrs = ${item.total?.toFixed(2)}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Labor Cost Breakdown */}
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Labor Cost (Selected Sections):</h3>
                    <span className="font-semibold">${calculateTotalLaborCost().toFixed(2)}</span>
                  </div>

                  {getAllLabor().map((sectionLabor, idx) => (
                    <div key={`labor-${idx}`} className="ml-4 mt-2">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-sm mr-2 flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                        <span className="font-medium">
                          {sectionLabor.sectionName} - ${sectionLabor.total.toFixed(2)}
                        </span>
                      </div>
                      {sectionLabor.items.map((item, itemIdx) => (
                        <p key={`labor-item-${idx}-${itemIdx}`} className="ml-6 text-gray-600 italic">
                          {item.name}: {item.quantity} {item.quantity > 1 ? "workers" : "worker"} @ ${item.rate}/hr ×{" "}
                          {item.hours} hrs = ${item.total?.toFixed(2)}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Materials Cost Breakdown */}
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Materials Cost:</h3>
                    <span className="font-semibold">${calculateTotalMaterialsCost().toFixed(2)}</span>
                  </div>

                  {getAllMaterials().map((sectionMaterials, idx) => (
                    <div key={`materials-${idx}`} className="ml-4 mt-2">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-sm mr-2 flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                        <span className="font-medium">
                          {sectionMaterials.sectionName} - ${sectionMaterials.total.toFixed(2)}
                        </span>
                      </div>
                      {sectionMaterials.items.map((item, itemIdx) => (
                        <p key={`material-item-${idx}-${itemIdx}`} className="ml-6 text-gray-600 italic">
                          {item.name}: {item.quantity} {item.unit} @ ${item.rate}/{item.unit} = $
                          {item.total?.toFixed(2)}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Trucking Cost Breakdown */}
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Trucking Cost:</h3>
                    <span className="font-semibold">${calculateTotalTruckingCost().toFixed(2)}</span>
                  </div>

                  {getAllTrucking().map((sectionTrucking, idx) => (
                    <div key={`trucking-${idx}`} className="ml-4 mt-2">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-sm mr-2 flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                        <span className="font-medium">
                          {sectionTrucking.sectionName} - ${sectionTrucking.total.toFixed(2)}
                        </span>
                      </div>
                      {sectionTrucking.items.map((item, itemIdx) => (
                        <p key={`trucking-item-${idx}-${itemIdx}`} className="ml-6 text-gray-600 italic">
                          {item.name}: {item.quantity} {item.quantity > 1 ? "trucks" : "truck"} @ ${item.rate}/hr ×{" "}
                          {item.hours} hrs = ${item.total?.toFixed(2)}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-xl font-medium">Total Job Cost:</span>
                <span className="text-xl font-bold">${calculateJobTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {editedJobData.notes && (
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-2">Notes</h3>
              <p className="text-gray-700">{editedJobData.notes}</p>
            </div>
          )}

          <div className="mt-8 border-t pt-4">
            <h3 className="text-lg font-bold mb-2">Terms & Conditions</h3>
            {editMode ? (
              <Textarea
                value={editedJobData.terms || ""}
                onChange={(e) => setEditedJobData({ ...editedJobData, terms: e.target.value })}
                rows={4}
                placeholder="Enter terms and conditions"
              />
            ) : (
              <p className="text-gray-700">
                {editedJobData.terms ||
                  "This quote is valid for 30 days from the date of issue. Payment terms are net 30 days from invoice date. All work to be completed in a workmanlike manner according to standard practices."}
              </p>
            )}
          </div>

          <div className="mt-8 flex justify-between">
            <div>
              <p className="font-bold">Prepared By:</p>
              <p>{editedContactInfo.name || "___________________"}</p>
            </div>
            <div>
              <p className="font-bold">Customer Acceptance:</p>
              <div className="mt-4 border-b border-black w-48"></div>
              <p className="mt-1 text-sm">Signature & Date</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
