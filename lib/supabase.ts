import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kkvwqohfntixskwecbwe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtrdndxb2hmbnRpeHNrd2VjYndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzYyMTMsImV4cCI6MjA5NTMxMjIxM30.VgXuuIheG0fkj3DspMqABfX0gH1rzNMhShLUwJ_SOGI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);