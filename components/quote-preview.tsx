"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatQuoteNumber } from "@/utils/quote-number"
import { Printer, Mail, X, Download, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react"
import { useState, useEffect } from "react"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"

interface QuotePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobData: any
}

const printStyles = `
  @media print {
    .section-container {
      page-break-inside: avoid;
      break-inside: avoid;
      margin-bottom: 2rem;
    }
    .section-container:nth-child(2n) {
      page-break-after: always;
    }
    .section-container:last-child {
      page-break-after: auto;
    }
    .no-break {
      page-break-inside: avoid;
    }
    body { margin: 0; }
    .print\\:block { display: block !important; }
    .print\\:hidden { display: none !important; }
    
    /* Ensure logo prints properly */
    .print-logo {
      display: block !important;
      height: 60px !important;
      margin: 0 auto 15px auto !important;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    .print-header {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    @page {
      margin: 0.5in;
      size: letter;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 12px;
        color: #666;
      }
    }
    
    .page-counter {
      position: fixed;
      bottom: 0.3in;
      right: 0.5in;
      font-size: 12px;
      color: #666;
      z-index: 1000;
    }
  }
  
  @page {
    margin: 0.5in;
    size: letter;
  }
`

export function QuotePreview({ open, onOpenChange, jobData }: QuotePreviewProps) {
  const [showDetails, setShowDetails] = useState(true)
  const [viewMode, setViewMode] = useState<"internal" | "customer">("internal")
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const styleSheet = document.createElement("style")
    styleSheet.type = "text/css"
    styleSheet.innerText = printStyles
    document.head.appendChild(styleSheet)

    return () => {
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet)
      }
    }
  }, [])

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        // Calculate total pages based on sections (2 per page)
        const selectedSections = jobData.sections.filter((section) => jobData.selectedSections.includes(section.id))
        const totalPages = Math.ceil(selectedSections.length / 2)

        printWindow.document.write(`
      <html>
        <head>
          <title>Print Preview</title>
          <style>
            ${printStyles}
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: bold; }
            .font-medium { font-weight: 500; }
            .text-lg { font-size: 1.125rem; }
            .text-xl { font-size: 1.25rem; }
            .text-2xl { font-size: 1.5rem; }
            .text-3xl { font-size: 1.875rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .p-3 { padding: 0.75rem; }
            .p-4 { padding: 1rem; }
            .p-6 { padding: 1.5rem; }
            .border { border: 1px solid #e5e7eb; }
            .border-b { border-bottom: 1px solid #e5e7eb; }
            .border-l-4 { border-left: 4px solid; }
            .rounded-lg { border-radius: 0.5rem; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-blue-50 { background-color: #eff6ff; }
            .bg-yellow-50 { background-color: #fefce8; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-700 { color: #374151; }
            .text-gray-800 { color: #1f2937; }
            .text-blue-600 { color: #2563eb; }
            .text-green-600 { color: #16a34a; }
            .border-yellow-400 { border-color: #facc15; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { font-weight: 500; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .gap-4 { gap: 1rem; }
            .gap-6 { gap: 1.5rem; }
            .space-y-2 > * + * { margin-top: 0.5rem; }
            .space-y-3 > * + * { margin-top: 0.75rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            .space-y-6 > * + * { margin-top: 1.5rem; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-center { align-items: center; }
            
            /* Ensure logo prints */
            img { 
              max-width: 100%; 
              height: auto; 
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            .print-logo {
              display: block !important;
              height: 60px !important;
              margin: 0 auto 15px auto !important;
            }
            
            /* Page numbering */
            .page-counter {
              position: fixed;
              bottom: 0.3in;
              right: 0.5in;
              font-size: 12px;
              color: #666;
              z-index: 1000;
            }
          </style>
        </head>
        <body>
          ${printRef.current.innerHTML}
        </body>
      </html>
    `)
        printWindow.document.close()

        // Wait for images to load before printing
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
            printWindow.close()
          }, 500)
        }
      }
    }
  }

  const handleExportPDF = async () => {
    if (!printRef.current) return

    try {
      const selectedSections = jobData.sections.filter((section) => jobData.selectedSections.includes(section.id))
      const sectionsPerPage = 2
      const totalPages = Math.ceil(selectedSections.length / sectionsPerPage)

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Remove the first page since we'll add it manually
      pdf.deletePage(1)

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        // Create a temporary container for this page
        const pageContainer = document.createElement("div")
        pageContainer.style.width = "210mm"
        pageContainer.style.minHeight = "297mm"
        pageContainer.style.padding = "20px"
        pageContainer.style.backgroundColor = "white"
        pageContainer.style.fontFamily = "Arial, sans-serif"

        // Add header (only on first page)
        if (pageNum === 1) {
          pageContainer.innerHTML = `
          <div style="text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 20px; margin-bottom: 20px;">
            <img src="/NEW_Logo.jpg" alt="Spallina Materials" style="height: 60px; margin-bottom: 15px;" />
            <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0;">ASPHALT ESTIMATE</h1>
            <p style="font-size: 16px; color: #4b5563; margin: 10px 0 0 0;">Professional Paving Services</p>
          </div>
        `

          // Add project info on first page
          const projectInfo = `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
            <div>
              <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; border-bottom: 1px solid #ccc; padding-bottom: 8px;">Project Information</h2>
              <div style="margin-top: 15px;">
                <p><strong>Quote Number:</strong> ${formatQuoteNumber(jobData.quoteNumber)}</p>
                <p><strong>Date:</strong> ${new Date(jobData.date).toLocaleDateString()}</p>
                <p><strong>Customer:</strong> ${jobData.customerName}</p>
                <p><strong>Project:</strong> ${jobData.projectName}</p>
                <p><strong>Location:</strong> ${jobData.projectLocation}</p>
              </div>
            </div>
            <div>
              <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; border-bottom: 1px solid #ccc; padding-bottom: 8px;">Contact Information</h2>
              <div style="margin-top: 15px;">
                <p><strong>Prepared By:</strong> ${jobData.contactInfo?.preparedBy || ""}</p>
                <p><strong>Phone:</strong> ${jobData.contactInfo?.phone || ""}</p>
                <p><strong>Email:</strong> ${jobData.contactInfo?.email || ""}</p>
              </div>
            </div>
          </div>
        `
          pageContainer.innerHTML += projectInfo

          // Add project summary
          const projectSummary = `
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 15px;">Project Summary</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; text-align: center;">
              <div>
                <p style="font-size: 12px; color: #4b5563; margin: 0;">Total Area</p>
                <p style="font-size: 20px; font-weight: bold; color: #2563eb; margin: 5px 0 0 0;">${jobData.totalArea?.toLocaleString() || "0"} sq ft</p>
              </div>
              <div>
                <p style="font-size: 12px; color: #4b5563; margin: 0;">Total Tonnage</p>
                <p style="font-size: 20px; font-weight: bold; color: #2563eb; margin: 5px 0 0 0;">${jobData.totalTonnage?.toFixed(2) || "0.00"} tons</p>
              </div>
              <div>
                <p style="font-size: 12px; color: #4b5563; margin: 0;">Total Estimate</p>
                <p style="font-size: 24px; font-weight: bold; color: #16a34a; margin: 5px 0 0 0;">$${calculateFinalQuoteAmount().toLocaleString()}</p>
              </div>
            </div>
          </div>
        `
          pageContainer.innerHTML += projectSummary
        }

        // Add sections for this page
        const startIndex = (pageNum - 1) * sectionsPerPage
        const endIndex = Math.min(startIndex + sectionsPerPage, selectedSections.length)
        const pageSections = selectedSections.slice(startIndex, endIndex)

        if (pageNum === 1) {
          pageContainer.innerHTML +=
            '<h2 style="font-size: 18px; font-weight: 600; color: #1f2937; border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-bottom: 20px;">Section Breakdown</h2>'
        }

        pageSections.forEach((section) => {
          const sectionHtml = `
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; background-color: #f9fafb; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0;">${section.name}</h3>
              <div style="text-align: right;">
                <p style="font-size: 16px; font-weight: bold; color: #16a34a; margin: 0;">$${calculateSectionTotal(section).toLocaleString()}</p>
                <p style="font-size: 12px; color: #4b5563; margin: 5px 0 0 0;">${section.area?.toFixed(2) || "0.00"} sq ft • ${section.tons?.toFixed(2) || "0.00"} tons</p>
              </div>
            </div>
            ${section.notes ? `<div style="margin-bottom: 15px; padding: 12px; background-color: #fefce8; border-left: 4px solid #facc15;"><p style="font-size: 12px; color: #374151; margin: 0;"><strong>Notes:</strong> ${section.notes}</p></div>` : ""}
            <div>
              ${section.materials && section.materials.length > 0 ? `<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><span style="font-weight: 500;">Materials & Supplies</span><span style="font-weight: 500;">$${section.materials.reduce((sum, m) => sum + applyMarkup(m.total || 0, "materials"), 0).toFixed(2)}</span></div>` : ""}
              ${section.equipment && section.equipment.length > 0 ? `<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><span style="font-weight: 500;">Equipment & Machinery</span><span style="font-weight: 500;">$${section.equipment.reduce((sum, e) => sum + applyMarkup(e.total || 0, "equipment"), 0).toFixed(2)}</span></div>` : ""}
              ${section.labor && section.labor.length > 0 ? `<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><span style="font-weight: 500;">Labor Team (${section.labor.reduce((sum, l) => sum + (l.quantity || 0), 0)} workers)</span><span style="font-weight: 500;">$${section.labor.reduce((sum, l) => sum + applyMarkup(l.total || 0, "labor"), 0).toFixed(2)}</span></div>` : ""}
              ${section.trucking && section.trucking.length > 0 ? `<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><span style="font-weight: 500;">Transportation & Hauling</span><span style="font-weight: 500;">$${section.trucking.reduce((sum, t) => sum + applyMarkup(t.total || 0, "trucking"), 0).toFixed(2)}</span></div>` : ""}
              ${section.additionalItems && section.additionalItems.length > 0 ? `<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><span style="font-weight: 500;">Additional Services</span><span style="font-weight: 500;">$${section.additionalItems.reduce((sum, a) => sum + applyMarkup(a.total || 0, "materials"), 0).toFixed(2)}</span></div>` : ""}
            </div>
          </div>
        `
          pageContainer.innerHTML += sectionHtml
        })

        // Add footer on last page
        if (pageNum === totalPages) {
          const footer = `
          <div style="text-align: center; font-size: 12px; color: #4b5563; border-top: 1px solid #ccc; padding-top: 20px; margin-top: 30px;">
            <p>This estimate is valid for 30 days from the date of issue.</p>
            <p>All work will be performed in accordance with industry standards and local regulations.</p>
            <p style="margin-top: 10px;"><strong>Spallina Materials</strong> • Professional Asphalt Services</p>
          </div>
        `
          pageContainer.innerHTML += footer
        }

        // Add page number
        pageContainer.innerHTML += `<div style="position: fixed; bottom: 15px; right: 20px; font-size: 12px; color: #666;">Page ${pageNum} of ${totalPages}</div>`

        // Append to body temporarily for rendering
        document.body.appendChild(pageContainer)

        // Convert to canvas
        const canvas = await html2canvas(pageContainer, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "white",
        })

        // Remove from body
        document.body.removeChild(pageContainer)

        // Add page to PDF
        if (pageNum > 1) {
          pdf.addPage()
        } else {
          pdf.addPage() // Add the first page
        }

        const imgData = canvas.toDataURL("image/png")
        const imgWidth = 210 // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, Math.min(imgHeight, 297))
      }

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
    const equipmentTotal = calculateTotalEquipmentCost()
    const laborTotal = calculateTotalLaborCost()
    const materialsTotal = calculateTotalMaterialsCost()
    const truckingTotal = calculateTotalTruckingCost()
    const additionalItemsTotal = calculateTotalAdditionalItemsCost()

    // Apply category markups
    const equipmentWithMarkup = applyMarkup(equipmentTotal, "equipment")
    const laborWithMarkup = applyMarkup(laborTotal, "labor")
    const materialsWithMarkup = applyMarkup(materialsTotal, "materials")
    const truckingWithMarkup = applyMarkup(truckingTotal, "trucking")
    const additionalItemsWithMarkup = applyMarkup(additionalItemsTotal, "materials")

    const subtotalWithMarkup =
      equipmentWithMarkup + laborWithMarkup + materialsWithMarkup + truckingWithMarkup + additionalItemsWithMarkup

    // Apply project markup to the entire subtotal
    const finalTotal =
      jobData.projectMarkup > 0 ? subtotalWithMarkup * (1 + jobData.projectMarkup / 100) : subtotalWithMarkup

    return finalTotal
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
            {viewMode === "internal" && (
              <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                {showDetails ? "Hide Details" : "Show Details"}
              </Button>
            )}
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
          <div className="text-center border-b pb-6 print-header">
            <img
              src="/NEW_Logo.jpg"
              alt="Spallina Materials"
              className="mx-auto h-16 mb-4 print-logo"
              style={{ display: "block", height: "60px", margin: "0 auto 15px auto" }}
            />
            <h1 className="text-3xl font-bold text-gray-800">Spallina Materials Estimate</h1>
            <p className="text-lg text-gray-600 mt-2">Construction Trucking and Material Supplier</p>
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

            {selectedSections.map((section, index) => (
              <div key={section.id} className="section-container border rounded-lg p-6 bg-gray-50">
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

                {viewMode === "customer" ? (
                  // Simplified customer view
                  <div className="space-y-3">
                    {/* Materials Summary */}
                    {section.materials && section.materials.length > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="font-medium">Materials & Supplies</span>
                        <span className="font-medium">
                          $
                          {section.materials
                            .reduce((sum, m) => sum + applyMarkup(m.total || 0, "materials"), 0)
                            .toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Equipment Summary */}
                    {section.equipment && section.equipment.length > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="font-medium">Equipment & Machinery</span>
                        <span className="font-medium">
                          $
                          {section.equipment
                            .reduce((sum, e) => sum + applyMarkup(e.total || 0, "equipment"), 0)
                            .toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Labor Summary */}
                    {section.labor && section.labor.length > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="font-medium">
                          Labor Team ({section.labor.reduce((sum, l) => sum + (l.quantity || 0), 0)} workers)
                        </span>
                        <span className="font-medium">
                          ${section.labor.reduce((sum, l) => sum + applyMarkup(l.total || 0, "labor"), 0).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Trucking Summary */}
                    {section.trucking && section.trucking.length > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="font-medium">Transportation & Hauling</span>
                        <span className="font-medium">
                          $
                          {section.trucking
                            .reduce((sum, t) => sum + applyMarkup(t.total || 0, "trucking"), 0)
                            .toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Additional Items Summary */}
                    {section.additionalItems && section.additionalItems.length > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="font-medium">Additional Services</span>
                        <span className="font-medium">
                          $
                          {section.additionalItems
                            .reduce((sum, a) => sum + applyMarkup(a.total || 0, "materials"), 0)
                            .toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  // Existing detailed view for internal use
                  showDetails && (
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
                  )
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
                  <span>
                    $
                    {(
                      calculateTotalEquipmentCost() +
                      calculateTotalLaborCost() +
                      calculateTotalMaterialsCost() +
                      calculateTotalTruckingCost() +
                      calculateTotalAdditionalItemsCost()
                    ).toFixed(2)}
                  </span>
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
                <div className="flex justify-between font-medium">
                  <span>Subtotal with Category Markups:</span>
                  <span>
                    $
                    {(
                      applyMarkup(calculateTotalEquipmentCost(), "equipment") +
                      applyMarkup(calculateTotalLaborCost(), "labor") +
                      applyMarkup(calculateTotalMaterialsCost(), "materials") +
                      applyMarkup(calculateTotalTruckingCost(), "trucking") +
                      applyMarkup(calculateTotalAdditionalItemsCost(), "materials")
                    ).toFixed(2)}
                  </span>
                </div>
                {jobData.projectMarkup > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Project Markup ({jobData.projectMarkup}%):</span>
                    <span>
                      $
                      {(
                        calculateFinalQuoteAmount() -
                        (applyMarkup(calculateTotalEquipmentCost(), "equipment") +
                          applyMarkup(calculateTotalLaborCost(), "labor") +
                          applyMarkup(calculateTotalMaterialsCost(), "materials") +
                          applyMarkup(calculateTotalTruckingCost(), "trucking") +
                          applyMarkup(calculateTotalAdditionalItemsCost(), "materials"))
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Final Total:</span>
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
