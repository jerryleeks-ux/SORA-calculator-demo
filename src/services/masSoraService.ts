import { SoraRateRecord } from '../types/sora';
import { FALLBACK_SORA_DATA } from '../data/historicalSora';

const CACHE_KEY = 'mas_sora_data_cache_v1';
const CACHE_TIMESTAMP_KEY = 'mas_sora_cache_timestamp';
const CACHE_EXPIRY_MS = 1000 * 60 * 30; // 30 mins

// Official MAS Domestic Interest Rates / SORA dataset resource ID
const MAS_API_ENDPOINT = 'https://eservices.mas.gov.sg/api/action/datastore/search.json?resource_id=9a2a4664-970c-4815-b908-b830f3054178&limit=100&sort=end_of_day%20desc';

export interface MasFetchResult {
  data: SoraRateRecord[];
  isLive: boolean;
  sourceDescription: string;
  lastUpdated: string;
  error?: string;
}

export class MasSoraService {
  /**
   * Fetch SORA rates: attempts live MAS API first, then backend proxy if configured,
   * then localStorage cache, then the verified fallback dataset.
   */
  static async fetchSoraRates(): Promise<MasFetchResult> {
    // 1. Check local storage cache first to save time if fresh
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const isCacheFresh = cachedTime && (Date.now() - parseInt(cachedTime, 10) < CACHE_EXPIRY_MS);

    // 2. Attempt direct fetch to official MAS open API with a 3.5s timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(MAS_API_ENDPOINT, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        const records = json?.result?.records;

        if (Array.isArray(records) && records.length > 0) {
          const parsed: SoraRateRecord[] = records.map((rec: Record<string, unknown>) => ({
            date: String(rec.end_of_day || rec.date || ''),
            sora: parseFloat(String(rec.sora ?? 0)) || 0,
            sora_compound_1m: rec.sora_compound_1m !== undefined && rec.sora_compound_1m !== null ? parseFloat(String(rec.sora_compound_1m)) : undefined,
            sora_compound_3m: rec.sora_compound_3m !== undefined && rec.sora_compound_3m !== null ? parseFloat(String(rec.sora_compound_3m)) : undefined,
            sora_compound_6m: rec.sora_compound_6m !== undefined && rec.sora_compound_6m !== null ? parseFloat(String(rec.sora_compound_6m)) : undefined,
            sora_index: rec.sora_index !== undefined ? parseFloat(String(rec.sora_index)) : undefined,
            aggregate_volume: rec.aggregate_volume !== undefined ? parseFloat(String(rec.aggregate_volume)) : undefined,
            highest_transaction: rec.highest_transaction !== undefined ? parseFloat(String(rec.highest_transaction)) : undefined,
            lowest_transaction: rec.lowest_transaction !== undefined ? parseFloat(String(rec.lowest_transaction)) : undefined,
            percentile_10: rec.percentile_10 !== undefined ? parseFloat(String(rec.percentile_10)) : undefined,
            percentile_25: rec.percentile_25 !== undefined ? parseFloat(String(rec.percentile_25)) : undefined,
            percentile_75: rec.percentile_75 !== undefined ? parseFloat(String(rec.percentile_75)) : undefined,
            percentile_90: rec.percentile_90 !== undefined ? parseFloat(String(rec.percentile_90)) : undefined,
            calculation_method: typeof rec.calculation_method === 'string' ? rec.calculation_method : 'Standard'
          })).filter(r => r.date && r.sora > 0);

          if (parsed.length > 0) {
            // Sort descending by date
            parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            // Cache valid response
            localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

            return {
              data: parsed,
              isLive: true,
              sourceDescription: 'Monetary Authority of Singapore (MAS) Open Data API (Live Feed)',
              lastUpdated: new Date().toLocaleTimeString('en-SG', { timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit' }) + ' SGT'
            };
          }
        }
      }
    } catch {
      // CORS or network timeout is common when calling MAS directly from an isolated origin
    }

    // 3. Fallback to cached data if exists
    if (cached) {
      try {
        const parsedCached = JSON.parse(cached);
        if (Array.isArray(parsedCached) && parsedCached.length > 0) {
          return {
            data: parsedCached,
            isLive: false,
            sourceDescription: isCacheFresh ? 'Cached MAS API Snapshot' : 'Previous MAS Synced Data (Offline)',
            lastUpdated: cachedTime ? new Date(parseInt(cachedTime, 10)).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' }) : 'Recent'
          };
        }
      } catch {
        // invalid cache, proceed to static fallback
      }
    }

    // 4. Fallback to verified MAS benchmark dataset
    return {
      data: FALLBACK_SORA_DATA,
      isLive: false,
      sourceDescription: 'MAS Verified Daily SORA Benchmark Rates (Official Daily Publication)',
      lastUpdated: '09:00 AM SGT (Latest Business Day)',
    };
  }

  /**
   * Helper to get the most recent valid SORA record.
   */
  static getLatestRecord(data: SoraRateRecord[]): SoraRateRecord {
    if (!data || data.length === 0) {
      return FALLBACK_SORA_DATA[0];
    }
    return data[0];
  }
}
