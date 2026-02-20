/**
 * LifecycleItemField - Renders the correct field UI based on item_type.
 * Uses VerifyWise styling patterns.
 */

import React, { useState, useCallback, useRef } from "react";
import {
  Stack,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  TextField,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Chip,
  Button,
} from "@mui/material";
import { Trash2, Upload, FileText, Check, X } from "lucide-react";
import { LifecycleItem, LifecycleValue } from "./useModelLifecycle";

// ============================================================================
// VerifyWise Theme Constants
// ============================================================================

const VW_COLORS = {
  primary: "#13715B",
  primaryDark: "#10614d",
  textPrimary: "#1c2130",
  textSecondary: "#344054",
  textTertiary: "#475467",
  textAccent: "#838c99",
  bgMain: "#FFFFFF",
  bgAlt: "#FCFCFD",
  bgFill: "#F4F4F4",
  bgAccent: "#f9fafb",
  borderLight: "#eaecf0",
  borderDark: "#d0d5dd",
  error: "#f04438",
  errorBg: "#FEE2E2",
  success: "#17b26a",
  successBg: "#ecfdf3",
};

const VW_TYPOGRAPHY = {
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  fontSize: 13,
};

// Shared input styles
const vwInputSx = {
  "& .MuiInputBase-root": {
    fontFamily: VW_TYPOGRAPHY.fontFamily,
    fontSize: "13px",
    borderRadius: "4px",
  },
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: VW_COLORS.borderDark },
    "&:hover fieldset": { borderColor: VW_COLORS.primary },
    "&.Mui-focused fieldset": { borderColor: VW_COLORS.primary },
  },
};

const vwButtonOutlined = {
  textTransform: "none" as const,
  fontWeight: 500,
  fontSize: "13px",
  fontFamily: VW_TYPOGRAPHY.fontFamily,
  borderRadius: "4px",
  borderColor: VW_COLORS.borderDark,
  color: VW_COLORS.textSecondary,
  "&:hover": {
    borderColor: VW_COLORS.primary,
    color: VW_COLORS.primary,
    backgroundColor: "rgba(19, 113, 91, 0.04)",
  },
};

const vwChipSx = {
  fontFamily: VW_TYPOGRAPHY.fontFamily,
  fontSize: "12px",
  fontWeight: 500,
  borderRadius: "4px",
};

interface ApiServices {
  get: <T>(endpoint: string) => Promise<{ data: T }>;
  post: <T>(endpoint: string, data?: any, config?: any) => Promise<{ data: T }>;
  put: <T>(endpoint: string, data?: any) => Promise<{ data: T }>;
  delete: <T>(endpoint: string) => Promise<{ data: T }>;
}

interface LifecycleItemFieldProps {
  modelId: number;
  item: LifecycleItem;
  onValueChanged?: () => void;
  apiServices?: ApiServices;
}

export default function LifecycleItemField({
  modelId,
  item,
  onValueChanged,
  apiServices,
}: LifecycleItemFieldProps) {
  const value = item.value;

  switch (item.item_type) {
    case "text":
      return (
        <TextFieldRenderer
          modelId={modelId} item={item} value={value}
          multiline={false} onValueChanged={onValueChanged} apiServices={apiServices}
        />
      );
    case "textarea":
      return (
        <TextFieldRenderer
          modelId={modelId} item={item} value={value}
          multiline onValueChanged={onValueChanged} apiServices={apiServices}
        />
      );
    case "documents":
      return (
        <DocumentsFieldRenderer
          modelId={modelId} item={item} value={value}
          onValueChanged={onValueChanged} apiServices={apiServices}
        />
      );
    case "people":
      return (
        <PeopleFieldRenderer
          modelId={modelId} item={item} value={value}
          onValueChanged={onValueChanged} apiServices={apiServices}
        />
      );
    case "classification":
      return (
        <ClassificationFieldRenderer
          modelId={modelId} item={item} value={value}
          onValueChanged={onValueChanged} apiServices={apiServices}
        />
      );
    case "checklist":
      return (
        <ChecklistFieldRenderer
          modelId={modelId} item={item} value={value}
          onValueChanged={onValueChanged} apiServices={apiServices}
        />
      );
    case "approval":
      return (
        <ApprovalFieldRenderer
          modelId={modelId} item={item} value={value}
          onValueChanged={onValueChanged} apiServices={apiServices}
        />
      );
    default:
      return (
        <Typography color="text.secondary" variant="body2">
          Unsupported field type: {item.item_type}
        </Typography>
      );
  }
}

