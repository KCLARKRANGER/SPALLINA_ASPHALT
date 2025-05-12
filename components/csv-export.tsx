"use client"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface CsvExportProps {
  jobData: any
}

export const CSVExport = ({ jobData }: CsvExportProps) => {
  const headers = [
    { label: "Section", key: "section" },
    { label: "Area (sq ft)", key: "area" },
    { label: "Asphalt (tons)", key: "tons" },
    { label: "Equipment Cost", key: "equipmentCost" },
    { label: "Labor Cost", key: "laborCost" },
    { label: "Materials Cost", key: "materialsCost" },
    { label: "Trucking Cost", key: "truckingCost" },
    { label: "Mobilization Cost", key: "mobilizationCost" },
    { label: "Total Cost", key: "totalCost" },
  ]

  const data = jobData.sections
    .filter((section: any) => jobData.selectedSections.includes(section.id))
    .map((section: any) => {
      const equipmentTotal = section.equipment.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
      const laborTotal = section.labor.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
      const materialsTotal = section.materials.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
      const truckingTotal = section.trucking.reduce((sum: number, item: any) => sum + (item.total || 0), 0)

      // Calculate mobilization cost
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

      const sectionTotal = equipmentTotal + laborTotal + materialsTotal + truckingTotal + mobilizationTotal

      return {
        section: section.name,
        area: section.area || 0,
        tons: section.tons || 0,
        equipmentCost: equipmentTotal.toFixed(2),
        laborCost: laborTotal.toFixed(2),
        materialsCost: materialsTotal.toFixed(2),
        truckingCost: truckingTotal.toFixed(2),
        mobilizationCost: mobilizationTotal.toFixed(2),
        totalCost: sectionTotal.toFixed(2),
      }
    })

  const handleExportPdf = () => {
    const doc = new jsPDF()
    const title = "Job Cost Estimate"

    doc.text(title, 20, 10)

    autoTable(doc, {
      head: [headers.map((header) => header.label)],
      body: data.map((row) => headers.map((header) => row[header.key])),
    })

    doc.save(`${jobData.projectName.replace(/\s+/g, "_")}_estimate.pdf`)
  }

  const handleExportCsv = () => {
    // Create CSV content
    let csvContent = headers.map((header) => header.label).join(",") + "\n"

    data.forEach((row) => {
      csvContent += headers.map((header) => row[header.key]).join(",") + "\n"
    })

    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${jobData.projectName.replace(/\s+/g, "_")}_estimate.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Export
          <Download className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleExportPdf}>Export as PDF</DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCsv}>Export as CSV</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
