import { createClient } from '@supabase/supabase-js'
import * as webpush from 'web-push'

// Get the VAPID keys from the secrets we just set
const VAPID_PUBLIC_KEY = 'BMZtsjLVAlMgYB235iT7OoA2sJL7fUhGXa9flptCnGVcLosNjg6xKwtA-LEAN_Tdw_zbukNTqp0gIiHteOiu8Gc'
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const DB_PASSWORD = Deno.env.get('DB_PASSWORD')!

// Set up web-push with your VAPID details
webpush.setVapidDetails(
  'mailto:your-email@example.com', // !!! CHANGE THIS TO YOUR EMAIL !!!
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

// This Deno.serve function is the Edge Function
Deno.serve(async (req) => {
  try {
    // 1. Get the 'user_id' and 'payload' from the request
    const { user_id_to_notify, notification_payload } = await req.json()

    // 2. Create a Supabase admin client
    // We use the service_role key to bypass RLS and read the subscriptions table
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 3. Get the user's push subscription from the database
    const { data, error: dbError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', user_id_to_notify)
      .single()

    if (dbError) throw new Error(`Database error: ${dbError.message}`)
    if (!data) throw new Error('Subscription not found for user')

    const subscription = data.subscription as webpush.PushSubscription

    // 4. Send the push notification
    await webpush.sendNotification(subscription, JSON.stringify(notification_payload))

    // 5. Return a success response
    return new Response(
      JSON.stringify({ success: true, message: 'Push notification sent.' }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (err) {
    // Return an error response
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})