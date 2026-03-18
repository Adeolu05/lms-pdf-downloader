import { EventEmitter } from 'events';

/**
 * Global Event Hub for streaming downloader events to the UI.
 * This allows the API route and the Downloader engine to communicate.
 */
class DownloaderEvents extends EventEmitter {
    private constructor() {
        super();
        this.setMaxListeners(100);
    }

    public static getInstance(): DownloaderEvents {
        if (!global.downloaderEventsInstance) {
            global.downloaderEventsInstance = new DownloaderEvents();
        }
        return global.downloaderEventsInstance;
    }

    /**
     * Helper to emit structured events
     */
    emitEvent(courseId: string, type: string, data: any) {
        this.emit('event', {
            courseId,
            type,
            data,
            timestamp: new Date().toISOString()
        });
    }
}

// Ensure TypeScript knows about this global property
declare global {
    var downloaderEventsInstance: DownloaderEvents | undefined;
}

export const downloaderEvents = DownloaderEvents.getInstance();
