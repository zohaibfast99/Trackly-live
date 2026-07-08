import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";

// Backstop authentication for the app's protected areas.
// Individual pages/actions still call userRequired(), but this guarantees an
// unauthenticated request never reaches a protected route even if a page forgets to.
//
// Intentionally NOT matched (must stay public):
//   /                         -> marketing landing page
//   /api/auth/*               -> Kinde login/logout/callback
//   /api/webhooks/*           -> server-to-server webhooks (own verification)
//   /api/uploadthing          -> has its own auth in the file router
//   /workspace-invite/*       -> public invite preview / sign-in-to-join flow
//   static assets             -> excluded by the matcher below
export default withAuth;

export const config = {
  matcher: [
    "/workspace",
    "/workspace/:path*",
    "/create-workspace",
    "/onboarding",
    "/billing",
    "/pricing",
  ],
};
