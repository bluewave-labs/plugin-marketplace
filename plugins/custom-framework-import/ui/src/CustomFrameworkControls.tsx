/**
 * Custom Framework Controls
 *
 * Renders a combined framework toggle that includes both built-in and custom frameworks.
 * This component takes over the entire Controls tab toggle section when custom frameworks exist.
 * Uses the same styling as the app's ButtonToggle component.
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

// Styles matching the app's ButtonToggle exactly
const toggleContainerStyle = (height: number) => ({
  position: "relative",
  display: "flex",
  border: "1px solid rgba(0, 0, 0, 0.12)",
  borderRadius: "4px",
  overflow: "hidden",
  height,
  bgcolor: "action.hover",
  width: "fit-content",
  padding: "2px",
  gap: "2px",
});

const toggleTabStyle = {
  cursor: "pointer",
  px: 5,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  color: "text.primary",
  fontSize: "13px",
  fontWeight: 400,
  userSelect: "none",
  width: "fit-content",
  minWidth: "120px",
  position: "relative",
  zIndex: 1,
  transition: "color 0.3s ease",
  gap: 1,
};

const sliderStyle = (activeIndex: number, optionsCount: number) => ({
  position: "absolute",
  top: "2px",
  left: "2px",
  height: "calc(100% - 4px)",
  width: `calc((100% - ${(optionsCount + 1) * 2}px) / ${optionsCount})`,
  bgcolor: "background.paper",
  border: "1px solid rgba(0, 0, 0, 0.08)",
  borderRadius: "4px",
  transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  transform: `translateX(calc(${activeIndex} * (100% + 2px)))`,
  zIndex: 0,
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

  // Calculate active index for the slider
  const totalOptions = builtInFrameworks.length + customFrameworks.length;
  let activeIndex: number;
  if (isCustomSelected && selectedCustomFramework !== null) {
    const customIndex = customFrameworks.findIndex(
      (fw) => fw.framework_id === selectedCustomFramework
    );
    activeIndex = builtInFrameworks.length + customIndex;
  } else {
    activeIndex = selectedBuiltInFramework;
  }

  const currentCustomFramework = customFrameworks.find(
    (fw) => fw.framework_id === selectedCustomFramework
  );

  return (
    <Stack spacing={3}>
      {/* Combined framework toggle - matching ButtonToggle styling */}
      {project && totalOptions > 0 && (
        <Box data-joyride-id="framework-toggle" sx={toggleContainerStyle(34)}>
          {/* Sliding background */}
          <Box sx={sliderStyle(activeIndex, totalOptions)} />

          {/* Built-in framework options */}
          {builtInFrameworks.map((framework, index) => (
            <Box
              key={framework.id}
              onClick={() => handleBuiltInSelect(index)}
              sx={toggleTabStyle}
            >
              {framework.name}
            </Box>
          ))}

          {/* Custom framework options */}
          {customFrameworks.map((framework) => (
            <Box
              key={`custom-${framework.framework_id}`}
              onClick={() => handleCustomSelect(framework.framework_id)}
              sx={toggleTabStyle}
            >
              {framework.name}
              <Chip
                label="Custom"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "11px",
                  fontWeight: 500,
                  backgroundColor: "#E6F4EE",
                  color: "#13715B",
                  border: "none",
                  "& .MuiChip-label": {
                    px: 1,
                  },
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
