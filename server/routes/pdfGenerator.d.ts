declare module '../../certificate-system/backend/src/utils/pdfGenerator' {
  export function renderTemplate(templatePath: string, data: any): Promise<string>;
  export function htmlToPdfBuffer(html: string): Promise<Buffer>;
  export function getBase64Logo(logoPath: string): string;
}
