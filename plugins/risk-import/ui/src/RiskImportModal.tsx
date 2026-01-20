import React, { useState, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import { Download, Upload, FileText, CheckCircle, XCircle, X } from "lucide-react";
import * as ExcelJS from "exceljs";
import { colors, typography, borderRadius, buttonStyles, cardStyles, tableStyles, chipStyles, modalStyles } from "./theme";

interface RiskImportModalProps {
  open: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
  apiServices?: {
    get: (url: string, options?: any) => Promise<any>;
    post: (url: string, data?: any) => Promise<any>;
  };
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; field: string; message: string }>;
  importedAt: string;
}

export const RiskImportModal: React.FC<RiskImportModalProps> = ({
  open,
  onClose,
  onImportComplete,
  apiServices,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Default API services if not provided
  const api = apiServices || {
    get: async (url: string, options?: any) => {
      const response = await fetch(`/api${url}`, options);
      return { data: await response.blob() };
    },
    post: async (url: string, data?: any) => {
      const response = await fetch(`/api${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return { data: await response.json() };
    },
  };

  // Download Excel template
  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the Excel file as a blob using apiServices
      const response = await api.get("plugins/risk-import/template", {
        responseType: "blob",
      });

      // Create download link
      const blob = new Blob([response.data as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "risk_import_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Error downloading template:", err);
      const errorMessage = err.message || "Failed to download template";
      setError(`Failed to download template: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx")) {
      setError("Please upload an Excel file (.xlsx)");
      return;
    }

    setUploadedFile(file);
    setError(null);
    setImportResult(null);

    try {
      // Parse Excel file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      // Get first worksheet
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        setError("Excel file is empty or invalid");
        setExcelData([]);
        return;
      }

      // Parse data from worksheet
      const data: any[] = [];
      const headers: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          // First row is headers
          row.eachCell({ includeEmpty: true }, (cell) => {
            // Extract key from header (remove parentheses, asterisks, and convert to snake_case)
            const headerText = cell.value?.toString() || "";
            const key = headerText
              .replace(/\s*\([^)]*\)/g, '') // Remove anything in parentheses
              .replace(/\s*\*/g, '') // Remove asterisks
              .toLowerCase()
              .trim()
              .replace(/\s+/g, "_"); // Replace spaces with underscores
            headers.push(key);
          });
        } else {
          // Data rows
          const rowData: any = {};
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const key = headers[colNumber - 1];
            if (key) {
              rowData[key] = cell.value;
            }
          });

          // Only add row if it has meaningful data (at least one non-null value)
          const hasData = Object.values(rowData).some(val => val !== null && val !== undefined && val !== "");

          if (hasData) {
            data.push(rowData);
          }
        }
      });

      setExcelData(data);
    } catch (err: any) {
      console.error("Error parsing Excel file:", err);
      setError(`Error parsing Excel file: ${err.message}`);
      setExcelData([]);
    }
  }, []);

  // Handle import
  const handleImport = async () => {
    if (excelData.length === 0) {
      setError("No data to import. Please upload a valid Excel file.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setImportResult(null);

      const response = await api.post("/plugins/risk-import/import", {
        csvData: excelData, // Backend still expects csvData param name
      });

      if (response.data?.data) {
        setImportResult(response.data.data);

        // If import was successful, call the callback
        if (response.data.data.success && onImportComplete) {
          setTimeout(() => {
            onImportComplete();
            onClose();
          }, 1000);
        }
      }
    } catch (err: any) {
      console.error("Error importing risks:", err);
      setError(err.response?.data?.message || "Failed to import risks");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setUploadedFile(null);
    setExcelData([]);
    setImportResult(null);
    setError(null);
    // Clear file input to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: borderRadius.lg,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${colors.borderLight}`,
          py: 2,
          px: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{
            width: 36,
            height: 36,
            borderRadius: borderRadius.md,
            backgroundColor: colors.primaryLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <FileText size={20} color={colors.primary} />
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: "16px", color: colors.textPrimary }}>
            Import Risks from Excel
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            color: colors.textTertiary,
            "&:hover": { backgroundColor: colors.backgroundHover },
          }}
        >
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: borderRadius.sm,
          p: 2,
          mb: 3,
          border: `1px solid ${colors.borderLight}`,
        }}>
          <Typography sx={{ fontSize: "13px", color: colors.textSecondary, lineHeight: 1.6 }}>
            Import multiple risks at once using an Excel file. Download the template, fill it with your risk data, and upload to create risks in bulk.
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Import Result */}
        {importResult && (
          <Alert
            severity={importResult.success ? "success" : "warning"}
            sx={{ mb: 3 }}
            icon={importResult.success ? <CheckCircle /> : <XCircle />}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Import {importResult.success ? "Completed" : "Completed with Errors"}
            </Typography>
            <Typography variant="body2">
              Successfully imported: {importResult.imported} risk(s)
              {importResult.failed > 0 && ` | Failed: ${importResult.failed} risk(s)`}
            </Typography>

            {/* Error Details */}
            {importResult.errors && importResult.errors.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Error Details:
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Row</TableCell>
                        <TableCell>Field</TableCell>
                        <TableCell>Error</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importResult.errors.slice(0, 10).map((err, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{err.row}</TableCell>
                          <TableCell>{err.field}</TableCell>
                          <TableCell>{err.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {importResult.errors.length > 10 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Showing first 10 of {importResult.errors.length} errors
                  </Typography>
                )}
              </Box>
            )}
          </Alert>
        )}

        {/* Step 1: Download Template */}
        <Card sx={{ mb: 3, border: `1px solid ${colors.borderLight}`, boxShadow: "none" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Box sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                backgroundColor: colors.primaryLight,
                color: colors.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: 600,
                flexShrink: 0,
              }}>
                1
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ mb: 1, fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>
                  Download Excel Template
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: colors.textTertiary, fontSize: "13px" }}>
                  Download the template with dropdown menus for enum fields and sample data.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Download size={14} />}
                  onClick={handleDownloadTemplate}
                  disabled={loading}
                  sx={{
                    textTransform: "none",
                    fontSize: "13px",
                    borderColor: colors.border,
                    color: colors.textSecondary,
                    "&:hover": {
                      borderColor: colors.primary,
                      backgroundColor: colors.primaryLight,
                      color: colors.primary,
                    },
                  }}
                >
                  Download Template
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Step 2: Upload Excel */}
        <Card sx={{ mb: 3, border: `1px solid ${colors.borderLight}`, boxShadow: "none" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Box sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                backgroundColor: colors.primaryLight,
                color: colors.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: 600,
                flexShrink: 0,
              }}>
                2
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ mb: 1, fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>
                  Upload Filled Excel File
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: colors.textTertiary, fontSize: "13px" }}>
                  Upload your Excel file with risk data.
                </Typography>

                {/* Upload area */}
                <Box
                  sx={{
                    border: `1px dashed ${uploadedFile ? colors.primary : colors.border}`,
                    borderRadius: borderRadius.md,
                    p: 2,
                    backgroundColor: uploadedFile ? colors.primaryLight : colors.backgroundSecondary,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    transition: "all 0.2s ease",
                  }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    component="label"
                    startIcon={<Upload size={14} />}
                    sx={{
                      textTransform: "none",
                      fontSize: "13px",
                      borderColor: colors.border,
                      color: colors.textSecondary,
                      "&:hover": {
                        borderColor: colors.primary,
                        backgroundColor: colors.background,
                      },
                    }}
                  >
                    Choose File
                    <input
                      type="file"
                      hidden
                      accept=".xlsx"
                      onChange={handleFileUpload}
                      ref={fileInputRef}
                    />
                  </Button>

                  {uploadedFile ? (
                    <Chip
                      label={uploadedFile.name}
                      onDelete={handleReset}
                      size="small"
                      sx={{
                        backgroundColor: colors.background,
                        border: `1px solid ${colors.primary}`,
                        color: colors.primary,
                        "& .MuiChip-deleteIcon": {
                          color: colors.primary,
                          "&:hover": { color: colors.primaryHover },
                        },
                      }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ color: colors.textTertiary, fontSize: "13px" }}>
                      or drag and drop .xlsx file here
                    </Typography>
                  )}
                </Box>

                {/* Preview */}
                {excelData.length > 0 && (
                  <Box sx={{ mt: 2.5 }}>
                    <Typography sx={{ mb: 1.5, fontWeight: 600, fontSize: "13px", color: colors.textSecondary }}>
                      Preview ({excelData.length} risk(s) found):
                    </Typography>
                    <TableContainer sx={{ border: `1px solid ${colors.borderLight}`, borderRadius: borderRadius.sm, maxHeight: 240 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ backgroundColor: colors.backgroundSecondary, fontWeight: 600, fontSize: "11px", color: colors.textTertiary, textTransform: "uppercase", py: 1 }}>#</TableCell>
                            <TableCell sx={{ backgroundColor: colors.backgroundSecondary, fontWeight: 600, fontSize: "11px", color: colors.textTertiary, textTransform: "uppercase", py: 1 }}>Risk Name</TableCell>
                            <TableCell sx={{ backgroundColor: colors.backgroundSecondary, fontWeight: 600, fontSize: "11px", color: colors.textTertiary, textTransform: "uppercase", py: 1 }}>Owner</TableCell>
                            <TableCell sx={{ backgroundColor: colors.backgroundSecondary, fontWeight: 600, fontSize: "11px", color: colors.textTertiary, textTransform: "uppercase", py: 1 }}>Description</TableCell>
                            <TableCell sx={{ backgroundColor: colors.backgroundSecondary, fontWeight: 600, fontSize: "11px", color: colors.textTertiary, textTransform: "uppercase", py: 1 }}>Phase</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {excelData.slice(0, 5).map((row, idx) => (
                            <TableRow key={idx} sx={{ "&:hover": { backgroundColor: colors.backgroundHover } }}>
                              <TableCell sx={{ fontSize: "12px", color: colors.textSecondary, py: 1 }}>{idx + 1}</TableCell>
                              <TableCell sx={{ fontSize: "12px", color: colors.textSecondary, py: 1 }}>{row.risk_name || "-"}</TableCell>
                              <TableCell sx={{ fontSize: "12px", color: colors.textSecondary, py: 1 }}>{row.risk_owner || "-"}</TableCell>
                              <TableCell sx={{ fontSize: "12px", color: colors.textSecondary, py: 1, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {row.risk_description || "-"}
                              </TableCell>
                              <TableCell sx={{ fontSize: "12px", color: colors.textSecondary, py: 1 }}>{row.ai_lifecycle_phase || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {excelData.length > 5 && (
                      <Typography sx={{ mt: 1, fontSize: "11px", color: colors.textTertiary }}>
                        Showing first 5 of {excelData.length} risks
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Step 3: Import */}
        {excelData.length > 0 && (
          <Card sx={{ border: `1px solid ${colors.borderLight}`, boxShadow: "none", backgroundColor: colors.backgroundSecondary }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: colors.primary,
                  color: colors.white,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 600,
                  flexShrink: 0,
                }}>
                  3
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ mb: 1, fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>
                    Import Risks
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: colors.textTertiary, fontSize: "13px" }}>
                    Review the preview above and click Import to create the risks.
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleImport}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <CheckCircle size={14} />}
                      sx={{
                        textTransform: "none",
                        fontSize: "13px",
                        backgroundColor: colors.primary,
                        "&:hover": {
                          backgroundColor: colors.primaryHover,
                        },
                      }}
                    >
                      {loading ? "Importing..." : `Import ${excelData.length} Risk(s)`}
                    </Button>

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleReset}
                      disabled={loading}
                      sx={{
                        textTransform: "none",
                        fontSize: "13px",
                        borderColor: colors.border,
                        color: colors.textSecondary,
                      }}
                    >
                      Reset
                    </Button>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RiskImportModal;
