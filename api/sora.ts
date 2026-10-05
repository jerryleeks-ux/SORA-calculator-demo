/**
 * Serverless API handler for fetching MAS Domestic Interest Rates (Daily SORA & Compounded Averages).
 *
 * Endpoint:
 * https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
 *
 * Required Header:
 * KeyId: <MAS_KEY_ID>
 */

const MAS_SORA_ENDPOINT =
  'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily';

export interface SoraRecordNormalized {
  date: string;
  sora: number;
  sora_compound_1m?: number;
  sora_compound_3m?: number;
  sora_compound_6m?: number;
  sora_index?: number;
  aggregate_volume?: number;
  highest_transaction?: number;
  lowest_transaction?: number;
  percentile_10?: number;
  percentile_25?: number;
  percentile_75?: number;
  percentile_90?: number;
  calculation_method?: string;
  raw?: Record<string, unknown>;
}

export interface SoraApiResponse {
  success: boolean;
  count: number;
  source: string;
  masEndpoint: string;
  timestamp: string;
  records: SoraRecordNormalized[];
  raw?: any;
  error?: string;
  message?: string;
}

/**
 * Universal JSON response sender supporting Express, Node http.ServerResponse, and Web Response
 */
function sendJsonResponse(res: any, statusCode: number, payload: any) {
  if (res && res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, KeyId');
    res.setHeader('Content-Type', 'application/json');
  }

  if (res && typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(payload);
  }

  if (res && typeof res.writeHead === 'function' && typeof res.end === 'function') {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify(payload));
  }

  if (res && typeof res.end === 'function') {
    res.statusCode = statusCode;
    return res.end(JSON.stringify(payload));
  }

  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Fetch data from MAS API Gateway with KeyId header
 */
async function fetchFromMasGateway(
  masKeyId: string,
  queryParams: Record<string, string>
): Promise<{ ok: boolean; status: number; data: any; errorText?: string }> {
  const url = new URL(MAS_SORA_ENDPOINT);

  // Attach search parameters (e.g. limit, sort, start_date)
  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  // Ensure reasonable default limit if not specified
  if (!url.searchParams.has('rows') && !url.searchParams.has('limit')) {
    url.searchParams.set('rows', '90');
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'KeyId': masKeyId,
      'Accept': 'application/json',
      'User-Agent': 'Singapore-SORA-Calculator/1.0'
    }
  });

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    return {
      ok: response.ok,
      status: response.status,
      data
    };
  }

  const text = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    data: null,
    errorText: text
  };
}

/**
 * Normalize heterogeneous MAS payload schemas into clean numeric SORA records
 */
function normalizeMasRecords(masData: any): SoraRecordNormalized[] {
  let list: any[] = [];

  if (Array.isArray(masData)) {
    list = masData;
  } else if (Array.isArray(masData?.data)) {
    list = masData.data;
  } else if (Array.isArray(masData?.result?.records)) {
    list = masData.result.records;
  } else if (Array.isArray(masData?.results)) {
    list = masData.results;
  } else if (Array.isArray(masData?.records)) {
    list = masData.records;
  }

  const parsed: SoraRecordNormalized[] = list.map((item: Record<string, unknown>) => {
    const date = String(item.end_of_day || item.date || item.publication_date || '');
    const soraVal = parseFloat(String(item.sora ?? 0)) || 0;

    return {
      date,
      sora: soraVal,
      sora_compound_1m: item.sora_compound_1m !== undefined && item.sora_compound_1m !== null
        ? parseFloat(String(item.sora_compound_1m))
        : undefined,
      sora_compound_3m: item.sora_compound_3m !== undefined && item.sora_compound_3m !== null
        ? parseFloat(String(item.sora_compound_3m))
        : undefined,
      sora_compound_6m: item.sora_compound_6m !== undefined && item.sora_compound_6m !== null
        ? parseFloat(String(item.sora_compound_6m))
        : undefined,
      sora_index: item.sora_index !== undefined && item.sora_index !== null
        ? parseFloat(String(item.sora_index))
        : undefined,
      aggregate_volume: item.aggregate_volume !== undefined && item.aggregate_volume !== null
        ? parseFloat(String(item.aggregate_volume))
        : undefined,
      highest_transaction: item.highest_transaction !== undefined
        ? parseFloat(String(item.highest_transaction))
        : undefined,
      lowest_transaction: item.lowest_transaction !== undefined
        ? parseFloat(String(item.lowest_transaction))
        : undefined,
      percentile_10: item.percentile_10 !== undefined ? parseFloat(String(item.percentile_10)) : undefined,
      percentile_25: item.percentile_25 !== undefined ? parseFloat(String(item.percentile_25)) : undefined,
      percentile_75: item.percentile_75 !== undefined ? parseFloat(String(item.percentile_75)) : undefined,
      percentile_90: item.percentile_90 !== undefined ? parseFloat(String(item.percentile_90)) : undefined,
      calculation_method: typeof item.calculation_method === 'string' ? item.calculation_method : 'Standard',
      raw: item
    };
  }).filter(r => Boolean(r.date));

  // Sort descending by date (most recent fixing first)
  parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return parsed;
}

/**
 * Standard Node.js Serverless Handler (Vercel, Express, Netlify, AWS Lambda)
 */
