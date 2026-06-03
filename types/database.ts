export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
export interface Database { public: { Tables: Record<string, any>; Views: {}; Functions: {}; Enums: {} } }
