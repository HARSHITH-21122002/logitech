export const ROUTES = {
  ANALYZING: '/analyzing',
  HOME: '/home',
  ORDER: '/order',
  PAYMENT: '/payment',
  PAYING: '/paying',
  BILL: '/bill',
  OPERATOR: '/operator',
  REFILL: '/refill',
  SPIRAL_SETTING: '/spiral-setting',
  MOTOR_TESTING: '/motor-testing',
  REPORT: '/report',
}

export const MOTOR_COUNT = 60

export const MOCK_PRODUCTS = [
  { id: 1, name: "Coca Cola", price: 25, image: "./images/lays.png" },
  { id: 2, name: "Pepsi", price: 25, image: "/placeholder.svg?height=100&width=100" },
  { id: 3, name: "Water Bottle", price: 15, image: "/placeholder.svg?height=100&width=100" },
  { id: 4, name: "Chips", price: 30, image: "/placeholder.svg?height=100&width=100" },
  { id: 5, name: "Chocolate", price: 40, image: "/placeholder.svg?height=100&width=100" },
  { id: 6, name: "Biscuits", price: 20, image: "/placeholder.svg?height=100&width=100" },
  { id: 7, name: "Energy Drink", price: 50, image: "/placeholder.svg?height=100&width=100" },
  { id: 8, name: "Juice", price: 35, image: "/placeholder.svg?height=100&width=100" },
]

export const INITIALIZATION_STEPS = [
  { name: "Modbus Connection", message: "Modbus Connection Successful",failureMessage: "Modbus connection error.",Status:false},
  { name: "Internet Connection", message: "Internet Connected",failureMessage: "Unable to connect to internet." ,Status:false},
  { name: "Sensor Reading", message: "Sensor Reading",failureMessage: "Sensor calibration error." ,Status:false}
]
  