import express, { Router, Request, Response } from 'express';
import { identifyContact } from '../services/contactService';

const router: Router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({ error: 'At least email or phoneNumber is required.' });
  }

  try {
    const contact = await identifyContact(email, phoneNumber);
    return res.status(200).json({ contact });
  } catch (err) {
    console.error('Identify error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
