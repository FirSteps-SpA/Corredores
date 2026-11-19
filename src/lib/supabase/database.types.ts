
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admins": {
                  Row: {
                    "user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "user_id": string
                  }
                  Update: {
                    "user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"propiedad_fotos": {
                  Row: {
                    "alt": string | null,"id": string,"orden": number,"path": string,"propiedad_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alt"?: string | null,"id"?: string,"orden"?: number,"path": string,"propiedad_id": string
                  }
                  Update: {
                    "alt"?: string | null,"id"?: string,"orden"?: number,"path"?: string,"propiedad_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "propiedad_fotos_propiedad_id_fkey"
      columns: ["propiedad_id"]
isOneToOne: false
      referencedRelation: "propiedades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "propiedad_fotos_propiedad_id_fkey"
      columns: ["propiedad_id"]
isOneToOne: false
      referencedRelation: "propiedades_publicas"
      referencedColumns: ["id"]
    }
                  ]
                },"propiedades": {
                  Row: {
                    "banos": number | null,"bodegas": number | null,"caracteristicas": (string)[],"codigo": string | null,"comuna": string,"created_at": string,"descripcion": string | null,"destacada": boolean,"direccion": string | null,"dormitorios": number | null,"estacionamientos": number | null,"estado": string,"gastos_comunes": number | null,"id": string,"lat": number | null,"lng": number | null,"m2_totales": number | null,"m2_utiles": number | null,"moneda": string,"mostrar_direccion": boolean,"operacion": string,"precio": number,"region": string | null,"sector": string | null,"slug": string,"tipo": string,"titulo": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "banos"?: number | null,"bodegas"?: number | null,"caracteristicas"?: (string)[],"codigo"?: string | null,"comuna": string,"created_at"?: string,"descripcion"?: string | null,"destacada"?: boolean,"direccion"?: string | null,"dormitorios"?: number | null,"estacionamientos"?: number | null,"estado"?: string,"gastos_comunes"?: number | null,"id"?: string,"lat"?: number | null,"lng"?: number | null,"m2_totales"?: number | null,"m2_utiles"?: number | null,"moneda": string,"mostrar_direccion"?: boolean,"operacion": string,"precio": number,"region"?: string | null,"sector"?: string | null,"slug": string,"tipo": string,"titulo": string,"updated_at"?: string
                  }
                  Update: {
                    "banos"?: number | null,"bodegas"?: number | null,"caracteristicas"?: (string)[],"codigo"?: string | null,"comuna"?: string,"created_at"?: string,"descripcion"?: string | null,"destacada"?: boolean,"direccion"?: string | null,"dormitorios"?: number | null,"estacionamientos"?: number | null,"estado"?: string,"gastos_comunes"?: number | null,"id"?: string,"lat"?: number | null,"lng"?: number | null,"m2_totales"?: number | null,"m2_utiles"?: number | null,"moneda"?: string,"mostrar_direccion"?: boolean,"operacion"?: string,"precio"?: number,"region"?: string | null,"sector"?: string | null,"slug"?: string,"tipo"?: string,"titulo"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "propiedades_publicas": {
                  Row: {
                    "banos": number | null,"bodegas": number | null,"caracteristicas": (string)[] | null,"codigo": string | null,"comuna": string | null,"created_at": string | null,"descripcion": string | null,"destacada": boolean | null,"direccion": string | null,"dormitorios": number | null,"estacionamientos": number | null,"estado": string | null,"gastos_comunes": number | null,"id": string | null,"lat": number | null,"lng": number | null,"m2_totales": number | null,"m2_utiles": number | null,"moneda": string | null,"mostrar_direccion": boolean | null,"operacion": string | null,"precio": number | null,"region": string | null,"sector": string | null,"slug": string | null,"tipo": string | null,"titulo": string | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "es_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
