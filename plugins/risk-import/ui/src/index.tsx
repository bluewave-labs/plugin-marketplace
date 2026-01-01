import RiskImport from './RiskImport';

export const manifest = {
  key: 'risk-import',
  version: '1.0.0',
  extensionPoints: [
    {
      type: 'menu-item' as const,
      location: 'risk-management',
      id: 'risk-import-menu',
      label: 'Risk Import (CSV)',
      description: 'Import multiple risks at once from a CSV file',
      component: RiskImport,
      order: 1,
    },
  ],
};

export { RiskImport };
