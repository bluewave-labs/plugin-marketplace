/**
 * Custom Framework Dashboard
 *
 * Shows dashboard/overview for custom frameworks when no system frameworks are enabled.
 * Displays progress and status for all custom frameworks attached to the project.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Stack,
  LinearProgress,
} from "@mui/material";
import { colors } from "./theme";

interface CustomFramework {
  id: number;
  framework_id: number;
  name: string;
  description: string;
  hierarchy_type: string;
  level_1_name: string;
  level_2_name: string;
  level_3_name?: string;
  is_organizational: boolean;
}

interface FrameworkProgress {
  framework_id: number;
  name: string;
  total: number;
  completed: number;
  percentage: number;
}

interface Project {
  id: number;
  project_title: string;
  is_organizational: boolean;
}

interface CustomFrameworkDashboardProps {
  project: Project;
  apiServices?: {
    get: (url: string, options?: any) => Promise<any>;
  };
}

export const CustomFrameworkDashboard: React.FC<CustomFrameworkDashboardProps> = ({
  project,
  apiServices,
}) => {
  const [loading, setLoading] = useState(true);
  const [frameworks, setFrameworks] = useState<CustomFramework[]>([]);
  const [progressData, setProgressData] = useState<FrameworkProgress[]>([]);

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

  const api = useMemo(() => apiServices || {
    get: async (url: string) => {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(`/api${url}`, { headers });
      return { data: await response.json(), status: response.status };
    },
  }, [apiServices]);

  const loadData = useCallback(async () => {
    if (!project?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch custom frameworks for this project
      const response = await api.get(
        `/plugins/custom-framework-import/projects/${project.id}/custom-frameworks`
      );

      let rawData = response.data;
      if (rawData && typeof rawData === "object" && "data" in rawData) {
        rawData = rawData.data;
      }
      if (rawData && typeof rawData === "object" && !Array.isArray(rawData) && "data" in rawData) {
        rawData = rawData.data;
      }

      const frameworksArray = Array.isArray(rawData) ? rawData : [];
      setFrameworks(frameworksArray);

      // Fetch progress for each framework
      const progressPromises = frameworksArray.map(async (fw: CustomFramework) => {
        try {
          const progressRes = await api.get(
            `/plugins/custom-framework-import/projects/${project.id}/frameworks/${fw.framework_id}/progress`
          );
          const progressData = progressRes.data?.data || progressRes.data || {};
          return {
            framework_id: fw.framework_id,
            name: fw.name,
            total: progressData.total || 0,
            completed: progressData.completed || 0,
            percentage: progressData.percentage || 0,
          };
        } catch {
          return {
            framework_id: fw.framework_id,
            name: fw.name,
            total: 0,
            completed: 0,
            percentage: 0,
          };
        }
      });

      const progress = await Promise.all(progressPromises);
      setProgressData(progress);
    } catch (err) {
      console.error("[CustomFrameworkDashboard] Error loading data:", err);
      setFrameworks([]);
      setProgressData([]);
    } finally {
      setLoading(false);
    }
  }, [project?.id, api]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for custom framework changes
  useEffect(() => {
    const handleCustomFrameworkChange = (event: CustomEvent) => {
      if (event.detail?.projectId === project?.id) {
        loadData();
      }
    };

    window.addEventListener(
      "customFrameworkChanged" as any,
      handleCustomFrameworkChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "customFrameworkChanged" as any,
        handleCustomFrameworkChange as EventListener
      );
    };
  }, [loadData, project?.id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={32} sx={{ color: colors.primary }} />
      </Box>
    );
  }

  if (frameworks.length === 0) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 8,
          backgroundColor: "#F9FAFB",
          borderRadius: 2,
          border: "1px solid #d0d5dd",
        }}
      >
        <Typography variant="body1" color="text.secondary">
          No frameworks enabled for this organization.
        </Typography>
      </Box>
    );
  }

  // Calculate overall progress
  const overallTotal = progressData.reduce((sum, p) => sum + p.total, 0);
  const overallCompleted = progressData.reduce((sum, p) => sum + p.completed, 0);
  const overallPercentage = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  return (
    <Stack spacing={3}>
      {/* Overall Progress Card */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: "16px",
        }}
      >
        {/* Framework Progress Card */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            border: "1px solid #d0d5dd",
            borderRadius: "4px",
            p: 3,
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#000", mb: 2 }}>
            Framework Progress
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={overallPercentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#E5E7EB",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: colors.primary,
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.primary }}>
              {overallPercentage}%
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 12, color: "#666" }}>
            {overallCompleted} of {overallTotal} items completed
          </Typography>
        </Box>

        {/* Frameworks Count Card */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            border: "1px solid #d0d5dd",
            borderRadius: "4px",
            p: 3,
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#000", mb: 2 }}>
            Active Frameworks
          </Typography>
          <Typography sx={{ fontSize: 28, fontWeight: 700, color: colors.primary }}>
            {frameworks.length}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#666" }}>
            Custom framework{frameworks.length !== 1 ? "s" : ""} enabled
          </Typography>
        </Box>

        {/* Quick Stats Card */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            border: "1px solid #d0d5dd",
            borderRadius: "4px",
            p: 3,
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#000", mb: 2 }}>
            Completion Status
          </Typography>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
            <Typography sx={{ fontSize: 28, fontWeight: 700, color: colors.primary }}>
              {overallCompleted}
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#666" }}>
              / {overallTotal}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 12, color: "#666" }}>
            Items marked as done
          </Typography>
        </Box>
      </Box>

      {/* Individual Framework Progress */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          border: "1px solid #d0d5dd",
          borderRadius: "4px",
          p: 3,
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#000", mb: 3 }}>
          Framework Details
        </Typography>
        <Stack spacing={2}>
          {progressData.map((fw) => (
            <Box key={fw.framework_id}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#000" }}>
                  {fw.name}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#666" }}>
                  {fw.completed} / {fw.total} ({fw.percentage}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={fw.percentage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#E5E7EB",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: fw.percentage === 100 ? "#16A34A" : colors.primary,
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
};

export default CustomFrameworkDashboard;
