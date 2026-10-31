import { ref } from 'vue'

// Shared reactive request state lets views show loading, error, and result states consistently.
export function useApi(initialData = null) {
  const data = ref(initialData)
  const loading = ref(false)
  const error = ref(null)

  // Run a request and keep its result or a display-ready error in the composable state.
  async function execute(request) {
    loading.value = true
    error.value = null

    try {
      data.value = await request()
      return data.value
    } catch (requestError) {
      let title = 'Application Error'
      if (requestError.response) {
        title = 'Server Response'
      } else if (requestError.request) {
        title = 'Unable to Reach Server'
      }

      error.value = {
        title,
        message: requestError.message || 'The request failed.'
      }
      return null
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, execute }
}
