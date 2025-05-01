declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    info: Record<string, any>;
    metadata: Record<string, any>;
    version: string;
  }

  function parse(
    dataBuffer: Buffer, 
    options?: {
      pagerender?: (pageData: any) => Promise<string>;
      max?: number;
    }
  ): Promise<PDFData>;

  export = parse;
} 