import mockjs from 'mockjs';
import { Request, Response } from 'express';

export default {
  'GET /api/driver/dirs': (req: Request, res: Response) => {
    //res.status(401);
    const data = mockjs.mock({
      'dirs|10': [
        {
          id: '@integer(1, 900000)',
          name: '@name',
          'type|1': ['dir', 'file'],
          parent: req.query.parent || 'root',
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
    if (!req.query.parent) {
      res.send([]);
    }
    res.send([
      { id: 'manual-2', name: 'Hello' },
      { id: 'manual-3', name: 'World' + req.query.parent },
    ]);
  },
  'POST /api/driver/documents/move': (req: Request, res: Response) => {
    res.send({ ...req.body, id: new Date().getTime() + '' });
  },
  'POST /api/driver/documents/copy': (req: Request, res: Response) => {
    const parent = req.body.target || 'root';
    const data = mockjs.mock({
      'dirs|10': [
        {
          id: '@integer(1, 900000)',
          name: '@name',
          'type|1': ['dir', 'file'],
          parent,
        },
      ],
    });
    res.send(data.dirs);
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
  'GET /api/driver/presigned': async (req: Request, res: Response) => {
    res.send({
      'x-amz-algorithm': 'AWS4-HMAC-SHA256',
      'x-amz-credential': 'hello/20210822/mblocks/s3/aws4_request',
      'x-amz-date': '20210822T150433Z',
      policy:
        'eyJleHBpcmF0aW9uIjogIjIwMjEtMDktMDFUMTU6MDQ6MzMuMzQyWiIsICJjb25kaXRpb25zIjogW1siZXEiLCAiJGJ1Y2tldCIsICJoZWxsbyJdLCBbInN0YXJ0cy13aXRoIiwgIiRrZXkiLCAiMS91cGxvYWRzLzIwMjEwODIyL2Q3N2E3N2U0ODYyMDQwNDNiYmNhNjUxNGQ4MTBjN2EyLyJdLCBbImVxIiwgIiR4LWFtei1hbGdvcml0aG0iLCAiQVdTNC1ITUFDLVNIQTI1NiJdLCBbImVxIiwgIiR4LWFtei1jcmVkZW50aWFsIiwgImhlbGxvLzIwMjEwODIyL21ibG9ja3MvczMvYXdzNF9yZXF1ZXN0Il0sIFsiZXEiLCAiJHgtYW16LWRhdGUiLCAiMjAyMTA4MjJUMTUwNDMzWiJdXX0=',
      'x-amz-signature':
        '6e4846c39d555e8d2b0061496d7482c4cb281c31342d06ac43fdb7f1eff49e39',
      key: '1/uploads/20210822/d77a77e486204043bbca6514d810c7a2/',
    });
  },
  'POST /api/driver/mockuploadfile': (req: Request, res: Response) => {
    setTimeout(() => {
      res.send('ok');
    }, 3000);
  },
};
