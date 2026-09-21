import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import {
  getListContactsQueryKey,
  useCreateContact,
} from '@/api/contacts/contacts';
import type { ContactResponseDto, CreateContactDto } from '@/api/model';
import { getApiErrorMessage } from '@/lib/apiError';
import { findContactByIco } from '@/lib/contactMatch';

const trimOrUndefined = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/** Drops empty optional fields so the API does not validate blank strings. */
const cleanContact = (contact: CreateContactDto): CreateContactDto => ({
  name: contact.name.trim(),
  country: contact.country.trim(),
  ico: trimOrUndefined(contact.ico),
  dic: trimOrUndefined(contact.dic),
  street: trimOrUndefined(contact.street),
  city: trimOrUndefined(contact.city),
  psc: trimOrUndefined(contact.psc),
  email: trimOrUndefined(contact.email),
  phone: trimOrUndefined(contact.phone),
  description: trimOrUndefined(contact.description),
});

/**
 * Turns the invoice form's contact choice into a contactId: an existing
 * contact is used as is, a pending one (ARES / typed by hand) is created
 * first — unless a contact with the same IČO already exists, which is then
 * reused, since the backend keeps IČO unique per company. Resolves to
 * undefined when creating the contact failed — the error is already reported,
 * so the caller should just stop.
 */
export const useResolveContactId = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { mutateAsync: createContact, isPending: isCreatingContact } =
    useCreateContact();

  const resolveContactId = async (
    contactId: string | undefined,
    pendingContact: CreateContactDto | null | undefined,
    contacts: ContactResponseDto[],
  ): Promise<string | undefined> => {
    if (contactId || !pendingContact) return contactId;
    const existing = findContactByIco(contacts, pendingContact.ico);
    if (existing) return existing.id;
    try {
      const created = await createContact({
        data: cleanContact(pendingContact),
      });
      await queryClient.invalidateQueries({
        queryKey: getListContactsQueryKey(),
      });
      return created.data.id;
    } catch (error) {
      enqueueSnackbar(
        getApiErrorMessage(error, t, 'contacts.messages.createFailed'),
        { variant: 'error' },
      );
      return undefined;
    }
  };

  return { resolveContactId, isCreatingContact };
};
