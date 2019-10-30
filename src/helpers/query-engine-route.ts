import { Request, Response } from 'express';
import request from 'request-promise';
import _ from 'lodash';

import replaceVariables from './replace-variables';
import photon from '../photon';

export default async (req: Request, res: Response) => {
  if (!process.env.ENGINE_PORT) {
    await photon.connect();
    //@ts-ignore
    process.env.ENGINE_PORT = photon.fetcher.engine.port;
    console.log(`Prisma engine ready at http://localhost:${process.env.ENGINE_PORT}`);
  }

  const uri = `http://localhost:${process.env.ENGINE_PORT}/`;

  let data = req.body;

  if (!_.isEmpty(req.body.variables)) {
    data = replaceVariables(data);
  }

  let result;
  try {
    result = await request.post(uri, {
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log(result);
  } catch (e) {
    console.log(e);
  }

  res.status(200).end(result);
};
