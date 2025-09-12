import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Globe, Plus, Image, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface CultureContent {
  id: string;
  title: string;
  content: string;
  content_type: string;
  image_url?: string;
  gujarati_text?: string;
  english_translation?: string;
  created_at: string;
  created_by: string;
}

const Culture = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [cultureContent, setCultureContent] = useState<CultureContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState({
    title: '',
    content: '',
    content_type: 'story',
    gujarati_text: '',
    english_translation: ''
  });

  const isTeacher = profile?.role === 'teacher';

  useEffect(() => {
    fetchCultureContent();
  }, []);

  const fetchCultureContent = async () => {
    try {
      const { data, error } = await supabase
        .from('culture_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCultureContent(data || []);
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

  const handleCreateContent = async () => {
    if (!newContent.title || !newContent.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('culture_content')
        .insert([{
          ...newContent,
          created_by: profile?.user_id
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Culture content created successfully!",
      });

      setNewContent({
        title: '',
        content: '',
        content_type: 'story',
        gujarati_text: '',
        english_translation: ''
      });
      setIsCreating(false);
      fetchCultureContent();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteContent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('culture_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content deleted successfully!",
      });
      fetchCultureContent();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Globe className="h-8 w-8" />
            Culture Corner
          </h1>
          <p className="text-muted-foreground mt-2">
            Explore Gujarati culture, traditions, and stories
          </p>
        </div>
        
        {isTeacher && (
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Culture Content</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newContent.title}
                    onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                    placeholder="Enter content title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newContent.content}
                    onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
                    placeholder="Enter the main content"
                    className="min-h-[100px]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="gujarati">Gujarati Text (Optional)</Label>
                  <Textarea
                    id="gujarati"
                    value={newContent.gujarati_text}
                    onChange={(e) => setNewContent({ ...newContent, gujarati_text: e.target.value })}
                    placeholder="Enter Gujarati text"
                  />
                </div>
                
                <div>
                  <Label htmlFor="translation">English Translation (Optional)</Label>
                  <Textarea
                    id="translation"
                    value={newContent.english_translation}
                    onChange={(e) => setNewContent({ ...newContent, english_translation: e.target.value })}
                    placeholder="Enter English translation"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleCreateContent}>Create Content</Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cultureContent.map((content) => (
          <Card key={content.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{content.title}</CardTitle>
                  <Badge variant="outline" className="mt-2">
                    {content.content_type}
                  </Badge>
                </div>
                {isTeacher && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteContent(content.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.image_url && (
                <img 
                  src={content.image_url} 
                  alt={content.title}
                  className="w-full h-32 object-cover rounded-md"
                />
              )}
              
              <p className="text-sm text-muted-foreground line-clamp-3">
                {content.content}
              </p>
              
              {content.gujarati_text && (
                <div className="border-l-4 border-primary pl-4">
                  <p className="text-lg font-gujarati">{content.gujarati_text}</p>
                </div>
              )}
              
              {content.english_translation && (
                <p className="text-sm italic text-muted-foreground">
                  "{content.english_translation}"
                </p>
              )}
              
              <p className="text-xs text-muted-foreground">
                {new Date(content.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
        
        {cultureContent.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No culture content yet</h3>
            <p className="text-muted-foreground mb-4">
              {isTeacher 
                ? "Start by creating some cultural content for your students." 
                : "Your teacher will add cultural content soon."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Culture;