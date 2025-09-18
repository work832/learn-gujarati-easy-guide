import React from 'react';
import { Navigate, Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { Button } from '@/components/ui/button';
import { BookOpen, Home, PlaySquare, Gamepad2, Trophy, Globe, User, LogOut, Users, Plus, BarChart, FileText, Clock } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const Layout = () => {
  const { user, profile, loading, signOut } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  
  // Extract page name from current route
  const pageName = location.pathname.slice(1) || 'dashboard';
  
  // Track time spent in app
  const { getSessionStats } = useTimeTracking({ 
    pageName,
    trackActivities: true 
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "See you next time!",
      });
    }
  };

  const isTeacher = profile?.role === 'teacher';
  
  const navLinkClass = "flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-foreground hover:text-accent-foreground";
  const activeClass = "bg-primary/10 text-primary hover:text-primary";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Gujarati Setu</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{profile?.display_name}</span>
              <span className="ml-2 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                {isTeacher ? 'Teacher' : 'Student'}
              </span>
            </div>
            <div className="flex items-center space-x-1 text-sm">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">{profile?.points || 0}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{getSessionStats().totalTime}m</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 min-h-[calc(100vh-73px)] border-r border-border bg-card/30">
          <div className="p-4">
            <div className="space-y-2">
              <NavLink
                to="/"
                className={({ isActive }) => cn(navLinkClass, isActive && activeClass)}
              >
                <Home className="h-5 w-5" />
                <span>Dashboard</span>
              </NavLink>
              
              {!isTeacher && (
                <>
                  <NavLink
                    to="/word-bank"
                    className={({ isActive }) => cn(navLinkClass, isActive && activeClass)}
                  >
                    <BookOpen className="h-5 w-5" />
                    <span>Word Bank</span>
                  </NavLink>
                  
                  <NavLink
                    to="/practice"
                    className={({ isActive }) => cn(navLinkClass, isActive && activeClass)}
                  >
                    <PlaySquare className="h-5 w-5" />
                    <span>Basic Learning</span>
                  </NavLink>
                  
                  <NavLink
                    to="/quiz"
                    className={({ isActive }) => cn(navLinkClass, isActive && activeClass)}
                  >
                    <Gamepad2 className="h-5 w-5" />
                    <span>Quiz</span>
                  </NavLink>
                  
                  <NavLink
                    to="/games"
                    className={({ isActive }) => cn(navLinkClass, isActive && activeClass)}
                  >
                    <Gamepad2 className="h-5 w-5" />
                    <span>Games</span>
                  </NavLink>
                  
                  <NavLink
                    to="/notes"
                    className={({ isActive }) => cn(navLinkClass, isActive && activeClass)}
                  >
                    <FileText className="h-5 w-5" />
                    <span>Notes</span>
                  </NavLink>
                </>
              )}
              
              {isTeacher && (
                <>
                  <NavLink
                    to="/create-content"
                    className={({ isActive }) => cn(navLinkClass, isActive && activeClass)}
                  >
                    <Plus className="h-5 w-5" />
                    <span>Create Content</span>
                  </NavLink>
                  
                  <NavLink
                    to="/student-progress"
                    className={({ isActive }) => cn(navLinkClass, isActive && activeClass)}
                  >
                    <BarChart className="h-5 w-5" />
                    <span>Student Progress</span>
                  </NavLink>
                </>
              )}
              
              <NavLink
                to="/culture"
                className={({ isActive }) => cn(navLinkClass, isActive && activeClass)}
              >
                <Globe className="h-5 w-5" />
                <span>Culture Corner</span>
              </NavLink>
              
              <NavLink
                to="/profile"
                className={({ isActive }) => cn(navLinkClass, isActive && activeClass)}
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </NavLink>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-73px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;