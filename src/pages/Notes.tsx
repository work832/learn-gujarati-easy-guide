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
import { FileText, Plus, Upload, Trash2, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Note {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  created_by: string;
  created_at: string;
}

const Notes = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    description: '',
    image_url: ''
  });

  const isTeacher = profile?.role === 'teacher';

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('notes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('notes')
        .getPublicUrl(filePath);

      setNewNote({ ...newNote, image_url: publicUrl });
      
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.title || !newNote.image_url) {
      toast({
        title: "Error",
        description: "Please fill in the title and upload an image.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .insert([{
          ...newNote,
          created_by: profile?.user_id
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note created successfully!",
      });

      setNewNote({
        title: '',
        description: '',
        image_url: ''
      });
      setIsCreating(false);
      fetchNotes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note deleted successfully!",
      });
      fetchNotes();
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
            <FileText className="h-8 w-8" />
            Class Notes
          </h1>
          <p className="text-muted-foreground mt-2">
            {isTeacher 
              ? "Upload and manage class notes for your students" 
              : "Access notes shared by your teacher"}
          </p>
        </div>
        
        {isTeacher && (
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Class Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    placeholder="Enter note title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={newNote.description}
                    onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
                    placeholder="Add a description for this note"
                  />
                </div>
                
                <div>
                  <Label htmlFor="image">Note Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  {uploading && (
                    <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                  )}
                  {newNote.image_url && (
                    <div className="mt-2">
                      <img 
                        src={newNote.image_url} 
                        alt="Preview"
                        className="w-full max-w-xs h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleCreateNote} disabled={uploading}>
                    Create Note
                  </Button>
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
        {notes.map((note) => (
          <Card key={note.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{note.title}</CardTitle>
                {isTeacher && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {note.description && (
                <CardDescription>{note.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative group">
                <img 
                  src={note.image_url} 
                  alt={note.title}
                  className="w-full h-48 object-cover rounded-md cursor-pointer"
                  onClick={() => window.open(note.image_url, '_blank')}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Download className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{new Date(note.created_at).toLocaleDateString()}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(note.image_url, '_blank')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {notes.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No notes available</h3>
            <p className="text-muted-foreground mb-4">
              {isTeacher 
                ? "Start by uploading some class notes for your students." 
                : "Your teacher will upload class notes here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;