// ============================================================================
// Text / Textarea
// ============================================================================

function TextFieldRenderer({
  modelId, item, value, multiline, onValueChanged, apiServices,
}: {
  modelId: number; item: LifecycleItem; value: LifecycleValue | null | undefined;
  multiline: boolean; onValueChanged?: () => void; apiServices?: ApiServices;
}) {
  const config = item.config as { placeholder?: string; maxLength?: number };
  const [text, setText] = useState(value?.value_text ?? "");
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(value?.value_text ?? "");

  const handleBlur = useCallback(async () => {
    if (text === savedRef.current) return;
    setSaving(true);
    try {
      await apiServices?.put(
        `/plugins/model-lifecycle/models/${modelId}/lifecycle/items/${item.id}`,
        { value_text: text || null }
      );
      savedRef.current = text;
      onValueChanged?.();
    } catch { /* keep current text */ } finally { setSaving(false); }
  }, [text, modelId, item.id, onValueChanged, apiServices]);

  return (
    <TextField
      placeholder={config?.placeholder || `Enter ${item.name.toLowerCase()}`}
      value={text}
      onChange={(e) => {
        if (config?.maxLength && e.target.value.length > config.maxLength) return;
        setText(e.target.value);
      }}
      onBlur={handleBlur}
      multiline={multiline}
      rows={multiline ? 3 : undefined}
      size="small"
      fullWidth
      sx={vwInputSx}
      InputProps={{
        endAdornment: saving ? <CircularProgress size={14} sx={{ color: VW_COLORS.primary }} /> : undefined,
      }}
    />
  );
}

// ============================================================================
// Documents
// ============================================================================

