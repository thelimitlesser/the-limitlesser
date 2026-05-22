export function middleware(request) {
  const url = new URL(request.url);
  
  // Only run redirection logic when visiting the root path "/"
  if (url.pathname === '/') {
    // 1. Check for manual language selection via standard Cookie header
    const cookieHeader = request.headers.get('cookie') || '';
    const hasHuCookie = cookieHeader.includes('lang=hu');
    const hasEnCookie = cookieHeader.includes('lang=en');
    
    if (hasHuCookie) {
      // User explicitly wanted Hungarian, let them stay on the root
      return;
    }
    if (hasEnCookie) {
      // User explicitly wanted English, redirect to /en
      url.pathname = '/en';
      return Response.redirect(url, 307);
    }
    
    // 2. Auto-detect country based on Vercel's GeoIP header
    const country = request.headers.get('x-vercel-ip-country') || 'HU';
    if (country !== 'HU') {
      // Visitor is from abroad, redirect to English subfolder /en
      url.pathname = '/en';
      return Response.redirect(url, 307);
    }
  }
}
