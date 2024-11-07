// src/lib/medusa.js
import Medusa from "@medusajs/medusa-js"

// Ensure we have a BACKEND_URL
const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

// Create and configure the Medusa client
const medusaClient = new Medusa({
  baseUrl: BACKEND_URL,
  maxRetries: 3,
  apiKey: process.env.NEXT_PUBLIC_MEDUSA_API_KEY // optional
})

export default medusaClient