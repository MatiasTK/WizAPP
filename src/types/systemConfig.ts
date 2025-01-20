export interface systemConfig {
  method: string
  params: Record<string, unknown>
  result: {
    homeId: number
    roomId: number
    rgn: string
    moduleName: string
    fwVersion: string
    groupId: number
    ping: number
  }
}
