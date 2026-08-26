"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// CSV Importer Types
// ---------------------------------------------------------------------------

type ImportStep = "upload" | "mapping" | "validation" | "import";
type ImportEntity = "contacts" | "companies" | "deals";

interface CsvRow {
  [key: string]: string;
}

const CRM_FIELDS: Record<ImportEntity, { value: string; label: string; required?: boolean }[]> = {
  contacts: [
    { value: "firstName", label: "First Name", required: true },
    { value: "lastName", label: "Last Name", required: true },
    { value: "email", label: "Email", required: true },
    { value: "phone", label: "Phone" },
    { value: "title", label: "Job Title" },
    { value: "company", label: "Company" },
    { value: "status", label: "Status" },
  ],
  companies: [
    { value: "name", label: "Name", required: true },
    { value: "industry", label: "Industry" },
    { value: "website", label: "Website" },
    { value: "phone", label: "Phone" },
    { value: "city", label: "City" },
    { value: "country", label: "Country" },
    { value: "size", label: "Size" },
  ],
  deals: [
    { value: "title", label: "Title", required: true },
    { value: "value", label: "Value", required: true },
    { value: "stage", label: "Stage" },
    { value: "contact", label: "Contact" },
    { value: "company", label: "Company" },
    { value: "closeDate", label: "Close Date" },
  ],
};

