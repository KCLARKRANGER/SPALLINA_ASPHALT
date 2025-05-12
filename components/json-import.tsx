"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface JSONImportProps {
  onImport: (data: any) => void
}

export function JSONImport({ onImport }: JSONImportProps) {
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
        const parsedData = JSON.parse(content)

        // Check if the data has the expected structure
        if (parsedData.jobData) {
          onImport(parsedData)
          setIsDialogOpen(false)
        } else {
          setError("Invalid project file format. The file does not contain the expected data structure.")
        }
      } catch (error) {
        console.error("Error parsing JSON file:", error)
        setError("Failed to parse JSON file. Please check the file format.")
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
          Import Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Project</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Input type="file" accept=".json" onChange={handleFileUpload} ref={fileInputRef} />

          <p className="text-sm text-gray-500">
            Upload a JSON file to import a previously saved project. This will replace your current project data.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
