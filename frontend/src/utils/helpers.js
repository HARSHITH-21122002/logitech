export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export const formatCurrency = (amount) => {
  return `₹${amount}`
}

export const generateTransactionId = () => {
  return `VM${Date.now().toString().slice(-6)}`
}

export const getRowColumnFromMotor = (motorId) => {
  const row = Math.ceil(motorId / 10)
  const col = motorId % 10 || 10
  return { row, col }
}

export const simulateDelay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const generateMockMotors = (products) => {
  const mockMotors = []
  for (let i = 1; i <= 60; i++) {
    const isActive = Math.random() > 0.7
    if (isActive) {
      mockMotors.push({
        id: i,
        isActive: true,
        itemCount: Math.floor(Math.random() * 10),
        productName: products[Math.floor(Math.random() * products.length)].name,
      })
    }
  }
  return mockMotors
}
