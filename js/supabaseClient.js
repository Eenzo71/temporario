import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://pzgtlgdjofwzsmlflghp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6Z3RsZ2Rqb2Z3enNtbGZsZ2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NjgzNTksImV4cCI6MjA4MTE0NDM1OX0.jfsOHphuLB86iewCZLXomz3xKsx3d2ig307j8u2G-9k';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);