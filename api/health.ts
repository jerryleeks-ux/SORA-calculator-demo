/**
 * Health check serverless endpoint.
 * Verifies serverless runtime health and whether MAS_KEY_ID is configured in environment.
 */

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: {
    masKeyConfigured: boolean;
    nodeEnv: string;
  };
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, KeyId');
    res.setHeader('Content-Type', 'application/json');
  }

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    if (res.status) {
      return res.status(204).end();
    }
    return new Response(null, { status: 204 });
  }

  const masKeyConfigured = Boolean(process.env.MAS_KEY_ID || process.env.MAS_API_KEY);

  const payload: HealthResponse = {
    status: 'ok',
    service: 'Singapore SORA MAS Serverless Gateway',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    environment: {
      masKeyConfigured,
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  };

  if (res.status && typeof res.json === 'function') {
    return res.status(200).json(payload);
  } else if (res.writeHead && res.end) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(payload));
  }

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Support Web Standard Request/Response (Edge / Next.js)
export async function GET() {
  const masKeyConfigured = Boolean(process.env.MAS_KEY_ID || process.env.MAS_API_KEY);
  const payload: HealthResponse = {
    status: 'ok',
    service: 'Singapore SORA MAS Serverless Gateway',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    environment: {
      masKeyConfigured,
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
