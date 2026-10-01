declare module 'starkbank' {
  export class Organization {
    constructor(params: {
      id: string;
      privateKey: string;
      environment: string;
      workspaceId?: string | null;
    });
    static replace(organization: Organization, workspaceId: string): Organization;
  }

  export interface Workspace {
    id: string;
    username: string;
    name: string;
    status: string;
  }

  export interface Balance {
    amount: number;
    currency: string;
  }

  export interface LedgerTransaction {
    id: string;
    amount: number;
    description: string;
    created: string;
    source: string;
    tags: string[];
  }

  export interface Transfer {
    id: string;
    amount: number;
    name: string;
    taxId: string;
    bankCode: string;
    branchCode: string;
    accountNumber: string;
    accountType: string;
    status: string;
    tags: string[];
  }

  export interface DictKey {
    id: string;
    type: string;
    name?: string;
    taxId?: string;
    ownerType?: string;
    bankName?: string;
    ispb?: string;
    branchCode?: string;
    accountNumber?: string;
    accountType?: string;
    status?: string;
  }

  export interface SplitReceiver {
    id: string;
    name: string;
    taxId: string;
    bankCode: string;
    branchCode: string;
    accountNumber: string;
    accountType: string;
  }

  export interface EventLog {
    type?: string;
    transfer?: Transfer;
    deposit?: { id: string; amount: number; created?: string; tags?: string[]; description?: string };
    invoice?: { id: string; amount: number; created?: string; tags?: string[]; descriptions?: Array<{ text: string }> };
    transaction?: LedgerTransaction;
  }

  export interface Event {
    id: string;
    subscription: string;
    workspaceId?: string;
    log?: EventLog;
  }

  export const workspace: {
    create(
      data: { username: string; name: string; allowedTaxIds?: string[] },
      options?: { user?: Organization },
    ): Promise<Workspace>;
    get(id: string, options?: { user?: Organization }): Promise<Workspace>;
    query(
      params?: { limit?: number; username?: string },
      options?: { user?: Organization },
    ): AsyncIterable<Workspace>;
  };

  export const balance: {
    get(options?: { user?: Organization }): Promise<Balance>;
  };

  export const transaction: {
    query(
      params?: { limit?: number; after?: string; before?: string; tags?: string[] },
      options?: { user?: Organization },
    ): AsyncIterable<LedgerTransaction>;
  };

  export const transfer: {
    create(
      transfers: Array<{
        amount: number;
        name: string;
        taxId: string;
        bankCode: string;
        branchCode: string;
        accountNumber: string;
        accountType: string;
        externalId?: string;
        description?: string;
        tags?: string[];
      }>,
      options?: { user?: Organization },
    ): Promise<Transfer[]>;
  };

  export const dictKey: {
    get(id: string, options?: { user?: Organization }): Promise<DictKey>;
    query(params?: { limit?: number; type?: string }, options?: { user?: Organization }): AsyncIterable<DictKey>;
    create?: (data: { type: string }, options?: { user?: Organization }) => Promise<DictKey>;
  };

  export const splitReceiver: {
    create(
      receivers: Array<{
        name: string;
        taxId: string;
        bankCode: string;
        branchCode: string;
        accountNumber: string;
        accountType: string;
        tags?: string[];
      }>,
      options?: { user?: Organization },
    ): Promise<SplitReceiver[]>;
  };

  export const event: {
    parse(params: { content: string; signature: string }): Event;
  };

  const starkbank: {
    Organization: typeof Organization;
    workspace: typeof workspace;
    balance: typeof balance;
    transaction: typeof transaction;
    transfer: typeof transfer;
    dictKey: typeof dictKey;
    splitReceiver: typeof splitReceiver;
    event: typeof event;
  };

  export default starkbank;
}
