declare module 'downloadjs' {
    export default function download(data: Blob | File | string, strFileName?: string, strMimeType?: string): boolean;
}
