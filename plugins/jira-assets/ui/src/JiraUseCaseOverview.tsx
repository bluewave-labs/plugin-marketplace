/**
 * JIRA Use Case Overview
 * Shows JIRA object summary with the same styling as the regular Overview
 */

import React from "react";
import { Stack, Typography, Box, Chip } from "@mui/material";
import { Database } from "lucide-react";

interface JiraUseCaseOverviewProps {
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
    });
  } catch {
    return dateStr;
  }
};

const styles = {
  block: {
    borderRadius: 2,
    backgroundColor: "#FAFAFA",
    minWidth: 228,
    width: "100%",
    padding: "8px 36px 14px 14px",
  },
  title: {
    fontSize: 12,
    color: "#8594AC",
    pb: "2px",
  },
  value: {
    fontSize: 16,
    fontWeight: 600,
    color: "#2D3748",
  },
  sectionTitle: {
    color: "#1A1919",
    fontWeight: 600,
    mb: "10px",
    fontSize: 16,
  },
};

export const JiraUseCaseOverview: React.FC<JiraUseCaseOverviewProps> = ({ project }) => {
  if (!project) {
    return <Typography>No JIRA use case found</Typography>;
  }

  const jiraData = project._jira_data;
  const attributes = jiraData?.attributes || {};

  // Extract key attributes for display
  const description = attributes["Description / Purpose"] || attributes["Description"] || attributes["Purpose"] || "-";
  const riskLevel = attributes["Risk Level / Criticality"] || "-";
  const lifecycleStatus = attributes["Lifecycle Status"] || "-";
  const primaryFunction = attributes["Primary Function"] || "-";

  return (
    <Stack sx={{ width: "100%" }}>
      {/* JIRA Source Badge */}
      <Box sx={{ mb: 3 }}>
        <Chip
          icon={<Database size={14} />}
          label="Imported from JIRA Assets"
          size="small"
          sx={{
            backgroundColor: "#E3F2FD",
            color: "#1565C0",
            "& .MuiChip-icon": { color: "#1565C0" },
          }}
        />
      </Box>

      {/* Main Info Row */}
      <Stack direction="row" spacing={18} sx={{ pb: "31px" }}>
        <Stack sx={styles.block}>
          <Typography sx={styles.title}>JIRA Object Key</Typography>
          <Typography sx={styles.value}>{jiraData?.objectKey || "-"}</Typography>
        </Stack>
        <Stack sx={styles.block}>
          <Typography sx={styles.title}>Object Type</Typography>
          <Typography sx={styles.value}>{jiraData?.objectType?.name || "-"}</Typography>
        </Stack>
        <Stack sx={styles.block}>
          <Typography sx={styles.title}>Sync Status</Typography>
          <Typography sx={{ ...styles.value, textTransform: "capitalize" }}>
            {project._sync_status || "synced"}
          </Typography>
        </Stack>
      </Stack>

      {/* Dates Row */}
      <Stack direction="row" spacing={18} sx={{ pb: "31px" }}>
        <Stack sx={styles.block}>
          <Typography sx={styles.title}>Created in JIRA</Typography>
          <Typography sx={styles.value}>
            {formatDate(jiraData?.created)}
          </Typography>
        </Stack>
        <Stack sx={styles.block}>
          <Typography sx={styles.title}>Last Updated in JIRA</Typography>
          <Typography sx={styles.value}>
            {formatDate(jiraData?.updated)}
          </Typography>
        </Stack>
        <Stack sx={{ minWidth: 228, width: "100%", p: "8px 36px 14px 14px" }} />
      </Stack>

      {/* Key Attributes Section */}
      <Stack sx={{ mb: 4 }}>
        <Typography sx={styles.sectionTitle}>Key Attributes</Typography>
        <Stack direction="row" spacing={18} sx={{ pb: "16px" }}>
          <Stack sx={styles.block}>
            <Typography sx={styles.title}>Risk Level / Criticality</Typography>
            <Typography sx={styles.value}>{riskLevel}</Typography>
          </Stack>
          <Stack sx={styles.block}>
            <Typography sx={styles.title}>Lifecycle Status</Typography>
            <Typography sx={styles.value}>{lifecycleStatus}</Typography>
          </Stack>
          <Stack sx={styles.block}>
            <Typography sx={styles.title}>Primary Function</Typography>
            <Typography sx={styles.value}>{primaryFunction}</Typography>
          </Stack>
        </Stack>
      </Stack>

      {/* Description Section */}
      <Stack sx={{ mb: 4 }}>
        <Typography sx={styles.sectionTitle}>Description / Purpose</Typography>
        <Box
          sx={{
            ...styles.block,
            maxWidth: "100%",
            minHeight: 80,
          }}
        >
          <Typography sx={{ fontSize: 14, color: "#2D3748", lineHeight: 1.6 }}>
            {description}
          </Typography>
        </Box>
      </Stack>
    </Stack>
  );
};

export default JiraUseCaseOverview;
