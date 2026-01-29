/**
 * Custom Framework Config
 *
 * Main configuration/management panel for the Custom Framework Import plugin.
 * Accessible from Settings > Plugins > Custom Framework Import
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  FileJson,
  Building2,
  Layers,
  Link as LinkIcon,
} from "lucide-react";
import { theme } from "./theme";
import { FrameworkImportModal } from "./FrameworkImportModal";
import { FrameworkDetailDrawer } from "./FrameworkDetailDrawer";

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
  created_at: string;
  level1_count?: number;
  level2_count?: number;
  level3_count?: number;
}

interface Project {
  id: number;
  project_title: string;
  is_organizational: boolean;
}

interface CustomFrameworkConfigProps {
  apiServices?: {
    get: (url: string, options?: any) => Promise<any>;
    post: (url: string, data?: any) => Promise<any>;
    delete?: (url: string) => Promise<any>;
  };
  pluginEnabled?: boolean;
}

export const CustomFrameworkConfig: React.FC<CustomFrameworkConfigProps> = ({
  apiServices,
  pluginEnabled = true,
}) => {
  const [frameworks, setFrameworks] = useState<CustomFramework[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addToProjectDialogOpen, setAddToProjectDialogOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<CustomFramework | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");
  const [actionLoading, setActionLoading] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailFrameworkId, setDetailFrameworkId] = useState<number | null>(null);

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
      return { data: await response.json() };
    },
    delete: async (url: string) => {
      const response = await fetch(`/api${url}`, { method: "DELETE" });
      return { data: await response.json() };
    },
  };

  const loadFrameworks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/plugins/custom-framework-import/frameworks");
      const data = response.data.data || response.data;
      setFrameworks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load frameworks");
    } finally {
      setLoading(false);
    }
  }, [api]);

  const loadProjects = useCallback(async () => {
    try {
      const response = await api.get("/projects");
      const data = response.data.data || response.data;
      setProjects(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load projects:", err);
    }
  }, [api]);

  useEffect(() => {
    loadFrameworks();
    loadProjects();
  }, [loadFrameworks, loadProjects]);

  const handleDeleteFramework = async () => {
    if (!selectedFramework) return;

    try {
      setActionLoading(true);
      const deleteMethod = api.delete || (async (url: string) => {
        const response = await fetch(`/api${url}`, { method: "DELETE" });
        return { data: await response.json() };
      });
      await deleteMethod(`/plugins/custom-framework-import/frameworks/${selectedFramework.framework_id}`);
      setSuccess(`Framework "${selectedFramework.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setSelectedFramework(null);
      loadFrameworks();
    } catch (err: any) {
      setError(err.message || "Failed to delete framework");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddToProject = async () => {
    if (!selectedFramework || !selectedProjectId) return;

    try {
      setActionLoading(true);
      await api.post("/plugins/custom-framework-import/add-to-project", {
        frameworkId: selectedFramework.framework_id,
        projectId: selectedProjectId,
      });
      setSuccess(`Framework "${selectedFramework.name}" added to project successfully`);
      setAddToProjectDialogOpen(false);
      setSelectedFramework(null);
      setSelectedProjectId("");
    } catch (err: any) {
      setError(err.message || "Failed to add framework to project");
    } finally {
      setActionLoading(false);
    }
  };

  const getCompatibleProjects = () => {
    if (!selectedFramework) return [];
    return projects.filter(
      (p) => p.is_organizational === selectedFramework.is_organizational
    );
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  if (!pluginEnabled) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            Custom Framework Import plugin is not enabled. Enable it to import and manage custom compliance frameworks.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Custom Frameworks
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Import and manage custom compliance frameworks
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadFrameworks} disabled={loading}>
              <RefreshCw size={18} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => setImportModalOpen(true)}
            sx={{ bgcolor: theme.colors.primary.main }}
          >
            Import Framework
          </Button>
        </Box>
      </Box>

      {/* Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearMessages}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={clearMessages}>
          {success}
        </Alert>
      )}

      {/* Frameworks Table */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : frameworks.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <FileJson size={48} color={theme.colors.text.secondary} style={{ marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom>
              No Custom Frameworks
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Import your first custom compliance framework to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => setImportModalOpen(true)}
              sx={{ bgcolor: theme.colors.primary.main }}
            >
              Import Framework
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                <TableCell sx={{ fontWeight: 600 }}>Framework</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Hierarchy</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Structure</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {frameworks.map((fw) => (
                <TableRow key={fw.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={500}>
                        {fw.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fw.description?.substring(0, 60)}
                        {fw.description && fw.description.length > 60 ? "..." : ""}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<Building2 size={14} />}
                      label={fw.is_organizational ? "Organizational" : "Project"}
                      size="small"
                      color={fw.is_organizational ? "primary" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<Layers size={14} />}
                      label={fw.hierarchy_type === "three_level" ? "3 Levels" : "2 Levels"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {fw.level1_count || 0} {fw.level_1_name}s, {fw.level2_count || 0} {fw.level_2_name}s
                      {fw.hierarchy_type === "three_level" && fw.level3_count
                        ? `, ${fw.level3_count} ${fw.level_3_name}s`
                        : ""}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(fw.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                      <Tooltip title="Add to Project">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedFramework(fw);
                            setAddToProjectDialogOpen(true);
                          }}
                        >
                          <LinkIcon size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDetailFrameworkId(fw.id);
                            setDetailDrawerOpen(true);
                          }}
                        >
                          <Eye size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedFramework(fw);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Import Modal */}
      <FrameworkImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportComplete={() => {
          loadFrameworks();
          setSuccess("Framework imported successfully");
        }}
        apiServices={api}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Framework</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedFramework?.name}"? This will remove the
            framework structure but will not affect projects that have already implemented it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteFramework}
            disabled={actionLoading}
          >
            {actionLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add to Project Dialog */}
      <Dialog
        open={addToProjectDialogOpen}
        onClose={() => setAddToProjectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Framework to Project</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a project to add "{selectedFramework?.name}" to. This will create implementation
            records for tracking compliance.
          </Typography>

          {selectedFramework?.is_organizational && (
            <Alert severity="info" sx={{ mb: 2 }}>
              This is an organizational framework and can only be added to organizational projects.
            </Alert>
          )}

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Project</InputLabel>
            <Select
              value={selectedProjectId}
              label="Select Project"
              onChange={(e) => setSelectedProjectId(e.target.value as number)}
            >
              {getCompatibleProjects().map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.project_title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {getCompatibleProjects().length === 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              No compatible projects found. Create a{" "}
              {selectedFramework?.is_organizational ? "organizational" : "regular"} project first.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddToProjectDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddToProject}
            disabled={actionLoading || !selectedProjectId}
            sx={{ bgcolor: theme.colors.primary.main }}
          >
            {actionLoading ? "Adding..." : "Add to Project"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Framework Detail Drawer */}
      <FrameworkDetailDrawer
        open={detailDrawerOpen}
        onClose={() => {
          setDetailDrawerOpen(false);
          setDetailFrameworkId(null);
        }}
        frameworkId={detailFrameworkId}
        apiServices={api}
      />
    </Box>
  );
};
