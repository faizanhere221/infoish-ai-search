import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin operations

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to update user subscription
export async function updateUserSubscription(
  userEmail: string,
  productSlug: string,
  tier: string
) {
  try {
    // Get user
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, tool_subscriptions')
      .eq('email', userEmail)
      .single()
    
    if (fetchError || !user) {
      throw new Error(`User not found: ${userEmail}`)
    }
    
    // Update tool_subscriptions
    const updatedSubscriptions = {
      ...(user.tool_subscriptions || {}),
      [productSlug]: tier
    }
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ tool_subscriptions: updatedSubscriptions })
      .eq('email', userEmail)
    
    if (updateError) throw updateError
    
    console.log(`✅ Updated ${userEmail}: ${productSlug} → ${tier}`)
    return { success: true }
    
  } catch (error) {
    console.error('Update failed:', error)
    throw error
  }
}

// Usage examples:
// await updateUserSubscription('user@example.com', 'ai_humanizer', 'starter')
// await updateUserSubscription('user@example.com', 'infoishai_search', 'pro')