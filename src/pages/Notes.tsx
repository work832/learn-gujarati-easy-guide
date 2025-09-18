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
import { FileText, Plus, Upload, Trash2, Download, Image } from 'lucide-react';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const isTeacher = profile?.role === 'teacher';

  useEffect(() => {
    fetchNotes();
  }, []);

  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
  };

  const uploadImage = async () => {
    if (!selectedFile) return null;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `note_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('notes')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('notes')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.title || !selectedFile) {
      toast({
        title: "Error",
        description: "Please fill in the title and select an image.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload image first
      const imageUrl = await uploadImage();
      if (!imageUrl) {
        return; // Error already shown in uploadImage
      }

      const { error } = await supabase
        .from('notes')
        .insert([{
          title: newNote.title,
          description: newNote.description,
          image_url: imageUrl,
          created_by: profile?.user_id
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note created successfully!",
      });

      // Reset form
      setNewNote({
        title: '',
        description: '',
        image_url: ''
      });
      setSelectedFile(null);
      setPreviewUrl('');
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
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

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

  const resetForm = () => {
    setNewNote({
      title: '',
      description: '',
      image_url: ''
    });
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
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
              {note.text_content && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{note.text_content}</p>
                </div>
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