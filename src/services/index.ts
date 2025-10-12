const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const getVapidPublicKey = async () => {
  return fetch(`${BASE_URL}/api/vapidPublicKey`)
}

const createSubscription = async (body: object) => {
  return fetch(`${BASE_URL}/api/subscribe`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export default {
  getVapidPublicKey,
  createSubscription,
}