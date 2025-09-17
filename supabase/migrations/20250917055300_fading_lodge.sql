@@ .. @@
   page_visits JSONB DEFAULT '{}',
   activities_completed INTEGER DEFAULT 0,
-  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
+  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
+  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
 );