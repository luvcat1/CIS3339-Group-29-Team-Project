<!-- This view allows a user to update a specific service's information. -->
<template>
  <main>
    <!--Header-->
    <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
      Service Details
    </h1>
    <div class="px-10 py-20">
        <!-- grid container -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
          <h2 class="text-2xl font-bold">Service Details</h2>
          <!-- Service Name input field -->
          <div class="flex flex-col">
            <label class="block">
              <span class="text-gray-700">Service Name</span>
              <span style="color: #ff0000">*</span>
              <input type="text"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                v-model="service.name" />
            </label>
            <span v-if="v$.service.name.$error" class="text-red-500">
              Service Name is required
            </span>
          </div>

          <!-- Description input field -->
          <div class="flex flex-col">
            <label>
              <span class="text-gray-700">Description:</span>
              <textarea
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                v-model="service.description"></textarea>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
          <div></div>
          <!-- form field: update service description -->
          <div class="flex flex-col">
            <label class="block">
              <span class="text-gray-700">Service Status</span>
              <span style="color: #ff0000">*</span>
              <div class="mt-1">
                <label class="inline-flex items-center">
                  <input type="radio" class="form-radio" value="Active" v-model="service.status">
                  <span class="ml-2">Active</span>
                </label>
                <label class="inline-flex items-center ml-6">
                  <input type="radio" class="form-radio" value="Inactive" v-model="service.status">
                  <span class="ml-2">Inactive</span>
                </label>
              </div>
            </label>
          </div>
        </div>

        <!-- grid container -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
          <div></div>
          <!-- Update Service button -->
          <div class="flex justify-between mt-10 mr-20">
            <div class="flex justify-between mt-10 mr-25">
              <button @click="submitServiceUpdate" type="submit" class="bg-green-700 disabled:opacity-50 text-white rounded"
                :disabled="user.role === 'viewer'">
                Update Service
              </button>
            </div>
          </div>
          <!--Delete Service button-->
          <div class="flex justify-between mt-20 mr-20">
            <button @click="submitDeleteService" type="submit" class="bg-red-700 disabled:opacity-50 text-white rounded"
              :disabled="user.role === 'viewer'">
              Delete Service
            </button>
          </div>
          <!--Go back button-->
          <div class="flex justify-between mt-20 mr-20">
            <button type="button" class="border border-red-700 bg-white text-red-700 rounded" @click="router.back()">
              Go back
            </button>
          </div>
        </div>
    </div>

    <hr class="mt-10 mb-10" />
    <!-- Display Found Data -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
      <!--List of Events table-->
      <div class="ml-10">
        <h2 class="text-2xl font-bold">List of Events</h2>
        <h3 class="italic">Click table row to view event details</h3>
      </div>
      <div class="flex flex-col col-span-2">
        <table class="min-w-full shadow-md rounded">
          <thead class="bg-gray-50 text-xl">
            <tr>
              <th class="p-4 text-left">Event Name</th>
              <th class="p-4 text-left">Event Date</th>
              <th class="p-4 text-left">Event Address</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-300">
            <tr @click="openEvent(event._id)"
            v-for="event in events" :key="event._id" class="cursor-pointer"
              :class="{ 'hoverRow': hoverId === event._id }" @mouseenter="hoverId = event._id"
              @mouseleave="hoverId = null">
              <td class="p-2 text-left">{{ event.name }}</td>
              <td class="p-2 text-left">{{ formatDate(event.date) }}</td>
              <td class="p-2 text-left">{{ event.address.line1 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import useVuelidate from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import { useLoggedInUserStore } from '../store/loggedInUser'
import { useRoute, useRouter } from 'vue-router'
import { getServiceById, getEventsByServiceId, updateService, deleteService } from '../api/api'
import { useToast } from 'vue-toastification'
import { formatDate } from '../utils/formatDate'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const user = useLoggedInUserStore()
// The service page also loads linked events to show usage and prevent unsafe deletion.
const service = reactive({ name: null, description: null, status: null })
const events = ref([])
const hoverId = ref(null)
const validations = { service: { name: { required } } }
const v$ = useVuelidate(validations, { service })

// Load the selected service and its related events using the route parameter.
onMounted(async () => {
  try {
    const [serviceResponse, eventsResponse] = await Promise.all([
      getServiceById(route.params.id),
      getEventsByServiceId(route.params.id)
    ])
    Object.assign(service, serviceResponse)
    events.value = eventsResponse
  } catch (error) {
    toast.error(error.message)
  }
})

function openEvent(id) {
  router.push({ name: 'eventdetails', params: { id } })
}

async function submitServiceUpdate() {
  if (!(await v$.value.$validate())) return

  try {
    const response = await updateService(route.params.id, service)
    await router.push('/findservice')
    toast.success(response)
  } catch (error) {
    toast.error(error.message)
  }
}

async function submitDeleteService() {
  // A service referenced by events must remain available to those records.
  if (events.value.length !== 0) {
    toast.info('Service can not be deleted since it is being used by events.')
    return
  }

  try {
    const response = await deleteService(route.params.id)
    await router.push('/findservice')
    toast.success(response)
  } catch (error) {
    toast.error(error.message)
  }
}
</script>