export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      invites: {
        Row: {
          id: string;
          code: string;
          user_id: string;
          created_at: string;
          expires_at: string;
          redeemed_at: string | null;
          denied: boolean;
        };
        Insert: {
          id?: string;
          code?: string;
          user_id: string;
          created_at?: string;
          expires_at: string;
          redeemed_at?: string | null;
          denied?: boolean;
        };
        Update: {
          id?: string;
          code?: string;
          user_id?: string;
          created_at?: string;
          expires_at?: string;
          redeemed_at?: string | null;
          denied?: boolean;
        };
      };
    };
  };
}
