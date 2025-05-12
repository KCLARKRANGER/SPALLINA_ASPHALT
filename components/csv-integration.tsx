"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CSVIntegrationProps {
  jobData: any
  setJobData: (jobData: any) => void
}

export function CSVIntegration({ jobData, setJobData }: CSVIntegrationProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const lines = content.split("\n")

        // Parse header information
        const headerLine = lines[0].split(",")
        const dataLine = lines[1].split(",")

        const projectName = dataLine[1] || jobData.projectName
        const customerName = dataLine[2] || jobData.customerName
        const location = dataLine[3] || jobData.location
        const date = dataLine[4] || jobData.date

        // Find the section data start line
        let sectionStartLine = 3
        for (let i = 2; i < lines.length; i++) {
          if (lines[i].includes("Section,Area")) {
            sectionStartLine = i + 1
            break
          }
        }

        // Parse sections
        const sections = []
        const selectedSections = []

        for (let i = sectionStartLine; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line || line.startsWith("TOTAL")) break

          const parts = line.split(",")
          if (parts.length < 9) continue

          const sectionName = parts[0]
          const area = Number.parseFloat(parts[1]) || 0
          const tons = Number.parseFloat(parts[2]) || 0
          const equipmentCost = Number.parseFloat(parts[3]) || 0
          const laborCost = Number.parseFloat(parts[4]) || 0
          const materialsCost = Number.parseFloat(parts[5]) || 0
          const truckingCost = Number.parseFloat(parts[6]) || 0

          // Create a new section
          const sectionId = `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          const newSection = {
            id: sectionId,
            name: sectionName,
            area: area,
            tons: tons,
            equipment: [
              {
                name: "Imported Equipment",
                quantity: 1,
                hours: 8,
                rate: equipmentCost,
                total: equipmentCost,
                includesOperator: false,
              },
            ],
            labor: [
              {
                name: "Imported Labor",
                quantity: 1,
                hours: 8,
                rate: laborCost / 8,
                total: laborCost,
              },
            ],
            materials: [
              {
                name: "Imported Materials",
                unit: "tons",
                quantity: tons,
                rate: tons > 0 ? materialsCost / tons : 0,
                total: materialsCost,
              },
            ],
            trucking: [
              {
                name: "Imported Trucking",
                quantity: 1,
                hours: 8,
                rate: truckingCost / 8,
                total: truckingCost,
              },
            ],
          }

          sections.push(newSection)
          selectedSections.push(sectionId)
        }

        // Update job data
        setJobData({
          ...jobData,
          projectName,
          customerName,
          location,
          date,
          sections: [...jobData.sections, ...sections],
          selectedSections: [...jobData.selectedSections, ...selectedSections],
        })

        setIsDialogOpen(false)
      } catch (error) {
        console.error("Error parsing CSV file:", error)
        setError("Failed to parse CSV file. Please check the file format.")
      }
    }
    reader.readAsText(file)

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Input type="file" accept=".csv" onChange={handleFileUpload} ref={fileInputRef} />

          <p className="text-sm text-gray-500">
            Upload a CSV file to import job data. The CSV should have the following format:
          </p>
          <pre className="text-xs bg-gray-100 p-2 rounded">
            Quote Number,Project Name,Customer Name,Location,Date
            <br />
            2023-1001,Project Name,Customer Name,Location,2023-01-01
            <br />
            <br />
            Section,Area,Tons,Equipment Cost,Labor Cost,Materials Cost,Trucking Cost,Mobilization Cost,Total Cost
            <br />
            Section 1,1000,120,1000,2000,3000,1500,500,8000
            <br />
            Section 2,500,60,500,1000,1500,750,250,4000
            <br />
            <br />
            TOTAL,,,,,,,,12000
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
