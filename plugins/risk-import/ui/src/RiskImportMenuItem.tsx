import React from "react";
import { Box, Typography } from "@mui/material";
import { FileSpreadsheet } from "lucide-react";

interface RiskImportMenuItemProps {
  onTriggerModal?: (componentName: string) => void;
  onOpenImportModal?: () => void;
  onMenuClose?: () => void;
}

export const RiskImportMenuItem: React.FC<RiskImportMenuItemProps> = ({
  onTriggerModal,
  onOpenImportModal,
  onMenuClose,
}) => {
  const handleClick = () => {
    // Close the menu first
    if (onMenuClose) {
      onMenuClose();
    }
    // Open the import modal (prefer direct callback over trigger system)
    if (onOpenImportModal) {
      onOpenImportModal();
    } else if (onTriggerModal) {
      onTriggerModal("RiskImportModal");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Box
      role="menuitem"
      tabIndex={0}
      aria-label="Import risks from Excel"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        p: 2,
        cursor: "pointer",
        borderRadius: "8px",
        border: "1px solid #d0d5dd",
        backgroundColor: "white",
        transition: "all 0.2s ease",
        minHeight: "180px",
        "&:hover": {
          backgroundColor: "rgba(19, 113, 91, 0.04)",
          borderColor: "#13715B",
        },
        "&:focus": {
          outline: "2px solid #13715B",
          outlineOffset: "2px",
        },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderRadius: "8px",
          mb: 1.5,
        }}
      >
        <FileSpreadsheet size={28} color="#10b981" />
      </Box>
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: "13px",
          color: "#344054",
          mb: 0.5,
        }}
      >
        Import from Excel
      </Typography>
      <Typography
        sx={{
          fontSize: "12px",
          color: "#667085",
          lineHeight: 1.4,
        }}
      >
        Bulk import risks from Excel file
      </Typography>
    </Box>
  );
};

export default RiskImportMenuItem;
