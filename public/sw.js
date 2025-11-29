// Empty Service Worker - Prevents 404 error
// This file exists only to prevent the browser from throwing 404 errors

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Do nothing - just let requests pass through normally
  return;
});