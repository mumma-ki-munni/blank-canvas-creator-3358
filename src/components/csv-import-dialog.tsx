import { useRef, useState } from "react";
import { IconUpload } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ItemType } from "@/lib/data-provider";
import { useDataProvider } from "@/lib/data-provider";
import {
  autoMap,
  buildRecords,
  fieldsForType,
  parseCsv,
  SAMPLE_CSV,
  type BuildResult,
} from "@/lib/csv-import";

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which kind of RecurringItem this screen imports. The one importer,
   *  parameterized per screen — expenses set "expense", income sets "income". */
  type: ItemType;
}

/**
 * Generic CSV importer, usable on any RecurringItem screen. Columns are matched
 * to fields by header name (PapaParse); the target `type` comes from the screen,
 * so income imports as income and expenses as expenses through one component.
 */
export function CsvImportDialog({ open, onOpenChange, type }: CsvImportDialogProps) {
  const { useCreateRecurringItem } = useDataProvider();
  const { mutateAsync } = useCreateRecurringItem();
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  const noun = type === "income" ? "income" : "expenses";

  const reset = () => {
    setResult(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    const parsed = await parseCsv(file);
    const mapping = autoMap(parsed.headers, fieldsForType(type));
    setResult(buildRecords(parsed, mapping, { type }));
  };

  const handleImport = async () => {
    if (!result || result.valid.length === 0) return;
    setImporting(true);
    let imported = 0;
    let failed = 0;
    for (const record of result.valid) {
      try {
        await mutateAsync(record);
        imported += 1;
      } catch {
        failed += 1;
      }
    }
    setImporting(false);
    const skippedTotal = result.skipped.length + failed;
    toast.success(`${imported} imported, ${skippedTotal} skipped`);
    onOpenChange(false);
    reset();
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV[type]], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sample-${noun}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import {noun} from CSV</DialogTitle>
          <DialogDescription>
            Columns are matched by header name. Rows missing a name, a valid
            amount, or a valid start date are skipped.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {!result ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8">
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <IconUpload className="size-4" />
              Choose CSV file
            </Button>
            <button
              type="button"
              onClick={downloadSample}
              className="text-sm text-muted-foreground underline underline-offset-2"
            >
              Download sample CSV
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              <span className="font-medium">{fileName}</span>:{" "}
              <strong>{result.valid.length}</strong> to import
              {result.skipped.length > 0 ? (
                <>
                  , <strong>{result.skipped.length}</strong> will be skipped
                </>
              ) : null}
              .
            </p>
            <div className="max-h-64 overflow-auto rounded-lg border border-solid text-sm">
              {result.valid.slice(0, 50).map((r, i) => (
                <div
                  key={`valid-${i}`}
                  className="flex items-center justify-between gap-4 border-b border-border px-3 py-1.5 last:border-b-0"
                >
                  <span className="min-w-0 flex-1 truncate">{r.name}</span>
                  <span className="text-muted-foreground">
                    {r.category ? `${r.category} · ` : ""}
                    {r.frequency}
                  </span>
                  <span className="tabular-nums">{r.amount.toFixed(2)}</span>
                </div>
              ))}
              {result.skipped.map((s, i) => (
                <div
                  key={`skip-${i}`}
                  className="flex items-center justify-between gap-4 border-b border-border px-3 py-1.5 text-destructive last:border-b-0"
                >
                  <span>Row {s.row} skipped</span>
                  <span className="text-muted-foreground">{s.reason}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={reset}
              className="self-start text-sm text-muted-foreground underline underline-offset-2"
            >
              Choose a different file
            </button>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false);
              reset();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!result || result.valid.length === 0 || importing}
          >
            {importing
              ? "Importing…"
              : `Import ${result?.valid.length ?? 0} ${noun}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
