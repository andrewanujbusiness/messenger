import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fkntaksvyulgcayzzowy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrbnRha3N2eXVsZ2NheXp6b3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjM1NTgsImV4cCI6MjA3MTAzOTU1OH0.b2UrMEy-80KjIPktxC-is_LbrETqTTKXVjXHVMJzxkg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
