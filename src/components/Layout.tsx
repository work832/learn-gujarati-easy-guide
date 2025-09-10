import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { BookOpen, Home, PlaySquare, Gamepad2, Trophy, Globe, User, LogOut, Users, Plus } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Layout = () => {
  const { user, profile, loading, signOut } = useAuth();
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Learn Gujarati Easy</h1>
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
              <a
                href="/"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-foreground hover:text-accent-foreground"
              >
                <Home className="h-5 w-5" />
                <span>Dashboard</span>
              </a>
              
              {!isTeacher && (
                <>
                  <a
                    href="/flashcards"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-foreground hover:text-accent-foreground"
                  >
                    <BookOpen className="h-5 w-5" />
                    <span>Flashcards</span>
                  </a>
                  
                  <a
                    href="/practice"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-foreground hover:text-accent-foreground"
                  >
                    <PlaySquare className="h-5 w-5" />
                    <span>Practice</span>
                  </a>
                  
                  <a
                    href="/games"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-foreground hover:text-accent-foreground"
                  >
                    <Gamepad2 className="h-5 w-5" />
                    <span>Games</span>
                  </a>
                  
                  <a
                    href="/leaderboard"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-foreground hover:text-accent-foreground"
                  >
                    <Trophy className="h-5 w-5" />
                    <span>Leaderboard</span>
                  </a>
                </>
              )}
              
              {isTeacher && (
                <>
                  <a
                    href="/teacher/students"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-foreground hover:text-accent-foreground"
                  >
                    <Users className="h-5 w-5" />
                    <span>Students</span>
                  </a>
                  
                  <a
                    href="/teacher/content"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-foreground hover:text-accent-foreground"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Create Content</span>
                  </a>
                </>
              )}
              
              <a
                href="/culture"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-foreground hover:text-accent-foreground"
              >
                <Globe className="h-5 w-5" />
                <span>Culture Corner</span>
              </a>
              
              <a
                href="/profile"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-foreground hover:text-accent-foreground"
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </a>
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