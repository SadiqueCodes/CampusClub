import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import clubsRouter from './routes/clubs';
import eventsRouter from './routes/events';
import marketplaceRouter from './routes/marketplace';
import chatsRouter from './routes/chats';
import messagesRouter from './routes/messages';
import joinRequestsRouter from './routes/joinRequests';
import usersRouter from './routes/users';
import { requireAuth } from './middleware/auth';
import errorHandler from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send({ status: 'ok', uptime: process.uptime() }));

// Feature routes
// Public routes
app.use('/api/clubs', clubsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/marketplace', marketplaceRouter);

// Protected routes (use requireAuth inside route files where necessary)
app.use('/api/chats', chatsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/join-requests', joinRequestsRouter);
app.use('/api/users', usersRouter);

// Error handler (last)
app.use(errorHandler);

app.listen(PORT, () => {
  // Do not print secrets
  console.log(`CampusClub backend listening on port ${PORT}`);
});
