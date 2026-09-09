export type Contact = {
  id: number;
  name: string;
  company: string;
  designation: string;
  industry: string | null;
  requirement: string | null;
  is_priority: boolean;
  remarks: string | null;
};
