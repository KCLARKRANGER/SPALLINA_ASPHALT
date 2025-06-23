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
    const markupPercentage = jobData.markup?.[category] || 0
    // If markup is 0, just return the original cost
    return markupPercentage === 0 ? cost : cost * (1 + markupPercentage / 100)
  }

  // Calculate section total with markup applied
  const calculateSectionTotal = (section) => {
    const equipmentTotal = section.equipment?.reduce((sum, item) => sum + (Number(item.total) || 0), 0) || 0
    const laborTotal = section.labor?.reduce((sum, item) => sum + (Number(item.total) || 0), 0) || 0
    const materialsTotal = section.materials?.reduce((sum, item) => sum + (Number(item.total) || 0), 0) || 0
    const truckingTotal = section.trucking?.reduce((sum, item) => sum + (Number(item.total) || 0), 0) || 0
    const additionalItemsTotal = (section.additionalItems || []).reduce(
      (sum, item) => sum + (Number(item.total) || 0),
      0,
    )

    if (viewMode === "internal") {
      return equipmentTotal + laborTotal + materialsTotal + truckingTotal + additionalItemsTotal
    } else {
      return (
        applyMarkup(equipmentTotal, "equipment") +
        applyMarkup(laborTotal, "labor") +
        applyMarkup(materialsTotal, "materials") +
        applyMarkup(truckingTotal, "trucking") +
        applyMarkup(additionalItemsTotal, "materials") // Apply materials markup to additional items
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
      const additionalItemsTotal = calculateTotalAdditionalItemsCost()

      return (
        applyMarkup(equipmentTotal, "equipment") +
        applyMarkup(laborTotal, "labor") +
        applyMarkup(materialsTotal, "materials") +
        applyMarkup(truckingTotal, "trucking") +
        applyMarkup(additionalItemsTotal, "materials")
      )
    } else {
      return calculateJobTotal()
    }
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

  // Calculate total additional items cost
  const calculateTotalAdditionalItemsCost = () => {
    return jobData.sections
      .filter((section) => jobData.selectedSections.includes(section.id))
      .reduce((sum, section) => {
        return (
          sum + ((section.additionalItems || []).reduce((subSum, item) => subSum + (Number(item.total) || 0), 0) || 0)
        )
      }, 0)
  }

  const selectedSections = jobData.sections.filter((section) => jobData.selectedSections.includes(section.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Project Summary</DialogTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "internal" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("internal")}
            >
              <Eye className="mr-2 h-4 w-4" />
              Internal View
            </Button>
            <Button
              variant={viewMode === "customer" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("customer")}
            >
              <EyeOff className="mr-2 h-4 w-4" />
              Customer View
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
              {showDetails ? "Hide Details" : "Show Details"}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div ref={printRef} className="space-y-6 p-6 bg-white">
          {/* Header */}
          <div className="text-center border-b pb-6">
            <img src="/spallina-logo.jpeg" alt="Spallina Materials" className="mx-auto h-16 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">ASPHALT ESTIMATE</h1>
            <p className="text-lg text-gray-600 mt-2">Professional Paving Services</p>
          </div>

          {/* Project Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Project Information</h2>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Quote Number:</span> {formatQuoteNumber(jobData.quoteNumber)}
                </p>
                <p>
                  <span className="font-medium">Date:</span> {new Date(jobData.date).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Customer:</span> {jobData.customerName}
                </p>
                <p>
                  <span className="font-medium">Project:</span> {jobData.projectName}
                </p>
                <p>
                  <span className="font-medium">Location:</span> {jobData.projectLocation}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Contact Information</h2>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Prepared By:</span> {jobData.contactInfo?.preparedBy}
                </p>
                <p>
                  <span className="font-medium">Phone:</span> {jobData.contactInfo?.phone}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {jobData.contactInfo?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Project Summary */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Area</p>
                <p className="text-2xl font-bold text-blue-600">{jobData.totalArea?.toLocaleString() || "0"} sq ft</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Tonnage</p>
                <p className="text-2xl font-bold text-blue-600">{jobData.totalTonnage?.toFixed(2) || "0.00"} tons</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Estimate</p>
                <p className="text-3xl font-bold text-green-600">${calculateFinalQuoteAmount().toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Section Breakdown */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Section Breakdown</h2>

            {selectedSections.map((section) => (
              <div key={section.id} className="border rounded-lg p-6 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{section.name}</h3>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      ${calculateSectionTotal(section).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {section.area?.toFixed(2) || "0.00"} sq ft • {section.tons?.toFixed(2) || "0.00"} tons
                    </p>
                  </div>
                </div>

                {/* Section Notes */}
                {section.notes && (
                  <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Notes:</span> {section.notes}
                    </p>
                  </div>
                )}

                {showDetails && (
                  <div className="space-y-4">
                    {/* Materials */}
                    {section.materials && section.materials.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Materials</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Material</th>
                                <th className="text-right py-2">Quantity</th>
                                <th className="text-right py-2">Unit</th>
                                <th className="text-right py-2">Rate</th>
                                <th className="text-right py-2">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.materials.map((material, index) => (
                                <tr key={index} className="border-b">
                                  <td className="py-1">{material.name}</td>
                                  <td className="text-right py-1">{material.quantity?.toFixed(2) || "0.00"}</td>
                                  <td className="text-right py-1">{material.unit}</td>
                                  <td className="text-right py-1">${material.rate?.toFixed(2) || "0.00"}</td>
                                  <td className="text-right py-1 font-medium">
                                    $
                                    {viewMode === "customer"
                                      ? applyMarkup(material.total || 0, "materials").toFixed(2)
                                      : (material.total || 0).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Equipment */}
                    {section.equipment && section.equipment.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Equipment</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Equipment</th>
                                <th className="text-right py-2">Days</th>
                                <th className="text-right py-2">Hours</th>
                                <th className="text-right py-2">Rate</th>
                                <th className="text-right py-2">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.equipment.map((equipment, index) => (
                                <tr key={index} className="border-b">
                                  <td className="py-1">{equipment.name}</td>
                                  <td className="text-right py-1">{equipment.quantity}</td>
                                  <td className="text-right py-1">{equipment.hours}</td>
                                  <td className="text-right py-1">${equipment.rate?.toFixed(2) || "0.00"}</td>
                                  <td className="text-right py-1 font-medium">
                                    $
                                    {viewMode === "customer"
                                      ? applyMarkup(equipment.total || 0, "equipment").toFixed(2)
                                      : (equipment.total || 0).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Labor */}
                    {section.labor && section.labor.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Labor</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Role</th>
                                <th className="text-right py-2">Days</th>
                                <th className="text-right py-2">Hours</th>
                                <th className="text-right py-2">Rate</th>
                                <th className="text-right py-2">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.labor.map((labor, index) => (
                                <tr key={index} className="border-b">
                                  <td className="py-1">
                                    {labor.name} ({labor.title})
                                  </td>
                                  <td className="text-right py-1">{labor.quantity}</td>
                                  <td className="text-right py-1">{labor.hours}</td>
                                  <td className="text-right py-1">${labor.rate?.toFixed(2) || "0.00"}</td>
                                  <td className="text-right py-1 font-medium">
                                    $
                                    {viewMode === "customer"
                                      ? applyMarkup(labor.total || 0, "labor").toFixed(2)
                                      : (labor.total || 0).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Trucking */}
                    {section.trucking && section.trucking.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Trucking</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Type</th>
                                <th className="text-left py-2">Function</th>
                                <th className="text-right py-2">Quantity</th>
                                <th className="text-right py-2">Rate</th>
                                <th className="text-right py-2">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.trucking.map((trucking, index) => (
                                <tr key={index} className="border-b">
                                  <td className="py-1">{trucking.name}</td>
                                  <td className="py-1">{trucking.function}</td>
                                  <td className="text-right py-1">
                                    {trucking.quantity} ×{" "}
                                    {trucking.pricingType === "per-hour"
                                      ? `${trucking.hours} hrs`
                                      : `${trucking.tons} tons`}
                                  </td>
                                  <td className="text-right py-1">${trucking.rate?.toFixed(2) || "0.00"}</td>
                                  <td className="text-right py-1 font-medium">
                                    $
                                    {viewMode === "customer"
                                      ? applyMarkup(trucking.total || 0, "trucking").toFixed(2)
                                      : (trucking.total || 0).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Additional Items */}
                    {section.additionalItems && section.additionalItems.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Additional Items</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Description</th>
                                <th className="text-right py-2">Quantity</th>
                                <th className="text-right py-2">Unit</th>
                                <th className="text-right py-2">Rate</th>
                                <th className="text-right py-2">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.additionalItems.map((item, index) => (
                                <tr key={index} className="border-b">
                                  <td className="py-1">{item.description}</td>
                                  <td className="text-right py-1">{item.quantity?.toFixed(2) || "0.00"}</td>
                                  <td className="text-right py-1">{item.unit}</td>
                                  <td className="text-right py-1">${item.rate?.toFixed(2) || "0.00"}</td>
                                  <td className="text-right py-1 font-medium">
                                    $
                                    {viewMode === "customer"
                                      ? applyMarkup(item.total || 0, "materials").toFixed(2)
                                      : (item.total || 0).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Cost Summary */}
          {viewMode === "internal" && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Cost Breakdown (Internal)</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Equipment Cost:</span>
                  <span>${calculateTotalEquipmentCost().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Labor Cost:</span>
                  <span>${calculateTotalLaborCost().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Materials Cost:</span>
                  <span>${calculateTotalMaterialsCost().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trucking Cost:</span>
                  <span>${calculateTotalTruckingCost().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Additional Items Cost:</span>
                  <span>${calculateTotalAdditionalItemsCost().toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Subtotal (Base Cost):</span>
                  <span>${calculateJobTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Equipment Markup ({jobData.markup?.equipment || 0}%):</span>
                  <span>
                    $
                    {(applyMarkup(calculateTotalEquipmentCost(), "equipment") - calculateTotalEquipmentCost()).toFixed(
                      2,
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Labor Markup ({jobData.markup?.labor || 0}%):</span>
                  <span>
                    ${(applyMarkup(calculateTotalLaborCost(), "labor") - calculateTotalLaborCost()).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Materials Markup ({jobData.markup?.materials || 0}%):</span>
                  <span>
                    $
                    {(applyMarkup(calculateTotalMaterialsCost(), "materials") - calculateTotalMaterialsCost()).toFixed(
                      2,
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Trucking Markup ({jobData.markup?.trucking || 0}%):</span>
                  <span>
                    ${(applyMarkup(calculateTotalTruckingCost(), "trucking") - calculateTotalTruckingCost()).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Additional Items Markup ({jobData.markup?.materials || 0}%):</span>
                  <span>
                    $
                    {(
                      applyMarkup(calculateTotalAdditionalItemsCost(), "materials") -
                      calculateTotalAdditionalItemsCost()
                    ).toFixed(2)}
                  </span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total with Markup:</span>
                  <span>${calculateFinalQuoteAmount().toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Project Notes */}
          {jobData.notes && (
            <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Notes</h2>
              <div className="whitespace-pre-wrap text-gray-700">{jobData.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-gray-600 border-t pt-6">
            <p>This estimate is valid for 30 days from the date of issue.</p>
            <p>All work will be performed in accordance with industry standards and local regulations.</p>
            <p className="mt-2">
              <strong>Spallina Materials</strong> • Professional Asphalt Services
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
