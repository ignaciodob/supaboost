import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface Person {
  id: string
  email: string
  user_id: string | null
}

async function linkUserToPerson(supabaseClient: SupabaseClient) {
  // Get the user from the auth context
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

  if (userError || !user?.email) {
    return new Response(
      JSON.stringify({ error: 'Not authenticated' }),
      { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  // Find the person with matching email
  const { data: person, error: personError } = await supabaseClient
    .from('people')
    .select('*')
    .eq('email', user.email)
    .maybeSingle()

  if (personError) {
    return new Response(
      JSON.stringify({ error: personError.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  if (!person) {
    return new Response(
      JSON.stringify({ error: 'No person found for this email' }),
      { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  // Update the person with the user's ID
  const { error: updateError } = await supabaseClient
    .from('people')
    .update({ user_id: user.id })
    .eq('id', person.id)

  if (updateError) {
    return new Response(
      JSON.stringify({ error: updateError.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  return new Response(
    JSON.stringify({ message: 'Linked successfully' }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return linkUserToPerson(supabaseClient)
  } catch (error: any) {
    console.error(error)

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 