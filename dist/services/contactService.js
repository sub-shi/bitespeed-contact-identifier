"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyContact = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const redis_1 = __importDefault(require("../redis"));
const identifyContact = async (email, phoneNumber) => {
    // 🔍 1. Try Redis cache first
    const cacheKey = `contact:${email || ''}:${phoneNumber || ''}`;
    const cached = await redis_1.default.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }
    // 🔎 2. Find all matching contacts by email or phoneNumber
    const matchingContacts = await client_1.default.contact.findMany({
        where: {
            OR: [
                email ? { email } : undefined,
                phoneNumber ? { phoneNumber } : undefined,
            ].filter(Boolean),
        },
        orderBy: {
            createdAt: 'asc',
        },
    });
    // ➕ 3. If no matches, create a new primary contact
    if (matchingContacts.length === 0) {
        const newContact = await client_1.default.contact.create({
            data: {
                email,
                phoneNumber,
                linkPrecedence: 'primary',
                linkedId: null,
                deletedAt: null,
            },
        });
        const response = {
            primaryContatctId: newContact.id,
            emails: email ? [email] : [],
            phoneNumbers: phoneNumber ? [phoneNumber] : [],
            secondaryContactIds: [],
        };
        await redis_1.default.set(cacheKey, JSON.stringify(response), { EX: 60 });
        return response;
    }
    // 👑 4. Determine the true primary contact
    const primaryContact = matchingContacts.find((c) => c.linkPrecedence === 'primary') || matchingContacts[0];
    // 🔗 5. Fetch all contacts linked to the primary
    const allLinkedContacts = await client_1.default.contact.findMany({
        where: {
            OR: [
                { id: primaryContact.id },
                { linkedId: primaryContact.id },
                {
                    id: {
                        in: matchingContacts
                            .map((c) => c.linkedId)
                            .filter((id) => id !== null),
                    },
                },
            ],
        },
        orderBy: {
            createdAt: 'asc',
        },
    });
    const emailsSet = new Set();
    const phonesSet = new Set();
    const secondaryIds = [];
    allLinkedContacts.forEach((c) => {
        if (c.email)
            emailsSet.add(c.email);
        if (c.phoneNumber)
            phonesSet.add(c.phoneNumber);
        if (c.id !== primaryContact.id) {
            secondaryIds.push(c.id);
        }
    });
    // 🧠 6. If request has new info, add it as a secondary contact
    const hasEmail = email ? emailsSet.has(email) : false;
    const hasPhone = phoneNumber ? phonesSet.has(phoneNumber) : false;
    if (!hasEmail || !hasPhone) {
        const newSecondary = await client_1.default.contact.create({
            data: {
                email,
                phoneNumber,
                linkPrecedence: 'secondary',
                linkedId: primaryContact.id,
                deletedAt: null,
            },
        });
        if (newSecondary.email)
            emailsSet.add(newSecondary.email);
        if (newSecondary.phoneNumber)
            phonesSet.add(newSecondary.phoneNumber);
        secondaryIds.push(newSecondary.id);
    }
    // 🧾 7. Prepare response
    const response = {
        primaryContatctId: primaryContact.id,
        emails: [primaryContact.email, ...Array.from(emailsSet).filter((e) => e !== primaryContact.email)],
        phoneNumbers: [primaryContact.phoneNumber, ...Array.from(phonesSet).filter((p) => p !== primaryContact.phoneNumber)],
        secondaryContactIds: secondaryIds,
    };
    // 💾 8. Cache final result
    await redis_1.default.set(cacheKey, JSON.stringify(response), { EX: 60 });
    return response;
};
exports.identifyContact = identifyContact;
