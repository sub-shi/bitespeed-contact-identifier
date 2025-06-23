import prisma from '../prisma/client';
import { Contact } from '@prisma/client';
import redisClient from '../redis';

interface ContactResponse {
  primaryContatctId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

export const identifyContact = async (
  email?: string,
  phoneNumber?: string
): Promise<ContactResponse> => {
  // 🔍 1. Try Redis cache first
  const cacheKey = `contact:${email || ''}:${phoneNumber || ''}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 🔎 2. Find all matching contacts by email or phoneNumber
  const matchingContacts: Contact[] = await prisma.contact.findMany({
    where: {
      OR: [
        email ? { email } : undefined,
        phoneNumber ? { phoneNumber } : undefined,
      ].filter(Boolean) as any,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // ➕ 3. If no matches, create a new primary contact
  if (matchingContacts.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: 'primary',
        linkedId: null,
        deletedAt: null,
      },
    });

    const response: ContactResponse = {
      primaryContatctId: newContact.id,
      emails: email ? [email] : [],
      phoneNumbers: phoneNumber ? [phoneNumber] : [],
      secondaryContactIds: [],
    };

    await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 });
    return response;
  }

  // 👑 4. Determine the true primary contact
  const primaryContact: Contact =
    matchingContacts.find((c) => c.linkPrecedence === 'primary') || matchingContacts[0];

  // 🔗 5. Fetch all contacts linked to the primary
  const allLinkedContacts: Contact[] = await prisma.contact.findMany({
    where: {
      OR: [
        { id: primaryContact.id },
        { linkedId: primaryContact.id },
        {
          id: {
            in: matchingContacts
              .map((c) => c.linkedId)
              .filter((id): id is number => id !== null),
          },
        },
      ],
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const emailsSet = new Set<string>();
  const phonesSet = new Set<string>();
  const secondaryIds: number[] = [];

  allLinkedContacts.forEach((c: Contact) => {
    if (c.email) emailsSet.add(c.email);
    if (c.phoneNumber) phonesSet.add(c.phoneNumber);
    if (c.id !== primaryContact.id) {
      secondaryIds.push(c.id);
    }
  });

  // 🧠 6. If request has new info, add it as a secondary contact
  const hasEmail = email ? emailsSet.has(email) : false;
  const hasPhone = phoneNumber ? phonesSet.has(phoneNumber) : false;

  if (!hasEmail || !hasPhone) {
    const newSecondary = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: 'secondary',
        linkedId: primaryContact.id,
        deletedAt: null,
      },
    });

    if (newSecondary.email) emailsSet.add(newSecondary.email);
    if (newSecondary.phoneNumber) phonesSet.add(newSecondary.phoneNumber);
    secondaryIds.push(newSecondary.id);
  }

  // 🧾 7. Prepare response
  const response: ContactResponse = {
    primaryContatctId: primaryContact.id,
    emails: [primaryContact.email!, ...Array.from(emailsSet).filter((e) => e !== primaryContact.email)],
    phoneNumbers: [primaryContact.phoneNumber!, ...Array.from(phonesSet).filter((p) => p !== primaryContact.phoneNumber)],
    secondaryContactIds: secondaryIds,
  };

  // 💾 8. Cache final result
  await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 });

  return response;
};
