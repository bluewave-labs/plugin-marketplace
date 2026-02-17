/**
 * JIRA Use Case Settings
 * Shows all JIRA object attributes with the same styling as ProjectSettings
 */

import React, { useState } from "react";
import {
  Stack,
  Typography,
  Box,
  Chip,
  Divider,
  TextField,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { Database, ChevronDown, ExternalLink } from "lucide-react";

interface JiraUseCaseSettingsProps {
  project: {
    project_title?: string;
    uc_id?: string;
    _jira_data?: {
      id?: string;
      label?: string;
      objectKey?: string;
      objectType?: { name?: string };
      created?: string;
      updated?: string;
      attributes?: Record<string, any>;
      _links?: {
        self?: string;
      };
    };
    _sync_status?: string;
  } | null;
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ") || "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value) || "-";
};

const styles = {
  sectionTitle: {
    color: "#1A1919",
    fontWeight: 600,
    mb: 2,
    fontSize: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: "#344054",
    mb: 0.5,
  },
  fieldContainer: {
    mb: 2,
  },
  readOnlyField: {
    "& .MuiInputBase-root": {
      backgroundColor: "#F9FAFB",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#E5E7EB",
    },
  },
};

export const JiraUseCaseSettings: React.FC<JiraUseCaseSettingsProps> = ({ project }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(["basic", "attributes"]);

  if (!project) {
    return <Typography>No JIRA use case found</Typography>;
  }

  const jiraData = project._jira_data;
  const attributes = jiraData?.attributes || {};

  const handleSectionToggle = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  // Categorize attributes
  const identificationAttrs = [
    "System Name / Identifier",
    "Name",
    "Description / Purpose",
    "Description",
    "Purpose",
  ];

  const ownershipAttrs = [
    "Business Owner / Responsible Team",
    "Technical Owner / Maintainer",
    "AI Officer",
    "Model Owner / Maintainer",
    "Risk Owner",
    "Vendor / Developer Name (if third-party)",
  ];

  const classificationAttrs = [
    "Lifecycle Status",
    "Primary Function",
    "Use Case / Business Process Supported",
    "User Groups / Stakeholders",
    "Decision Type",
    "AI Function Type",
  ];

  const riskAttrs = [
    "Risk Level / Criticality",
    "Potential Harms or Impacts",
    "Known Limitations",
    "Applicable Regulations",
  ];

  const technicalAttrs = [
    "Input Data Sources & Types",
    "Contains Personal / Sensitive Data",
    "Deployment Environment",
    "Platform / Tooling",
    "Model Type / Algorithm & Version",
    "Key Performance Metrics",
    "Explainability Method",
    "Human Oversight Mechanisms",
  ];

  const otherAttrs = Object.keys(attributes).filter(
    (key) =>
      ![
        ...identificationAttrs,
        ...ownershipAttrs,
        ...classificationAttrs,
        ...riskAttrs,
        ...technicalAttrs,
      ].includes(key)
  );

  const renderField = (label: string, value: any) => (
    <Box sx={styles.fieldContainer} key={label}>
      <InputLabel sx={styles.label}>{label}</InputLabel>
      <TextField
        fullWidth
        size="small"
        value={formatValue(value)}
        InputProps={{ readOnly: true }}
        sx={styles.readOnlyField}
        multiline={String(value || "").length > 100}
        rows={String(value || "").length > 100 ? 3 : 1}
      />
    </Box>
  );

  const renderAttributeSection = (title: string, attrKeys: string[]) => {
    const sectionAttrs = attrKeys.filter((key) => attributes[key] !== undefined);
    if (sectionAttrs.length === 0) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#475467", mb: 2 }}>
          {title}
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={2}>
          {sectionAttrs.map((key) => (
            <Box key={key} sx={{ minWidth: 280, flex: "1 1 280px", maxWidth: "calc(50% - 8px)" }}>
              {renderField(key, attributes[key])}
            </Box>
          ))}
        </Stack>
      </Box>
    );
  };

  return (
    <Stack sx={{ width: "100%", maxWidth: 1200 }}>
      {/* JIRA Source Badge */}
      <Box sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center" }}>
        <Chip
          icon={<Database size={14} />}
          label="JIRA Assets Object"
          size="small"
          sx={{
            backgroundColor: "#E3F2FD",
            color: "#1565C0",
            "& .MuiChip-icon": { color: "#1565C0" },
          }}
        />
        <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
          This use case is imported from JIRA and is read-only
        </Typography>
      </Box>

      {/* Basic Information Section */}
      <Accordion
        expanded={expandedSections.includes("basic")}
        onChange={() => handleSectionToggle("basic")}
        sx={{ mb: 2, boxShadow: "none", border: "1px solid #E5E7EB", borderRadius: "8px !important" }}
      >
        <AccordionSummary expandIcon={<ChevronDown size={20} />}>
          <Typography sx={styles.sectionTitle}>Basic Information</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack direction="row" flexWrap="wrap" gap={2}>
            <Box sx={{ minWidth: 280, flex: "1 1 280px" }}>
              {renderField("Use Case ID", project.uc_id)}
            </Box>
            <Box sx={{ minWidth: 280, flex: "1 1 280px" }}>
              {renderField("Name", project.project_title)}
            </Box>
            <Box sx={{ minWidth: 280, flex: "1 1 280px" }}>
              {renderField("JIRA Object Key", jiraData?.objectKey)}
            </Box>
            <Box sx={{ minWidth: 280, flex: "1 1 280px" }}>
              {renderField("Object Type", jiraData?.objectType?.name)}
            </Box>
            <Box sx={{ minWidth: 280, flex: "1 1 280px" }}>
              {renderField("Created in JIRA", formatDate(jiraData?.created))}
            </Box>
            <Box sx={{ minWidth: 280, flex: "1 1 280px" }}>
              {renderField("Last Updated in JIRA", formatDate(jiraData?.updated))}
            </Box>
            <Box sx={{ minWidth: 280, flex: "1 1 280px" }}>
              {renderField("Sync Status", project._sync_status || "synced")}
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* All Attributes Section */}
      <Accordion
        expanded={expandedSections.includes("attributes")}
        onChange={() => handleSectionToggle("attributes")}
        sx={{ mb: 2, boxShadow: "none", border: "1px solid #E5E7EB", borderRadius: "8px !important" }}
      >
        <AccordionSummary expandIcon={<ChevronDown size={20} />}>
          <Typography sx={styles.sectionTitle}>
            JIRA Attributes ({Object.keys(attributes).length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {renderAttributeSection("Identification", identificationAttrs)}
          {renderAttributeSection("Ownership & Governance", ownershipAttrs)}
          {renderAttributeSection("Classification & Function", classificationAttrs)}
          {renderAttributeSection("Risk & Compliance", riskAttrs)}
          {renderAttributeSection("Technical Details", technicalAttrs)}
          {otherAttrs.length > 0 && renderAttributeSection("Other Attributes", otherAttrs)}

          {Object.keys(attributes).length === 0 && (
            <Typography sx={{ color: "#6B7280", fontStyle: "italic" }}>
              No attributes available for this object
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Raw Data Section (collapsed by default) */}
      <Accordion
        expanded={expandedSections.includes("raw")}
        onChange={() => handleSectionToggle("raw")}
        sx={{ boxShadow: "none", border: "1px solid #E5E7EB", borderRadius: "8px !important" }}
      >
        <AccordionSummary expandIcon={<ChevronDown size={20} />}>
          <Typography sx={styles.sectionTitle}>Raw JIRA Data</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            fullWidth
            multiline
            rows={15}
            value={JSON.stringify(jiraData, null, 2)}
            InputProps={{ readOnly: true, sx: { fontFamily: "monospace", fontSize: 12 } }}
            sx={styles.readOnlyField}
          />
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
};

export default JiraUseCaseSettings;
