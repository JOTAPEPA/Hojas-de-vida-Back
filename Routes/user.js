import { Router } from "express";
import httpUser from "../Controllers/user.js";

const router = Router();

router.post('/', [], httpUser.postUser);
router.get('/', [], httpUser.getListarTodos);
router.put('/:id', [], httpUser.putUpdateUser);

// ✅ Rutas corregidas
router.put('/inactivo/:id', httpUser.putModificarInactivo);
router.put('/activo/:id', httpUser.putModificarActivo);

export default router;
