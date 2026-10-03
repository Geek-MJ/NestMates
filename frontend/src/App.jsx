import { Outlet, ScrollRestoration, createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { AuthProvider } from './context/AuthContext.jsx';
import AppLayout from './layout/AppLayout.jsx';
import AuthLayout from './layout/AuthLayout.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';
import CalendarPage from './pages/calendar/CalendarPage.jsx';
import ChatPage from './pages/chat/ChatPage.jsx';
import DocumentsPage from './pages/documents/DocumentsPage.jsx';
import ExpensesPage from './pages/expenses/ExpensesPage.jsx';
import HouseholdSettingsPage from './pages/household/HouseholdSettingsPage.jsx';
import LandingPage from './pages/landing/LandingPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import OnboardingPage from './pages/onboarding/OnboardingPage.jsx';
import ProfilePage from './pages/profile/ProfilePage.jsx';
import RouteErrorPage from './pages/RouteErrorPage.jsx';
import TasksPage from './pages/tasks/TasksPage.jsx';
import { PublicOnly, RequireAuth, RequireHousehold, RequireNoHousehold } from './routes/guards.jsx';

function Root() {
  return (
    <AuthProvider>
      <Outlet />
      <ScrollRestoration />
    </AuthProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <PublicOnly />,
        children: [
          { index: true, element: <LandingPage /> },
          {
            element: <AuthLayout />,
            children: [
              { path: 'login', element: <LoginPage /> },
              { path: 'register', element: <RegisterPage /> },
              { path: 'forgot-password', element: <ForgotPasswordPage /> },
            ],
          },
        ],
      },
      {
        element: <AuthLayout />,
        children: [{ path: 'reset-password', element: <ResetPasswordPage /> }],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                element: <RequireHousehold />,
                children: [
                  { path: 'expenses', element: <ExpensesPage /> },
                  { path: 'calendar', element: <CalendarPage /> },
                  { path: 'documents', element: <DocumentsPage /> },
                  { path: 'tasks', element: <TasksPage /> },
                  { path: 'chat', element: <ChatPage /> },
                ],
              },
              {
                element: <RequireNoHousehold />,
                children: [{ path: 'onboarding', element: <OnboardingPage /> }],
              },
              { path: 'household', element: <HouseholdSettingsPage /> },
              { path: 'profile', element: <ProfilePage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
