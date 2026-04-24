import { Router } from 'express';
import auditRoutes from './audit';
import leadsRoutes from './leads';

const r = Router();
r.use(auditRoutes);
r.use(leadsRoutes);
export default r;
