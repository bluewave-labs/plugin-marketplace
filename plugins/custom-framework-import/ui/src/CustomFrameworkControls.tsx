/**
 * Custom Framework Controls
 *
 * Renders a combined framework toggle that includes both built-in and custom frameworks.
 * This component takes over the entire Controls tab toggle section when custom frameworks exist.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  CircularProgress,
  Stack,
  Chip,
} from "@mui/material";
import { CustomFrameworkViewer } from "./CustomFrameworkViewer";
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

interface BuiltInFramework {
  id: string;
  name: string;
  description?: string;
}

interface Project {
  id: number;
  project_title: string;
  is_organizational: boolean;
}

interface CustomFrameworkControlsProps {
  project: Project;
  builtInFrameworks: BuiltInFramework[];
  selectedBuiltInFramework: number;
  onBuiltInFrameworkSelect: (index: number) => void;
  renderBuiltInContent: () => React.ReactNode;
  onRefresh?: () => void;
  children?: React.ReactNode;
  apiServices?: {
    get: (url: string, options?: any) => Promise<any>;
    post: (url: string, data?: any) => Promise<any>;
    patch: (url: string, data?: any) => Promise<any>;
  };
}

// Toggle button styles matching the app's ButtonToggle
const toggleContainerStyle = {
  display: "inline-flex",
  borderRadius: "4px",
  border: "1px solid #D0D5DD",
  overflow: "hidden",
  backgroundColor: "#fff",
};

const toggleButtonStyle = (isSelected: boolean, _isCustom: boolean = false) => ({
  padding: "8px 16px",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
  border: "none",
  borderRight: "1px solid #D0D5DD",
  backgroundColor: isSelected ? "#13715B" : "#fff",
  color: isSelected ? "#fff" : "#344054",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  "&:hover": {
    backgroundColor: isSelected ? "#0e5c47" : "#F9FAFB",
  },
  "&:last-child": {
    borderRight: "none",
  },
});

export const CustomFrameworkControls: React.FC<CustomFrameworkControlsProps> = ({
  project,
  builtInFrameworks,
  selectedBuiltInFramework,
  onBuiltInFrameworkSelect,
  renderBuiltInContent,
  onRefresh,
  children,
  apiServices,
}) => {
  const [customFrameworks, setCustomFrameworks] = useState<CustomFramework[]>([]);
  const [selectedCustomFramework, setSelectedCustomFramework] = useState<number | null>(null);
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const [loading, setLoading] = useState(true);

  const api = apiServices || {
    get: async (url: string) => {
      const response = await fetch(`/api${url}`);
      return { data: await response.json() };
    },
    post: async (url: string, body?: any) => {
      const response = await fetch(`/api${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return { data: await response.json(), status: response.status };
    },
    patch: async (url: string, body?: any) => {
      const response = await fetch(`/api${url}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return { data: await response.json() };
    },
  };

  const loadFrameworks = useCallback(async () => {
    if (!project?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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
      console.log("[CustomFrameworkControls] Loaded custom frameworks:", frameworksArray);
      setCustomFrameworks(frameworksArray);
    } catch (err) {
      console.log("[CustomFrameworkControls] Error loading frameworks:", err);
      setCustomFrameworks([]);
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    loadFrameworks();
  }, [loadFrameworks]);

  const handleBuiltInSelect = (index: number) => {
    setIsCustomSelected(false);
    setSelectedCustomFramework(null);
    onBuiltInFrameworkSelect(index);
  };

  const handleCustomSelect = (frameworkId: number) => {
    setIsCustomSelected(true);
    setSelectedCustomFramework(frameworkId);
  };

  // If still loading, show spinner
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={24} sx={{ color: colors.primary }} />
      </Box>
    );
  }

  // If no custom frameworks, render the default children (built-in toggle + content)
  if (customFrameworks.length === 0) {
    return <>{children}</>;
  }

  // Render combined toggle with built-in + custom frameworks
  const currentCustomFramework = customFrameworks.find(
    (fw) => fw.framework_id === selectedCustomFramework
  );

  return (
    <Stack spacing={3}>
      {/* Combined framework toggle */}
      {project && (builtInFrameworks.length > 0 || customFrameworks.length > 0) && (
        <Box data-joyride-id="framework-toggle" sx={toggleContainerStyle}>
          {/* Built-in framework options */}
          {builtInFrameworks.map((framework, index) => (
            <Box
              key={framework.id}
              component="button"
              onClick={() => handleBuiltInSelect(index)}
              sx={toggleButtonStyle(!isCustomSelected && selectedBuiltInFramework === index)}
            >
              {framework.name}
            </Box>
          ))}

          {/* Custom framework options */}
          {customFrameworks.map((framework) => (
            <Box
              key={`custom-${framework.framework_id}`}
              component="button"
              onClick={() => handleCustomSelect(framework.framework_id)}
              sx={toggleButtonStyle(isCustomSelected && selectedCustomFramework === framework.framework_id, true)}
            >
              {framework.name}
              <Chip
                label="Custom"
                size="small"
                sx={{
                  height: 18,
                  fontSize: "10px",
                  fontWeight: 600,
                  backgroundColor: isCustomSelected && selectedCustomFramework === framework.framework_id
                    ? "rgba(255,255,255,0.2)"
                    : "#eff6ff",
                  color: isCustomSelected && selectedCustomFramework === framework.framework_id
                    ? "#fff"
                    : "#3b82f6",
                  ml: 0.5,
                }}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Content area */}
      {isCustomSelected && selectedCustomFramework && currentCustomFramework ? (
        <CustomFrameworkViewer
          frameworkId={selectedCustomFramework}
          projectId={project.id}
          frameworkName={currentCustomFramework.name}
          apiServices={api}
          onRefresh={() => {
            loadFrameworks();
            onRefresh?.();
          }}
        />
      ) : (
        renderBuiltInContent()
      )}
    </Stack>
  );
};

export default CustomFrameworkControls;
