// src/utils/reauthenticate.js
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

export const reauthenticateUser = async (user, currentPassword) => {
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
};
