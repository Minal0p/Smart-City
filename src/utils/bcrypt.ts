// Simple bcrypt implementation for Cloudflare Workers
export const bcrypt = {
  async hash(password: string, rounds: number = 10): Promise<string> {
    // In production, use a proper bcrypt implementation
    // This is a simplified version for demonstration
    const encoder = new TextEncoder()
    const data = encoder.encode(password + 'smart-city-salt')
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  },

  async compare(password: string, hash: string): Promise<boolean> {
    const hashedPassword = await this.hash(password)
    return hashedPassword === hash
  }
}