// Auto-detect mapping
function autoMap(header: string): string {
  const h = header.toLowerCase().replace(/[^a-z]/g, "");
  const MAP: Record<string, string> = {
    firstname: "firstName", first: "firstName",
    lastname: "lastName", last: "lastName",
    email: "email", emailaddress: "email",
    phone: "phone", phonenumber: "phone",
    title: "title", jobtitle: "title",
    company: "company", companyname: "company",
    name: "name",
    industry: "industry",
    website: "website",
    city: "city",
    country: "country",
    size: "size",
    value: "value", amount: "value", dealvalue: "value",
    stage: "stage",
    contact: "contact",
    closedate: "closeDate",
    status: "status",
  };
  return MAP[h] ?? "skip";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DataManagementPage() {
  const [importOpen, setImportOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>("upload");
  const [entity, setEntity] = useState<ImportEntity>("contacts");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: number } | null>(null);

  const resetImporter = () => {
    setStep("upload");
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    setValidationErrors([]);
    setImporting(false);
    setImportProgress(0);
    setImportResult(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error("CSV must have at least a header and one data row");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        const row: CsvRow = {};
        headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
        return row;
      });

      setCsvHeaders(headers);
      setCsvRows(rows);

      // Auto-map
      const autoMapping: Record<string, string> = {};
      headers.forEach((h) => { autoMapping[h] = autoMap(h); });
      setMapping(autoMapping);

      setStep("mapping");
    };
    reader.readAsText(file);
  };

  const handleValidation = () => {
    const errors: string[] = [];
    const requiredFields = CRM_FIELDS[entity].filter((f) => f.required).map((f) => f.value);
    const mappedTo = new Set(Object.values(mapping).filter((v) => v !== "skip"));

    requiredFields.forEach((f) => {
      if (!mappedTo.has(f)) {
        const label = CRM_FIELDS[entity].find((cf) => cf.value === f)?.label ?? f;
        errors.push(`Required field "${label}" is not mapped`);
      }
    });

    // Row-level validation (simplified)
    csvRows.forEach((row, i) => {
      const emailCol = Object.entries(mapping).find(([, v]) => v === "email")?.[0];
      if (emailCol && row[emailCol] && !/\S+@\S+\.\S+/.test(row[emailCol])) {
        errors.push(`Row ${i + 1}: Invalid email "${row[emailCol]}"`);
      }
    });

    setValidationErrors(errors);
    setStep("validation");
  };

  const handleImport = async () => {
    setImporting(true);
    setImportProgress(0);

    const total = csvRows.length;
    let created = 0;
    let skipped = 0;

    for (let i = 0; i < total; i++) {
      await new Promise((r) => setTimeout(r, 50));
      if (Math.random() > 0.1) {
        created++;
      } else {
        skipped++;
      }
      setImportProgress(Math.round(((i + 1) / total) * 100));
    }

    setImporting(false);
    setImportResult({ created, skipped, errors: validationErrors.length });
    setStep("import");
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Data Management</h3>
        <p className="text-sm text-muted-foreground">
          Import, export, and manage your CRM data
        </p>
      </div>

      {/* Import / Export */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <Upload className="size-5 text-primary" />
            <h4 className="font-semibold">Import Data</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Import contacts, companies, or deals from a CSV file
          </p>
          <Button
            size="sm"
            onClick={() => { resetImporter(); setImportOpen(true); }}
          >
            <FileSpreadsheet className="mr-1.5 size-3.5" />
            Start Import
          </Button>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <Download className="size-5 text-primary" />
            <h4 className="font-semibold">Export Data</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Export your CRM data to CSV format
          </p>
          <div className="flex flex-wrap gap-2">
            {["Contacts", "Companies", "Deals"].map((type) => (
              <Button
                key={type}
                size="sm"
                variant="outline"
                onClick={() => toast.success(`${type} exported`)}
              >
                Export {type}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* Danger Zone */}
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="size-5 text-destructive" />
          <h4 className="font-semibold text-destructive">Danger Zone</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Irreversible actions. Proceed with extreme caution.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={() => toast.info("Data reset not available in demo")}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            Reset All Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={() => toast.info("Organization deletion not available in demo")}
          >
            Delete Organization
          </Button>
        </div>
      </div>

      {/* CSV Importer Dialog */}
      <Dialog open={importOpen} onOpenChange={(open) => { if (!open) setImportOpen(false); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              {step === "upload" && "Upload a CSV file to import"}
              {step === "mapping" && "Map CSV columns to CRM fields"}
              {step === "validation" && "Review validation results"}
              {step === "import" && (importing ? "Importing data..." : "Import complete")}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs">
            {(["upload", "mapping", "validation", "import"] as ImportStep[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <ArrowRight className="size-3 text-muted-foreground" />}
                <Badge
                  variant={step === s ? "default" : "secondary"}
                  className="text-[10px] capitalize"
                >
                  {i + 1}. {s}
                </Badge>
              </div>
            ))}
          </div>

          {/* Step 1: Upload */}
          {step === "upload" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Import Type</Label>
                <Select value={entity} onValueChange={(v) => v && setEntity(v as ImportEntity)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contacts">Contacts</SelectItem>
                    <SelectItem value="companies">Companies</SelectItem>
                    <SelectItem value="deals">Deals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>CSV File</Label>
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-8">
                  <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
                    <FileSpreadsheet className="size-8 text-muted-foreground" />
                    <span className="text-sm font-medium">Click to upload CSV</span>
                    <span className="text-xs text-muted-foreground">
                      .csv files up to 10MB
                    </span>
                    <Input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === "mapping" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Found {csvHeaders.length} columns and {csvRows.length} rows.
                Preview of first 3 rows below.
              </p>

              {/* Preview */}
              <div className="rounded border overflow-x-auto max-h-32">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted">
                      {csvHeaders.map((h) => (
                        <th key={h} className="px-2 py-1 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-t">
                        {csvHeaders.map((h) => (
                          <td key={h} className="px-2 py-1 truncate max-w-[120px]">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Column mapping */}
              <div className="space-y-2">
                {csvHeaders.map((header) => (
                  <div key={header} className="flex items-center gap-3">
                    <span className="w-32 text-sm font-medium truncate">{header}</span>
                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                    <Select
                      value={mapping[header] ?? "skip"}
                      onValueChange={(v) => v && setMapping((prev) => ({ ...prev, [header]: v }))}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">— Skip —</SelectItem>
                        {CRM_FIELDS[entity].map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}{f.required ? " *" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {mapping[header] && mapping[header] !== "skip" && (
                      <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
                <Button onClick={handleValidation}>Validate</Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 3: Validation */}
          {step === "validation" && (
            <div className="space-y-4">
              {validationErrors.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6">
                  <CheckCircle2 className="size-10 text-green-500" />
                  <p className="font-medium">All validations passed!</p>
                  <p className="text-sm text-muted-foreground">
                    {csvRows.length} records ready to import
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-orange-500" />
                    <p className="text-sm font-medium">
                      {validationErrors.length} issue{validationErrors.length > 1 ? "s" : ""} found
                    </p>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded border p-3 space-y-1">
                    {validationErrors.map((err, i) => (
                      <p key={i} className="text-xs text-destructive">{err}</p>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can still proceed — rows with errors will be skipped.
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setStep("mapping")}>Back</Button>
                <Button onClick={handleImport}>
                  Import {csvRows.length} Records
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 4: Import */}
          {step === "import" && (
            <div className="space-y-4">
              {importing ? (
                <div className="space-y-3 py-6">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span className="font-medium">Importing...</span>
                  </div>
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-center text-xs text-muted-foreground">
                    {importProgress}% complete
                  </p>
                </div>
              ) : importResult ? (
                <div className="space-y-4 py-4">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="size-10 text-green-500" />
                    <p className="font-semibold text-lg">Import Complete!</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="rounded-lg border p-3">
                      <p className="text-2xl font-bold text-green-600">{importResult.created}</p>
                      <p className="text-xs text-muted-foreground">Created</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-2xl font-bold text-orange-600">{importResult.skipped}</p>
                      <p className="text-xs text-muted-foreground">Skipped</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-2xl font-bold text-red-600">{importResult.errors}</p>
                      <p className="text-xs text-muted-foreground">Errors</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setImportOpen(false)}>Done</Button>
                  </DialogFooter>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
