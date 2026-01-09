import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ROLE_LEVELS: Record<string, number> = {
    company: 1, company_subadmin: 2, cbo: 3, vp: 4, avp: 5,
    dgm: 6, agm: 7, sm: 8, tl: 9, bde: 10, intern: 11, ca: 12
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing authorization header");
        }

        const { targetUserId } = await req.json();

        if (!targetUserId) {
            return new Response(
                JSON.stringify({ error: "Missing targetUserId" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // 1. Get Requester User
        const { data: { user: requester }, error: userError } = await supabaseAuth.auth.getUser();
        if (userError || !requester) throw new Error("Unauthorized");

        // 2. Get Requester Role
        const { data: requesterRoleData, error: reqRoleError } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", requester.id)
            .single();

        if (reqRoleError || !requesterRoleData) throw new Error("Could not verify your role");

        // 3. Get Target User Role
        const { data: targetRoleData, error: targetRoleError } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", targetUserId)
            .maybeSingle();

        // If target has no role, we might still want to allow deletion if they are just a profile?
        // But for now let's assume valid users have roles.
        if (targetRoleError) throw new Error("Could not verify target user role");

        const requesterLevel = ROLE_LEVELS[requesterRoleData.role] || 99;
        const targetLevel = targetRoleData ? (ROLE_LEVELS[targetRoleData.role] || 99) : 99;

        // 4. Permission Check: Requester < Target (lower number = higher permission)
        if (requesterLevel >= targetLevel) {
            return new Response(
                JSON.stringify({ error: "You can only delete members below your level." }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 5. Hierarchy Check (Optional but recommended): Ensure target is actually in requester's downstream
        // For now, the Level check + Company check (implicit via RLS if we queried directly, but here we are admin)
        // We should verify they are in the same company.

        const { data: requesterProfile } = await supabaseAdmin
            .from("profiles")
            .select("company_id")
            .eq("id", requester.id)
            .single();

        const { data: targetProfile } = await supabaseAdmin
            .from("profiles")
            .select("company_id")
            .eq("id", targetUserId)
            .single();

        if (requesterProfile?.company_id !== targetProfile?.company_id) {
            return new Response(
                JSON.stringify({ error: "Target user is not in your organization." }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 6. Delete User
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

        if (deleteError) throw deleteError;

        // Cleanup related data?
        // Supabase Auth delete usually cascades if configure correctly, but we might want to ensure Profiles/UserRoles are gone.
        // Usually ON DELETE CASCADE on foreign keys handles this in Postgres.
        // Assuming DB schema handles cascades for profiles/user_roles linked to auth.users.

        return new Response(
            JSON.stringify({ success: true, message: "User deleted successfully" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
