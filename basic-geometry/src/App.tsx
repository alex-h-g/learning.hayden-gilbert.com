import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ROUTER_BASENAME } from './lib/paths';
import { HomePage } from './pages/HomePage';
import { PlayPage } from './pages/PlayPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { FormulasPage } from './pages/FormulasPage';
import { ProgressPage } from './pages/ProgressPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="play" element={<PlayPage />} />
        <Route path="calculator" element={<CalculatorPage />} />
        <Route path="formulas" element={<FormulasPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter basename={ROUTER_BASENAME}>
      <AppRoutes />
    </BrowserRouter>
  );
}