export default async function handler(req: any, res: any) {
  // Handle Preflight
  if (req.method === 'OPTIONS') {
    if (res && res.writeHead && res.end) {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, KeyId'
      });
      return res.end();
    }
    if (res && typeof res.status === 'function') {
      return res.status(204).end();
    }
    return new Response(null, { status: 204 });
  }

  if (req.method !== 'GET') {
    return sendJsonResponse(res, 405, {
      success: false,
      error: 'Method Not Allowed. Use GET.'
    });
  }

  // Retrieve KeyId from environment variable (or optional request header)
  const masKeyId =
    process.env.MAS_KEY_ID ||
    process.env.MAS_API_KEY ||
    req.headers?.['keyid'] ||
    req.headers?.['key-id'] ||
    req.headers?.['x-mas-key-id'] ||
    '';

  if (!masKeyId) {
    const errorPayload: SoraApiResponse = {
      success: false,
      count: 0,
      source: 'Monetary Authority of Singapore (MAS) Gateway',
      masEndpoint: MAS_SORA_ENDPOINT,
      timestamp: new Date().toISOString(),
      records: [],
      error: 'MAS_KEY_ID environment variable is not configured.',
      message:
        'Please set MAS_KEY_ID in your environment variables (.env file). All requests to the MAS API Gateway require the "KeyId" header.'
    };

    return sendJsonResponse(res, 401, errorPayload);
  }

  try {
    // Extract query parameters
    const queryParams: Record<string, string> = {};
    if (req.query && typeof req.query === 'object') {
      for (const [k, v] of Object.entries(req.query)) {
        if (typeof v === 'string') queryParams[k] = v;
      }
    } else if (req.url && req.url.includes('?')) {
      const parsedUrl = new URL(req.url, 'http://localhost');
      parsedUrl.searchParams.forEach((val, key) => {
        queryParams[key] = val;
      });
    }

    const masResult = await fetchFromMasGateway(masKeyId, queryParams);

    if (!masResult.ok) {
      const errorPayload: SoraApiResponse = {
        success: false,
        count: 0,
        source: 'Monetary Authority of Singapore (MAS) Gateway',
        masEndpoint: MAS_SORA_ENDPOINT,
        timestamp: new Date().toISOString(),
        records: [],
        error: `MAS Gateway responded with HTTP status ${masResult.status}`,
        message: masResult.errorText || 'Failed to authenticate with MAS Gateway. Verify that your MAS_KEY_ID is valid and active.'
      };

      return sendJsonResponse(res, masResult.status, errorPayload);
    }

    const normalizedRecords = normalizeMasRecords(masResult.data);

    const successPayload: SoraApiResponse = {
      success: true,
      count: normalizedRecords.length,
      source: 'Monetary Authority of Singapore (MAS) Gateway (Live)',
      masEndpoint: MAS_SORA_ENDPOINT,
      timestamp: new Date().toISOString(),
      records: normalizedRecords,
      raw: masResult.data
    };

    return sendJsonResponse(res, 200, successPayload);
  } catch (err: any) {
    const errorPayload: SoraApiResponse = {
      success: false,
      count: 0,
      source: 'Monetary Authority of Singapore (MAS) Gateway',
      masEndpoint: MAS_SORA_ENDPOINT,
      timestamp: new Date().toISOString(),
      records: [],
      error: err?.message || 'Internal error while connecting to MAS Gateway.'
    };

    return sendJsonResponse(res, 500, errorPayload);
  }
}

/**
 * Web Standard Request/Response Handler (Next.js / Cloudflare / Edge)
 */
export async function GET(request: Request) {
  const masKeyId =
    process.env.MAS_KEY_ID ||
    process.env.MAS_API_KEY ||
    request.headers.get('keyid') ||
    request.headers.get('key-id') ||
    request.headers.get('x-mas-key-id') ||
    '';

  if (!masKeyId) {
    const errorPayload: SoraApiResponse = {
      success: false,
      count: 0,
      source: 'Monetary Authority of Singapore (MAS) Gateway',
      masEndpoint: MAS_SORA_ENDPOINT,
      timestamp: new Date().toISOString(),
      records: [],
      error: 'MAS_KEY_ID environment variable is not configured.',
      message:
        'Please set MAS_KEY_ID in your environment variables. All requests to the MAS API Gateway require the "KeyId" header.'
    };

    return new Response(JSON.stringify(errorPayload), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const url = new URL(request.url);
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((v, k) => {
      queryParams[k] = v;
    });

    const masResult = await fetchFromMasGateway(masKeyId, queryParams);

    if (!masResult.ok) {
      const errorPayload: SoraApiResponse = {
        success: false,
        count: 0,
        source: 'Monetary Authority of Singapore (MAS) Gateway',
        masEndpoint: MAS_SORA_ENDPOINT,
        timestamp: new Date().toISOString(),
        records: [],
        error: `MAS Gateway responded with HTTP status ${masResult.status}`,
        message: masResult.errorText || 'Authentication failed. Please verify your MAS_KEY_ID.'
      };

      return new Response(JSON.stringify(errorPayload), {
        status: masResult.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const normalizedRecords = normalizeMasRecords(masResult.data);

    const successPayload: SoraApiResponse = {
      success: true,
      count: normalizedRecords.length,
      source: 'Monetary Authority of Singapore (MAS) Gateway (Live)',
      masEndpoint: MAS_SORA_ENDPOINT,
      timestamp: new Date().toISOString(),
      records: normalizedRecords,
      raw: masResult.data
    };

    return new Response(JSON.stringify(successPayload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: any) {
    const errorPayload: SoraApiResponse = {
      success: false,
      count: 0,
      source: 'Monetary Authority of Singapore (MAS) Gateway',
      masEndpoint: MAS_SORA_ENDPOINT,
      timestamp: new Date().toISOString(),
      records: [],
      error: err?.message || 'Error connecting to MAS Gateway.'
    };

    return new Response(JSON.stringify(errorPayload), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
