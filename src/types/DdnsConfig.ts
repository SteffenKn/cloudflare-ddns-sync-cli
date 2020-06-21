import {Record} from 'cloudflare-ddns-sync';

export type DdnsConfig = {
  auth: {
    email: string,
    key: string,
  },
  domain: string,
  records: Array<Record>,
};
