export type Company = {
  id: string; name: string; team: string; member: string; product: string;
  industry: string; phone: string; contactPerson: string; address: string;
  website: string; social: string; source: string; pitch: string;
  crm: boolean; contacted: boolean; notes: string; bookletSent: boolean;
  followUp: string; outcome: string; updatedAt: string;
  sourceRow?: number; extraFields?: Record<string, string>;
};
export type Resource = { name: string; url: string; category: string };
