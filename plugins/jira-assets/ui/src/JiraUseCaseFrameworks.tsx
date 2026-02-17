/**
 * Frameworks tab for JIRA-imported use cases
 * Shows "No frameworks" state when empty, with ability to add frameworks
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Chip,
  Alert,
} from "@mui/material";
import { Plus, FileText, CheckCircle } from "lucide-react";

interface Framework {
  id: number;
  name: string;
  description?: string;
}

interface ProjectFramework {
  id: number;
  framework_id: number;
  framework_name?: string;
  name?: string;
}

interface JiraUseCaseFrameworksProps {
  project: {
    id: number;
    project_title?: string;
  };
}

export const JiraUseCaseFrameworks: React.FC<JiraUseCaseFrameworksProps> = ({ project }) => {
  const [loading, setLoading] = useState(true);
  const [installedFrameworks, setInstalledFrameworks] = useState<ProjectFramework[]>([]);
  const [availableFrameworks, setAvailableFrameworks] = useState<Framework[]>([]);
  const [installing, setInstalling] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFrameworks();
  }, [project.id]);

  const fetchFrameworks = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch installed frameworks for this project
      const installedRes = await fetch(`/api/projects/${project.id}/frameworks`);
      if (installedRes.ok) {
        const installed = await installedRes.json();
        setInstalledFrameworks(installed.data || installed || []);
      }

      // Fetch available frameworks
      const availableRes = await fetch(`/api/frameworks`);
      if (availableRes.ok) {
        const available = await availableRes.json();
        setAvailableFrameworks(available.data || available || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load frameworks");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFramework = async (frameworkId: number) => {
    setInstalling(frameworkId);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/frameworks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ framework_id: frameworkId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to add framework");
      }

      // Refresh the list
      await fetchFrameworks();
    } catch (err: any) {
      setError(err.message || "Failed to add framework");
    } finally {
      setInstalling(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  // If frameworks are installed, show them with link to native view
  if (installedFrameworks.length > 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: "16px", fontWeight: 600 }}>
          Installed Frameworks
        </Typography>

        <Stack spacing={2}>
          {installedFrameworks.map((pf) => (
            <Card key={pf.id} variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}>
                <CheckCircle size={20} color="#16a34a" />
                <Typography sx={{ flex: 1, fontWeight: 500 }}>
                  {pf.framework_name || pf.name || `Framework ${pf.framework_id}`}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => window.location.href = `/projects/${project.id}/frameworks/${pf.framework_id}`}
                >
                  View Controls
                </Button>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="h6" sx={{ mt: 4, mb: 2, fontSize: "16px", fontWeight: 600 }}>
          Add More Frameworks
        </Typography>

        <Stack direction="row" flexWrap="wrap" gap={1}>
          {availableFrameworks
            .filter(f => !installedFrameworks.some(pf => pf.framework_id === f.id))
            .map((framework) => (
              <Button
                key={framework.id}
                variant="outlined"
                size="small"
                startIcon={installing === framework.id ? <CircularProgress size={16} /> : <Plus size={16} />}
                disabled={installing !== null}
                onClick={() => handleAddFramework(framework.id)}
                sx={{ textTransform: "none" }}
              >
                {framework.name}
              </Button>
            ))}
        </Stack>
      </Box>
    );
  }

  // No frameworks installed - show empty state with add options
  return (
    <Box sx={{ p: 4 }}>
      <Stack alignItems="center" spacing={3}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FileText size={40} color="#9ca3af" />
        </Box>

        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#374151", mb: 1 }}>
            No frameworks installed
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#6b7280", maxWidth: 400 }}>
            This use case doesn't have any compliance frameworks yet.
            Add a framework to start tracking controls and assessments.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ width: "100%", maxWidth: 400 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#374151", mb: 2, textAlign: "center" }}>
            Available Frameworks
          </Typography>

          <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1}>
            {availableFrameworks.map((framework) => (
              <Button
                key={framework.id}
                variant="outlined"
                startIcon={installing === framework.id ? <CircularProgress size={16} /> : <Plus size={16} />}
                disabled={installing !== null}
                onClick={() => handleAddFramework(framework.id)}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                {framework.name}
              </Button>
            ))}
          </Stack>

          {availableFrameworks.length === 0 && (
            <Typography sx={{ fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
              No frameworks available. Install framework plugins from the marketplace.
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

export default JiraUseCaseFrameworks;
