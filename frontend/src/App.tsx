import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RedirectIfAuthed, RequireAuth } from '@/components/RequireAuth';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { FeedPage } from '@/pages/feed/FeedPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';

function App() {
  return (
    <Routes>
      <Route element={<RedirectIfAuthed />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route
            path="/category/:slug"
            element={<PlaceholderPage title="Category" subtitle="Topic feed." />}
          />
          <Route
            path="/search"
            element={<PlaceholderPage title="Search" subtitle="Find articles across NewsAPI." />}
          />
          <Route
            path="/bookmarks"
            element={<PlaceholderPage title="Bookmarks" subtitle="Articles you saved for later." />}
          />
          <Route
            path="/history"
            element={<PlaceholderPage title="Reading History" subtitle="Recent articles you opened." />}
          />
          <Route
            path="/stats"
            element={<PlaceholderPage title="Stats" subtitle="Your weekly and monthly reading activity." />}
          />
          <Route
            path="/settings"
            element={<PlaceholderPage title="Settings" subtitle="Preferences, profile, account." />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
