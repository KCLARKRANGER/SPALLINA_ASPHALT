"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatQuoteNumber } from "@/utils/quote-number"
import { Printer, Mail, X, Download, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"

interface QuotePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobData: any
}

export function QuotePreview({ open, onOpenChange, jobData }: QuotePreviewProps) {
  const [showDetails, setShowDetails] = useState(true)
  const [viewMode, setViewMode] = useState<"internal" | "customer">("internal")
  const printRef = useRef<HTMLDivElement>(null)

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

  const handleExportPDF = async () => {
    if (!printRef.current) return

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      pdf.save(`estimate-${jobData.quoteNumber}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
    }
  }

  const handleEmail = async () => {
    if (!printRef.current) return

    try {
      // First generate the PDF
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)

      // Save the PDF file
      const pdfBlob = pdf.output("blob")
      const pdfUrl = URL.createObjectURL(pdfBlob)

      // Download the PDF automatically
      const link = document.createElement("a")
      link.href = pdfUrl
      link.download = `estimate-${jobData.quoteNumber}.pdf`
      link.click()

      // Create email with pre-filled content
      const subject = `Asphalt Estimate for ${jobData.projectName || "Project"}`
      const body = `Dear ${jobData.customerName || "Customer"},

I hope this email finds you well. Attached please find our detailed estimate for the ${jobData.projectName || "Project"} project located at ${jobData.projectLocation || "Location"}.

Quote Number: ${jobData.quoteNumber}
Total Estimate: $${calculateFinalQuoteAmount().toFixed(2)}

Please review the attached PDF and let me know if you have any questions or if you would like to discuss any aspects of this estimate.

Thank you for considering Spallina Materials for your project.

Best regards,
${jobData.contactInfo?.preparedBy || "Estimator"}
${jobData.contactInfo?.phone || ""}
${jobData.contactInfo?.email || ""}`

      // Open email client with pre-filled content
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    } catch (error) {
      console.error("Error preparing email:", error)
    }
  }

  // Apply markup to a cost based on category
  const applyMarkup = (cost, category) => {
    const markupPercentage = jobData.markup?.[category] || 15
    return cost * (1 + markupPercentage / 100)
  }

  // Calculate section total with markup applied
  const calculateSectionTotal = (section) => {
    const equipmentTotal = section.equipment?.reduce((sum, item) => sum + (Number(item.total) || 0), 0) || 0
    const laborTotal = section.labor?.reduce((sum, item) => sum + (Number(item.total) || 0), 0) || 0
    const materialsTotal = section.materials?.reduce((sum, item) => sum + (Number(item.total) || 0), 0) || 0
    const truckingTotal = section.trucking?.reduce((sum, item) => sum + (Number(item.total) || 0), 0) || 0

    if (viewMode === "internal") {
      return equipmentTotal + laborTotal + materialsTotal + truckingTotal
    } else {
      return (
        applyMarkup(equipmentTotal, "equipment") +
        applyMarkup(laborTotal, "labor") +
        applyMarkup(materialsTotal, "materials") +
        applyMarkup(truckingTotal, "trucking")
      )
    }
  }

  // Calculate job total
  const calculateJobTotal = () => {
    return jobData.sections
      .filter((section) => jobData.selectedSections.includes(section.id))
      .reduce((sum, section) => sum + calculateSectionTotal(section), 0)
  }

  // Calculate final quote amount with markup
  const calculateFinalQuoteAmount = () => {
    if (viewMode === "internal") {
      const equipmentTotal = calculateTotalEquipmentCost()
      const laborTotal = calculateTotalLaborCost()
      const materialsTotal = calculateTotalMaterialsCost()
      const truckingTotal = calculateTotalTruckingCost()

      return (
        applyMarkup(equipmentTotal, "equipment") +
        applyMarkup(laborTotal, "labor") +
        applyMarkup(materialsTotal, "materials") +
        applyMarkup(truckingTotal, "trucking")
      )
    } else {
      return calculateJobTotal()
    }
  }

  // Get all equipment from selected sections
  const getAllEquipment = () => {
    const result = []

    for (const section of jobData.sections.filter((s) => jobData.selectedSections.includes(s.id))) {
      if (section.equipment && section.equipment.length > 0) {
        result.push({
          sectionName: section.name,
          items: section.equipment,
          total: section.equipment.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
        })
      }
    }

    return result
  }

  // Get all labor from selected sections
  const getAllLabor = () => {
    const result = []

    for (const section of jobData.sections.filter((s) => jobData.selectedSections.includes(s.id))) {
      if (section.labor && section.labor.length > 0) {
        result.push({
          sectionName: section.name,
          items: section.labor,
          total: section.labor.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
        })
      }
    }

    return result
  }

  // Get all materials from selected sections
  const getAllMaterials = () => {
    const result = []

    for (const section of jobData.sections.filter((s) => jobData.selectedSections.includes(s.id))) {
      if (section.materials && section.materials.length > 0) {
        result.push({
          sectionName: section.name,
          items: section.materials,
          total: section.materials.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
        })
      }
    }

    return result
  }

  // Get all trucking from selected sections
  const getAllTrucking = () => {
    const result = []

    for (const section of jobData.sections.filter((s) => jobData.selectedSections.includes(s.id))) {
      if (section.trucking && section.trucking.length > 0) {
        result.push({
          sectionName: section.name,
          items: section.trucking,
          total: section.trucking.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
        })
      }
    }

    return result
  }

  // Calculate total equipment cost
  const calculateTotalEquipmentCost = () => {
    return jobData.sections
      .filter((section) => jobData.selectedSections.includes(section.id))
      .reduce((sum, section) => {
        return sum + (section.equipment?.reduce((subSum, item) => subSum + (Number(item.total) || 0), 0) || 0)
      }, 0)
  }

  // Calculate total labor cost
  const calculateTotalLaborCost = () => {
    return jobData.sections
      .filter((section) => jobData.selectedSections.includes(section.id))
      .reduce((sum, section) => {
        return sum + (section.labor?.reduce((subSum, item) => subSum + (Number(item.total) || 0), 0) || 0)
      }, 0)
  }

  // Calculate total materials cost
  const calculateTotalMaterialsCost = () => {
    return jobData.sections
      .filter((section) => jobData.selectedSections.includes(section.id))
      .reduce((sum, section) => {
        return sum + (section.materials?.reduce((subSum, item) => subSum + (Number(item.total) || 0), 0) || 0)
      }, 0)
  }

  // Calculate total trucking cost
  const calculateTotalTruckingCost = () => {
    return jobData.sections
      .filter((section) => jobData.selectedSections.includes(section.id))
      .reduce((sum, section) => {
        return sum + (section.trucking?.reduce((subSum, item) => subSum + (Number(item.total) || 0), 0) || 0)
      }, 0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Job Summary</DialogTitle>
        </DialogHeader>
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={handleEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Save As PDF
            </Button>
            <Button variant={viewMode === "internal" ? "default" : "outline"} onClick={() => setViewMode("internal")}>
              <Eye className="mr-2 h-4 w-4" />
              Internal View
            </Button>
            <Button variant={viewMode === "customer" ? "default" : "outline"} onClick={() => setViewMode("customer")}>
              <EyeOff className="mr-2 h-4 w-4" />
              Customer View
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div ref={printRef} className="p-4 bg-white">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-start gap-4">
              <div className="h-24 w-auto">
                <img src="/spallina-logo.jpeg" alt="Spallina Materials" className="h-full w-auto object-contain" />
              </div>
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
                    <a href="mailto:dspallina@spallinamaterials.com" className="text-blue-600">
                      dspallina@spallinamaterials.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">Date: {jobData.date || new Date().toLocaleDateString()}</p>
              <p className="font-medium">
                Estimate #: {formatQuoteNumber ? formatQuoteNumber(jobData.quoteNumber) : jobData.quoteNumber}
              </p>
              {viewMode === "internal" && (
                <p className="text-xs text-red-600 font-bold mt-2">INTERNAL VIEW - NOT FOR CUSTOMER</p>
              )}
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded-md mb-6">
            <h2 className="text-xl font-bold mb-2">Job Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p>
                  <strong>Job Name:</strong> {jobData.projectName || "Untitled Job"}
                </p>
                <p>
                  <strong>Location:</strong> {jobData.projectLocation || "N/A"}
                </p>
              </div>
              <div>
                <p>
                  <strong>Date:</strong> {jobData.date || "N/A"}
                </p>
                <p>
                  <strong>Total Area:</strong> {jobData.totalArea ? jobData.totalArea.toLocaleString() : "0"} sq ft
                </p>
                <p>
                  <strong>Total Tonnage:</strong> {jobData.totalTonnage ? jobData.totalTonnage.toLocaleString() : "0"}{" "}
                  tons
                </p>
              </div>
            </div>
          </div>

          {/* Job Sections Summary */}
          {jobData.sections.filter((section) => jobData.selectedSections.includes(section.id)).length > 0 && (
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
                  {jobData.sections
                    .filter((section) => jobData.selectedSections.includes(section.id))
                    .map((section, idx) => {
                      const equipmentTotal =
                        section.equipment?.reduce((sum, item) => sum + (Number(item.total) || 0), 0) || 0
                      const laborTotal = section.labor?.reduce((sum, item) => sum + (Number(item.total) || 0), 0) || 0
                      const materialsTotal =
                        section.materials?.reduce((sum, item) => sum + (Number(item.total) || 0), 0) || 0
                      const truckingTotal =
                        section.trucking?.reduce((sum, item) => sum + (Number(item.total) || 0), 0) || 0

                      // Calculate marked-up costs
                      const equipmentTotalWithMarkup = applyMarkup(equipmentTotal, "equipment")
                      const laborTotalWithMarkup = applyMarkup(laborTotal, "labor")
                      const materialsTotalWithMarkup = applyMarkup(materialsTotal, "materials")
                      const truckingTotalWithMarkup = applyMarkup(truckingTotal, "trucking")

                      return (
                        <tr key={idx} className="border-b">
                          <td className="border p-2">{section.name}</td>
                          <td className="border p-2 text-right">
                            {viewMode === "internal" ? (
                              <>
                                <span className="italic text-gray-600">${equipmentTotal?.toFixed(2)}</span>
                                <br />
                                <span className="font-bold">${equipmentTotalWithMarkup?.toFixed(2)}</span>
                              </>
                            ) : (
                              <>${equipmentTotalWithMarkup?.toFixed(2)}</>
                            )}
                          </td>
                          <td className="border p-2 text-right">
                            {viewMode === "internal" ? (
                              <>
                                <span className="italic text-gray-600">${laborTotal?.toFixed(2)}</span>
                                <br />
                                <span className="font-bold">${laborTotalWithMarkup?.toFixed(2)}</span>
                              </>
                            ) : (
                              <>${laborTotalWithMarkup?.toFixed(2)}</>
                            )}
                          </td>
                          <td className="border p-2 text-right">
                            {viewMode === "internal" ? (
                              <>
                                <span className="italic text-gray-600">${materialsTotal?.toFixed(2)}</span>
                                <br />
                                <span className="font-bold">${materialsTotalWithMarkup?.toFixed(2)}</span>
                              </>
                            ) : (
                              <>${materialsTotalWithMarkup?.toFixed(2)}</>
                            )}
                          </td>
                          <td className="border p-2 text-right">
                            {viewMode === "internal" ? (
                              <>
                                <span className="italic text-gray-600">${truckingTotal?.toFixed(2)}</span>
                                <br />
                                <span className="font-bold">${truckingTotalWithMarkup?.toFixed(2)}</span>
                              </>
                            ) : (
                              <>${truckingTotalWithMarkup?.toFixed(2)}</>
                            )}
                          </td>
                          <td className="border p-2 text-right font-bold">
                            {viewMode === "internal" ? (
                              <>
                                <span className="italic text-gray-600">
                                  ${(equipmentTotal + laborTotal + materialsTotal + truckingTotal)?.toFixed(2)}
                                </span>
                                <br />
                                <span className="font-bold">
                                  $
                                  {(
                                    equipmentTotalWithMarkup +
                                    laborTotalWithMarkup +
                                    materialsTotalWithMarkup +
                                    truckingTotalWithMarkup
                                  )?.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <>
                                $
                                {(
                                  equipmentTotalWithMarkup +
                                  laborTotalWithMarkup +
                                  materialsTotalWithMarkup +
                                  truckingTotalWithMarkup
                                )?.toFixed(2)}
                              </>
                            )}
                          </td>
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
                    <span className="font-semibold">
                      {viewMode === "internal" ? (
                        <>
                          <span className="italic text-gray-600">${calculateTotalEquipmentCost().toFixed(2)}</span>
                          {" → "}
                          <span className="font-bold">
                            ${applyMarkup(calculateTotalEquipmentCost(), "equipment").toFixed(2)}
                          </span>{" "}
                          <span className="text-xs text-gray-500">({jobData.markup?.equipment || 15}% markup)</span>
                        </>
                      ) : (
                        <>${applyMarkup(calculateTotalEquipmentCost(), "equipment").toFixed(2)}</>
                      )}
                    </span>
                  </div>

                  {getAllEquipment().map((sectionEquipment, idx) => (
                    <div key={`equipment-${idx}`} className="ml-4 mt-2">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-sm mr-2 flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                        <span className="font-medium">
                          {sectionEquipment.sectionName} -
                          {viewMode === "internal" ? (
                            <>
                              <span className="italic text-gray-600"> ${sectionEquipment.total.toFixed(2)}</span>
                              {" → "}
                              <span className="font-bold">
                                ${applyMarkup(sectionEquipment.total, "equipment").toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <> ${applyMarkup(sectionEquipment.total, "equipment").toFixed(2)}</>
                          )}
                        </span>
                      </div>
                      {sectionEquipment.items.map((item, itemIdx) => (
                        <p key={`equipment-item-${idx}-${itemIdx}`} className="ml-6 text-gray-600 italic">
                          {item.name}: {item.quantity || 0} {(item.quantity || 0) > 1 ? "units" : "unit"} @
                          {viewMode === "internal" ? (
                            <>
                              <span className="italic"> ${(Number(item.rate) || 0).toFixed(2)}</span>
                              {" → "}
                              <span className="font-medium">
                                ${applyMarkup(Number(item.rate) || 0, "equipment").toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <> ${applyMarkup(Number(item.rate) || 0, "equipment").toFixed(2)}</>
                          )}
                          /hr × {item.hours || 0} hrs =
                          {viewMode === "internal" ? (
                            <>
                              <span className="italic"> ${(Number(item.total) || 0).toFixed(2)}</span>
                              {" → "}
                              <span className="font-medium">
                                ${applyMarkup(Number(item.total) || 0, "equipment").toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <> ${applyMarkup(Number(item.total) || 0, "equipment").toFixed(2)}</>
                          )}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Labor Cost Breakdown */}
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Labor Cost (Selected Sections):</h3>
                    <span className="font-semibold">
                      {viewMode === "internal" ? (
                        <>
                          <span className="italic text-gray-600">${calculateTotalLaborCost().toFixed(2)}</span>
                          {" → "}
                          <span className="font-bold">
                            ${applyMarkup(calculateTotalLaborCost(), "labor").toFixed(2)}
                          </span>{" "}
                          <span className="text-xs text-gray-500">({jobData.markup?.labor || 15}% markup)</span>
                        </>
                      ) : (
                        <>${applyMarkup(calculateTotalLaborCost(), "labor").toFixed(2)}</>
                      )}
                    </span>
                  </div>

                  {getAllLabor().map((sectionLabor, idx) => (
                    <div key={`labor-${idx}`} className="ml-4 mt-2">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-sm mr-2 flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                        <span className="font-medium">
                          {sectionLabor.sectionName} -
                          {viewMode === "internal" ? (
                            <>
                              <span className="italic text-gray-600"> ${sectionLabor.total.toFixed(2)}</span>
                              {" → "}
                              <span className="font-bold">${applyMarkup(sectionLabor.total, "labor").toFixed(2)}</span>
                            </>
                          ) : (
                            <> ${applyMarkup(sectionLabor.total, "labor").toFixed(2)}</>
                          )}
                        </span>
                      </div>
                      {sectionLabor.items.map((item, itemIdx) => {
                        const regularHours = Math.min(item.hours || 0, 8)
                        const overtimeHours = Math.max((item.hours || 0) - 8, 0)
                        const regularPay = (item.quantity || 0) * regularHours * (Number(item.rate) || 0)
                        const overtimePay = (item.quantity || 0) * overtimeHours * (Number(item.overtimeRate) || 0)
                        const totalPay = regularPay + overtimePay

                        return (
                          <p key={`labor-item-${idx}-${itemIdx}`} className="ml-6 text-gray-600 italic">
                            {item.name}: {item.quantity || 0} {(item.quantity || 0) > 1 ? "workers" : "worker"} @
                            {viewMode === "internal" ? (
                              <>
                                <span className="italic"> ${(Number(item.rate) || 0).toFixed(2)}</span>
                                {" → "}
                                <span className="font-medium">
                                  ${applyMarkup(Number(item.rate) || 0, "labor").toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <> ${applyMarkup(Number(item.rate) || 0, "labor").toFixed(2)}</>
                            )}
                            /hr × {regularHours} hrs
                            {overtimeHours > 0 && (
                              <>
                                {" + "}
                                <span className="text-orange-500">{overtimeHours} OT hrs</span> @
                                {viewMode === "internal" ? (
                                  <>
                                    <span className="italic"> ${(Number(item.overtimeRate) || 0).toFixed(2)}</span>
                                    {" → "}
                                    <span className="font-medium">
                                      ${applyMarkup(Number(item.overtimeRate) || 0, "labor").toFixed(2)}
                                    </span>
                                  </>
                                ) : (
                                  <> ${applyMarkup(Number(item.overtimeRate) || 0, "labor").toFixed(2)}</>
                                )}
                                /hr
                              </>
                            )}
                            {" = "}
                            {viewMode === "internal" ? (
                              <>
                                <span className="italic">${totalPay.toFixed(2)}</span>
                                {" → "}
                                <span className="font-medium">${applyMarkup(totalPay, "labor").toFixed(2)}</span>
                              </>
                            ) : (
                              <>${applyMarkup(totalPay, "labor").toFixed(2)}</>
                            )}
                          </p>
                        )
                      })}
                    </div>
                  ))}
                </div>

                {/* Materials Cost Breakdown */}
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Materials Cost:</h3>
                    <span className="font-semibold">
                      {viewMode === "internal" ? (
                        <>
                          <span className="italic text-gray-600">${calculateTotalMaterialsCost().toFixed(2)}</span>
                          {" → "}
                          <span className="font-bold">
                            ${applyMarkup(calculateTotalMaterialsCost(), "materials").toFixed(2)}
                          </span>{" "}
                          <span className="text-xs text-gray-500">({jobData.markup?.materials || 15}% markup)</span>
                        </>
                      ) : (
                        <>${applyMarkup(calculateTotalMaterialsCost(), "materials").toFixed(2)}</>
                      )}
                    </span>
                  </div>

                  {getAllMaterials().map((sectionMaterials, idx) => (
                    <div key={`materials-${idx}`} className="ml-4 mt-2">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-sm mr-2 flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                        <span className="font-medium">
                          {sectionMaterials.sectionName} -
                          {viewMode === "internal" ? (
                            <>
                              <span className="italic text-gray-600"> ${sectionMaterials.total.toFixed(2)}</span>
                              {" → "}
                              <span className="font-bold">
                                ${applyMarkup(sectionMaterials.total, "materials").toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <> ${applyMarkup(sectionMaterials.total, "materials").toFixed(2)}</>
                          )}
                        </span>
                      </div>
                      {sectionMaterials.items.map((item, itemIdx) => (
                        <p key={`material-item-${idx}-${itemIdx}`} className="ml-6 text-gray-600 italic">
                          {item.name}: {item.thickness ? `${item.thickness}" thick, ` : ""}
                          {item.quantity || 0} {item.unit} @
                          {viewMode === "internal" ? (
                            <>
                              <span className="italic"> ${(Number(item.rate) || 0).toFixed(2)}</span>
                              {" → "}
                              <span className="font-medium">
                                ${applyMarkup(Number(item.rate) || 0, "materials").toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <> ${applyMarkup(Number(item.rate) || 0, "materials").toFixed(2)}</>
                          )}
                          /{item.unit} =
                          {viewMode === "internal" ? (
                            <>
                              <span className="italic"> ${(Number(item.total) || 0).toFixed(2)}</span>
                              {" → "}
                              <span className="font-medium">
                                ${applyMarkup(Number(item.total) || 0, "materials").toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <> ${applyMarkup(Number(item.total) || 0, "materials").toFixed(2)}</>
                          )}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Trucking Cost Breakdown */}
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Trucking Cost:</h3>
                    <span className="font-semibold">
                      {viewMode === "internal" ? (
                        <>
                          <span className="italic text-gray-600">${calculateTotalTruckingCost().toFixed(2)}</span>
                          {" → "}
                          <span className="font-bold">
                            ${applyMarkup(calculateTotalTruckingCost(), "trucking").toFixed(2)}
                          </span>{" "}
                          <span className="text-xs text-gray-500">({jobData.markup?.trucking || 15}% markup)</span>
                        </>
                      ) : (
                        <>${applyMarkup(calculateTotalTruckingCost(), "trucking").toFixed(2)}</>
                      )}
                    </span>
                  </div>

                  {getAllTrucking().map((sectionTrucking, idx) => (
                    <div key={`trucking-${idx}`} className="ml-4 mt-2">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-sm mr-2 flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                        <span className="font-medium">
                          {sectionTrucking.sectionName} -
                          {viewMode === "internal" ? (
                            <>
                              <span className="italic text-gray-600"> ${sectionTrucking.total.toFixed(2)}</span>
                              {" → "}
                              <span className="font-bold">
                                ${applyMarkup(sectionTrucking.total, "trucking").toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <> ${applyMarkup(sectionTrucking.total, "trucking").toFixed(2)}</>
                          )}
                        </span>
                      </div>
                      {sectionTrucking.items.map((item, itemIdx) => {
                        if (item.pricingType === "per-ton") {
                          return (
                            <p key={`trucking-item-${idx}-${itemIdx}`} className="ml-6 text-gray-600 italic">
                              {item.name} ({item.function}): {item.quantity || 0}{" "}
                              {(item.quantity || 0) > 1 ? "trucks" : "truck"} @
                              {viewMode === "internal" ? (
                                <>
                                  <span className="italic"> ${(Number(item.rate) || 0).toFixed(2)}</span>
                                  {" → "}
                                  <span className="font-medium">
                                    ${applyMarkup(Number(item.rate) || 0, "trucking").toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <> ${applyMarkup(Number(item.rate) || 0, "trucking").toFixed(2)}</>
                              )}
                              /ton × {item.tons} tons =
                              {viewMode === "internal" ? (
                                <>
                                  <span className="italic"> ${(Number(item.total) || 0).toFixed(2)}</span>
                                  {" → "}
                                  <span className="font-medium">
                                    ${applyMarkup(Number(item.total) || 0, "trucking").toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <> ${applyMarkup(Number(item.total) || 0, "trucking").toFixed(2)}</>
                              )}
                            </p>
                          )
                        } else {
                          return (
                            <p key={`trucking-item-${idx}-${itemIdx}`} className="ml-6 text-gray-600 italic">
                              {item.name} ({item.function}): {item.quantity || 0}{" "}
                              {(item.quantity || 0) > 1 ? "trucks" : "truck"} @
                              {viewMode === "internal" ? (
                                <>
                                  <span className="italic"> ${(Number(item.rate) || 0).toFixed(2)}</span>
                                  {" → "}
                                  <span className="font-medium">
                                    ${applyMarkup(Number(item.rate) || 0, "trucking").toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <> ${applyMarkup(Number(item.rate) || 0, "trucking").toFixed(2)}</>
                              )}
                              /hr × {item.hours || 0} hrs =
                              {viewMode === "internal" ? (
                                <>
                                  <span className="italic"> ${(Number(item.total) || 0).toFixed(2)}</span>
                                  {" → "}
                                  <span className="font-medium">
                                    ${applyMarkup(Number(item.total) || 0, "trucking").toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <> ${applyMarkup(Number(item.total) || 0, "trucking").toFixed(2)}</>
                              )}
                            </p>
                          )
                        }
                      })}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-xl font-medium">Total Job Cost:</span>
                <span className="text-xl font-bold">${calculateFinalQuoteAmount().toFixed(2)}</span>
              </div>
              {viewMode === "internal" && (
                <div className="mt-2 text-sm">
                  <p className="font-medium">Base Cost: ${calculateJobTotal().toFixed(2)}</p>
                  <div className="grid grid-cols-2 gap-x-4 mt-1">
                    <p>
                      <span className="font-medium">Equipment Markup:</span> {jobData.markup?.equipment || 15}%
                    </p>
                    <p>
                      <span className="font-medium">Labor Markup:</span> {jobData.markup?.labor || 15}%
                    </p>
                    <p>
                      <span className="font-medium">Materials Markup:</span> {jobData.markup?.materials || 15}%
                    </p>
                    <p>
                      <span className="font-medium">Trucking Markup:</span> {jobData.markup?.trucking || 15}%
                    </p>
                    <p>
                      <span className="font-medium">Overtime Markup:</span> {jobData.markup?.overtime || 15}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {jobData.notes && (
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-2">Notes</h3>
              <p className="text-gray-700">{jobData.notes}</p>
            </div>
          )}

          <div className="mt-8 border-t pt-4">
            <h3 className="text-lg font-bold mb-2">Terms & Conditions</h3>
            <p className="text-gray-700">
              {jobData.terms ||
                "This quote is valid for 30 days from the date of issue. Payment terms are net 30 days from invoice date. All work to be completed in a workmanlike manner according to standard practices."}
            </p>
          </div>

          <div className="mt-8 flex justify-between">
            <div>
              <p className="font-bold">Prepared By:</p>
              <p>{jobData.contactInfo?.preparedBy || "___________________"}</p>
              {jobData.contactInfo?.phone && <p>{jobData.contactInfo.phone}</p>}
              {jobData.contactInfo?.email && <p>{jobData.contactInfo.email}</p>}
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
