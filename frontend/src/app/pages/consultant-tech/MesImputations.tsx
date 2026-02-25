// Re-exports the shared bi-monthly MesImputations component
import React from 'react';
import { MesImputations as SharedMesImputations } from '../shared/MesImputations';

export const MesImputations: React.FC = () => (
  <SharedMesImputations basePath="/consultant-tech" />
);
