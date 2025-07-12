import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BookOpen, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

// Pages
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import CardCreation from "@/pages/card-creation";
import FrayerModel from "@/pages/frayer-model";
import Review from "@/pages/review";
import Practice from "@/pages/practice";
import CardList from "@/pages/card-list";
import Settings from "@/pages/settings";
import TemplateManagement from "@/pages/template-management";
import TeacherDashboard from "@/pages/teacher-dashboard";
import SharedDecks from "@/pages/shared-decks"; // Confirm this file exists
import { useAuth } from "@/hooks/useAuth";

function AppHeader() {
  const { user, isAuthenticated } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (!isAuthenticated) return null;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Brainy Vocab Vault</h1>
              <p className="text-xs text-gray-600">
                Master vocabulary through intelligent spaced repetition
              </p>
            </div>
          </div>
          {user && (
            <div className="flex items-center space-x-3">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">
                {user.firstName || user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <main className={isAuthenticated ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
      <Switch>
        {isAuthenticated ? (
          <>
            <Route path="/" component={Dashboard} />
            <Route path="/card-creation" component={CardCreation} />
            <Route path="/frayer/:id" component={FrayerModel} />
            <Route path="/cards" component={CardList} />
            <Route path="/review" component={Review} />
            <Route path="/practice" component={Practice} />
            <Route path="/settings" component={Settings} />
            <Route path="/templates" component={TemplateManagement} />
            <Route path="/teacher" component={TeacherDashboard} />
            <Route path="/shared-decks" component={SharedDecks} />
            <Route component={NotFound} />
          </>
        ) : (
          <>
            <Route path="/" component={Landing} />
            <Route>
              {() => {
                window.location.href = "/api/login";
                return null;
              }}
            </Route>
          </>
        )}
      </Switch>
    </main>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppHeader />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
