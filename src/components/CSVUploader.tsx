import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CSVUploaderProps {
  onUploadSuccess?: () => void;
}

export const CSVUploader = ({ onUploadSuccess }: CSVUploaderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive"
        });
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const parseCSVAndCreateQuizzes = async (csvText: string) => {
    if (!user) return;
    
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV must have at least a header row and one data row');
      }
      
      // Group questions by quiz type/title
      const quizGroups: Record<string, any[]> = {};
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(val => val.replace(/"/g, '').trim());
        
        if (values.length < 10) continue;
        
        const title = values[0] || 'Imported Quiz';
        const questionGujarati = values[3];
        const questionEnglish = values[4];
        const options = [values[5], values[6], values[7], values[8]];
        const correctAnswer = values[9];
        
        if (!questionGujarati || !questionEnglish) continue;
        
        if (!quizGroups[title]) {
          quizGroups[title] = [];
        }
        
        quizGroups[title].push({
          question: `${questionGujarati} / ${questionEnglish}`,
          question_gujarati: questionGujarati,
          options: options.filter(opt => opt && opt.length > 0),
          correct_answer: correctAnswer,
          explanation: ''
        });
      }
      
      // Create or update quizzes for each group
      let createdCount = 0;
      let updatedCount = 0;
      
      for (const [title, questions] of Object.entries(quizGroups)) {
        if (questions.length === 0) continue;
        
        // Check if quiz already exists
        const { data: existingQuiz } = await supabase
          .from('quizzes')
          .select('id')
          .eq('title', title)
          .eq('created_by', user.id)
          .maybeSingle();
        
        if (existingQuiz) {
          // Update existing quiz
          const { error } = await supabase
            .from('quizzes')
            .update({
              questions: questions as any,
              description: `Updated ${title} - Imported from CSV with ${questions.length} questions`
            })
            .eq('id', existingQuiz.id);
            
          if (!error) {
            updatedCount++;
          }
        } else {
          // Create new quiz
          const { error } = await supabase
            .from('quizzes')
            .insert({
              title,
              description: `${title} - Imported from CSV with ${questions.length} questions`,
              quiz_type: 'game',
              difficulty_level: 2,
              time_limit: 15,
              questions: questions as any,
              created_by: user.id
            });
            
          if (!error) {
            createdCount++;
          }
        }
      }
      
      return { createdCount, updatedCount };
      
    } catch (error) {
      console.error('Error parsing CSV:', error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    
    setUploading(true);
    
    try {
      const csvText = await file.text();
      const { createdCount, updatedCount } = await parseCSVAndCreateQuizzes(csvText);
      
      toast({
        title: "CSV Upload Successful",
        description: `${createdCount} new quizzes created, ${updatedCount} existing quizzes updated`
      });
      
      clearFile();
      onUploadSuccess?.();
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to process CSV file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Quiz CSV
        </CardTitle>
        <CardDescription>
          Upload a CSV file to bulk create or update quizzes. Format: Title, Type, Description, Question (Gujarati), Question (English), Option A, Option B, Option C, Option D, Correct Answer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="csv-file">Select CSV File</Label>
          <div className="mt-2">
            <Input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="cursor-pointer"
            />
          </div>
        </div>

        {file && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFile}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1"
          >
            {uploading ? 'Processing...' : 'Upload & Process'}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>CSV Format:</strong></p>
          <p>• Column 1: Quiz Title</p>
          <p>• Column 2: Type (optional)</p>
          <p>• Column 3: Description (optional)</p>
          <p>• Column 4: Question in Gujarati</p>
          <p>• Column 5: Question in English</p>
          <p>• Column 6-9: Answer Options A-D</p>
          <p>• Column 10: Correct Answer</p>
        </div>
      </CardContent>
    </Card>
  );
};