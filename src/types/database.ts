export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'customer' | 'staff' | 'admin' | 'auditor';
export type OrderStatus = 'draft' | 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled' | 'expired';
export type PaymentProvider = 'stripe' | 'openpix' | 'asaas' | 'ifthenpay' | 'mercadopago' | 'pagbank' | 'manual';
export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'boleto' | 'mbway' | 'multibanco' | 'cash';
export type InventoryMovementType = 'in' | 'out' | 'adjustment' | 'reservation' | 'release' | 'sale' | 'return';
export type CashMovementType = 'in' | 'out' | 'sangria' | 'suprimento' | 'adjustment';
export type CashRegisterStatus = 'open' | 'closed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          document: string | null;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          document?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          document?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          sku: string;
          name: string;
          slug: string;
          description: string | null;
          price_cents: number;
          cost_cents: number;
          currency: string;
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          sku: string;
          name: string;
          slug: string;
          description?: string | null;
          price_cents: number;
          cost_cents?: number;
          currency?: string;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          sku?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price_cents?: number;
          cost_cents?: number;
          currency?: string;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          name: string;
          price_cents: number;
          attributes: Json;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          name: string;
          price_cents: number;
          attributes?: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string;
          name?: string;
          price_cents?: number;
          attributes?: Json;
          is_active?: boolean;
          created_at?: string;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          variant_id: string;
          quantity: number;
          reserved_quantity: number;
          low_stock_threshold: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          variant_id: string;
          quantity?: number;
          reserved_quantity?: number;
          low_stock_threshold?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          variant_id?: string;
          quantity?: number;
          reserved_quantity?: number;
          low_stock_threshold?: number;
          updated_at?: string;
        };
      };
      inventory_movements: {
        Row: {
          id: string;
          variant_id: string;
          type: InventoryMovementType;
          quantity: number;
          previous_quantity: number;
          new_quantity: number;
          reason: string | null;
          reference_type: string | null;
          reference_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          variant_id: string;
          type: InventoryMovementType;
          quantity: number;
          previous_quantity: number;
          new_quantity: number;
          reason?: string | null;
          reference_type?: string | null;
          reference_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          variant_id?: string;
          type?: InventoryMovementType;
          quantity?: number;
          previous_quantity?: number;
          new_quantity?: number;
          reason?: string | null;
          reference_type?: string | null;
          reference_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: number;
          user_id: string | null;
          status: OrderStatus;
          currency: string;
          subtotal_cents: number;
          shipping_cents: number;
          discount_cents: number;
          total_cents: number;
          shipping_address: Json | null;
          billing_address: Json | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: number;
          user_id?: string | null;
          status?: OrderStatus;
          currency?: string;
          subtotal_cents?: number;
          shipping_cents?: number;
          discount_cents?: number;
          total_cents?: number;
          shipping_address?: Json | null;
          billing_address?: Json | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: number;
          user_id?: string | null;
          status?: OrderStatus;
          currency?: string;
          subtotal_cents?: number;
          shipping_cents?: number;
          discount_cents?: number;
          total_cents?: number;
          shipping_address?: Json | null;
          billing_address?: Json | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          variant_id: string | null;
          product_name: string;
          variant_name: string | null;
          sku: string;
          quantity: number;
          unit_price_cents: number;
          total_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          variant_id?: string | null;
          product_name: string;
          variant_name?: string | null;
          sku: string;
          quantity: number;
          unit_price_cents: number;
          total_cents: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          variant_id?: string | null;
          product_name?: string;
          variant_name?: string | null;
          sku?: string;
          quantity?: number;
          unit_price_cents?: number;
          total_cents?: number;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          provider: PaymentProvider;
          method: PaymentMethod;
          status: PaymentStatus;
          amount_cents: number;
          currency: string;
          provider_payment_id: string | null;
          provider_reference: string | null;
          idempotency_key: string | null;
          provider_payload: Json;
          expires_at: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          provider: PaymentProvider;
          method: PaymentMethod;
          status?: PaymentStatus;
          amount_cents: number;
          currency?: string;
          provider_payment_id?: string | null;
          provider_reference?: string | null;
          idempotency_key?: string | null;
          provider_payload?: Json;
          expires_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          provider?: PaymentProvider;
          method?: PaymentMethod;
          status?: PaymentStatus;
          amount_cents?: number;
          currency?: string;
          provider_payment_id?: string | null;
          provider_reference?: string | null;
          idempotency_key?: string | null;
          provider_payload?: Json;
          expires_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payment_events: {
        Row: {
          id: string;
          payment_id: string | null;
          provider: PaymentProvider;
          event_type: string;
          provider_event_id: string | null;
          payload: Json;
          signature_valid: boolean;
          processed: boolean;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          payment_id?: string | null;
          provider: PaymentProvider;
          event_type: string;
          provider_event_id?: string | null;
          payload: Json;
          signature_valid?: boolean;
          processed?: boolean;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          payment_id?: string | null;
          provider?: PaymentProvider;
          event_type?: string;
          provider_event_id?: string | null;
          payload?: Json;
          signature_valid?: boolean;
          processed?: boolean;
          processed_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
