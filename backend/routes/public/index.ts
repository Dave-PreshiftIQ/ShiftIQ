import { Router } from 'express';
import validateEmailRoutes from './validate-email';

const r = Router();
r.use(validateEmailRoutes);
export default r;
