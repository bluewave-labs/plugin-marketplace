/**
 * Custom Framework Config
 *
 * Main configuration/management panel for the Custom Framework Import plugin.
 * Accessible from Settings > Custom Frameworks
 * Uses VerifyWise design system for consistency
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Drawer,
  Chip,
  Divider,
} from "@mui/material";
import { RefreshCw, FileJson, X, Building2, Layers } from "lucide-react";
import {
  colors,
  textColors,
  fontSizes,
  cardStyles,
  emptyStateStyles,
  borderColors,
  bgColors,
} from "./theme";
import { FrameworksTable } from "./FrameworksTable";

interface CustomFramework {
  id: number;
  framework_id?: number;
  name: string;
  description: string;
  hierarchy_type: string;
  level_1_name: string;
  level_2_name: string;
  level_3_name?: string;
  is_organizational: boolean;
  created_at: string;
  level1_count?: number;
  level2_count?: number;
  level3_count?: number;
}

interface CustomFrameworkConfigProps {
  apiServices?: {
    get: (url: string, options?: any) => Promise<any>;
    post: (url: string, data?: any) => Promise<any>;
    delete?: (url: string) => Promise<any>;
  };
  pluginEnabled?: boolean;
  /** Plugin key for API routing (defaults to 'custom-framework-import') */
  pluginKey?: string;
}

