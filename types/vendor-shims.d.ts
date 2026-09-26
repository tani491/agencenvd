declare module "@aws-sdk/client-s3" {
  export class S3Client {
    constructor(config?: any);
  }

  export class PutObjectCommand {
    constructor(input: any);
  }
}

declare module "@aws-sdk/s3-request-presigner" {
  export function getSignedUrl(
    client: any,
    command: any,
    options?: { expiresIn?: number }
  ): Promise<string>;
}

declare module "@hookform/resolvers/zod" {
  export function zodResolver(schema: any, schemaOptions?: any, resolverOptions?: any): any;
}

declare module "framer-motion" {
  export const motion: any;
}

declare module "react-hook-form" {
  export function useForm<TFieldValues = any>(options?: any): any;
}

declare module "@tanstack/react-table" {
  export type ColumnDef<TData = any> = any;

  export function flexRender(component: any, props: any): any;

  export function getCoreRowModel(): any;

  export function useReactTable<TData = any>(options: {
    data: TData[];
    columns: ColumnDef<TData>[];
    getCoreRowModel: any;
  }): any;
}
