export type CmsFieldType = 'text' | 'long_text' | 'number' | 'currency' | 'boolean' | 'date' | 'email' | 'phone' | 'url' | 'image' | 'file' | 'select' | 'multi_select' | 'json';
export type CmsField = { key: string; label: string; type: CmsFieldType; required: boolean; options: string[] };
export type CmsCollection = { id: string; project_id: string; name: string; slug: string; fields: CmsField[]; created_at: string; updated_at: string };
export type CmsEntry = { id: string; project_id: string; collection_id: string; data: Record<string, unknown>; status: 'draft' | 'published'; created_at: string; updated_at: string };
