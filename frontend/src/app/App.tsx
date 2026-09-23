import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ActivityPage } from '../pages/activity/ActivityPage';
import { AdminPage } from '../pages/admin/AdminPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { FeedPage } from '../pages/feed/FeedPage';
import { FriendsPage } from '../pages/friends/FriendsPage';
import { LandingPage } from '../pages/landing/LandingPage';
import { PeoplePage } from '../pages/people/PeoplePage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import '../shared/ui/styles.css';
import { AdminRoute, AuthProvider, ProtectedRoute } from './auth-context';
import { Header } from './Header';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          {/* Публичные страницы */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Приватные: без токена ProtectedRoute уводит на логин */}
          <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
          <Route path="/people" element={<ProtectedRoute><PeoplePage /></ProtectedRoute>} />
          <Route path="/u/:login" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route
            path="/activities/:id"
            element={<ProtectedRoute><ActivityPage /></ProtectedRoute>}
          />

          {/* Ссылки в шапке нет — админка открывается по прямому адресу */}
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
