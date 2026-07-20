/** A single alert instance as returned by ZAP's core/view/alerts. */
export interface ZapAlert {
  alert?: string;
  name?: string;
  risk: string;
  confidence?: string;
  description?: string;
  url?: string;
  param?: string;
  evidence?: string;
  solution?: string;
  reference?: string;
  cweid?: string;
  method?: string;
}
