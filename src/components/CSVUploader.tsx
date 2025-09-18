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
  uploadType?: 'quiz' | 'vocabulary' | 'dialogue';
  title?: string;
  description?: string;
}

export const CSVUploader = ({ 
  onUploadSuccess, 
  uploadType = 'quiz',
  title = 'Upload CSV',
  description = 'Upload a CSV file to bulk create content'
}: CSVUploaderProps) => {
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

  const parseCSVAndCreateContent = async (csvText: string) => {
    if (!user) return;
    
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV must have at least a header row and one data row');
      }
      
      let createdCount = 0;
      let updatedCount = 0;

      if (uploadType === 'quiz') {
        const result = await parseQuizCSV(lines);
        createdCount = result.createdCount;
        updatedCount = result.updatedCount;
      } else if (uploadType === 'vocabulary') {
        const result = await parseVocabularyCSV(lines);
        createdCount = result.createdCount;
      } else if (uploadType === 'dialogue') {
        const result = await parseDialogueCSV(lines);
        createdCount = result.createdCount;
      } else if (uploadType === 'word_bank') {
        const result = await parseWordBankCSV(lines);
        createdCount = result.createdCount;
      } else if (uploadType === 'basic_learning') {
        const result = await parseBasicLearningCSV(lines);
        createdCount = result.createdCount;
      } else if (uploadType === 'games') {
        const result = await parseGamesCSV(lines);
        createdCount = result.createdCount;
      }
      
      return { createdCount, updatedCount };
      
    } catch (error) {
      console.error('Error parsing CSV:', error);
      throw error;
    }
  };

  const parseQuizCSV = async (lines: string[]) => {
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
    
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const [title, questions] of Object.entries(quizGroups)) {
      if (questions.length === 0) continue;
      
      const { data: existingQuiz } = await supabase
        .from('quizzes')
        .select('id')
        .eq('title', title)
        .eq('created_by', user!.id)
        .maybeSingle();
      
      if (existingQuiz) {
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
        const { error } = await supabase
          .from('quizzes')
          .insert({
            title,
            description: `${title} - Imported from CSV with ${questions.length} questions`,
            quiz_type: 'game',
            difficulty_level: 2,
            time_limit: 15,
            questions: questions as any,
            created_by: user!.id
          });
          
        if (!error) {
          createdCount++;
        }
      }
    }
    
    return { createdCount, updatedCount };
  };

  const parseVocabularyCSV = async (lines: string[]) => {
    let createdCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(val => val.replace(/"/g, '').trim());
      
      if (values.length < 3) continue;
      
      const englishWord = values[0];
      const gujaratiWord = values[1];
      const transliteration = values[2] || '';
      const difficultyLevel = parseInt(values[3]) || 1;
      
      if (!englishWord || !gujaratiWord) continue;
      
      // Check if vocabulary already exists
      const { data: existing } = await supabase
        .from('vocabulary')
        .select('id')
        .eq('english_word', englishWord)
        .eq('gujarati_word', gujaratiWord)
        .maybeSingle();
      
      if (!existing) {
        const { error } = await supabase
          .from('vocabulary')
          .insert({
            english_word: englishWord,
            gujarati_word: gujaratiWord,
            gujarati_transliteration: transliteration,
            difficulty_level: difficultyLevel,
            created_by: user!.id
          });
          
        if (!error) {
          createdCount++;
        }
      }
    }
    
    return { createdCount, updatedCount: 0 };
  };

  const parseDialogueCSV = async (lines: string[]) => {
    const dialogueGroups: Record<string, any[]> = {};
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(val => val.replace(/"/g, '').trim());
      
      if (values.length < 5) continue;
      
      const title = values[0] || 'Imported Dialogue';
      const speaker = values[1];
      const english = values[2];
      const gujarati = values[3];
      const transliteration = values[4] || '';
      
      if (!speaker || !english || !gujarati) continue;
      
      if (!dialogueGroups[title]) {
        dialogueGroups[title] = [];
      }
      
      dialogueGroups[title].push({
        speaker,
        english,
        gujarati,
        transliteration
      });
    }
    
    let createdCount = 0;
    
    for (const [title, dialogueData] of Object.entries(dialogueGroups)) {
      if (dialogueData.length === 0) continue;
      
      const { error } = await supabase
        .from('dialogues')
        .insert({
          title,
          description: `${title} - Imported from CSV with ${dialogueData.length} steps`,
          scenario: 'Imported conversation',
          dialogue_data: dialogueData as any,
          difficulty_level: 2,
          created_by: user!.id
        });
        
      if (!error) {
        createdCount++;
      }
    }
    
    return { createdCount, updatedCount: 0 };
  };

  const getFormatInstructions = () => {
    switch (uploadType) {
      case 'quiz':
        return (
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Quiz CSV Format:</strong></p>
            <p>• Column 1: Quiz Title</p>
            <p>• Column 2: Type (optional)</p>
            <p>• Column 3: Description (optional)</p>
            <p>• Column 4: Question in Gujarati</p>
            <p>• Column 5: Question in English</p>
            <p>• Column 6-9: Answer Options A-D</p>
            <p>• Column 10: Correct Answer</p>
          </div>
        );
      case 'vocabulary':
        return (
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Vocabulary CSV Format:</strong></p>
            <p>• Column 1: English Word</p>
            <p>• Column 2: Gujarati Word</p>
            <p>• Column 3: Transliteration (optional)</p>
            <p>• Column 4: Difficulty Level (1-5, optional)</p>
          </div>
        );
      case 'dialogue':
        return (
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Dialogue CSV Format:</strong></p>
            <p>• Column 1: Dialogue Title</p>
            <p>• Column 2: Speaker Name</p>
            <p>• Column 3: English Text</p>
            <p>• Column 4: Gujarati Text</p>
            <p>• Column 5: Transliteration (optional)</p>
          </div>
        );
      default:
        return null;
    }
  };

  const getSuccessMessage = (createdCount: number, updatedCount: number) => {
    switch (uploadType) {
      case 'quiz':
        return `${createdCount} new quizzes created, ${updatedCount} existing quizzes updated`;
      case 'vocabulary':
        return `${createdCount} new vocabulary words added`;
      case 'dialogue':
        return `${createdCount} new dialogues created`;
      default:
        return `${createdCount} items created, ${updatedCount} items updated`;
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    
    setUploading(true);
    
    try {
      const csvText = await file.text();
      const { createdCount, updatedCount } = await parseCSVAndCreateContent(csvText);
      
      toast({
        title: "CSV Upload Successful",
        description: getSuccessMessage(createdCount, updatedCount)
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
          {title}
        </CardTitle>
        <CardDescription>
          {description}
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

        {getFormatInstructions()}
      </CardContent>
    </Card>
  );
};