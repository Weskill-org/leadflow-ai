import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  fullName: string;
  password: string;
  role: string;
}

const VALID_ROLES = [
  "company", "company_subadmin", "cbo", "vp", "avp",
  "dgm", "agm", "sm", "tl", "bde", "intern", "ca",
  "level_3", "level_4", "level_5", "level_6", "level_7", "level_8",
  "level_9", "level_10", "level_11", "level_12", "level_13", "level_14",
  "level_15", "level_16", "level_17", "level_18", "level_19", "level_20"
];

const ROLE_LEVELS: Record<string, number> = {
  company: 1, company_subadmin: 2, cbo: 3, vp: 4, avp: 5,
  dgm: 6, agm: 7, sm: 8, tl: 9, bde: 10, intern: 11, ca: 12,
  level_3: 3, level_4: 4, level_5: 5, level_6: 6, level_7: 7, level_8: 8,
  level_9: 9, level_10: 10, level_11: 11, level_12: 12, level_13: 13,
  level_14: 14, level_15: 15, level_16: 16, level_17: 17, level_18: 18,
  level_19: 19, level_20: 20
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get and validate authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client for verifying the requester
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Admin client for creating users
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Get the requesting user
    const { data: { user: requester }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !requester) {
      console.error("Auth error:", userError);
      throw new Error("Unauthorized: " + (userError?.message || "User not found"));
    }

    // Ensure requester has a profile row (required because profiles.manager_id FK references profiles.id)
    const { data: requesterProfile, error: requesterProfileError } = await supabaseAdmin
      .from("profiles")
      .select("id, company_id, full_name, email, manager_id")
      .eq("id", requester.id)
      .maybeSingle();

    if (requesterProfileError) {
      console.error("Requester profile fetch error:", requesterProfileError);
      throw new Error("Could not verify your profile: " + requesterProfileError.message);
    }

    let requesterCompanyId: string | null = requesterProfile?.company_id ?? null;

    // Fallback for Company Admins where profile might not exist yet
    if (!requesterCompanyId) {
      const { data: companyRow, error: companyError } = await supabaseAdmin
        .from("companies")
        .select("id")
        .eq("admin_id", requester.id)
        .maybeSingle();

      if (companyError) {
        console.error("Company lookup error:", companyError);
      }

      requesterCompanyId = companyRow?.id ?? null;
    }

    if (!requesterCompanyId) {
      throw new Error("Your account is not linked to a company.");
    }

    // Create the requester's profile row if missing (prevents FK failure when inviting someone)
    if (!requesterProfile) {
      const requesterFullName = (requester.user_metadata as Record<string, unknown> | null)?.["full_name"];

      const { error: ensureRequesterProfileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: requester.id,
          email: requester.email,
          full_name: typeof requesterFullName === "string" ? requesterFullName : null,
          manager_id: null,
          company_id: requesterCompanyId,
        });

      if (ensureRequesterProfileError) {
        console.error("Ensure requester profile error:", ensureRequesterProfileError);
        throw new Error("Could not create your profile record: " + ensureRequesterProfileError.message);
      }
    }

    // Parse and validate request body
    const body: InviteRequest = await req.json();
    console.log("Invite request received:", JSON.stringify(body));
    const { email, fullName, password, role } = body;

    // Input validation
    if (!email || !fullName || !password || !role) {
      throw new Error("Missing required fields");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Validate full name length
    if (fullName.length > 100) {
      throw new Error("Full name must be less than 100 characters");
    }

    // Validate password
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Validate role is in allowed list
    if (!VALID_ROLES.includes(role)) {
      throw new Error("Invalid role");
    }

    // Get requester's role
    const { data: requesterRoleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requester.id)
      .single();

    if (roleError || !requesterRoleData) {
      console.error("Role fetch error:", roleError);
      throw new Error("Could not verify your role");
    }

    const requesterLevel = ROLE_LEVELS[requesterRoleData.role] || 99;
    const targetLevel = ROLE_LEVELS[role] || 99;

    // Server-side validation: requester can only assign roles below their level
    if (requesterLevel >= targetLevel) {
      console.log(`Permission denied: requester level ${requesterLevel} cannot assign level ${targetLevel}`);
      throw new Error("You cannot assign this role. You can only assign roles below your level.");
    }

    console.log(`Creating user ${email} with role ${role} requested by ${requester.email}`);

    // Create the user with admin client
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        manager_id: requester.id
      }
    });

    if (signUpError) {
      console.error("Signup error:", signUpError);
      throw new Error(signUpError.message);
    }

    const newUserId = signUpData.user?.id;
    if (!newUserId) {
      throw new Error("Failed to create user (no ID returned)");
    }

    // Ensure the new user is added to profiles with correct manager_id + company_id
    const { error: upsertProfileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: newUserId,
          email,
          full_name: fullName,
          manager_id: requester.id,
          company_id: requesterCompanyId,
        },
        { onConflict: "id" }
      );

    if (upsertProfileError) {
      console.error("Profile upsert error:", upsertProfileError);
      // Rollback user creation to avoid orphaned auth users
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error("Failed to create profile for new user: " + upsertProfileError.message);
    }

    // Set role (keep a single role row per user)
    const { error: deleteRolesError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", newUserId);

    if (deleteRolesError) {
      console.error("Role cleanup error:", deleteRolesError);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error("Failed to set role for new user (cleanup failed)");
    }

    const { error: insertRoleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role });

    if (insertRoleError) {
      console.error("Role insert error:", insertRoleError);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error("Failed to set role for new user (insert failed)");
    }

    console.log(`Successfully invited ${email} as ${role} by ${requester.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUserId,
        message: `${fullName} has been added successfully.`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
