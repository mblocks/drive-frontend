import mockjs from 'mockjs';
import { Request, Response } from 'express';

export default {
  'GET /api/driver/dirs': (req: Request, res: Response) => {
    //res.status(401);
    const data = mockjs.mock({
      'dirs|10': [
        {
          id: '@integer(1, 900000)',
          title: '@name',
          'type|1': ['dir', 'file'],
          parent: req.query.dir,
        },
      ],
    });
    res.send(data.dirs);
  },
  'POST /api/driver/dirs': (req: Request, res: Response) => {
    res.send({ ...req.body, id: new Date().getTime() + '' });
  },
  'GET /api/driver/documents': (req: Request, res: Response) => {
    if (req.query.page > 5) {
      res.send([]);
      return;
    }
    const data = mockjs.mock({
      'documents|50': [
        {
          id: '@integer(1, 900000)',
          name: '@name',
          'type|1': ['dir', 'file', 'xlsx', 'pptx', 'jpg', 'png'],
          'public|1': ['link', 'auth', 'private'],
          modifiedAt: Date.now() - Math.floor(Math.random() * 100000),
        },
      ],
    });
    res.send(data.documents);
  },
  'GET /api/driver/breadcrumb': (req: Request, res: Response) => {
    if (!req.query.dir) {
      res.send([]);
    }
    res.send([
      { id: 'manual-2', title: 'Hello' },
      { id: 'manual-3', title: 'World' + req.query.dir },
    ]);
  },
  'POST /api/driver/documents/move': (req: Request, res: Response) => {
    res.send({ ...req.body, id: new Date().getTime() + '' });
  },
  'POST /api/driver/documents/copy': (req: Request, res: Response) => {
    res.send({ ...req.body, id: new Date().getTime() + '' });
  },
  'POST /api/driver/documents/delete': (req: Request, res: Response) => {
    res.send({ ...req.body, id: new Date().getTime() + '' });
  },
  'POST /api/driver/documents/update': (req: Request, res: Response) => {
    req.body.parent = req.body.dir ? req.body.dir : 'root';
    if (!req.body.id) {
      req.body.id = new Date().getTime() + '';
    }
    res.send({ ...req.body });
  },
  'GET /api/driver/documents/download': (req: Request, res: Response) => {
    res.set({
      'Content-Disposition': `attachment; filename="${
        req.query.id || 'mockdownload.txt'
      }"`,
    });
    res.send('some words');
  },
  'GET /api/driver/presigned/:type': async (req: Request, res: Response) => {
    const type = req.params.type;
    setTimeout(() => {
      res.send('/api/driver/mockuploadfile');
    }, 600);
  },
  'PUT /api/driver/mockuploadfile': (req: Request, res: Response) => {
    setTimeout(() => {
      res.send('ok');
    }, 3000);
  },
};
