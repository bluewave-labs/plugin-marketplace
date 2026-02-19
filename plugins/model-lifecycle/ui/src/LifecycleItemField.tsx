/**
 * LifecycleItemField - Renders the correct field UI based on item_type.
 * Self-contained version for plugin use — uses standard MUI components.
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
  Select,
  MenuItem,
  Chip,
  Button,
} from "@mui/material";
import { Trash2, Upload, FileText, Check, X, Plus } from "lucide-react";
import { LifecycleItem, LifecycleValue } from "./useModelLifecycle";

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
      InputProps={{
        endAdornment: saving ? <CircularProgress size={14} /> : undefined,
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
  const files = value?.files ?? [];
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
            "/files/upload",
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
                border: "1px solid #E0E4E9",
                backgroundColor: "#F9FAFB",
              }}
            >
              <FileText size={16} color="#667085" />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {file.filename || `File #${file.file_id}`}
              </Typography>
              <IconButton size="small" onClick={() => handleRemoveFile(file.file_id)} aria-label="Remove file">
                <Trash2 size={14} />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      )}
      <Box
        sx={{
          border: "1px dashed #D0D5DD",
          borderRadius: "4px",
          p: "20px 16px",
          textAlign: "center",
          cursor: "pointer",
          "&:hover": { backgroundColor: "#F9FAFB" },
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <CircularProgress size={20} />
        ) : (
          <Stack direction="row" sx={{ gap: "8px", justifyContent: "center", alignItems: "center" }}>
            <Upload size={16} color="#667085" />
            <Typography variant="body2" color="text.secondary">
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

  return (
    <Stack sx={{ gap: "8px" }}>
      {currentPeople.map((p) => (
        <Chip key={p.userId} label={`User #${p.userId}`} size="small" variant="outlined" />
      ))}
      <Stack direction="row" sx={{ gap: "8px" }}>
        <TextField
          placeholder="Enter user ID..."
          size="small"
          value={newUserId}
          onChange={(e) => setNewUserId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          sx={{ flex: 1 }}
        />
        <Button variant="outlined" size="small" onClick={handleAdd} disabled={saving}>
          Add
        </Button>
      </Stack>
      {saving && <CircularProgress size={14} />}
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
  const levels = config?.levels ?? [];
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
            control={<Radio size="small" />}
            label={<Typography variant="body2">{level}</Typography>}
          />
        ))}
      </RadioGroup>
      {saving && <CircularProgress size={14} />}
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
  const defaultItems: ChecklistValue[] = (config?.defaultItems ?? []).map(
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
          />
          <Typography
            variant="body2"
            sx={{
              flex: 1,
              fontSize: "13px",
              textDecoration: it.checked ? "line-through" : "none",
              color: it.checked ? "#667085" : "#344054",
            }}
          >
            {it.label}
          </Typography>
          <IconButton size="small" onClick={() => removeItem(index)} aria-label="Remove item">
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
          sx={{ flex: 1 }}
        />
        <Button variant="outlined" size="small" onClick={addItem}>
          Add
        </Button>
      </Stack>
      {saving && <CircularProgress size={14} />}
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "#079455";
      case "rejected": return "#F04438";
      default: return "#667085";
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
            border: "1px solid #E0E4E9",
          }}
        >
          <Typography variant="body2" sx={{ flex: 1 }}>
            User #{approval.userId}
          </Typography>
          <Chip
            label={approval.status}
            size="small"
            sx={{ color: getStatusColor(approval.status), borderColor: getStatusColor(approval.status) }}
            variant="outlined"
          />
          {approval.status === "pending" && (
            <>
              <IconButton
                size="small"
                onClick={() => handleStatusChange(approval.userId, "approved")}
                sx={{ color: "#079455" }}
                aria-label="Approve"
              >
                <Check size={16} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleStatusChange(approval.userId, "rejected")}
                sx={{ color: "#F04438" }}
                aria-label="Reject"
              >
                <X size={16} />
              </IconButton>
            </>
          )}
        </Stack>
      ))}
      <Stack direction="row" sx={{ gap: "8px" }}>
        <TextField
          placeholder="Enter approver user ID..."
          size="small"
          value={newUserId}
          onChange={(e) => setNewUserId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addApprover()}
          sx={{ flex: 1 }}
        />
        <Button variant="outlined" size="small" onClick={addApprover} disabled={saving}>
          Add Approver
        </Button>
      </Stack>
      {saving && <CircularProgress size={14} />}
    </Stack>
  );
}
