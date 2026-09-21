import { throwAsDataError } from '../../errors';
import type { DataSource } from '../types';
import { client } from './shared';

/** Signing out, and deleting the account for good. */

export const accountSource: DataSource['account'] = {
  /**
   * Calls the `delete-account` edge function.
   *
   * Not three writes from here: anonymising, purging storage and closing the
   * login have to happen together, and only the last needs a key the app
   * must never hold. The function reads who is asking from the token — it
   * takes no id.
   */
  delete: async (): Promise<void> => {
    const db = client();
    const { error } = await db.functions.invoke('delete-account', { method: 'POST' });
    if (error) throwAsDataError(error);
  },
};
