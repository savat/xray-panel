const call = async (method: string, path: string, body?: any) => {
  const res = await fetch(`/api/proxy${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  return data
}

const get  = (path: string)             => call('GET',  path)
const post = (path: string, body?: any) => call('POST', path, body)

export const login  = (username: string, password: string) => post('/login', { username, password })
export const logout = () => post('/logout')

export const getStatus      = () => get('/panel/api/server/status')
export const getXrayInfo    = () => get('/panel/api/xray/info')
export const getXrayConfig  = () => get('/panel/api/xray/json')

export const getInbounds    = () => get('/panel/api/inbounds/list')
export const getInbound     = (id: number) => get(`/panel/api/inbounds/get/${id}`)
export const addInbound     = (data: any) => post('/panel/api/inbounds/add', data)
export const updateInbound  = (id: number, data: any) => post(`/panel/api/inbounds/update/${id}`, data)
export const deleteInbound  = (id: number) => post(`/panel/api/inbounds/del/${id}`)
export const resetTraffic   = (id: number) => post(`/panel/api/inbounds/resetAllTraffics/${id}`)
export const toggleInbound  = (id: number, enable: boolean) => post(`/panel/api/inbounds/update/${id}`, { enable })

export const addClient = (inboundId: number, data: any) =>
  post('/panel/api/inbounds/addClient', { id: inboundId, settings: JSON.stringify({ clients: [data] }) })
export const updateClient = (inboundId: number, clientId: string, data: any) =>
  post(`/panel/api/inbounds/updateClient/${clientId}`, { id: inboundId, settings: JSON.stringify({ clients: [data] }) })
export const deleteClient = (inboundId: number, clientId: string) =>
  post(`/panel/api/inbounds/delClient/${clientId}`, { id: inboundId })
export const resetClientTraffic = (inboundId: number, email: string) =>
  post(`/panel/api/inbounds/resetClientTraffic/${inboundId}/${email}`)
export const getClientTraffic = (email: string) =>
  get(`/panel/api/inbounds/getClientTraffics/${email}`)
export const getOnlineClients = () => post('/panel/api/inbounds/onlines')

export const restartXray = () => post('/panel/api/server/restartXrayService')
export const stopXray    = () => post('/panel/api/server/stopXrayService')
export const startXray   = () => post('/panel/api/server/startXrayService')

export const getSettings    = () => get('/panel/api/setting/all')
export const updateSettings = (data: any) => post('/panel/api/setting/update', data)
export const changePass     = (oldPwd: string, newPwd: string) =>
  post('/panel/api/setting/updateUser', { oldPwd, newPwd })
export const getBackup      = () => get('/panel/api/setting/getBackup')

// ── Subscription ──────────────────────────────────────────────
// sub URL ดึงจาก setting (subURI) + client subId
export const getSubInfo = (subId: string) =>
  get(`/sub/${subId}`)

// ── Telegram Bot (อยู่ใน settings) ───────────────────────────
// enable/disable + token + adminId อยู่ใน getSettings() แล้ว
// updateSettings() ครอบคลุมอยู่แล้ว
