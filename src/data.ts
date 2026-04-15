export interface Alert {
  id: string
  carName: string
  carNumber: string
  description: string
  severity: 'critical' | 'warning' | 'info' | 'normal'
  timestamp: string
}

export interface ShockEvent {
  gForce: string
  time: string
}

export interface Message {
  text: string
  timeAgo: string
  carName: string
  location: string
}

export const alerts: Alert[] = [
  { id: '1', carName: 'Train Car 562', carNumber: '#19', description: 'Shock Alert Shock 4.2G', severity: 'critical', timestamp: '2 min ago' },
  { id: '2', carName: 'Train Car 562', carNumber: '#18', description: '2 days to failure 82% Co...', severity: 'warning', timestamp: '5 min ago' },
  { id: '3', carName: 'Train Car 789', carNumber: '#22', description: 'Impact Levels: Optimal', severity: 'normal', timestamp: '12 min ago' },
  { id: '4', carName: 'Train Car 789', carNumber: '#21', description: 'Ride Quality: Excellent', severity: 'info', timestamp: '18 min ago' },
  { id: '5', carName: 'Train Car 789', carNumber: '#19', description: 'System Check: All Clear', severity: 'normal', timestamp: '25 min ago' },
  { id: '6', carName: 'Train Car 789', carNumber: '#18', description: 'Status: Normal at 0.15G', severity: 'normal', timestamp: '32 min ago' },
  { id: '7', carName: 'Train Car 789', carNumber: '#17', description: 'System Check: All Clear', severity: 'normal', timestamp: '45 min ago' },
]

export const shockEvents: ShockEvent[] = [
  { gForce: '5.6G', time: '09:55 AM' },
  { gForce: '5.2G', time: '09:44 AM' },
  { gForce: '4.8G', time: '09:24 AM' },
  { gForce: '3.6G', time: '09:14 AM' },
  { gForce: '4.8G', time: '09:24 AM' },
  { gForce: '3.6G', time: '09:14 AM' },
  { gForce: '4.8G', time: '09:24 AM' },
]

export const messages: Message[] = [
  { text: 'Speed limit adjustment', timeAgo: '15 min. ago', carName: 'Train Car 7329', location: 'Near Richmond' },
  { text: 'Sensor calibration stop', timeAgo: '15 min. ago', carName: 'Train Car 7329', location: 'Near Richmond' },
]

export const selectedCar = {
  id: '56',
  daysToFailure: '24 Days',
  currentLocation: 'Near Newport News, VA',
  latestShockEvent: 'Today (11:42 AM)',
  latestShockDetail: '5.6G, Norfolk, VA',
}

export const filterOptions = {
  carType: ['All Cars', 'Boxcar', 'Tanker', 'Flatcar', 'Hopper', 'Gondola'],
  location: ['All Locations', 'Norfolk, VA', 'Richmond, VA', 'Newport News, VA'],
  severity: ['4G', '3G', '2G', '1G'],
  period: ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'All Time'],
}
