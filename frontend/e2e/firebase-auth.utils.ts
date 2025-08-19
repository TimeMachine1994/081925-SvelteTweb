import axios from 'axios';

const AUTH_EMULATOR_URL = 'http://localhost:9099/identitytoolkit.googleapis.com/v1';
const FIREBASE_PROJECT_ID = 'demo-svelte-tweb';

export async function createUser(email, password) {
  const url = `${AUTH_EMULATOR_URL}/accounts:signUp?key=${FIREBASE_PROJECT_ID}`;
  const data = { email, password, returnSecureToken: true };
  try {
    const response = await axios.post(url, data);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error.response?.data || error.message);
    throw error;
  }
}

export async function getUserByEmail(email) {
  const url = `${AUTH_EMULATOR_URL}/accounts:lookup?key=${FIREBASE_PROJECT_ID}`;
  const data = { email: [email] };
  const config = { headers: { Authorization: 'Bearer owner' } };
  try {
    const response = await axios.post(url, data, config);
    return response.data.users && response.data.users[0];
  } catch (error) {
    if (error.response?.data?.error?.message === 'EMAIL_NOT_FOUND') {
      return null;
    }
    console.error('Error getting user by email:', error.response?.data || error.message);
    throw error;
  }
}

export async function deleteUser(uid) {
  const url = `${AUTH_EMULATOR_URL}/accounts:delete?key=${FIREBASE_PROJECT_ID}`;
  const data = { localId: uid };
  const config = { headers: { Authorization: 'Bearer owner' } };
  try {
    await axios.post(url, data, config);
  } catch (error) {
    console.error('Error deleting user:', error.response?.data || error.message);
    throw error;
  }
}