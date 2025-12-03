import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  listAdminUsersHandler,
  createAdminUserHandler,
  toggleAdminUserActiveHandler,
} from '../controllers/adminUsersController';

const router = Router();

// Semua endpoint admin/users hanya boleh diakses super_admin
router.use(authenticate, authorize(['super_admin']));

router.get('/users', listAdminUsersHandler);
router.post('/users', createAdminUserHandler);
router.patch('/users/:id', toggleAdminUserActiveHandler);

export default router;
