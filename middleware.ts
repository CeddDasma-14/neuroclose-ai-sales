import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Routes that must remain publicly accessible (no auth required)
const isPublic = createRouteMatcher([
  '/sign-in(.*)',          // Clerk sign-in flow
  '/api/webhook/sms(.*)', // Twilio webhook — must be reachable without a session
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) await auth.protect()
})

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