export const CustomFrameworkConfig: React.FC<CustomFrameworkConfigProps> = ({
  apiServices,
  pluginEnabled = true,
  pluginKey,
}) => {
  const [frameworks, setFrameworks] = useState<CustomFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<CustomFramework | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleViewDetails = (framework: CustomFramework) => {
    setSelectedFramework(framework);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedFramework(null);
  };

  // Helper to get auth token from localStorage (redux-persist)
  const getAuthToken = (): string | null => {
    try {
      const persistedRoot = localStorage.getItem("persist:root");
      if (persistedRoot) {
        const parsed = JSON.parse(persistedRoot);
        if (parsed.auth) {
          const authState = JSON.parse(parsed.auth);
          return authState.authToken || null;
        }
      }
    } catch {
      // Silently fail
    }
    return null;
  };

  const api = apiServices || {
    get: async (url: string) => {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(`/api${url}`, { headers });
      return { data: await response.json(), status: response.status };
    },
  };

  const loadFrameworks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch ALL frameworks from all installed framework plugins
      const response = await api.get(
        `/plugins/${pluginKey}/frameworks?all=true`
      );
      const data = response.data.data || response.data;
      setFrameworks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load frameworks");
    } finally {
      setLoading(false);
    }
  }, [pluginKey]);

  useEffect(() => {
    loadFrameworks();
  }, [loadFrameworks]);

  // Auto-dismiss error messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!pluginEnabled) {
    return (
      <Box sx={cardStyles.default}>
        <Alert severity="info" sx={{ border: "none" }}>
          Custom Framework Import plugin is not enabled. Enable it to import
          and manage custom compliance frameworks.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 8 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: fontSizes.large,
              fontWeight: 600,
              color: textColors.primary,
            }}
          >
            Custom Frameworks
          </Typography>
          <Typography
            sx={{
              fontSize: fontSizes.medium,
              color: textColors.muted,
              mt: 0.5,
            }}
          >
            Manage custom compliance frameworks from installed plugins
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton
            onClick={loadFrameworks}
            disabled={loading}
            sx={{
              border: `1px solid ${borderColors.default}`,
              borderRadius: "4px",
              width: 32,
              height: 32,
              "&:hover": { backgroundColor: bgColors.hover },
            }}
          >
            <RefreshCw size={16} color={textColors.muted} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Messages */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, fontSize: fontSizes.medium }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Frameworks Table */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={24} sx={{ color: colors.primary }} />
        </Box>
      ) : frameworks.length === 0 ? (
        <Box sx={{ ...cardStyles.gradient, ...emptyStateStyles.container }}>
          <FileJson
            size={48}
            color={textColors.muted}
            style={{ marginBottom: 16 }}
          />
          <Typography sx={emptyStateStyles.title}>
            No Custom Frameworks
          </Typography>
          <Typography sx={emptyStateStyles.description}>
            Install a framework plugin from the marketplace to get started
          </Typography>
        </Box>
      ) : (
        <FrameworksTable frameworks={frameworks} onViewDetails={handleViewDetails} />
      )}

      {/* Framework Details Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: {
            width: 400,
            p: 3,
          },
        }}
      >
        {selectedFramework && (
          <Box>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
              <Box>
                <Typography sx={{ fontSize: 18, fontWeight: 600, color: textColors.primary }}>
                  {selectedFramework.name}
                </Typography>
                <Typography sx={{ fontSize: 13, color: textColors.muted, mt: 0.5 }}>
                  Framework Details
                </Typography>
              </Box>
              <IconButton onClick={handleCloseDrawer} size="small">
                <X size={18} />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Description */}
            {selectedFramework.description && (
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: textColors.muted, mb: 1, textTransform: "uppercase" }}>
                  Description
                </Typography>
                <Typography sx={{ fontSize: 14, color: textColors.primary, lineHeight: 1.6 }}>
                  {selectedFramework.description}
                </Typography>
              </Box>
            )}

            {/* Type & Hierarchy */}
            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: textColors.muted, mb: 1, textTransform: "uppercase" }}>
                  Type
                </Typography>
                <Chip
                  icon={<Building2 size={12} />}
                  label={selectedFramework.is_organizational ? "Organizational" : "Project"}
                  size="small"
                  sx={{
                    fontSize: "11px",
                    fontWeight: 500,
                    height: 24,
                    backgroundColor: selectedFramework.is_organizational ? "#ECFDF3" : "#F2F4F7",
                    color: selectedFramework.is_organizational ? "#027A48" : "#344054",
                    border: selectedFramework.is_organizational ? "1px solid #A6F4C5" : "1px solid #E4E7EC",
                    "& .MuiChip-icon": {
                      color: selectedFramework.is_organizational ? "#027A48" : "#667085",
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: textColors.muted, mb: 1, textTransform: "uppercase" }}>
                  Hierarchy
                </Typography>
                <Chip
                  icon={<Layers size={12} />}
                  label={selectedFramework.hierarchy_type === "three_level" ? "3 Levels" : "2 Levels"}
                  size="small"
                  sx={{
                    fontSize: "11px",
                    fontWeight: 500,
                    height: 24,
                    backgroundColor: "#F2F4F7",
                    color: "#344054",
                    border: "1px solid #E4E7EC",
                    "& .MuiChip-icon": { color: "#667085" },
                  }}
                />
              </Box>
            </Box>

            {/* Structure */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: textColors.muted, mb: 1, textTransform: "uppercase" }}>
                Structure
              </Typography>
              <Box sx={{ backgroundColor: "#F9FAFB", p: 2, borderRadius: 1, border: "1px solid #E4E7EC" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography sx={{ fontSize: 13, color: textColors.muted }}>
                    {selectedFramework.level_1_name}s
                  </Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: textColors.primary }}>
                    {selectedFramework.level1_count || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: selectedFramework.hierarchy_type === "three_level" ? 1 : 0 }}>
                  <Typography sx={{ fontSize: 13, color: textColors.muted }}>
                    {selectedFramework.level_2_name}s
                  </Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: textColors.primary }}>
                    {selectedFramework.level2_count || 0}
                  </Typography>
                </Box>
                {selectedFramework.hierarchy_type === "three_level" && selectedFramework.level_3_name && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: 13, color: textColors.muted }}>
                      {selectedFramework.level_3_name}s
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: textColors.primary }}>
                      {selectedFramework.level3_count || 0}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Created Date */}
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: textColors.muted, mb: 1, textTransform: "uppercase" }}>
                Created
              </Typography>
              <Typography sx={{ fontSize: 14, color: textColors.primary }}>
                {new Date(selectedFramework.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Typography>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};
