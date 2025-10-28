import { Router } from 'express';
import { WheelStoreError, wheelStore } from '../store.js';
import { CreateListPayload, UpdateListPayload } from '../types.js';

export const listsRouter = Router();

listsRouter.get('/', async (_req, res, next) => {
  try {
    const lists = await wheelStore.getLists();
    res.json(lists);
  } catch (error) {
    next(error);
  }
});

listsRouter.post('/', async (req, res, next) => {
  const payload = req.body as CreateListPayload;
  if (!payload?.name || payload.name.trim().length === 0) {
    res.status(400).json({ message: 'Name is required' });
    return;
  }

  try {
    const list = await wheelStore.createList(payload);
    res.status(201).json(list);
  } catch (error) {
    next(error);
  }
});

listsRouter.get('/:id', async (req, res, next) => {
  try {
    const list = await wheelStore.getList(req.params.id);
    if (!list) {
      res.status(404).json({ message: 'List not found' });
      return;
    }

    res.json(list);
  } catch (error) {
    next(error);
  }
});

listsRouter.put('/:id', async (req, res, next) => {
  const payload = req.body as UpdateListPayload;

  try {
    const list = await wheelStore.updateList(req.params.id, payload);
    if (!list) {
      res.status(404).json({ message: 'List not found' });
      return;
    }

    res.json(list);
  } catch (error) {
    next(error);
  }
});

listsRouter.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await wheelStore.deleteList(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'List not found' });
      return;
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

listsRouter.post('/:id/spins', async (req, res, next) => {
  try {
    const spin = await wheelStore.recordSpin(req.params.id);
    if (!spin) {
      res.status(404).json({ message: 'List not found' });
      return;
    }

    res.status(201).json(spin);
  } catch (error) {
    if (error instanceof WheelStoreError && error.code === 'NO_ITEMS') {
      res.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
});
