'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: Updated initialization logic to be more resilient in non-App Hosting environments (like Vercel)
export function initializeFirebase() {
  const apps = getApps();
  if (apps.length > 0) return getSdks(apps[0]);

  let firebaseApp;
  try {
    // Attempt to initialize via Firebase App Hosting environment variables (primary method)
    // This will throw if not in an App Hosting environment.
    firebaseApp = initializeApp();
  } catch (e) {
    // If auto-init fails, fall back to the provided config object.
    // This is critical for deployments on Vercel or local development.
    if (firebaseConfig && firebaseConfig.apiKey) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      console.error("Firebase initialization failed: No config provided and auto-init failed.", e);
      throw e;
    }
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
