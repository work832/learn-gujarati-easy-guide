import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Calendar, Trophy, BookOpen } from 'lucide-react';

const Profile = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Profile</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={""} alt={profile.display_name} />
                <AvatarFallback>
                  {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <Badge variant={profile.role === 'teacher' ? 'default' : 'secondary'}>
                  {profile.role}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                {isEditing ? (
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                ) : (
                  <Input
                    value={profile.display_name || 'Not set'}
                    disabled
                    className="bg-muted"
                  />
                )}
              </div>
              
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleUpdateProfile} disabled={loading}>
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Learning Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="text-2xl font-bold text-primary">{profile.points || 0}</div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
              <div className="text-center p-4 bg-secondary/5 rounded-lg">
                <div className="text-2xl font-bold text-secondary-foreground">0</div>
                <div className="text-sm text-muted-foreground">Achievements</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Learning Streak</span>
                <span className="font-medium">0 days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Words Learned</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Practice Sessions</span>
                <span className="font-medium">0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;