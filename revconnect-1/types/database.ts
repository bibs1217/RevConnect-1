export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type MembershipTier = 'cruiser' | 'builder' | 'racer' | 'legend'
export type VehicleStatus = 'active' | 'project' | 'for_sale' | 'sold' | 'parted_out' | 'archived'
export type EventType = 'street_meet' | 'car_show' | 'track_day' | 'cruise' | 'drag' | 'autocross' | 'hpde'
export type PartCondition = 'new_oem' | 'new_aftermarket' | 'remanufactured' | 'used' | 'performance'
export type AuctionType = 'public' | 'dealer' | 'collector' | 'online' | 'specialty'
export type WashType = 'tunnel_soft' | 'tunnel_touchless' | 'tunnel_hybrid' | 'self_service' | 'hand_wash' | 'mobile_detailer' | 'full_detail'
export type InsuranceCoverageType = 'standard' | 'agreed_value' | 'stated_value' | 'classic' | 'track'
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'returned' | 'refunded'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          banner_url: string | null
          location: string | null
          years_in_scene: number | null
          skill_level: 'beginner' | 'intermediate' | 'advanced' | 'professional' | null
          membership_tier: MembershipTier
          rev_points: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          follower_count: number
          following_count: number
          is_verified_builder: boolean
          social_instagram: string | null
          social_tiktok: string | null
          social_youtube: string | null
          social_twitter: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at' | 'follower_count' | 'following_count' | 'rev_points'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      vehicles: {
        Row: {
          id: string
          owner_id: string
          year: number
          make: string
          model: string
          trim: string | null
          nickname: string | null
          vin: string | null
          color: string | null
          mileage: number | null
          status: VehicleStatus
          hero_image_url: string | null
          purchase_date: string | null
          purchase_price: number | null
          purchase_story: string | null
          paint_protection: 'bare' | 'wax' | 'sealant' | 'ceramic' | 'ppf' | 'vinyl' | null
          is_primary: boolean
          is_for_sale: boolean
          asking_price: number | null
          total_build_cost: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['vehicles']['Row'], 'id' | 'created_at' | 'updated_at' | 'total_build_cost'>
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>
      }
      vehicle_modifications: {
        Row: {
          id: string
          vehicle_id: string
          category: string
          part_name: string
          brand: string | null
          part_number: string | null
          source: string | null
          install_date: string | null
          cost: number | null
          is_diy: boolean
          difficulty_rating: number | null
          notes: string | null
          before_photo_url: string | null
          after_photo_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['vehicle_modifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['vehicle_modifications']['Insert']>
      }
      vehicle_maintenance: {
        Row: {
          id: string
          vehicle_id: string
          service_type: string
          date: string
          mileage: number | null
          cost: number | null
          shop_name: string | null
          is_diy: boolean
          notes: string | null
          next_service_mileage: number | null
          next_service_date: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['vehicle_maintenance']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['vehicle_maintenance']['Insert']>
      }
      events: {
        Row: {
          id: string
          organizer_id: string
          title: string
          description: string | null
          event_type: EventType
          address: string
          city: string
          state: string
          zip: string
          lat: number | null
          lng: number | null
          starts_at: string
          ends_at: string | null
          cover_image_url: string | null
          max_attendees: number | null
          current_attendees: number
          entry_fee: number | null
          registration_required: boolean
          qr_code: string | null
          club_id: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at' | 'current_attendees' | 'qr_code'>
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
      event_attendees: {
        Row: {
          id: string
          event_id: string
          user_id: string
          vehicle_id: string | null
          checked_in: boolean
          checked_in_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['event_attendees']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['event_attendees']['Insert']>
      }
      clubs: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          banner_url: string | null
          location: string | null
          member_count: number
          is_private: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['clubs']['Row'], 'id' | 'created_at' | 'member_count'>
        Update: Partial<Database['public']['Tables']['clubs']['Insert']>
      }
      marketplace_listings: {
        Row: {
          id: string
          seller_id: string
          vehicle_id: string | null
          listing_type: 'part' | 'vehicle'
          title: string
          description: string | null
          price: number
          condition: PartCondition
          category: string
          make_fitment: string[] | null
          model_fitment: string[] | null
          year_fitment_min: number | null
          year_fitment_max: number | null
          images: string[]
          location: string | null
          is_sold: boolean
          is_active: boolean
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['marketplace_listings']['Row'], 'id' | 'created_at' | 'updated_at' | 'view_count' | 'is_sold'>
        Update: Partial<Database['public']['Tables']['marketplace_listings']['Insert']>
      }
      vendors: {
        Row: {
          id: string
          name: string
          slug: string
          category: string
          description: string | null
          logo_url: string | null
          website: string | null
          is_featured: boolean
          is_verified: boolean
          location: string | null
          lat: number | null
          lng: number | null
          stripe_account_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['vendors']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['vendors']['Insert']>
      }
      auctions: {
        Row: {
          id: string
          source: string
          external_id: string | null
          auction_type: AuctionType
          title: string
          year: number | null
          make: string | null
          model: string | null
          trim: string | null
          vin: string | null
          mileage: number | null
          condition: string | null
          current_bid: number | null
          reserve_met: boolean | null
          buy_now_price: number | null
          buyer_premium_pct: number | null
          images: string[]
          auction_url: string
          location: string | null
          starts_at: string | null
          ends_at: string | null
          lot_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['auctions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['auctions']['Insert']>
      }
      car_washes: {
        Row: {
          id: string
          name: string
          wash_type: WashType
          address: string
          city: string
          state: string
          zip: string
          lat: number
          lng: number
          phone: string | null
          website: string | null
          hours: Json | null
          price_range: '$' | '$$' | '$$$' | null
          is_ceramic_safe: boolean
          is_ppf_safe: boolean
          is_touchless: boolean
          has_undercarriage: boolean
          has_spot_free_rinse: boolean
          has_membership: boolean
          google_place_id: string | null
          rating: number | null
          review_count: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['car_washes']['Row'], 'id' | 'created_at' | 'review_count'>
        Update: Partial<Database['public']['Tables']['car_washes']['Insert']>
      }
      insurance_quotes: {
        Row: {
          id: string
          user_id: string
          vehicle_id: string
          carrier_name: string
          coverage_type: InsuranceCoverageType
          annual_premium: number
          monthly_premium: number
          deductible: number | null
          agreed_value: number | null
          includes_track: boolean
          includes_mods: boolean
          quote_url: string | null
          am_best_rating: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['insurance_quotes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['insurance_quotes']['Insert']>
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category: string
          subcategory: string | null
          images: string[]
          base_price: number
          compare_at_price: number | null
          stripe_product_id: string | null
          stripe_price_id: string | null
          inventory: number
          is_customizable: boolean
          is_limited: boolean
          is_active: boolean
          tags: string[]
          rev_points_earn: number
          weight_oz: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      orders: {
        Row: {
          id: string
          user_id: string
          stripe_payment_intent_id: string | null
          stripe_checkout_session_id: string | null
          status: OrderStatus
          subtotal: number
          tax: number
          shipping: number
          discount: number
          total: number
          rev_points_earned: number
          rev_points_redeemed: number
          shipping_address: Json | null
          tracking_number: string | null
          carrier: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          customization: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string | null
          data: Json | null
          read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at' | 'read'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: Database['public']['Tables']['follows']['Row']
        Update: never
      }
      posts: {
        Row: {
          id: string
          user_id: string
          vehicle_id: string | null
          event_id: string | null
          content: string | null
          images: string[]
          like_count: number
          comment_count: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at' | 'updated_at' | 'like_count' | 'comment_count'>
        Update: Partial<Database['public']['Tables']['posts']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
