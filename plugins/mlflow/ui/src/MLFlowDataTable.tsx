/* eslint-disable @typescript-eslint/no-explicit-any */
declare const window: Window & { VerifyWise: any };

const { React, mui, lucideReact, themes, components, services, hooks } = window.VerifyWise;
const { useState, useEffect, useMemo, useCallback } = React;
const {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination,
  useTheme,
} = mui;
const { RefreshCw, XCircle, Eye, ChevronsUpDown } = lucideReact;
const { HeaderCard, VWChip, EmptyState, TablePaginationActions, GroupBy, GroupedTableView } = components;
const { apiServices } = services;
const { useGroupByState, useTableGrouping } = hooks;
const singleTheme = themes.default;

interface SelectorVerticalProps {
  className?: string;
  [key: string]: unknown;
}

const SelectorVertical = (props: SelectorVerticalProps) => <ChevronsUpDown size={16} {...props} />;

const MLFlowDataTable = () => {
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const [warning, setWarning] = useState<string | null>(null);
  const [mlflowData, setMlflowData] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { groupBy, groupSortOrder, handleGroupChange } = useGroupByState();

  const summaryStats = useMemo(() => {
    const stageCounts = mlflowData.reduce(
      (acc, model) => {
        const stage = (model.lifecycle_stage || "").toLowerCase();
        if (stage === "production") acc.active += 1;
        else if (stage === "staging") acc.staging += 1;
        else if (stage === "archived") acc.archived += 1;
        return acc;
      },
      { active: 0, staging: 0, archived: 0 },
    );

    const experiments = new Set(
      mlflowData
        .map((model) => model.experiment_id)
        .filter(Boolean),
    ).size;

    return {
      total: mlflowData.length,
      active: stageCounts.active,
      staging: stageCounts.staging,
      archived: stageCounts.archived,
      experiments,
    };
  }, [mlflowData]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const fetchMLFlowData = async () => {
    setLoading(true);
    setWarning(null);

    try {
      const response = await apiServices.get("/plugins/mlflow/models");

      if (response.data?.data) {
        const pluginData = response.data.data;
        if ('models' in pluginData && Array.isArray(pluginData.models)) {
          if (!pluginData.configured) {
            setWarning("Configure the MLFlow plugin to start syncing live data.");
          } else if (pluginData.connected === false) {
            setWarning(pluginData.message || "MLFlow server is not reachable.");
          } else if (pluginData.error) {
            setWarning(pluginData.error);
          }
          setMlflowData(pluginData.models);
        } else {
          setMlflowData([]);
        }
      } else {
        setMlflowData([]);
      }
    } catch {
      setWarning("Unable to reach the MLFlow backend.");
      setMlflowData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMLFlowData();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setWarning(null);

    try {
      await apiServices.post("/plugins/mlflow/sync");
      await fetchMLFlowData();
    } catch (error: any) {
      console.error("Error syncing MLflow data:", error);
      await fetchMLFlowData();

      if (error.response?.data?.message) {
        setWarning(`Sync failed: ${error.response.data.message}`);
      } else {
        setWarning("Failed to sync with MLflow server. Showing cached data.");
      }
    }
  };

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const getRange = useMemo(() => {
    if (!mlflowData.length) {
      return "0 - 0";
    }
    const start = page * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage + rowsPerPage, mlflowData.length);
    return `${start} - ${end}`;
  }, [page, rowsPerPage, mlflowData.length]);

  const getMLFlowGroupKey = (model: any, field: string): string | string[] => {
    switch (field) {
      case 'lifecycle_stage':
        return model.lifecycle_stage || 'Unknown';
      case 'experiment':
        return model.experiment_name || model.experiment_id || 'Unknown Experiment';
      case 'model_name':
        return model.model_name || 'Unknown Model';
      default:
        return 'Other';
    }
  };

  const groupedMLFlowData = useTableGrouping({
    data: mlflowData,
    groupByField: groupBy,
    sortOrder: groupSortOrder,
    getGroupKey: getMLFlowGroupKey,
  });

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>Loading MLFlow data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: "100%", overflowX: "hidden" }}>
      {warning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {warning}
        </Alert>
      )}

      <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 2, width: "100%" }}>
        <GroupBy
          options={[
            { id: 'lifecycle_stage', label: 'Lifecycle stage' },
            { id: 'experiment', label: 'Experiment' },
            { id: 'model_name', label: 'Model name' },
          ]}
          onGroupChange={handleGroupChange}
        />
        <Button
          variant="outlined"
          startIcon={<RefreshCw size={16} />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Sync
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <HeaderCard title="Models" count={summaryStats.total} disableNavigation={true} />
        <HeaderCard title="Active" count={summaryStats.active} />
        <HeaderCard title="Staging" count={summaryStats.staging} />
        <HeaderCard title="Experiments" count={summaryStats.experiments} />
      </Box>

      {mlflowData.length === 0 ? (
        <EmptyState message="No MLFlow runs have been synced yet. Configure the integration and click Sync to pull the latest models." />
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {["Model Name", "Version", "Status", "Created", "Last Updated"].map((header) => (
                  <TableCell key={header}>{header}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {mlflowData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((model) => (
                <TableRow key={model.id}>
                  <TableCell>{model.model_name}</TableCell>
                  <TableCell>{model.version}</TableCell>
                  <TableCell>
                    <VWChip label={model.lifecycle_stage} />
                  </TableCell>
                  <TableCell>{formatDate(model.creation_timestamp)}</TableCell>
                  <TableCell>{formatDate(model.last_updated_timestamp)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            {mlflowData.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2}>
                    Showing {getRange} of {mlflowData.length} model(s)
                  </TableCell>
                  <TablePagination
                    count={mlflowData.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[5, 10, 15, 25]}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    ActionsComponent={(props) => <TablePaginationActions {...props} />}
                    labelRowsPerPage="Rows per page"
                    labelDisplayedRows={({ page: p, count }) => `Page ${p + 1} of ${Math.max(1, Math.ceil(count / rowsPerPage))}`}
                    slotProps={{
                      select: {
                        IconComponent: SelectorVertical,
                      },
                    }}
                  />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default MLFlowDataTable;
