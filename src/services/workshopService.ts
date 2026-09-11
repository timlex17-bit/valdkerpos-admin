import api from './api'
import { normalizeApiList } from '@/utils/apiData'
import { ENDPOINTS } from './endpoints'

export type WorkshopModuleKey =
  | 'vehicles'
  | 'mechanics'
  | 'work_orders'
  | 'service_history'
  | 'service_packages'
  | 'bookings'

export type WorkshopRecord = {
  id: number
  name: string
  code: string
  status: string
  description: string
  created_at: string
  updated_at: string
  raw: Record<string, any>
}

export type WorkshopPayload = {
  name: string
  code: string
  status: string
  description: string
}

const endpoints: Record<WorkshopModuleKey, string> = {
  vehicles: ENDPOINTS.VEHICLES,
  mechanics: ENDPOINTS.MECHANICS,
  work_orders: ENDPOINTS.WORK_ORDERS,
  service_history: ENDPOINTS.SERVICE_HISTORY,
  service_packages: ENDPOINTS.SERVICE_PACKAGES,
  bookings: ENDPOINTS.BOOKINGS,
}

export function getWorkshopEndpoint(moduleKey: WorkshopModuleKey) {
  return endpoints[moduleKey]
}

export function normalizeWorkshopRecord(item: any): WorkshopRecord {
  const name =
    item?.name ||
    item?.title ||
    item?.vehicle_number ||
    item?.plate_number ||
    item?.mechanic_name ||
    item?.customer_name ||
    item?.package_name ||
    `#${item?.id ?? ''}`

  return {
    id: Number(item?.id ?? 0),
    name: String(name || '-'),
    code: String(item?.code || item?.reference || item?.number || item?.plate_number || ''),
    status: String(item?.status || (item?.is_active === false ? 'inactive' : 'active')),
    description: String(item?.description || item?.notes || item?.note || item?.remarks || ''),
    created_at: String(item?.created_at || item?.createdAt || ''),
    updated_at: String(item?.updated_at || item?.updatedAt || ''),
    raw: item || {},
  }
}

export async function listWorkshopRecords(moduleKey: WorkshopModuleKey) {
  const { data } = await api.get(getWorkshopEndpoint(moduleKey))
  return normalizeApiList(data).map(normalizeWorkshopRecord)
}

export async function createWorkshopRecord(moduleKey: WorkshopModuleKey, payload: WorkshopPayload) {
  const { data } = await api.post(getWorkshopEndpoint(moduleKey), payload)
  return normalizeWorkshopRecord(data)
}

export async function updateWorkshopRecord(
  moduleKey: WorkshopModuleKey,
  id: number,
  payload: WorkshopPayload,
) {
  const { data } = await api.put(`${getWorkshopEndpoint(moduleKey)}${id}/`, payload)
  return normalizeWorkshopRecord(data)
}

export async function deleteWorkshopRecord(moduleKey: WorkshopModuleKey, id: number) {
  await api.delete(`${getWorkshopEndpoint(moduleKey)}${id}/`)
}
