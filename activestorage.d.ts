declare module '@rails/activestorage' {

    export function start(): void;
    export class DirectUpload {
        constructor(file: File, url: string, delegate?: object);
        create(callback: (error: Error | null, blob: Blob) => void): void;
    }
}
