#!/usr/bin/env node

// Test script to verify proxy functionality
const https = require('https')
const http = require('http')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const proxyConfig = {
  host: process.env.PROXY_HOST,
  port: parseInt(process.env.PROXY_PORT || '3128'),
  auth: process.env.PROXY_USERNAME ? {
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD
  } : undefined
}

console.log('📋 Proxy Configuration:')
console.log(`   Host: ${proxyConfig.host}`)
console.log(`   Port: ${proxyConfig.port}`)
console.log(`   Auth: ${proxyConfig.auth ? '✅ Enabled' : '❌ Disabled'}`)
console.log('')

async function testProxyConnection() {
  console.log('🔍 Testing proxy connection...')
  console.log(`Proxy: ${proxyConfig.host}:${proxyConfig.port}`)
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'httpbin.org',
      port: 443,
      path: '/ip',
      method: 'GET',
      headers: {
        'User-Agent': 'MVLoader-Test/1.0'
      }
    }

    // Configure proxy if available
    if (proxyConfig.host) {
      const proxyOptions = {
        host: proxyConfig.host,
        port: proxyConfig.port,
        method: 'CONNECT',
        path: `${options.hostname}:${options.port}`,
        headers: {}
      }

      if (proxyConfig.auth) {
        const auth = Buffer.from(`${proxyConfig.auth.username}:${proxyConfig.auth.password}`).toString('base64')
        proxyOptions.headers['Proxy-Authorization'] = `Basic ${auth}`
      }

      const proxyReq = http.request(proxyOptions)
      
      proxyReq.on('connect', (proxyRes, socket) => {
        console.log('✅ Proxy connection established')
        
        const secureContext = require('tls').createSecureContext()
        const secureSocket = require('tls').connect({
          socket: socket,
          secureContext: secureContext,
          servername: options.hostname
        })

        const req = https.request({
          ...options,
          createConnection: () => secureSocket
        }, (res) => {
          let data = ''
          res.on('data', (chunk) => data += chunk)
          res.on('end', () => {
            try {
              const response = JSON.parse(data)
              console.log('🌍 External IP via proxy:', response.origin)
              console.log('✅ Proxy test successful!')
              resolve(response.origin)
            } catch (e) {
              reject(new Error(`Invalid JSON response: ${data}`))
            }
          })
        })

        req.on('error', reject)
        req.end()
      })

      proxyReq.on('error', (error) => {
        console.error('❌ Proxy connection failed:', error.message)
        reject(error)
      })

      proxyReq.end()
    } else {
      console.log('❌ No proxy configured')
      reject(new Error('No proxy configuration found'))
    }
  })
}

async function testDirectConnection() {
  console.log('🔍 Testing direct connection...')
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'httpbin.org',
      path: '/ip',
      method: 'GET',
      headers: {
        'User-Agent': 'MVLoader-Test/1.0'
      }
    }, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        try {
          const response = JSON.parse(data)
          console.log('🌍 Direct IP:', response.origin)
          resolve(response.origin)
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${data}`))
        }
      })
    })

    req.on('error', reject)
    req.end()
  })
}

async function main() {
  console.log('🚀 Starting proxy verification tests...\n')
  
  try {
    const directIP = await testDirectConnection()
    console.log('')
    
    const proxyIP = await testProxyConnection()
    console.log('')
    
    if (directIP !== proxyIP) {
      console.log('✅ SUCCESS: Proxy is working! IPs are different.')
      console.log(`Direct: ${directIP}`)
      console.log(`Proxy:  ${proxyIP}`)
    } else {
      console.log('⚠️  WARNING: Both requests show the same IP. Proxy might not be working properly.')
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

main()