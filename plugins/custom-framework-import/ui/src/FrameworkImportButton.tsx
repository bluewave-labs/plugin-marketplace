import React, { useState } from "react";
import { Button, Box, Typography, Card, CardContent, CardActions } from "@mui/material";
import { Plus, FileJson, Database } from "lucide-react";
import { theme } from "./theme";
import { FrameworkImportModal } from "./FrameworkImportModal";

interface FrameworkImportButtonProps {
  onImportComplete?: () => void;
  apiServices?: any;
  variant?: "button" | "card";
}

export const FrameworkImportButton: React.FC<FrameworkImportButtonProps> = ({
  onImportComplete,
  apiServices,
  variant = "button",
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleImportComplete = () => {
    onImportComplete?.();
    setModalOpen(false);
  };

  if (variant === "card") {
    return (
      <>
        <Card
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            border: "2px dashed #e2e8f0",
            bgcolor: "#fafafa",
            transition: "all 0.2s",
            cursor: "pointer",
            "&:hover": {
              borderColor: theme.colors.primary.main,
              bgcolor: "#f0fdf4",
            },
          }}
          onClick={handleOpenModal}
        >
          <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 4 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: theme.colors.primary.main + "15",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <Plus size={32} color={theme.colors.primary.main} />
            </Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Import Custom Framework
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Add your own compliance framework from JSON or Excel
            </Typography>
          </CardContent>
          <CardActions sx={{ justifyContent: "center", pb: 3 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                <FileJson size={14} />
                <Typography variant="caption">JSON</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">or</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                <Database size={14} />
                <Typography variant="caption">Excel</Typography>
              </Box>
            </Box>
          </CardActions>
        </Card>

        <FrameworkImportModal
          open={modalOpen}
          onClose={handleCloseModal}
          onImportComplete={handleImportComplete}
          apiServices={apiServices}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="contained"
        startIcon={<Plus size={18} />}
        onClick={handleOpenModal}
        sx={{
          bgcolor: theme.colors.primary.main,
          "&:hover": { bgcolor: theme.colors.primary.dark },
        }}
      >
        Import Custom Framework
      </Button>

      <FrameworkImportModal
        open={modalOpen}
        onClose={handleCloseModal}
        onImportComplete={handleImportComplete}
        apiServices={apiServices}
      />
    </>
  );
};
