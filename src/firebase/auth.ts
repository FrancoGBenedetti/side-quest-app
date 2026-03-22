import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from './config'
import { createUserProfile } from './users'

export async function registerWithEmail(email: string, password: string, displayName: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName })
  await createUserProfile({
    uid: credential.user.uid,
    email,
    displayName,
    photoURL: null,
  })
  return credential.user
}

export async function loginWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider)
  const { user } = credential
  await createUserProfile({
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? user.email ?? 'Usuario',
    photoURL: user.photoURL,
  })
  return user
}

export async function logout() {
  await signOut(auth)
}
