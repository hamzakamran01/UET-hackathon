// ==================== USER TYPES ====================
export interface User {
  id: string
  email: string
  phone: string
  name?: string
  emailVerified: boolean
  phoneVerified: boolean
  isBlocked: boolean
  createdAt: string
  updatedAt: string
}

export interface UserStats {
  totalTokens: number
  completedTokens: number
  cancelledTokens: number
  noShows: number
  completionRate: number
}

// ==================== SERVICE TYPES ====================
export interface Service {
  id: string
  name: string
  description: string | null
  isActive: boolean
  maxDailyTokens: number
  maxConcurrentTokens: number
  geofenceRadius: number
  latitude: number
  longitude: number
  address: string | null
  presenceGraceTime: number
  counterReachTime: number
  estimatedServiceTime: number
  totalTokensIssued: number
  createdAt: string
  updatedAt: string
  _count?: {
    tokens: number
  }
}

export interface ServiceStats {
  totalTokens: number
  activeTokens: number
  completedToday: number
}

// ==================== TOKEN TYPES ====================
export enum TokenStatus {
  ACTIVE = 'ACTIVE',
  CALLED = 'CALLED',
  IN_SERVICE = 'IN_SERVICE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  EXPIRED = 'EXPIRED',
}

export interface Token {
  id: string
  tokenNumber: string
  status: TokenStatus
  queuePosition: number
  estimatedWaitTime: number | null
  userId: string
  serviceId: string
  user?: User
  service?: Service
  presenceChecks?: PresenceCheck[]
  createdAt: string
  updatedAt: string
  calledAt: string | null
  serviceStartedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  cancellationReason: string | null
  autoCancel: boolean
}

export interface QueueInfo {
  position: number | null
  ahead: number
  behind: number
  total: number
}

// ==================== PRESENCE TYPES ====================
export enum PresenceCheckType {
  INITIAL = 'INITIAL',
  SCHEDULED = 'SCHEDULED',
  ON_DEMAND = 'ON_DEMAND',
  NEAR_TURN = 'NEAR_TURN',
  AT_TURN = 'AT_TURN',
}

export interface PresenceCheck {
  id: string
  tokenId: string
  latitude: number
  longitude: number
  distanceMeters: number
  isWithinGeofence: boolean
  accuracy: number | null
  checkType: PresenceCheckType
  isCompliant: boolean
  checkedAt: string
}

export interface PresenceCheckResponse {
  distance: number
  isWithinGeofence: boolean
  required: number
  presenceCheck: PresenceCheck
}

// ==================== ABUSE TYPES ====================
export enum AbuseEventType {
  NO_SHOW = 'NO_SHOW',
  RAPID_CANCELLATION = 'RAPID_CANCELLATION',
  RATE_LIMIT_HIT = 'RATE_LIMIT_HIT',
  GEOFENCE_SPOOF = 'GEOFENCE_SPOOF',
  OTP_ABUSE = 'OTP_ABUSE',
  DUPLICATE_TOKEN = 'DUPLICATE_TOKEN',
  SUSPICIOUS_PATTERN = 'SUSPICIOUS_PATTERN',
  USER_BANNED = 'USER_BANNED',
  PRESENCE_VIOLATION = 'PRESENCE_VIOLATION',
  MULTIPLE_CANCELLATIONS = 'MULTIPLE_CANCELLATIONS',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export interface AbuseLog {
  id: string
  userId: string | null
  user?: User | null
  eventType: AbuseEventType
  severity: number // 1-10 scale
  description: string | null
  metadata: any
  actionTaken: string | null
  resolved: boolean
  resolvedAt: string | null
  createdAt: string
}

// ==================== NOTIFICATION TYPES ====================
export enum NotificationType {
  TOKEN_CREATED = 'TOKEN_CREATED',
  TOKEN_CALLED = 'TOKEN_CALLED',
  TOKEN_SERVED = 'TOKEN_SERVED',
  TOKEN_COMPLETED = 'TOKEN_COMPLETED',
  TOKEN_CANCELLED = 'TOKEN_CANCELLED',
  PRESENCE_CHECK = 'PRESENCE_CHECK',
  QUEUE_UPDATE = 'QUEUE_UPDATE',
  SYSTEM = 'SYSTEM',
  // legacy/other types for compatibility
  TOKEN_ISSUED = 'TOKEN_ISSUED',
  TURN_APPROACHING = 'TURN_APPROACHING',
  YOUR_TURN = 'YOUR_TURN',
  PRESENCE_REQUIRED = 'PRESENCE_REQUIRED',
  SERVICE_COMPLETED = 'SERVICE_COMPLETED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data: any
  metadata?: any
  isRead: boolean
  isSent: boolean
  sentAt: string | null
  readAt: string | null
  createdAt: string
}

// ==================== AUTH TYPES ====================
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse {
  user: User
  tokens: AuthTokens
}

// ==================== ADMIN TYPES ====================
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

export interface Admin {
  id: string
  email: string
  name: string
  role: AdminRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalUsers: number
  totalServices: number
  activeTokens: number
  totalTokensToday: number
}

// ==================== WEBSOCKET TYPES ====================
export interface SocketTokenUpdate {
  token: Token
  queueInfo: QueueInfo
}

export interface SocketQueueUpdate {
  serviceId: string
  totalActive: number
  queue: Array<{
    id: string
    tokenNumber: string
    queuePosition: number
    status: TokenStatus
    createdAt: string
  }>
  timestamp: string
}

export interface SocketYourTurn {
  tokenId: string
  tokenNumber: string
  message: string
}

// ==================== API RESPONSE TYPES ====================
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ==================== FORM TYPES ====================
export interface EmailVerificationForm {
  email: string
}

export interface EmailOtpForm {
  email: string
  code: string
}

export interface PhoneVerificationForm {
  phone: string
}

export interface PhoneOtpForm {
  phone: string
  code: string
}

export interface CreateTokenForm {
  serviceId: string
}

export interface CancelTokenForm {
  tokenId: string
  reason?: string
}

export interface CreateServiceForm {
  name: string
  description?: string
  maxDailyTokens: number
  maxConcurrentTokens: number
  geofenceRadius: number
  latitude: number
  longitude: number
  address?: string
  presenceGraceTime: number
  counterReachTime: number
  estimatedServiceTime: number
}

export interface UpdateServiceForm extends Partial<CreateServiceForm> { }

// ==================== GEOLOCATION TYPES ====================
export interface Coordinates {
  latitude: number
  longitude: number
  accuracy?: number
}

export interface GeolocationState {
  coordinates: Coordinates | null
  error: string | null
  loading: boolean
  permissionStatus: PermissionState | null
}

// ==================== UTILITY TYPES ====================
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface UseQueryState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}