function DocumentsFieldRenderer({
  modelId, item, value, onValueChanged, apiServices,
}: {
  modelId: number; item: LifecycleItem; value: LifecycleValue | null | undefined;
  onValueChanged?: () => void; apiServices?: ApiServices;
}) {
  const files = Array.isArray(value?.files) ? value.files : [];
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles || selectedFiles.length === 0 || !apiServices) return;

      setUploading(true);
      try {
        for (const file of Array.from(selectedFiles)) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("source", "File Manager");
          const result = await apiServices.post<{ data: { id: number } }>(
            "/files",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          const fileId = (result.data as any)?.data?.id || (result.data as any)?.id;
          await apiServices.post(
            `/plugins/model-lifecycle/models/${modelId}/lifecycle/items/${item.id}/files`,
            { fileId }
          );
        }
        onValueChanged?.();
      } catch { /* upload failed */ } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [modelId, item.id, onValueChanged, apiServices]
  );

  const handleRemoveFile = useCallback(
    async (fileId: number) => {
      try {
        await apiServices?.delete(
          `/plugins/model-lifecycle/models/${modelId}/lifecycle/items/${item.id}/files/${fileId}`
        );
        onValueChanged?.();
      } catch { /* retry */ }
    },
    [modelId, item.id, onValueChanged, apiServices]
  );

  return (
    <Stack sx={{ gap: "12px" }}>
      {files.length > 0 && (
        <Stack sx={{ gap: "8px" }}>
          {files.map((file) => (
            <Stack
              key={file.id}
              direction="row"
              alignItems="center"
              sx={{
                gap: "10px",
                p: "10px 12px",
                borderRadius: "4px",
                border: `1px solid ${VW_COLORS.borderLight}`,
                backgroundColor: VW_COLORS.bgAccent,
              }}
            >
              <FileText size={16} color={VW_COLORS.textAccent} />
              <Typography
                sx={{
                  flex: 1,
                  fontFamily: VW_TYPOGRAPHY.fontFamily,
                  fontSize: "13px",
                  color: VW_COLORS.textSecondary,
                }}
              >
                {file.filename || `File #${file.file_id}`}
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleRemoveFile(file.file_id)}
                aria-label="Remove file"
                sx={{ color: VW_COLORS.textAccent, "&:hover": { color: VW_COLORS.error } }}
              >
                <Trash2 size={14} />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      )}
      <Box
        sx={{
          border: `1px dashed ${VW_COLORS.borderDark}`,
          borderRadius: "4px",
          p: "20px 16px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.15s ease",
          "&:hover": {
            backgroundColor: VW_COLORS.bgAccent,
            borderColor: VW_COLORS.primary,
          },
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <CircularProgress size={20} sx={{ color: VW_COLORS.primary }} />
        ) : (
          <Stack direction="row" sx={{ gap: "8px", justifyContent: "center", alignItems: "center" }}>
            <Upload size={16} color={VW_COLORS.textAccent} />
            <Typography
              sx={{
                fontFamily: VW_TYPOGRAPHY.fontFamily,
                fontSize: "13px",
                color: VW_COLORS.textTertiary,
              }}
            >
              Click to upload documents
            </Typography>
          </Stack>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md"
          onChange={handleFileSelect}
        />
      </Box>
    </Stack>
  );
}

// ============================================================================
// People
// ============================================================================

function PeopleFieldRenderer({
  modelId, item, value, onValueChanged, apiServices,
}: {
  modelId: number; item: LifecycleItem; value: LifecycleValue | null | undefined;
  onValueChanged?: () => void; apiServices?: ApiServices;
}) {
  const currentPeople: { userId: number }[] = Array.isArray(value?.value_json)
    ? (value.value_json as { userId: number }[])
    : [];
  const [newUserId, setNewUserId] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = useCallback(async () => {
    const userId = parseInt(newUserId);
    if (!userId || currentPeople.find((p) => p.userId === userId)) return;
    setSaving(true);
    try {
      const updated = [...currentPeople, { userId }];
      await apiServices?.put(
        `/plugins/model-lifecycle/models/${modelId}/lifecycle/items/${item.id}`,
        { value_json: updated }
      );
      setNewUserId("");
      onValueChanged?.();
    } catch { /* retry */ } finally { setSaving(false); }
  }, [newUserId, currentPeople, modelId, item.id, onValueChanged, apiServices]);

  const handleRemove = useCallback(async (userId: number) => {
    setSaving(true);
    try {
      const updated = currentPeople.filter(p => p.userId !== userId);
      await apiServices?.put(
        `/plugins/model-lifecycle/models/${modelId}/lifecycle/items/${item.id}`,
        { value_json: updated }
      );
      onValueChanged?.();
    } catch { /* retry */ } finally { setSaving(false); }
  }, [currentPeople, modelId, item.id, onValueChanged, apiServices]);

  return (
    <Stack sx={{ gap: "10px" }}>
      {currentPeople.length > 0 && (
        <Stack direction="row" flexWrap="wrap" sx={{ gap: "8px" }}>
          {currentPeople.map((p) => (
            <Chip
              key={p.userId}
              label={`User #${p.userId}`}
              size="small"
              variant="outlined"
              onDelete={() => handleRemove(p.userId)}
              sx={{
                ...vwChipSx,
                borderColor: VW_COLORS.borderDark,
                color: VW_COLORS.textSecondary,
                "& .MuiChip-deleteIcon": {
                  color: VW_COLORS.textAccent,
                  "&:hover": { color: VW_COLORS.error },
                },
              }}
            />
          ))}
        </Stack>
      )}
      <Stack direction="row" sx={{ gap: "8px" }}>
        <TextField
          placeholder="Enter user ID..."
          size="small"
          value={newUserId}
          onChange={(e) => setNewUserId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          sx={{ flex: 1, ...vwInputSx }}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={handleAdd}
          disabled={saving || !newUserId}
          sx={vwButtonOutlined}
        >
          Add
        </Button>
      </Stack>
      {saving && <CircularProgress size={14} sx={{ color: VW_COLORS.primary }} />}
    </Stack>
  );
}

// ============================================================================
// Classification
// ============================================================================

function ClassificationFieldRenderer({
  modelId, item, value, onValueChanged, apiServices,
}: {
  modelId: number; item: LifecycleItem; value: LifecycleValue | null | undefined;
  onValueChanged?: () => void; apiServices?: ApiServices;
}) {
  const config = item.config as { levels?: string[] };
  const levels = Array.isArray(config?.levels) ? config.levels : [];
  const currentValue = (value?.value_json as { level?: string })?.level ?? "";
  const [selected, setSelected] = useState(currentValue);
  const [saving, setSaving] = useState(false);

  const handleChange = useCallback(
    async (level: string) => {
      setSelected(level);
      setSaving(true);
      try {
        await apiServices?.put(
          `/plugins/model-lifecycle/models/${modelId}/lifecycle/items/${item.id}`,
          { value_json: { level } }
        );
        onValueChanged?.();
      } catch { /* keep selection */ } finally { setSaving(false); }
    },
    [modelId, item.id, onValueChanged, apiServices]
  );

  return (
    <Stack sx={{ gap: "8px" }}>
      <RadioGroup value={selected} onChange={(e) => handleChange(e.target.value)}>
        {levels.map((level) => (
          <FormControlLabel
            key={level}
            value={level}
            control={
              <Radio
                size="small"
                sx={{
                  color: VW_COLORS.borderDark,
                  "&.Mui-checked": { color: VW_COLORS.primary },
                }}
              />
            }
            label={
              <Typography
                sx={{
                  fontFamily: VW_TYPOGRAPHY.fontFamily,
                  fontSize: "13px",
                  color: VW_COLORS.textSecondary,
                }}
              >
                {level}
              </Typography>
            }
            sx={{ marginLeft: 0 }}
          />
        ))}
      </RadioGroup>
      {saving && <CircularProgress size={14} sx={{ color: VW_COLORS.primary }} />}
    </Stack>
  );
}

// ============================================================================
// Checklist
// ============================================================================

interface ChecklistValue { label: string; checked: boolean; }

function ChecklistFieldRenderer({
  modelId, item, value, onValueChanged, apiServices,
}: {
  modelId: number; item: LifecycleItem; value: LifecycleValue | null | undefined;
  onValueChanged?: () => void; apiServices?: ApiServices;
}) {
  const config = item.config as { defaultItems?: string[] };
  const configItems = Array.isArray(config?.defaultItems) ? config.defaultItems : [];
  const defaultItems: ChecklistValue[] = configItems.map(
    (label) => ({ label, checked: false })
  );
  const savedItems: ChecklistValue[] = Array.isArray(value?.value_json)
    ? (value.value_json as ChecklistValue[])
    : defaultItems;
  const [items, setItems] = useState<ChecklistValue[]>(
    savedItems.length > 0 ? savedItems : defaultItems
  );
  const [saving, setSaving] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  const saveItems = useCallback(
    async (updatedItems: ChecklistValue[]) => {
      setSaving(true);
      try {
        await apiServices?.put(
          `/plugins/model-lifecycle/models/${modelId}/lifecycle/items/${item.id}`,
          { value_json: updatedItems }
        );
        onValueChanged?.();
      } catch { /* keep state */ } finally { setSaving(false); }
    },
    [modelId, item.id, onValueChanged, apiServices]
  );

  const toggleItem = useCallback(
    (index: number) => {
      const updated = items.map((it, i) =>
        i === index ? { ...it, checked: !it.checked } : it
      );
      setItems(updated);
      saveItems(updated);
    },
    [items, saveItems]
  );

  const addItem = useCallback(() => {
    if (!newItemText.trim()) return;
    const updated = [...items, { label: newItemText.trim(), checked: false }];
    setItems(updated);
    setNewItemText("");
    saveItems(updated);
  }, [items, newItemText, saveItems]);

  const removeItem = useCallback(
    (index: number) => {
      const updated = items.filter((_, i) => i !== index);
      setItems(updated);
      saveItems(updated);
    },
    [items, saveItems]
  );

  return (
    <Stack sx={{ gap: "10px" }}>
      {items.map((it, index) => (
        <Stack key={index} direction="row" alignItems="center" sx={{ gap: "10px" }}>
          <Checkbox
            checked={it.checked}
            onChange={() => toggleItem(index)}
            size="small"
            sx={{
              color: VW_COLORS.borderDark,
              "&.Mui-checked": { color: VW_COLORS.primary },
              padding: "4px",
            }}
          />
          <Typography
            sx={{
              flex: 1,
              fontFamily: VW_TYPOGRAPHY.fontFamily,
              fontSize: "13px",
              textDecoration: it.checked ? "line-through" : "none",
              color: it.checked ? VW_COLORS.textAccent : VW_COLORS.textSecondary,
            }}
          >
            {it.label}
          </Typography>
          <IconButton
            size="small"
            onClick={() => removeItem(index)}
            aria-label="Remove item"
            sx={{ color: VW_COLORS.textAccent, "&:hover": { color: VW_COLORS.error } }}
          >
            <X size={14} />
          </IconButton>
        </Stack>
      ))}
      <Stack direction="row" sx={{ gap: "10px" }}>
        <TextField
          placeholder="Add checklist item..."
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          size="small"
          sx={{ flex: 1, ...vwInputSx }}
        />
        <Button variant="outlined" size="small" onClick={addItem} sx={vwButtonOutlined}>
          Add
        </Button>
      </Stack>
      {saving && <CircularProgress size={14} sx={{ color: VW_COLORS.primary }} />}
    </Stack>
  );
}

// ============================================================================
// Approval
// ============================================================================

interface ApprovalValue { userId: number; status: "pending" | "approved" | "rejected"; date?: string; }

function ApprovalFieldRenderer({
  modelId, item, value, onValueChanged, apiServices,
}: {
  modelId: number; item: LifecycleItem; value: LifecycleValue | null | undefined;
  onValueChanged?: () => void; apiServices?: ApiServices;
}) {
  const currentApprovals: ApprovalValue[] = Array.isArray(value?.value_json)
    ? (value.value_json as ApprovalValue[])
    : [];
  const [approvals, setApprovals] = useState<ApprovalValue[]>(currentApprovals);
  const [saving, setSaving] = useState(false);
  const [newUserId, setNewUserId] = useState("");

  const saveApprovals = useCallback(
    async (updated: ApprovalValue[]) => {
      setSaving(true);
      try {
        await apiServices?.put(
          `/plugins/model-lifecycle/models/${modelId}/lifecycle/items/${item.id}`,
          { value_json: updated }
        );
        onValueChanged?.();
      } catch { /* keep state */ } finally { setSaving(false); }
    },
    [modelId, item.id, onValueChanged, apiServices]
  );

  const handleStatusChange = useCallback(
    (userId: number, status: "approved" | "rejected") => {
      const updated = approvals.map((a) =>
        a.userId === userId
          ? { ...a, status, date: new Date().toISOString() }
          : a
      );
      setApprovals(updated);
      saveApprovals(updated);
    },
    [approvals, saveApprovals]
  );

  const addApprover = useCallback(() => {
    const userId = parseInt(newUserId);
    if (!userId || approvals.find((a) => a.userId === userId)) return;
    const updated: ApprovalValue[] = [
      ...approvals,
      { userId, status: "pending" as const },
    ];
    setApprovals(updated);
    setNewUserId("");
    saveApprovals(updated);
  }, [newUserId, approvals, saveApprovals]);

  const removeApprover = useCallback((userId: number) => {
    const updated = approvals.filter(a => a.userId !== userId);
    setApprovals(updated);
    saveApprovals(updated);
  }, [approvals, saveApprovals]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return VW_COLORS.success;
      case "rejected": return VW_COLORS.error;
      default: return VW_COLORS.textAccent;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "approved": return VW_COLORS.successBg;
      case "rejected": return VW_COLORS.errorBg;
      default: return VW_COLORS.bgAccent;
    }
  };

  return (
    <Stack sx={{ gap: "12px" }}>
      {approvals.map((approval) => (
        <Stack
          key={approval.userId}
          direction="row"
          alignItems="center"
          sx={{
            gap: "10px",
            p: "12px 16px",
            borderRadius: "4px",
            border: `1px solid ${VW_COLORS.borderLight}`,
            backgroundColor: VW_COLORS.bgMain,
          }}
        >
          <Typography
            sx={{
              flex: 1,
              fontFamily: VW_TYPOGRAPHY.fontFamily,
              fontSize: "13px",
              color: VW_COLORS.textSecondary,
            }}
          >
            User #{approval.userId}
          </Typography>
          <Chip
            label={approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
            size="small"
            sx={{
              ...vwChipSx,
              color: getStatusColor(approval.status),
              backgroundColor: getStatusBgColor(approval.status),
              border: "none",
            }}
          />
          {approval.status === "pending" && (
            <>
              <IconButton
                size="small"
                onClick={() => handleStatusChange(approval.userId, "approved")}
                sx={{
                  color: VW_COLORS.success,
                  "&:hover": { backgroundColor: VW_COLORS.successBg },
                }}
                aria-label="Approve"
              >
                <Check size={16} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleStatusChange(approval.userId, "rejected")}
                sx={{
                  color: VW_COLORS.error,
                  "&:hover": { backgroundColor: VW_COLORS.errorBg },
                }}
                aria-label="Reject"
              >
                <X size={16} />
              </IconButton>
            </>
          )}
          <IconButton
            size="small"
            onClick={() => removeApprover(approval.userId)}
            sx={{ color: VW_COLORS.textAccent, "&:hover": { color: VW_COLORS.error } }}
            aria-label="Remove approver"
          >
            <Trash2 size={14} />
          </IconButton>
        </Stack>
      ))}
      <Stack direction="row" sx={{ gap: "8px" }}>
        <TextField
          placeholder="Enter approver user ID..."
          size="small"
          value={newUserId}
          onChange={(e) => setNewUserId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addApprover()}
          sx={{ flex: 1, ...vwInputSx }}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={addApprover}
          disabled={saving || !newUserId}
          sx={vwButtonOutlined}
        >
          Add Approver
        </Button>
      </Stack>
      {saving && <CircularProgress size={14} sx={{ color: VW_COLORS.primary }} />}
    </Stack>
  );
}
