import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ROUTER_BASENAME } from './lib/paths';
import { ConverterPage } from './pages/ConverterPage';
import { GuidePage } from './pages/GuidePage';
import { HomePage } from './pages/HomePage';
import { LessonPage } from './pages/LessonPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PracticePage } from './pages/PracticePage';
import { ProgressPage } from './pages/ProgressPage';
import { ReferencePage } from './pages/ReferencePage';
import { TopicPage } from './pages/TopicPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="topic/:id" element={<TopicPage />} />
        <Route path="lesson/:id" element={<LessonPage />} />
        <Route path="practice" element={<PracticePageKeyed />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="guide" element={<GuidePage />} />
        <Route path="reference" element={<ReferencePage />} />
        <Route path="converter" element={<ConverterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

import { useLocation } from 'react-router-dom';
function PracticePageKeyed() {
  // A new query string (e.g. exam → mistakes) starts a fresh session.
  const { search } = useLocation();
  return <PracticePage key={search} />;
}

export function App() {
  return (
    <BrowserRouter basename={ROUTER_BASENAME}>
      <AppRoutes />
    </BrowserRouter>
  );
}
