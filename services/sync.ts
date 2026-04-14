
// Fix for: Error in file services/sync.ts on line 1: Module '"./api.ts"' has no exported member 'fetchDrugBatch'.
import { fetchDrugBatchFromAPI as fetchDrugBatch } from './api.ts';
import { Drug, SyncMetadata, SyncStatus } from '../types.ts';

const METADATA_KEY = 'dwa_sync_metadata';

/**
 * Manages background drug synchronization logic.
 * Isolated from the React render cycle.
 */
class SyncManager {
  private isRunning = false;
  private metadata: SyncMetadata = {
    status: 'idle',
    lastOffset: 0,
    totalFetched: 0,
    lastUpdate: null
  };
  
  private onUpdateCallback: ((meta: SyncMetadata, drugs: Drug[]) => void) | null = null;

  constructor() {
    this.loadMetadata();
  }

  private loadMetadata() {
    const saved = localStorage.getItem(METADATA_KEY);
    if (saved) {
      try {
        this.metadata = JSON.parse(saved);
        // We reset status to idle on load to ensure user explicitly starts it
        this.metadata.status = 'idle'; 
      } catch (e) {
        console.error("Sync metadata corrupted", e);
      }
    }
  }

  private saveMetadata() {
    localStorage.setItem(METADATA_KEY, JSON.stringify(this.metadata));
  }

  public getMetadata(): SyncMetadata {
    return { ...this.metadata };
  }

  public setUpdateCallback(cb: (meta: SyncMetadata, drugs: Drug[]) => void) {
    this.onUpdateCallback = cb;
  }

  public async startSync() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.metadata.status = 'running';
    this.saveMetadata();
    this.process();
  }

  public pauseSync() {
    this.isRunning = false;
    this.metadata.status = 'paused';
    this.saveMetadata();
    if (this.onUpdateCallback) this.onUpdateCallback(this.metadata, []);
  }

  private async process() {
    while (this.isRunning) {
      try {
        const batch = await fetchDrugBatch(this.metadata.lastOffset);
        
        if (!this.isRunning) break;

        if (batch && batch.length > 0) {
          this.metadata.lastOffset += 100;
          this.metadata.totalFetched += batch.length;
          this.metadata.lastUpdate = new Date().toISOString();
          
          if (this.onUpdateCallback) {
            this.onUpdateCallback(this.metadata, batch);
          }
          
          this.saveMetadata();
          
          // Small delay to prevent network/CPU saturation
          await new Promise(resolve => setTimeout(resolve, 400));
        } else {
          // No more data or error
          this.isRunning = false;
          this.metadata.status = batch ? 'complete' : 'error';
          this.saveMetadata();
          if (this.onUpdateCallback) this.onUpdateCallback(this.metadata, []);
          break;
        }
      } catch (e) {
        console.error("Sync batch failed", e);
        this.isRunning = false;
        this.metadata.status = 'error';
        this.saveMetadata();
        if (this.onUpdateCallback) this.onUpdateCallback(this.metadata, []);
        break;
      }
    }
  }
}

export const syncManager = new SyncManager();
