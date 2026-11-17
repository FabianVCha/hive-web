/** @type {import('next').NextConfig} */
const config = {
  // The floating development badge covers product controls on small screens.
  devIndicators: false,
  // Trust this demo tunnel only; keep other remote development origins blocked.
  // Replace the hostname when the tunnel changes (no scheme or port).
  allowedDevOrigins: [
    "321d-2800-e6-1010-3f26-588b-cb1d-b493-24ec.ngrok-free.app",
  ],
};

export default config;
