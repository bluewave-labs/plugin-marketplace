import MLFlowDataTable from './MLFlowDataTable';

export const manifest = {
  key: 'mlflow',
  version: '1.0.0',
  extensionPoints: [
    {
      type: 'page-tab' as const,
      location: 'model-inventory' as const,
      id: 'mlflow-tab',
      label: 'MLflow',
      component: MLFlowDataTable,
      order: 3,
    },
  ],
};

export { MLFlowDataTable };
