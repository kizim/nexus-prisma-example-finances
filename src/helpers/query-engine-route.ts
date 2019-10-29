import { Request, Response } from 'express';
import request from 'request-promise';

import photon from '../photon';

export default async (req: Request, res: Response) => {
  if (!process.env.ENGINE_PORT) {
    await photon.connect();
    //@ts-ignore
    process.env.ENGINE_PORT = photon.fetcher.engine.port;
    console.log(`Prisma engine ready at http://localhost:${process.env.ENGINE_PORT}`);
  }

  const uri = `http://localhost:${process.env.ENGINE_PORT}/`;

  let result;
  try {
    result = await request.post(uri, {
      headers: req.headers,
      body: JSON.stringify(req.body),
    });
  } catch (e) {}

  res.status(200).end(result);
};
