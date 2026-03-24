import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './config'

export async function uploadEvidenceImage(questId: string, file: File): Promise<string> {
  const path = `evidence/${questId}/${Date.now()}_${file.name}`
  const storageRef = ref(storage, path)
  const snapshot = await uploadBytes(storageRef, file)
  return getDownloadURL(snapshot.ref)
}
