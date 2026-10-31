import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_ROOT_API,
  headers: {
    'Content-Type': 'application/json'
  }
})

function setAuthHeader(token) {
  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
}

function removeAuthHeader() {
  delete apiClient.defaults.headers.common.Authorization
}

function getErrorMessage(data, fallback) {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return data || fallback
    }
  }

  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors[0].msg || data.errors[0].message || fallback
  }

  return data?.message || fallback
}

// Normalize Axios failures once so every API caller receives a readable Error consistently.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = getErrorMessage(
      error.response?.data,
      error.message || 'The API request failed.'
    )
    const normalizedError = new Error(message)
    normalizedError.response = error.response
    normalizedError.request = error.request
    normalizedError.code = error.code
    return Promise.reject(normalizedError)
  }
)

export async function loginUser(username, password) {
  const response = await apiClient.post('/users/login', { username, password })
  const token = response.data.token
  localStorage.setItem('authToken', token)
  setAuthHeader(token)
  return token
}

export function logoutUser() {
  localStorage.removeItem('authToken')
  removeAuthHeader()
}

export async function getOrgName() {
  const response = await apiClient.get('/org')
  return response.data
}

export async function getEvents() {
  const response = await apiClient.get('/events/')
  return response.data
}

export async function getEventById(id) {
  const response = await apiClient.get(`/events/id/${id}`)
  return response.data
}

export async function searchEvents(query) {
  const params = {}
  if (query.searchBy === 'name') {
    params.searchBy = query.searchBy
    params.name = query.name || ''
  } else if (query.searchBy === 'date') {
    params.searchBy = query.searchBy
    params.eventDate = query.eventDate || ''
  }
  const response = await apiClient.get('/events/search', { params })
  return response.data
}

export async function getClientEvents(id) {
  const response = await apiClient.get(`/events/client/${id}`)
  return response.data
}

export async function getNonClientEvents(id) {
  const response = await apiClient.get(`/events/client/${id}/not-registered`)
  return response.data
}

export async function getEventAttendees(id) {
  const response = await apiClient.get(`/events/attendees/${id}`)
  return response.data
}

export async function getEventsByServiceId(id) {
  const response = await apiClient.get(`/events/service/${id}`)
  return response.data
}

export async function createEvent(eventData) {
  const response = await apiClient.post('/events/', eventData)
  return response.data
}

export async function updateEvent(id, eventData) {
  const response = await apiClient.put(`/events/update/${id}`, eventData)
  return response.data
}

export async function registerAttendee(eventId, clientId) {
  const response = await apiClient.put(
    '/events/register',
    {},
    { params: { event: eventId, client: clientId } }
  )
  return response.data
}

export async function deregisterAttendee(eventId, clientId) {
  const response = await apiClient.put(
    '/events/deregister',
    {},
    { params: { event: eventId, client: clientId } }
  )
  return response.data
}

export async function deleteEvent(id) {
  const response = await apiClient.delete(`/events/${id}`)
  return response.data
}

export async function getAttendance() {
  const response = await apiClient.get('/events/attendance')
  return response.data
}

export async function getClients() {
  const response = await apiClient.get('clients')
  return response.data
}

export async function getClientById(id) {
  const response = await apiClient.get(`/clients/id/${id}`)
  return response.data
}

export async function searchClients(query) {
  const params = {}
  if (query.searchBy === 'name') {
    params.searchBy = query.searchBy
    params.firstName = query.firstName || ''
    params.lastName = query.lastName || ''
  } else if (query.searchBy === 'number') {
    params.searchBy = query.searchBy
    params.phoneNumber = query.phoneNumber || ''
  }
  const response = await apiClient.get('/clients/search', { params })
  return response.data
}

export async function createClient(newClient) {
  const response = await apiClient.post('/clients', newClient)
  return response.data
}

export async function updateClient(id, updatedClient) {
  const response = await apiClient.put(`/clients/update/${id}`, updatedClient)
  return response.data
}

export async function deleteClientbyId(id) {
  const response = await apiClient.delete(`/clients/${id}`)
  return response.data
}

export async function getClientsByZipCode() {
  const response = await apiClient.get('/clients/byzip')
  return response.data
}

export async function getServices() {
  const response = await apiClient.get('/services/')
  return response.data
}

export async function getServiceById(id) {
  const response = await apiClient.get(`/services/id/${id}`)
  return response.data
}

export async function searchServices(query) {
  const params = { searchBy: query.searchBy }
  if (query.searchBy === 'name') {
    params.name = query.name || ''
  } else if (query.searchBy === 'description') {
    params.description = query.description
  }
  const response = await apiClient.get('/services/search', { params })
  return response.data
}

export async function createService(newService) {
  const response = await apiClient.post('/services', newService)
  return response.data
}

export async function updateService(id, updatedService) {
  const response = await apiClient.put(`/services/update/${id}`, updatedService)
  return response.data
}

export async function deleteService(id) {
  const response = await apiClient.delete(`/services/${id}`)
  return response.data
}
